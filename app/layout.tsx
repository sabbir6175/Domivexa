/* eslint-disable @next/next/no-page-custom-font -- Material Symbols are shared through the App Router root layout. */
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const headingFont = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Domivexa | Find a domain for your next big idea",
  description:
    "Find a name that feels like you, explore domain endings, and start building your online home with Domivexa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
