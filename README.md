# Domivexa

Domivexa is a Next.js domain-management website. The customer dashboard uses
sample data. Public TLD pricing is read from enabled MongoDB pricing records.
Domain availability, purchases, payments, and DNS are not connected to live
providers.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set your Firebase Web app values,
   Firebase project ID, and MongoDB connection string.
3. Run `npm run dev`. This starts the Next.js website on port 3000 and the
   Express API on port 4000.
4. Open [http://localhost:3000](http://localhost:3000).

Use `npm run backend` to run only the Express API. The API health check is
available at [http://localhost:4000/api/health](http://localhost:4000/api/health).

## Firebase authentication

1. Create a Firebase project and register a Web app in Firebase Console.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Authentication → Settings → Authorized domains**, add `localhost` for
   local development and your deployed hostname before production.
4. Fill in the `NEXT_PUBLIC_FIREBASE_*` values and `FIREBASE_PROJECT_ID` in
   `.env.local`. The project ID must match the Firebase Web app project.
5. Open `/register` to create a customer account. Registration sends an email
   verification link; verified accounts can sign in at `/sign-in`.

Firebase Web app values with the `NEXT_PUBLIC_` prefix are public browser
configuration, not secrets. Never put MongoDB credentials in a `NEXT_PUBLIC_`
variable or client-side code.

## Express and MongoDB

Set `MONGODB_URI` to your MongoDB connection string and optionally set
`MONGODB_DB` (defaults to `domivexa`). Keep these values in `.env.local` for
local development and in the server's environment settings in production.
Configure `NEXT_PUBLIC_API_URL` to the Express API's public URL, and
`FRONTEND_ORIGINS` to a comma-separated list of allowed website origins.

When an account is created, the website sends its Firebase ID token to
`POST /api/auth/sync`. Express verifies the token and upserts the user by
Firebase UID. This is idempotent: repeat logins update the same record instead
of inserting another one. New records receive the server-assigned `customer`
role, and an existing database role is preserved. The API ignores
client-supplied roles.

To grant administrator access, find the user's document in the MongoDB `users`
collection by `firebaseUid` and change its `role` field to the string `admin`.
The next verified login loads that role and opens `/admin`; customers open
`/dashboard`. To revoke administrator access, change the role back to
`customer`. Role assignment is database-managed and cannot be selected in the
browser.

The admin panel reads and writes MongoDB collections for users, orders,
domains, pricing, support tickets, and audit logs. Pricing records use `tld`,
`registrationPrice`, `renewalPrice`, `transferPrice`, `currency`, `enabled`,
`effectiveFrom`, and optional `effectiveTo`. Support ticket internal notes and
customer-visible reply records are stored separately. Customer-visible replies
are recorded for the support workflow but are not emailed until a notification
provider is connected.

The public `/pricing` page reads enabled TLD records from `GET /api/pricing`.
Only records whose effective period includes the current date are listed; an
empty collection displays an explicit no-pricing state rather than sample rates.
These are configured base prices, not live registrar quotes.

Admin mutation APIs check the caller's current MongoDB role on every request.
Role/status changes, pricing changes, and support-ticket actions are transactionally
recorded in `auditLogs` with the actor, action, timestamp, outcome, and sanitized
metadata. The dashboard integration view reports only configured/healthy
states, never secret values. Payment/refund and registrar retry buttons remain
disabled until their providers are implemented and can safely execute those
operations; existing order/domain references and refund states can still be
reviewed.

Firebase sign-in itself still works if MongoDB is unavailable, but the app
cannot safely choose a role-specific dashboard until the API verifies the
database role. Registration displays a warning if it cannot save the new
profile; signing in retries the sync.

The Express API verifies Firebase ID tokens using Google's public signing keys;
Firebase Admin SDK credentials and Google Cloud CLI are not required. Domain,
DNS, registrar, payment, and billing fulfillment remain unavailable until their
providers are implemented. The admin panel can inspect records already stored
in MongoDB, but it does not fabricate domain, order, or support data.
