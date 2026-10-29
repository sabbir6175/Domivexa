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
   ```

5. Restart the development server after editing `.env.local`.
6. Open `/register` and create an account. Firebase Authentication creates the
   email/password account and sends a verification email.

These `NEXT_PUBLIC_` values are Firebase Web app configuration and are sent to
the browser; they are not server secrets. Never put Firebase Admin credentials
or service-account private keys in these variables or in client code. Restrict
the Firebase API key to the appropriate web APIs and authorized domains in
Google Cloud Console. Apply Firebase Authentication email/password policy and
authorized-domain settings in Firebase Console.

Firebase email/password flows are available at `/register`, `/sign-in`, and
`/forgot-password`. Registration sends an email verification link; sign-in
requires a verified email. The dashboard reads the signed-in Firebase user's
profile and accepts only the default customer role (or a trusted Firebase
custom claim set to `customer`); admin/support roles are not enabled. The
dashboard gate currently runs in the browser and must not be used to protect
private server data. A server-verified session, role assignment through trusted
Firebase Admin tooling, and server-side authorization are still required before
admin access or sensitive user data is added.

The customer dashboard has responsive overview, domain, DNS/nameserver,
website connection, orders/billing, and profile/security sections. The display
name can be updated in Firebase Authentication. Domain, DNS, order, and billing
data are not connected to Firestore or live providers; empty states explain
which integrations are still required and do not invent customer records.
