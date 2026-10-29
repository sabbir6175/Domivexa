"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div>
      {submitted ? (
        <div role="status" className="rounded-2xl border border-[#dce9dd] bg-[#f7fbf7] p-5 text-sm leading-6 text-[#526258]">
          <strong className="text-[#176b4d]">Preview only:</strong> your message has not
          been sent. A secure contact endpoint and support mailbox must be configured
          before this form can receive messages.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#344b3b]">
              Name
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-normal text-[#172b22] outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
              />
            </label>
            <label className="block text-sm font-semibold text-[#344b3b]">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-normal text-[#172b22] outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-[#344b3b]">
            What can we help with?
            <select
              name="topic"
              required
              defaultValue=""
              className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-normal text-[#172b22] outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
            >
              <option value="" disabled>Select a topic</option>
              <option>Domain question</option>
              <option>Transfer question</option>
              <option>Account support</option>
              <option>Other</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#344b3b]">
            Message
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              className="mt-2 w-full resize-y rounded-xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-normal leading-6 text-[#172b22] outline-none transition focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
            />
          </label>
          <p className="text-xs leading-5 text-[#718078]">
            Do not include passwords, payment information, or other sensitive data.
          </p>
          <button type="submit" className="glass-button inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white">
            Preview message <span aria-hidden="true" className="material-symbols-rounded text-base">send</span>
          </button>
        </form>
      )}
    </div>
  );
}
