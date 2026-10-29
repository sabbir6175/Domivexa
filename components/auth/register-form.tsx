"use client";

import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { FormEvent, useState } from "react";
import { FirebaseConfigurationError, getFirebaseAuth } from "@/lib/firebase";
import { MaterialIcon } from "@/components/marketing/material-icon";

function getErrorMessage(error: unknown) {
  if (error instanceof FirebaseConfigurationError) {
    return "Firebase is not configured yet. Add the Firebase web app values to .env.local, then restart the development server.";
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account already uses this email. Try signing in instead.";
      case "auth/invalid-email":
        return "Enter a valid email address and try again.";
      case "auth/weak-password":
        return "Choose a stronger password with at least 8 characters, including a letter and a number.";
      case "auth/operation-not-allowed":
        return "Email and password registration is disabled in Firebase. Enable the Email/Password sign-in method in Firebase Console.";
      case "auth/network-request-failed":
        return "Could not reach Firebase. Check your internet connection and try again.";
      case "auth/too-many-requests":
        return "Too many attempts were made. Wait a little while, then try again.";
      case "auth/unauthorized-domain":
        return "This website domain is not authorized in Firebase. Add it under Authentication settings in Firebase Console.";
      default:
        return "Firebase could not complete the request. Check the Firebase configuration and try again.";
    }
  }

  console.error("Unexpected Firebase registration error:", error);
  return "Registration could not be completed because of an unexpected error. Please try again.";
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationUser, setVerificationUser] = useState<User | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    if (name.trim().length < 2) {
      setFormError("Enter your name using at least 2 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Your passwords do not match.");
      return;
    }

    setSubmitting(true);
    let user: User;

    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      user = credential.user;
    } catch (error) {
      setFormError(getErrorMessage(error));
      setSubmitting(false);
      return;
    }

    setVerificationUser(user);
    let profileWarning = "";

    try {
      await updateProfile(user, { displayName: name.trim() });
    } catch (error) {
      console.error("Could not save the Firebase account display name:", error);
      profileWarning = "Your account was created, but the display name could not be saved.";
    }

    try {
      await sendEmailVerification(user);
      setNotice(profileWarning || "Check your inbox for the verification link. If it does not arrive in a few minutes, check Spam or Promotions, or request a new email.");
    } catch (error) {
      setFormError(
        `${profileWarning ? `${profileWarning} ` : ""}Your account was created, but the verification email could not be sent. ${getErrorMessage(error)}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerificationEmail() {
    if (!verificationUser) return;

    setResending(true);
    setFormError("");
    setNotice("");

    try {
      await sendEmailVerification(verificationUser);
      setNotice("Check your inbox for the verification link. If it does not arrive in a few minutes, check Spam or Promotions.");
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  }

  if (verificationUser) {
    return (
      <div className="rounded-2xl border border-[#dce9dd] bg-[#f7fbf6] p-6 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f3e8] text-[#218259]">
          <MaterialIcon name="mark_email_read" className="text-2xl" />
        </span>
        <h2 className="mt-5 font-heading text-2xl font-bold text-[#172b22]">
          Check your inbox
        </h2>
        <p className="mt-3 leading-7 text-[#59685e]">
          Your account has been created. Verify your email address to finish
          setting up your account.
        </p>
        <p className="mt-2 break-all font-semibold text-[#176b4d]">
          {verificationUser.email}
        </p>
        <div className="mt-4 rounded-xl border border-[#dce9dd] bg-white/80 p-4 text-sm leading-6 text-[#526258]">
          <p className="font-semibold text-[#344b3b]">Can&apos;t find the email?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Check Spam, Promotions, and All Mail.</li>
            <li>Search for a message from noreply@domivexa.firebaseapp.com.</li>
            <li>Check that the account email above is spelled correctly.</li>
          </ul>
          <p className="mt-2 text-xs text-[#718078]">
            Firebase confirming the request does not guarantee delivery to your inbox.
          </p>
        </div>
        {notice && (
          <p role="status" className="mt-4 rounded-xl bg-white p-3 text-sm leading-6 text-[#526258]">
            {notice}
          </p>
        )}
        {formError && (
          <p role="alert" className="mt-4 rounded-xl border border-[#f1d8d2] bg-white p-3 text-sm leading-6 text-[#8b3c2d]">
            {formError}
          </p>
        )}
        <button
          type="button"
          onClick={resendVerificationEmail}
          disabled={resending}
          className="glass-button mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Sending..." : "Resend verification email"}
          <MaterialIcon name="send" className="text-base" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-xl border border-[#f1d8d2] bg-[#fff8f6] p-4 text-sm leading-6 text-[#8b3c2d]">
          {formError}
        </p>
      )}

      <div>
        <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-[#344b3b]">
          Full name
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="register-glass-input min-h-12 w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-[#344b3b]">
          Email address
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="register-glass-input min-h-12 w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-[#344b3b]">
          Password
        </label>
        <div className="register-glass-input flex min-h-12 items-center rounded-xl pr-2 transition focus-within:border-[#91b99c] focus-within:ring-4 focus-within:ring-[#176b4d]/10">
          <input
            id="register-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
            title="Use at least 8 characters, including a letter and a number."
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none"
            placeholder="At least 8 characters"
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
        <p className="mt-2 text-xs text-[#718078]">
          Use at least 8 characters, including a letter and a number.
        </p>
      </div>

      <div>
        <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-semibold text-[#344b3b]">
          Confirm password
        </label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type={passwordVisible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="register-glass-input min-h-12 w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
          placeholder="Enter your password again"
        />
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-[#f4f8f2] p-3 text-sm leading-6 text-[#526258]">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="glass-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating your account..." : "Create account"}
        {!submitting && <MaterialIcon name="arrow_forward" className="text-base" />}
      </button>

      <p className="text-center text-xs leading-6 text-[#718078]">
        Creating an account does not purchase a domain. Domain search, pricing,
        and registration are not connected to a live registrar yet.
      </p>
      <p className="text-center text-xs text-[#718078]">
        Read our <Link className="font-semibold text-[#176b4d] underline" href="/terms">Terms</Link> and{" "}
        <Link className="font-semibold text-[#176b4d] underline" href="/privacy">Privacy Policy</Link>.
      </p>
      <p className="text-center text-sm text-[#68766d]">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-[#176b4d] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
