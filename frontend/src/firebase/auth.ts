// firebase/auth.ts
import { signInWithEmailAndPassword, User } from "firebase/auth";
import { auth } from "./config";
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
    const backend = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const response = await fetch(`${backend}/api/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ patientId, bed: bedNumber })
    });

    const data = await response.json();
    if (response.ok) {
      console.log("Allocation successful:", data);
    } else {
      console.error("Allocation failed:", data.message);
      throw new Error(`Allocation failed: ${data.message}`);
    }
  } catch (err: any) {
    console.error("Error calling backend:", err);
    throw new Error(`Error calling backend: ${err.message}`);
  }
}
