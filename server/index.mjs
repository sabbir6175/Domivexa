import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const port = Number(process.env.API_PORT ?? 4000);
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://localhost:3008")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseKeys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

let mongoClientPromise;
let userIndexPromise;

async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured in the server environment.");
  }

  if (!mongoClientPromise) {
    mongoClientPromise = (async () => {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      try {
        await client.connect();
        return client;
      } catch (error) {
        await client.close().catch((closeError) => {
          console.error("Could not close failed MongoDB connection:", closeError.message);
        });
        throw error;
      }
    })().catch((error) => {
      mongoClientPromise = undefined;
      throw error;
    });
  }

  const client = await mongoClientPromise;
  return client.db(process.env.MONGODB_DB || "domivexa");
}

async function getUsersCollection() {
  const users = (await getDatabase()).collection("users");
  if (!userIndexPromise) {
    userIndexPromise = users
      .createIndex({ firebaseUid: 1 }, { unique: true })
      .catch((error) => {
        userIndexPromise = undefined;
        throw error;
      });
  }
  await userIndexPromise;
  return users;
}

async function getMongoClient() {
  await getDatabase();
  return mongoClientPromise;
}

class HttpError extends Error {
  constructor(status, message, code = "admin_action_failed") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function safeAuditMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key, value]) =>
        !/password|secret|token|credential|api.?key/i.test(key) &&
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null),
    ),
  );
}

async function executeAuditedAction(
  actor,
  { action, targetType, targetId = "", metadata = {} },
  operation,
) {
  const database = await getDatabase();
  const client = await getMongoClient();
  const session = client.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(database, session);
      await database.collection("auditLogs").insertOne(
        {
          actorUid: actor.sub,
          actorEmail: actor.email,
          action,
          targetType,
          targetId: String(targetId),
          outcome: "success",
          metadata: safeAuditMetadata(metadata),
          createdAt: new Date(),
        },
        { session },
      );
    });
    return result;
  } catch (error) {
    try {
      await database.collection("auditLogs").insertOne({
        actorUid: actor.sub,
        actorEmail: actor.email,
        action,
        targetType,
        targetId: String(targetId),
        outcome: "failure",
        metadata: safeAuditMetadata({
          ...metadata,
          errorCode: error.code ?? "operation_failed",
        }),
        createdAt: new Date(),
      });
    } catch (auditError) {
      console.error("Could not record admin audit event:", auditError.message);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

function sendAdminError(response, error, fallback) {
  if (error instanceof HttpError) {
    return response.status(error.status).json({ error: error.message });
  }
  console.error(fallback, error.message);
  return response.status(503).json({ error: fallback });
}

function normalizeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidObjectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

app.disable("x-powered-by");
app.use((request, response, next) => {
  const origin = request.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return response.status(403).json({ error: "Origin is not allowed." });
  }

  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  }

  if (request.method === "OPTIONS") {
    return response.sendStatus(204);
  }

  next();
});
app.use(express.json({ limit: "10kb" }));

