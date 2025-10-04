// firebase/firestoreAPI.ts
// Strongly-typed Firestore helpers for patients and allocations
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  runTransaction,
  Firestore,
} from "firebase/firestore";
import { db } from "./config";

export interface PatientInput {
  name: string;
  age: number;
  condition: string;
  severity: number;
}

export interface Patient extends PatientInput {
  status: "Queued" | "Admitted";
  createdAt: ReturnType<typeof serverTimestamp> | Date;
  allocatedResource?: string;
  allocatedBy?: string;
  allocatedAt?: ReturnType<typeof serverTimestamp> | Date;
}

export async function addPatient(patient: PatientInput): Promise<string> {
  const patientsRef = collection(db, "patients");
  const payload: Omit<Patient, "allocatedResource" | "allocatedBy" | "allocatedAt"> = {
    ...patient,
    status: "Queued",
    createdAt: serverTimestamp(),
  } as const;

  const docRef = await addDoc(patientsRef, payload as any);
  return docRef.id;
}

export async function allocateResource(
  patientId: string,
  resourceType: string,
  receptionist: string
): Promise<void> {
  const patientRef = doc(db, "patients", patientId);
  const resourceRef = doc(collection(db, "resources"), resourceType);
  const allocationsRef = collection(db, "allocations");

  await runTransaction(db as Firestore, async (transaction) => {
    // 1) Update patient
    transaction.update(patientRef, {
      status: "Admitted",
      allocatedResource: resourceType,
      allocatedBy: receptionist,
      allocatedAt: serverTimestamp(),
    });

    // 2) Decrement resource availability
    transaction.update(resourceRef, {
      available: increment(-1),
    });

    // 3) Add allocation record
    const allocationDoc = doc(allocationsRef);
    transaction.set(allocationDoc, {
      patientId,
      resourceType,
      receptionist,
      allocatedAt: serverTimestamp(),
    });
  });
}
