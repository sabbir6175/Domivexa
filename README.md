# Domivexa

Domivexa is a Next.js domain-management website preview. Public pages and the
customer dashboard currently use sample data. Domain availability, purchases,
payments, and DNS are not connected to live providers.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configure Firebase registration

1. Create a Firebase project and register a Web app in Firebase Console.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Authentication → Settings → Authorized domains**, add `localhost` for
   local development and your deployed hostname before production.
4. Copy `.env.example` to `.env.local` and fill in the Web app config values:

   ```text
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   FIREBASE_PROJECT_ID=
   ```

5. Install the Google Cloud CLI and authenticate locally with Application
   Default Credentials:

   ```powershell
   gcloud auth application-default login
   ```

   The signed-in Google account needs permission to use Firebase Authentication
   in this project. The server uses ADC; no service-account key file is required.
6. Restart the development server after editing `.env.local`.
7. Open `/register` and create an account. Firebase Authentication creates the
   email/password account and sends a verification email.

These `NEXT_PUBLIC_` values are Firebase Web app configuration and are sent to
the browser; they are not server secrets. Never put Firebase Admin credentials
or service-account private keys in these variables or in client code. Restrict
the Firebase API key to the appropriate web APIs and authorized domains in
Google Cloud Console. Apply Firebase Authentication email/password policy and
authorized-domain settings in Firebase Console.

Firebase email/password flows are available at `/register`, `/sign-in`,
`/admin-login`, and `/forgot-password`. Registration sends an email verification
link; sign-in requires a verified email. Sign-in exchanges the Firebase ID
token for a five-day, HTTP-only, same-site session cookie. The `/dashboard`
and `/admin` routes verify that cookie and its revocation status on the server.
The server reads the account role from Firestore; client-submitted roles and
Firebase custom claims are not used for dashboard authorization. Any future
private-data API or admin operation must independently verify the session and
Firestore role before accessing data or performing the operation.

### Set up admin access

1. Enable **Cloud Firestore** in Firebase Console.
2. Publish the repository's `firestore.rules` in **Firestore Database → Rules**.
   The rules deny all client access to `users` role documents; the trusted
   server uses Firebase Admin SDK credentials to read them.
3. Open `/admin-login` and use **Create admin account** to register your email.
   Verify the address from the link in your inbox.
4. In Firebase Console, open **Authentication → Users**, find your account,
   and copy its UID.
5. In **Firestore Database → Data**, create a collection named `users` and a
   document whose ID is that UID. Add a string field `role` with value `admin`.
6. Return to `/admin-login` and sign in. The server checks the Firestore role
   before granting a session. To remove admin access, change the field to
   `customer` or delete the document. Role changes are checked on each server
   request.

Regular accounts without a role document are treated as customers. Never let
the browser write a user's `role`; keep the deny rules published. Locally,
Application Default Credentials must have both Firebase Authentication and
Firestore access. Production must attach a runtime service identity with the
corresponding permissions through the hosting platform's workload identity.
Do not deploy a service-account private key in the application bundle or
repository. Firebase Web app values in `NEXT_PUBLIC_` variables are public
configuration, not Admin credentials.

The customer dashboard has responsive overview, domain, DNS/nameserver,
website connection, orders/billing, and profile/security sections. The display
name can be updated in Firebase Authentication. Domain, DNS, order, and billing
data are not connected to Firestore or live providers; empty states explain
which integrations are still required and do not invent customer records.
The admin interface provides overview, user, domain, order/billing, support,
and integration sections. These sections show explicit disconnected states
until their backing services are implemented; Firebase Authentication alone
does not provide a server-side user directory or admin data access.