async function requireFirebaseUser(request, response, next) {
  if (!firebaseProjectId) {
    return response.status(503).json({
      error: "FIREBASE_PROJECT_ID is not configured for the Express API.",
    });
  }

  const authorization = request.get("authorization") ?? "";
  const tokenMatch = authorization.match(/^Bearer (.+)$/i);
  if (!tokenMatch) {
    return response.status(401).json({ error: "Firebase sign-in is required." });
  }

  try {
    const { payload } = await jwtVerify(tokenMatch[1], firebaseKeys, {
      algorithms: ["RS256"],
      audience: firebaseProjectId,
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.email_verified !== "boolean"
    ) {
      return response.status(403).json({
        error: "A valid Firebase account email is required.",
      });
    }

    request.firebaseUser = payload;
    next();
  } catch {
    return response.status(401).json({ error: "Firebase token is invalid or expired." });
  }
}

async function requireAdmin(request, response, next) {
  if (request.firebaseUser.email_verified !== true) {
    return response.status(403).json({ error: "Verify your email to access admin tools." });
  }

  try {
    const users = await getUsersCollection();
    const currentUser = await users.findOne(
      { firebaseUid: request.firebaseUser.sub },
      { projection: { role: 1, status: 1 } },
    );

    if (currentUser?.role !== "admin" || currentUser.status === "suspended") {
      return response.status(403).json({ error: "Administrator access is required." });
    }

    next();
  } catch (error) {
    console.error("Could not verify admin role:", error.message);
    response.status(503).json({ error: "Could not verify administrator access." });
  }
}

app.get("/api/health", async (_request, response) => {
  try {
    const database = await getDatabase();
    await database.command({ ping: 1 });
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("MongoDB health check failed:", error.message);
    response.status(503).json({
      status: "error",
      database: "disconnected",
      error: process.env.MONGODB_URI
        ? "MongoDB is unavailable. Check the connection string and network access."
        : "MONGODB_URI is not configured for the Express API.",
    });
  }
});

app.post("/api/auth/sync", requireFirebaseUser, async (request, response) => {
  try {
    const users = await getUsersCollection();
    const user = request.firebaseUser;
    const now = new Date();
    const profile = {
      email: user.email,
      displayName: typeof user.name === "string" ? user.name : "",
      emailVerified: user.email_verified === true,
      updatedAt: now,
    };

    try {
      await users.updateOne(
        { firebaseUid: user.sub },
        {
          $set: profile,
          $setOnInsert: {
            firebaseUid: user.sub,
            role: "customer",
            status: "active",
            createdAt: now,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      await users.updateOne(
        { firebaseUid: user.sub },
        { $set: profile },
      );
    }

    await users.updateOne(
      { firebaseUid: user.sub, role: { $exists: false } },
      { $set: { role: "customer" } },
      { upsert: false },
    );

    const savedUser = await users.findOne(
      { firebaseUid: user.sub },
      { projection: { role: 1 } },
    );
    if (savedUser?.role !== "customer" && savedUser?.role !== "admin") {
      response.status(403).json({
        error: "This account does not have a supported role. Contact an administrator.",
      });
      return;
    }
    if (user.email_verified !== true && savedUser.role === "admin") {
      response.status(403).json({
        error: "Verify your email before accessing the administrator dashboard.",
      });
      return;
    }
    const accountStatus = await users.findOne(
      { firebaseUid: user.sub },
      { projection: { status: 1 } },
    );
    if (accountStatus?.status === "suspended") {
      response.status(403).json({
        error: "This account is suspended. Contact support for assistance.",
      });
      return;
    }

    response.setHeader("Cache-Control", "no-store");
    response.json({
      user: {
        firebaseUid: user.sub,
        email: user.email,
        displayName: typeof user.name === "string" ? user.name : "",
        role: savedUser.role,
      },
    });
  } catch (error) {
    console.error("Could not sync Firebase user with MongoDB:", error.message);
    response.status(503).json({
      error: "Could not save your profile. Check the Express API MongoDB connection.",
    });
  }
});

app.get("/api/pricing", async (_request, response) => {
  try {
    const now = new Date();
    const pricing = await (await getDatabase())
      .collection("pricing")
      .find(
        {
          enabled: true,
          effectiveFrom: { $lte: now },
          $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
        },
        {
          projection: {
            _id: 0,
            tld: 1,
            registrationPrice: 1,
            renewalPrice: 1,
            transferPrice: 1,
            currency: 1,
            effectiveFrom: 1,
            effectiveTo: 1,
          },
        },
      )
      .sort({ tld: 1 })
      .toArray();
    response.setHeader("Cache-Control", "no-store");
    response.json({ pricing });
  } catch (error) {
    console.error("Could not load public pricing:", error.message);
    response.status(503).json({ error: "Published pricing is currently unavailable." });
  }
});

app.get("/api/admin/overview", requireFirebaseUser, requireAdmin, async (_request, response) => {
  try {
    const database = await getDatabase();
    const users = await getUsersCollection();
    const orders = database.collection("orders");
    const domains = database.collection("domains");
    const tickets = database.collection("supportTickets");
    const now = new Date();
    const renewalsCutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      adminUsers,
      customerUsers,
      domainCount,
      orderCount,
      supportCount,
      registrationFailures,
      paymentExceptions,
      renewalsDue,
    ] =
      await Promise.all([
        users.countDocuments(),
        users.countDocuments({ role: "admin" }),
        users.countDocuments({ role: "customer" }),
        domains.countDocuments(),
        orders.countDocuments(),
        tickets.countDocuments({ status: { $nin: ["closed", "resolved"] } }),
        orders.countDocuments({
          $or: [
            { registrationStatus: { $in: ["failed", "error"] } },
            { status: { $in: ["registration_failed", "registration_error"] } },
          ],
        }),
        orders.countDocuments({
          $or: [
            { paymentStatus: { $in: ["failed", "exception", "refund_failed"] } },
            { status: { $in: ["payment_failed", "payment_exception", "refund_failed"] } },
          ],
        }),
        domains.countDocuments({
          status: { $nin: ["expired", "deleted"] },
          $or: [
            { expiresAt: { $gte: now, $lte: renewalsCutoff } },
            { expiresAt: { $gte: now.toISOString(), $lte: renewalsCutoff.toISOString() } },
          ],
        }),
      ]);

    response.setHeader("Cache-Control", "no-store");
    response.json({
      users: { total: totalUsers, admins: adminUsers, customers: customerUsers },
      domains: domainCount,
      orders: orderCount,
      supportTickets: supportCount,
      registrationFailures,
      paymentExceptions,
      renewalsDue,
    });
  } catch (error) {
    console.error("Could not load admin overview:", error.message);
    response.status(503).json({ error: "Could not load admin dashboard data." });
  }
});

app.get("/api/admin/users", requireFirebaseUser, requireAdmin, async (request, response) => {
  try {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
    const query = typeof request.query.q === "string" ? request.query.q.trim().slice(0, 100) : "";
    const filter = query
      ? {
          $or: [
            { email: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
            { displayName: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
            { firebaseUid: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
          ],
        }
      : {};
    const users = await getUsersCollection();
    const [total, records] = await Promise.all([
      users.countDocuments(filter),
      users
        .find(filter, {
          projection: {
            _id: 0,
            firebaseUid: 1,
            email: 1,
            displayName: 1,
            role: 1,
            status: 1,
            emailVerified: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        })
        .sort({ createdAt: -1, email: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

    response.setHeader("Cache-Control", "no-store");
    response.json({ users: records, page, limit, total });
  } catch (error) {
    console.error("Could not load admin user list:", error.message);
    response.status(503).json({ error: "Could not load the user list." });
  }
});

app.patch(
  "/api/admin/users/:firebaseUid/role",
  requireFirebaseUser,
  requireAdmin,
  async (request, response) => {
    const { firebaseUid } = request.params;
    const role = request.body?.role;

    if (!/^[A-Za-z0-9_-]{1,128}$/.test(firebaseUid)) {
      return response.status(400).json({ error: "Invalid Firebase user ID." });
    }
    if (role !== "customer" && role !== "admin") {
      return response.status(400).json({ error: "Role must be customer or admin." });
    }
    if (firebaseUid === request.firebaseUser.sub) {
      return response.status(400).json({ error: "You cannot change your own administrator role." });
    }

    try {
      await executeAuditedAction(
        request.firebaseUser,
        {
          action: "user.role.updated",
          targetType: "user",
          targetId: firebaseUid,
          metadata: { role },
        },
        async (database, session) => {
          const users = database.collection("users");
          const target = await users.findOne(
            { firebaseUid },
            { projection: { role: 1 }, session },
          );
          if (!target) throw new HttpError(404, "User was not found.", "not_found");

          if (target.role === "admin" && role === "customer") {
            const adminCount = await users.countDocuments(
              { role: "admin", status: { $ne: "suspended" } },
              { session },
            );
            if (adminCount <= 1) {
              throw new HttpError(
                409,
                "The last administrator cannot be removed. Promote another user first.",
                "last_admin",
              );
            }
          }

          await users.updateOne(
            { firebaseUid },
            { $set: { role, updatedAt: new Date() } },
            { session },
          );
          return { firebaseUid, role };
        },
      );
      response.setHeader("Cache-Control", "no-store");
      response.json({ firebaseUid, role });
    } catch (error) {
      sendAdminError(response, error, "Could not update the user role.");
    }
  },
);

app.patch(
  "/api/admin/users/:firebaseUid/status",
  requireFirebaseUser,
  requireAdmin,
  async (request, response) => {
    const { firebaseUid } = request.params;
    const status = request.body?.status;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(firebaseUid)) {
      return response.status(400).json({ error: "Invalid Firebase user ID." });
    }
    if (status !== "active" && status !== "suspended") {
      return response.status(400).json({ error: "Status must be active or suspended." });
    }
    if (firebaseUid === request.firebaseUser.sub && status === "suspended") {
      return response.status(400).json({ error: "You cannot suspend your own account." });
    }

    try {
      await executeAuditedAction(
        request.firebaseUser,
        {
          action: "user.status.updated",
          targetType: "user",
          targetId: firebaseUid,
          metadata: { status },
        },
        async (database, session) => {
          const users = database.collection("users");
          const target = await users.findOne(
            { firebaseUid },
            { projection: { role: 1, status: 1 }, session },
          );
          if (!target) throw new HttpError(404, "User was not found.", "not_found");

          if (
            target.role === "admin" &&
            target.status !== "suspended" &&
            status === "suspended"
          ) {
            const activeAdmins = await users.countDocuments(
              { role: "admin", status: { $ne: "suspended" } },
              { session },
            );
            if (activeAdmins <= 1) {
              throw new HttpError(
                409,
                "The last active administrator cannot be suspended.",
                "last_admin",
              );
            }
          }

          const result = await users.updateOne(
            { firebaseUid },
            { $set: { status, updatedAt: new Date() } },
            { session },
          );
          if (!result.matchedCount) {
            throw new HttpError(404, "User was not found.", "not_found");
          }
          return { firebaseUid, status };
        },
      );
      response.json({ firebaseUid, status });
    } catch (error) {
      sendAdminError(response, error, "Could not update customer status.");
    }
  },
);

app.get("/api/admin/orders", requireFirebaseUser, requireAdmin, async (request, response) => {
  try {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
    const query = typeof request.query.q === "string" ? request.query.q.trim().slice(0, 100) : "";
    const regex = normalizeRegex(query);
    const filter = query
      ? {
          $or: [
            { customerEmail: { $regex: regex, $options: "i" } },
            { domain: { $regex: regex, $options: "i" } },
            { orderNumber: { $regex: regex, $options: "i" } },
            { paymentReference: { $regex: regex, $options: "i" } },
            { registrarReference: { $regex: regex, $options: "i" } },
          ],
        }
      : {};
    const orders = (await getDatabase()).collection("orders");
    const [total, records] = await Promise.all([
      orders.countDocuments(filter),
      orders
        .find(filter, {
          projection: {
            customerUid: 1,
            customerEmail: 1,
            domain: 1,
            orderNumber: 1,
            amount: 1,
            currency: 1,
            status: 1,
            paymentStatus: 1,
            registrationStatus: 1,
            paymentReference: 1,
            registrarReference: 1,
            refundStatus: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);
    response.setHeader("Cache-Control", "no-store");
    response.json({
      orders: records.map((record) => ({ ...record, id: String(record._id), _id: undefined })),
      page,
      limit,
      total,
    });
  } catch (error) {
    sendAdminError(response, error, "Could not load orders.");
  }
});

app.get("/api/admin/domains", requireFirebaseUser, requireAdmin, async (request, response) => {
  try {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
    const query = typeof request.query.q === "string" ? request.query.q.trim().slice(0, 100) : "";
    const regex = normalizeRegex(query);
    const filter = query
      ? {
          $or: [
            { domain: { $regex: regex, $options: "i" } },
            { name: { $regex: regex, $options: "i" } },
            { ownerEmail: { $regex: regex, $options: "i" } },
            { providerReference: { $regex: regex, $options: "i" } },
          ],
        }
      : {};
    const domains = (await getDatabase()).collection("domains");
    const [total, records] = await Promise.all([
      domains.countDocuments(filter),
      domains
        .find(filter, {
          projection: {
            ownerUid: 1,
            ownerEmail: 1,
            domain: 1,
            name: 1,
            status: 1,
            expiresAt: 1,
            provider: 1,
            providerReference: 1,
            createdAt: 1,
          },
        })
        .sort({ expiresAt: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);
    response.setHeader("Cache-Control", "no-store");
    response.json({
      domains: records.map((record) => ({ ...record, id: String(record._id), _id: undefined })),
      page,
      limit,
      total,
    });
  } catch (error) {
    sendAdminError(response, error, "Could not load domains.");
  }
});

app.get("/api/admin/pricing", requireFirebaseUser, requireAdmin, async (_request, response) => {
  try {
    const pricing = await (await getDatabase())
      .collection("pricing")
      .find({}, { projection: { tld: 1, registrationPrice: 1, renewalPrice: 1, transferPrice: 1, currency: 1, enabled: 1, effectiveFrom: 1, effectiveTo: 1, updatedAt: 1, updatedBy: 1 } })
      .sort({ tld: 1, effectiveFrom: -1 })
      .toArray();
    response.setHeader("Cache-Control", "no-store");
    response.json({
      pricing: pricing.map((record) => ({ ...record, id: String(record._id), _id: undefined })),
    });
  } catch (error) {
    sendAdminError(response, error, "Could not load pricing.");
  }
});

function validatePricing(body) {
  const tld = typeof body?.tld === "string" ? body.tld.trim().toLowerCase() : "";
  const currency = typeof body?.currency === "string" ? body.currency.trim().toUpperCase() : "";
  const effectiveFrom = new Date(body?.effectiveFrom);
  const effectiveTo = body?.effectiveTo ? new Date(body.effectiveTo) : null;
  const prices = {
    registrationPrice: Number(body?.registrationPrice),
    renewalPrice: Number(body?.renewalPrice),
    transferPrice: Number(body?.transferPrice),
  };
  if (!/^\.[a-z0-9-]{2,63}$/.test(tld)) {
    throw new HttpError(400, "Enter a valid TLD such as .com.", "invalid_tld");
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new HttpError(400, "Currency must be a three-letter ISO code.", "invalid_currency");
  }
  if (Object.values(prices).some((price) => !Number.isFinite(price) || price < 0)) {
    throw new HttpError(400, "Prices must be valid non-negative amounts.", "invalid_price");
  }
  if (Number.isNaN(effectiveFrom.getTime())) {
    throw new HttpError(400, "A valid effective start date is required.", "invalid_date");
  }
  if (effectiveTo && (Number.isNaN(effectiveTo.getTime()) || effectiveTo <= effectiveFrom)) {
    throw new HttpError(400, "Effective end date must be after the start date.", "invalid_date");
  }
  if (typeof body?.enabled !== "boolean") {
    throw new HttpError(400, "Choose whether this TLD is enabled.", "invalid_enabled");
  }
  return { tld, currency, ...prices, enabled: body.enabled, effectiveFrom, effectiveTo };
}

app.post("/api/admin/pricing", requireFirebaseUser, requireAdmin, async (request, response) => {
  let pricing;
  try {
    pricing = validatePricing(request.body);
    const result = await executeAuditedAction(
      request.firebaseUser,
      {
        action: "pricing.created",
        targetType: "pricing",
        targetId: pricing.tld,
        metadata: { tld: pricing.tld, currency: pricing.currency, enabled: pricing.enabled },
      },
      async (database, session) => {
        const collection = database.collection("pricing");
        const existing = await collection.find({ tld: pricing.tld }, { session }).toArray();
        const overlaps = existing.some((record) => {
          const start = record.effectiveFrom instanceof Date
            ? record.effectiveFrom
            : new Date(record.effectiveFrom);
          const end = record.effectiveTo
            ? record.effectiveTo instanceof Date
              ? record.effectiveTo
              : new Date(record.effectiveTo)
            : null;
          return (!pricing.effectiveTo || start <= pricing.effectiveTo) &&
            (!end || end >= pricing.effectiveFrom);
        });
        if (overlaps) {
          throw new HttpError(409, "This TLD already has a pricing period that overlaps these dates.", "pricing_overlap");
        }
        const document = {
          ...pricing,
          updatedAt: new Date(),
          updatedBy: request.firebaseUser.sub,
          createdAt: new Date(),
        };
        const inserted = await collection.insertOne(document, { session });
        return { ...document, id: String(inserted.insertedId) };
      },
    );
    response.status(201).json({ pricing: result });
  } catch (error) {
    sendAdminError(response, error, "Could not save pricing.");
  }
});

app.patch("/api/admin/pricing/:id", requireFirebaseUser, requireAdmin, async (request, response) => {
  const { id } = request.params;
  if (!isValidObjectId(id)) return response.status(400).json({ error: "Invalid pricing ID." });
  try {
    const pricing = validatePricing(request.body);
    const result = await executeAuditedAction(
      request.firebaseUser,
      {
        action: "pricing.updated",
        targetType: "pricing",
        targetId: id,
        metadata: { tld: pricing.tld, currency: pricing.currency, enabled: pricing.enabled },
      },
      async (database, session) => {
        const collection = database.collection("pricing");
        const pricingId = new ObjectId(id);
        const current = await collection.findOne({ _id: pricingId }, { session });
        if (!current) throw new HttpError(404, "Pricing record was not found.", "not_found");
        const existing = await collection.find(
          { tld: pricing.tld, _id: { $ne: pricingId } },
          { session },
        ).toArray();
        const overlaps = existing.some((record) => {
          const start = record.effectiveFrom instanceof Date
            ? record.effectiveFrom
            : new Date(record.effectiveFrom);
          const end = record.effectiveTo
            ? record.effectiveTo instanceof Date
              ? record.effectiveTo
              : new Date(record.effectiveTo)
            : null;
          return (!pricing.effectiveTo || start <= pricing.effectiveTo) &&
            (!end || end >= pricing.effectiveFrom);
        });
        if (overlaps) {
          throw new HttpError(409, "This TLD already has a pricing period that overlaps these dates.", "pricing_overlap");
        }
        await collection.updateOne(
          { _id: pricingId },
          { $set: { ...pricing, updatedAt: new Date(), updatedBy: request.firebaseUser.sub } },
          { session },
        );
        return { ...current, ...pricing, id };
      },
    );
    response.json({ pricing: result });
  } catch (error) {
    sendAdminError(response, error, "Could not update pricing.");
  }
});

app.get("/api/admin/support", requireFirebaseUser, requireAdmin, async (request, response) => {
  try {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
    const status = typeof request.query.status === "string" ? request.query.status : "";
    const allowedStatuses = ["open", "in_progress", "waiting_customer", "resolved", "closed"];
    const filter = allowedStatuses.includes(status) ? { status } : {};
    const tickets = (await getDatabase()).collection("supportTickets");
    const [total, records] = await Promise.all([
      tickets.countDocuments(filter),
      tickets.aggregate([
        { $match: filter },
        {
          $addFields: {
            priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "urgent"] }, then: 4 },
                  { case: { $eq: ["$priority", "high"] }, then: 3 },
                  { case: { $eq: ["$priority", "normal"] }, then: 2 },
                  { case: { $eq: ["$priority", "low"] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { priorityRank: -1, createdAt: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { priorityRank: 0 } },
      ]).toArray(),
    ]);
    response.setHeader("Cache-Control", "no-store");
    response.json({
      tickets: records.map((record) => ({ ...record, id: String(record._id), _id: undefined })),
      page,
      limit,
      total,
    });
  } catch (error) {
    sendAdminError(response, error, "Could not load support tickets.");
  }
});

app.patch("/api/admin/support/:id", requireFirebaseUser, requireAdmin, async (request, response) => {
  const { id } = request.params;
  if (!isValidObjectId(id)) return response.status(400).json({ error: "Invalid support ticket ID." });
  const body = request.body ?? {};
  const allowedFields = ["status", "priority", "assignee", "internalNote", "customerReply"];
  if (Object.keys(body).some((key) => !allowedFields.includes(key))) {
    return response.status(400).json({ error: "Unsupported support action." });
  }
  const update = {};
  if (body.status !== undefined) {
    if (!["open", "in_progress", "waiting_customer", "resolved", "closed"].includes(body.status)) {
      return response.status(400).json({ error: "Invalid ticket status." });
    }
    update.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!["low", "normal", "high", "urgent"].includes(body.priority)) {
      return response.status(400).json({ error: "Invalid ticket priority." });
    }
    update.priority = body.priority;
  }
  if (body.assignee !== undefined) {
    if (typeof body.assignee !== "string" || body.assignee.trim().length > 254) {
      return response.status(400).json({ error: "Assignee must be a valid email or empty." });
    }
    update.assignee = body.assignee.trim();
  }
  for (const field of ["internalNote", "customerReply"]) {
    if (body[field] !== undefined && (typeof body[field] !== "string" || !body[field].trim() || body[field].length > 5000)) {
      return response.status(400).json({ error: `${field} must contain 1–5000 characters.` });
    }
  }
  if (Object.keys(update).length === 0 && !body.internalNote && !body.customerReply) {
    return response.status(400).json({ error: "No support changes were provided." });
  }

  const action = body.internalNote
    ? "support.internal_note.added"
    : body.customerReply
      ? "support.customer_reply.added"
      : "support.ticket.updated";
  try {
    const result = await executeAuditedAction(
      request.firebaseUser,
      {
        action,
        targetType: "support_ticket",
        targetId: id,
        metadata: {
          status: update.status ?? "",
          priority: update.priority ?? "",
          assignee: update.assignee ?? "",
          noteLength: body.internalNote?.length ?? 0,
          replyLength: body.customerReply?.length ?? 0,
        },
      },
      async (database, session) => {
        const tickets = database.collection("supportTickets");
        const ticketId = new ObjectId(id);
        const set = { ...update, updatedAt: new Date() };
        const push = {};
        if (body.internalNote) {
          push.internalNotes = {
            actorUid: request.firebaseUser.sub,
            actorEmail: request.firebaseUser.email,
            message: body.internalNote.trim(),
            createdAt: new Date(),
          };
        }
        if (body.customerReply) {
          push.customerReplies = {
            actorUid: request.firebaseUser.sub,
            actorEmail: request.firebaseUser.email,
            message: body.customerReply.trim(),
            createdAt: new Date(),
          };
        }
        const updateDocument = {};
        if (Object.keys(set).length) updateDocument.$set = set;
        if (Object.keys(push).length) updateDocument.$push = push;
        const updated = await tickets.findOneAndUpdate(
          { _id: ticketId },
          updateDocument,
          { returnDocument: "after", session },
        );
        if (!updated) throw new HttpError(404, "Support ticket was not found.", "not_found");
        return updated;
      },
    );
    response.json({ ticket: { ...result, id: String(result._id), _id: undefined } });
  } catch (error) {
    sendAdminError(response, error, "Could not update support ticket.");
  }
});

app.get("/api/admin/integrations", requireFirebaseUser, requireAdmin, async (_request, response) => {
  let databaseConnected = false;
  try {
    await (await getDatabase()).command({ ping: 1 });
    databaseConnected = true;
  } catch (error) {
    console.error("Could not check MongoDB integration:", error.message);
  }
  response.setHeader("Cache-Control", "no-store");
  response.json({
    integrations: [
      { name: "MongoDB", configured: Boolean(process.env.MONGODB_URI), healthy: databaseConnected, detail: databaseConnected ? "Connected" : "Unavailable" },
      { name: "Firebase Authentication", configured: Boolean(firebaseProjectId), healthy: Boolean(firebaseProjectId), detail: firebaseProjectId ? "ID token verified for this request" : "Project ID missing" },
      { name: "Payment provider", configured: Boolean(process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_PROVIDER_API_KEY), healthy: false, detail: process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_PROVIDER_API_KEY ? "Configured; live health check unavailable" : "Not configured" },
      { name: "Domain registrar", configured: Boolean(process.env.REGISTRAR_API_KEY || process.env.DOMAIN_REGISTRAR_API_KEY), healthy: false, detail: process.env.REGISTRAR_API_KEY || process.env.DOMAIN_REGISTRAR_API_KEY ? "Configured; live health check unavailable" : "Not configured" },
    ],
  });
});

app.get("/api/admin/audit", requireFirebaseUser, requireAdmin, async (request, response) => {
  try {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 25));
    const auditLogs = (await getDatabase()).collection("auditLogs");
    const [total, records] = await Promise.all([
      auditLogs.countDocuments(),
      auditLogs.find({}, {
        projection: {
          actorUid: 1,
          actorEmail: 1,
          action: 1,
          targetType: 1,
          targetId: 1,
          outcome: 1,
          metadata: 1,
          createdAt: 1,
        },
      }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    ]);
    response.setHeader("Cache-Control", "no-store");
    response.json({
      entries: records.map((record) => ({ ...record, id: String(record._id), _id: undefined })),
      page,
      limit,
      total,
    });
  } catch (error) {
    sendAdminError(response, error, "Could not load the audit log.");
  }
});

app.use((error, _request, response, next) => {
  console.error("Express request failed:", error.message);
  if (response.headersSent) {
    return next(error);
  }

  response.status(400).json({ error: "The request could not be processed." });
});

const server = app.listen(port, () => {
  console.log(`Domivexa Express API listening on http://localhost:${port}`);
  void getDatabase()
    .then((database) => database.command({ ping: 1 }))
    .then(() => console.log("MongoDB connection is ready."))
    .catch((error) => {
      console.error("MongoDB is not ready:", error.message);
    });
});

async function shutdown() {
  server.close();
  if (mongoClientPromise) {
    const client = await mongoClientPromise.catch(() => null);
    await client?.close();
  }
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
