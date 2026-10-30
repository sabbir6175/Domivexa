"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { FormEvent, useState } from "react";
import { FirebaseConfigurationError, getFirebaseAuth } from "@/lib/firebase";
import {
  AuthSessionError,
  createServerSession,
  signOutAndClearSession,
} from "@/lib/auth-session";
import { MaterialIcon } from "@/components/marketing/material-icon";

function getSignInErrorMessage(error: unknown) {
  if (error instanceof AuthSessionError) {
    return "Firebase signed you in, but the secure server session could not be established. Check the server Firebase configuration and try again.";
  }

  if (error instanceof FirebaseConfigurationError) {
    return "Firebase is not configured. Check .env.local and restart the development server.";
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "The email or password is incorrect. Check your details and try again.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/email-already-in-use":
        return "An account already uses this email. Switch to sign in instead.";
      case "auth/weak-password":
        return "Choose a stronger password with at least 8 characters.";
      case "auth/too-many-requests":
        return "Too many sign-in attempts. Wait a little while, then try again.";
      case "auth/network-request-failed":
        return "Could not reach Firebase. Check your internet connection and try again.";
      case "auth/operation-not-allowed":
        return "Email and password sign-in is disabled in Firebase Authentication.";
      case "auth/unauthorized-domain":
        return "This website domain is not authorized in Firebase Authentication.";
      default:
        return "Firebase could not sign you in. Check your details and try again.";
    }
  }

  console.error("Unexpected Firebase sign-in error:", error);
  return "Sign-in could not be completed because of an unexpected error.";
}

export function SignInForm({ adminOnly = false }: { adminOnly?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdAdminUid, setCreatedAdminUid] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice("");
    setSubmitting(true);

    if (adminOnly && mode === "create") {
      try {
        const auth = getFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setUnverifiedUser(credential.user);
        setCreatedAdminUid(credential.user.uid);
        setMode("sign-in");
        await sendEmailVerification(credential.user);
        await signOutAndClearSession(auth);
        setNotice(
          "Account created. Verify your email, then set this account's Firestore role to admin before signing in.",
        );
      } catch (error) {
        try {
          const auth = getFirebaseAuth();
          if (auth.currentUser) await signOutAndClearSession(auth);
        } catch (signOutError) {
          console.error("Could not sign out after admin account creation:", signOutError);
        }

        if (error instanceof Error && !(error instanceof FirebaseError)) {
          setFormError(error.message);
        } else {
          setFormError(getSignInErrorMessage(error));
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      if (!credential.user.emailVerified) {
        setUnverifiedUser(credential.user);
        await signOut(auth);
        setFormError("Verify your email address before signing in.");
        return;
      }

      const token = await credential.user.getIdTokenResult(true);
      const session = await createServerSession(token.token, adminOnly);
      router.push(
        session.isAdmin ? "/admin" : "/dashboard",
      );
    } catch (error) {
      if (adminOnly) {
        try {
          await signOutAndClearSession(getFirebaseAuth());
        } catch (signOutError) {
          console.error("Could not clear the unauthorized admin sign-in:", signOutError);
        }
      }

      if (adminOnly && error instanceof AuthSessionError && error.status === 403) {
        setFormError(
          "This account does not have the admin role yet. In Firestore, set users/{your Firebase UID}.role to admin, then try again.",
        );
        return;
      }

      setFormError(getSignInErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerificationEmail() {
    if (!unverifiedUser) return;

    setResending(true);
    setFormError("");
    setNotice("");

    try {
      await sendEmailVerification(unverifiedUser);
      setNotice("Check your inbox for the verification link. If it does not arrive in a few minutes, check Spam or Promotions.");
    } catch (error) {
      setFormError(getSignInErrorMessage(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {adminOnly && (
        <div className="grid grid-cols-2 rounded-xl bg-[#edf4ee] p-1 text-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setFormError("");
              setNotice("");
            }}
            aria-pressed={mode === "sign-in"}
            className={`rounded-lg px-3 py-2.5 transition ${mode === "sign-in" ? "bg-white text-[#176b4d] shadow-sm" : "text-[#68766d]"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setFormError("");
              setNotice("");
            }}
            aria-pressed={mode === "create"}
            className={`rounded-lg px-3 py-2.5 transition ${mode === "create" ? "bg-white text-[#176b4d] shadow-sm" : "text-[#68766d]"}`}
          >
            Create admin account
          </button>
        </div>
      )}

      {formError && (
        <p role="alert" className="rounded-xl border border-[#f1d8d2] bg-[#fff8f6] p-4 text-sm leading-6 text-[#8b3c2d]">
          {formError}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-[#f4f8f2] p-3 text-sm leading-6 text-[#526258]">
          {notice}
        </p>
      )}
      {adminOnly && createdAdminUid && (
        <p className="rounded-xl border border-[#dce9dd] bg-white/80 p-3 text-xs leading-5 text-[#526258]">
          Firebase UID to use as the Firestore document ID:
          <code className="mt-1 block break-all font-mono text-[#176b4d]">
            {createdAdminUid}
          </code>
          Create <code>users/{createdAdminUid}</code> with string field{" "}
          <code>role: admin</code>.
        </p>
      )}

      <div>
        <label htmlFor="signin-email" className="mb-2 block text-sm font-semibold text-[#344b3b]">
          Email address
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete={mode === "create" ? "email" : "username"}
          autoCapitalize="none"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="register-glass-input min-h-12 w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="signin-password" className="block text-sm font-semibold text-[#344b3b]">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-semibold text-[#176b4d] hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="register-glass-input flex min-h-12 items-center rounded-xl pr-2 transition focus-within:border-[#91b99c] focus-within:ring-4 focus-within:ring-[#176b4d]/10">
          <input
            id="signin-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            required
            minLength={mode === "create" ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none"
            placeholder={mode === "create" ? "Create a password" : "Your password"}
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="rounded-lg p-2 text-[#68766d] hover:bg-[#f4f8f2] hover:text-[#176b4d]"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            <MaterialIcon name={passwordVisible ? "visibility_off" : "visibility"} />
          </button>
        </div>
      </div>

      {mode === "sign-in" && unverifiedUser && (
        <button
          type="button"
          onClick={resendVerificationEmail}
          disabled={resending}
          className="glass-button-light inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#176b4d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Sending..." : "Resend verification email"}
          <MaterialIcon name="send" className="text-base" />
        </button>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="glass-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? mode === "create"
            ? "Creating account..."
            : "Signing in..."
          : mode === "create"
            ? "Create admin account"
            : "Sign in"}
        {!submitting && <MaterialIcon name="arrow_forward" className="text-base" />}
      </button>

      <p className="text-center text-sm text-[#68766d]">
        {adminOnly ? (
          <Link href="/sign-in" className="font-semibold text-[#176b4d] hover:underline">
            Back to customer sign in
          </Link>
        ) : (
          <>
            New to Domivexa?{" "}
            <Link href="/register" className="font-semibold text-[#176b4d] hover:underline">
              Create an account
            </Link>
            <span className="mx-2 text-[#a3ada5]">·</span>
            <Link href="/admin-login" className="font-semibold text-[#176b4d] hover:underline">
              Admin login
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
