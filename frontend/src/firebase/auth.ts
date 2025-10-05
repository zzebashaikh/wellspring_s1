// firebase/auth.ts
import { signInWithEmailAndPassword, User } from "firebase/auth";
import { auth } from "./config";
import { getBaseUrl } from "@/utils/api";
import { FirebaseAuthError, FirebaseUser } from "@/types";
import { recordReceptionistLogin } from "./firestore";

export interface ReceptionistAuthResult {
  idToken: string;
  user: User;
}

// Login receptionist and get ID token
export async function loginReceptionist(
  email: string, 
  password: string
): Promise<string | null> {
  try {
    console.log("Starting login process for:", email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    
    console.log("Firebase Auth successful for user:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    // Record the login in Firestore
    try {
      console.log("Attempting to record login in Firestore...");
      const loginId = await recordReceptionistLogin(
        user.uid,
        user.email || email,
        user.displayName || undefined
      );
      console.log("Login recorded in Firestore successfully with ID:", loginId);
    } catch (firestoreError) {
      // Don't fail the login if Firestore recording fails
      console.error("Failed to record login in Firestore:", firestoreError);
      console.warn("Login will continue despite Firestore error");
    }
    
    return idToken;
  } catch (err: any) {
    console.error("Login failed:", err.message);
    const firebaseError: FirebaseAuthError = {
      code: err.code || 'auth/unknown',
      message: err.message || 'An unknown error occurred'
    };
    throw new Error(`Login failed: ${firebaseError.message}`);
  }
}

// Allocate patient
export async function allocatePatient(
  idToken: string, 
  patientId: string, 
  bedNumber: number
): Promise<void> {
  try {
    const baseApi = await getBaseUrl();
    const response = await fetch(`${baseApi.replace(/\/$/, '')}/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ patientId, bed: bedNumber })
    });

    let data: any = null;
    try { data = await response.json(); } catch { /* ignore parse errors */ }
    if (!response.ok) {
      const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
      throw new Error(`Allocation failed: ${message}`);
    }
    console.log("Allocation successful:", data);
  } catch (err: any) {
    console.error("Error calling backend:", err);
    throw new Error(`Error calling backend: ${err.message}`);
  }
}
