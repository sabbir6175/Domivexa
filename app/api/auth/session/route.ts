import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import {
  getAccountRole,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/server-auth";

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 12_000) {
    return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("idToken" in body) ||
    typeof body.idToken !== "string" ||
    body.idToken.length === 0 ||
    body.idToken.length > 10_000 ||
    ("adminOnly" in body && typeof body.adminOnly !== "boolean")
  ) {
    return NextResponse.json({ error: "A valid ID token is required" }, { status: 400 });
  }

  const adminOnly = "adminOnly" in body && body.adminOnly === true;
  const auth = getFirebaseAdminAuth();
  const decodedToken = await auth.verifyIdToken(body.idToken, true);
  if (decodedToken.email_verified !== true) {
    return NextResponse.json({ error: "Verified email is required" }, { status: 403 });
  }

  const role = await getAccountRole(decodedToken.uid);
  if (adminOnly && role !== "admin") {
    await clearSessionCookie();
    return NextResponse.json(
      { error: "This account does not have the admin role." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (role === "unsupported") {
    return NextResponse.json(
      { error: "This account has an unsupported role." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const sessionCookie = await auth.createSessionCookie(body.idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return NextResponse.json(
    { status: "ok", isAdmin: role === "admin" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await clearSessionCookie();

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
