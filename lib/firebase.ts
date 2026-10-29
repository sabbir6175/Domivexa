import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export class FirebaseConfigurationError extends Error {
  constructor(missingVariables: string[]) {
    super(`Missing Firebase configuration: ${missingVariables.join(", ")}`);
    this.name = "FirebaseConfigurationError";
  }
}

export function getFirebaseAuth() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const requiredVariables = [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", config.apiKey],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", config.authDomain],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", config.projectId],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", config.appId],
  ] as const;
  const missingVariables = requiredVariables
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new FirebaseConfigurationError(missingVariables);
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return getAuth(app);
}
