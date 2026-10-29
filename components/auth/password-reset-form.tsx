"use client";

import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { FormEvent, useState } from "react";
import { FirebaseConfigurationError, getFirebaseAuth } from "@/lib/firebase";
import { MaterialIcon } from "@/components/marketing/material-icon";

function getResetErrorMessage(error: unknown) {
  if (error instanceof FirebaseConfigurationError) {
    return "Firebase is not configured. Check .env.local and restart the development server.";
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/user-not-found":
      case "auth/invalid-credential":
        return "If an account exists for that email, Firebase will send a password reset link.";
      case "auth/too-many-requests":
        return "Too many requests. Wait a little while, then try again.";
      case "auth/network-request-failed":
        return "Could not reach Firebase. Check your internet connection and try again.";
      case "auth/unauthorized-domain":
        return "This website domain is not authorized in Firebase Authentication.";
      default:
        return "Firebase could not send the reset email. Please try again.";
    }
  }

  console.error("Unexpected Firebase password reset error:", error);
  return "The password reset request could not be completed because of an unexpected error.";
}

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setNotice("If an account exists for that email, a password reset link will arrive shortly. Check Spam or Promotions if you do not see it.");
    } catch (requestError) {
      setError(getResetErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p role="alert" className="rounded-xl border border-[#f1d8d2] bg-[#fff8f6] p-4 text-sm leading-6 text-[#8b3c2d]">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-[#dce9dd] bg-[#f7fbf6] p-4 text-sm leading-6 text-[#526258]">
          {notice}
        </p>
      )}
      <div>
        <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-[#344b3b]">
          Email address
        </label>
        <input
          id="reset-email"
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
      <button
        type="submit"
        disabled={submitting}
        className="glass-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending reset link..." : "Send reset link"}
        {!submitting && <MaterialIcon name="send" className="text-base" />}
      </button>
      <p className="text-center text-sm text-[#68766d]">
        Remember your password?{" "}
        <Link href="/sign-in" className="font-semibold text-[#176b4d] hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
