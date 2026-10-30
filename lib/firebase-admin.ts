import "server-only";

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID must be configured for server authentication.");
  }

  const app =
    getApps().find((candidate) => candidate.name === "[DEFAULT]") ??
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });

  if (app.options.projectId !== projectId) {
    throw new Error("FIREBASE_PROJECT_ID does not match the initialized Firebase Admin app.");
  }

  return app;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
