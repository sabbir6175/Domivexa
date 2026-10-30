"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { FormEvent, useState } from "react";
import { FirebaseConfigurationError, getFirebaseAuth } from "@/lib/firebase";
import { MaterialIcon } from "@/components/marketing/material-icon";

function getSignInErrorMessage(error: unknown) {
  if (error instanceof FirebaseConfigurationError) {
    return "Firebase is not configured. Check .env.local and restart the development server.";
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "We couldn't sign you in with those details.";
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

function isCredentialError(error: unknown) {
  return (
    error instanceof FirebaseError &&
    ["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(
      error.code,
    )
  );
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState("");
  const [showAccountHelp, setShowAccountHelp] = useState(false);
  const [notice, setNotice] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setShowAccountHelp(false);
    setNotice("");
    setSubmitting(true);

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

      router.push("/dashboard");
    } catch (error) {
      setFormError(getSignInErrorMessage(error));
      setShowAccountHelp(isCredentialError(error));
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
      {formError && (
        <div role="alert" className="rounded-xl border border-[#f1d8d2] bg-[#fff8f6] p-4 text-sm leading-6 text-[#8b3c2d]">
          <p>{formError}</p>
          {showAccountHelp && (
            <p className="mt-2">
              If you haven&apos;t created an account,{" "}
              <Link href="/register" className="font-semibold underline">
                create one
              </Link>
              . If you already have an account, check your password or{" "}
              <Link href="/forgot-password" className="font-semibold underline">
                reset it
              </Link>
              .
            </p>
          )}
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-[#f4f8f2] p-3 text-sm leading-6 text-[#526258]">
          {notice}
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
          autoComplete="email"
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none"
            placeholder="Your password"
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

      {unverifiedUser && (
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
        {submitting ? "Signing in..." : "Sign in"}
        {!submitting && <MaterialIcon name="arrow_forward" className="text-base" />}
      </button>

      <p className="text-center text-sm text-[#68766d]">
        New to Domivexa?{" "}
        <Link href="/register" className="font-semibold text-[#176b4d] hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
