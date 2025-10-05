// firebase/firestore.ts
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  onSnapshot,
  where,
  runTransaction,
  DocumentReference,
} from "firebase/firestore";
import { db } from "./config";
import { ReceptionistLogin, AmbulanceDispatch, AmbulanceResource, Patient } from "@/types";

const RECEPTIONIST_LOGINS_COLLECTION = "receptionistLogins";
const AMBULANCE_DISPATCH_COLLECTION = "ambulanceDispatch";
const AMBULANCE_RESOURCES_COLLECTION = "ambulanceResources";
const PATIENTS_COLLECTION = "patients";

/**
 * Record a receptionist login in Firestore
 */
export async function recordReceptionistLogin(
  uid: string,
  email: string,
  displayName?: string
): Promise<string> {
  try {
    const loginData = {
      name: displayName || email.split("@")[0],
      uid,
      email,
      loginTime: serverTimestamp(),
      loginTimeLocal: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, RECEPTIONIST_LOGINS_COLLECTION), loginData);
    return docRef.id;
  } catch (error) {
    throw new Error(
      `Failed to record login: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get recent receptionist logins (for admin)
 */
export async function getRecentLogins(limitCount: number = 50): Promise<ReceptionistLogin[]> {
  const q = query(
    collection(db, RECEPTIONIST_LOGINS_COLLECTION),
    orderBy("loginTime", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      uid: data.uid,
      email: data.email,
      loginTime: data.loginTime,
      loginTimeLocal: data.loginTimeLocal,
    } as ReceptionistLogin;
  });
}

/**
 * Get logins for a specific receptionist
 */
export async function getReceptionistLogins(uid: string, limitCount: number = 20): Promise<ReceptionistLogin[]> {
  const q = query(
    collection(db, RECEPTIONIST_LOGINS_COLLECTION),
    orderBy("loginTime", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => doc.data())
    .filter((data) => data.uid === uid)
    .map((data: any, idx) => ({
      id: snapshot.docs[idx].id,
      name: data.name,
      uid: data.uid,
      email: data.email,
      loginTime: data.loginTime,
      loginTimeLocal: data.loginTimeLocal,
    }));
}

/**
 * Move a patient from dispatch to patient queue inside a transaction
 */
export async function moveDispatchPatientToQueue(dispatchId: string): Promise<string> {
  const dispatchRef = doc(db, AMBULANCE_DISPATCH_COLLECTION, dispatchId);

  return await runTransaction(db, async (tx) => {
    const dispatchSnap = await tx.get(dispatchRef);
    if (!dispatchSnap.exists()) throw new Error("Dispatch not found");

    // Use type assertion for new fields
    const dispatchData = dispatchSnap.data() as AmbulanceDispatch & { movedToQueue?: boolean; patientDocId?: string };

    if (dispatchData.movedToQueue) return dispatchData.patientDocId || "";

    const patientRef = doc(collection(db, PATIENTS_COLLECTION));
    tx.set(patientRef, {
      name: dispatchData.patientName || "Unknown",
      age: dispatchData.age || 0,
      contact: dispatchData.contactNumber || "",
      severity: dispatchData.severityLevel || 3,
      status: "Waiting",
      admissionDateTime: serverTimestamp(),
      source: "ambulance",
    });

    tx.update(dispatchRef, {
      movedToQueue: true,
      patientDocId: patientRef.id,
      updatedAt: serverTimestamp(),
    });

    return patientRef.id;
  });
}

/**
 * Subscribe to ambulance dispatches in real-time
 */
export function subscribeAmbulanceDispatches(
  limitCount: number,
  callback: (dispatches: AmbulanceDispatch[]) => void
): () => void {
  const q = query(
    collection(db, AMBULANCE_DISPATCH_COLLECTION),
    orderBy("dispatchTime", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: (AmbulanceDispatch & { movedToQueue?: boolean; patientDocId?: string })[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // Move patients to queue for Available dispatches
      void Promise.all(
        list
          .filter((item) => item.ambulanceStatus === "Available" && !item.movedToQueue)
          .map(async (item) => {
            try {
              await moveDispatchPatientToQueue(item.id);
            } catch (e) {
              console.error("Failed to move dispatch patient to queue:", item.id, e);
            }
          })
      );

      callback(list);
    },
    (error) => {
      console.error("Error listening to ambulance dispatches:", error);
    }
  );
}

/**
 * Update ambulance dispatch status
 */
export async function updateAmbulanceDispatchStatus(
  dispatchId: string,
  status: "Available" | "En Route" | "Busy"
): Promise<void> {
  const dispatchRef = doc(db, AMBULANCE_DISPATCH_COLLECTION, dispatchId);

  await updateDoc(dispatchRef, {
    ambulanceStatus: status,
    updatedAt: serverTimestamp(),
  });

  if (status === "Available") {
    const dispatchDocSnap = await getDocs(
      query(collection(db, AMBULANCE_DISPATCH_COLLECTION), where("__name__", "==", dispatchId))
    );

    if (!dispatchDocSnap.empty) {
      const dispatchData = dispatchDocSnap.docs[0].data() as AmbulanceDispatch & { assignedAmbulanceID?: string };

      if (dispatchData.assignedAmbulanceID) {
        const ambulanceRef = doc(db, AMBULANCE_RESOURCES_COLLECTION, dispatchData.assignedAmbulanceID);
        await updateDoc(ambulanceRef, {
          status: "Available",
          currentDispatchId: null,
          lastUpdated: serverTimestamp(),
        });
      }

      try {
        await moveDispatchPatientToQueue(dispatchId);
      } catch (e) {
        console.error("Failed to move patient to queue after status update:", dispatchId, e);
      }
    }
  }
}

/**
 * Subscribe to patients collection in real-time
 */
export function subscribePatients(
  callback: (patients: Patient[]) => void
): () => void {
  const q = query(collection(db, PATIENTS_COLLECTION), orderBy("admissionDateTime", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Patient[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        let status = data.status;
        if (status === "waiting") status = "Waiting";
        if (status === "in_progress") status = "Admitted";

        let admission: string | undefined;
        if (data.admissionDateTime instanceof Timestamp) {
          admission = data.admissionDateTime.toDate().toISOString();
        } else if (data.admissionDateTime) {
          admission = new Date(data.admissionDateTime).toISOString();
        }

        return {
          id: d.id,
          name: data.name || "Unknown",
          age: data.age || 0,
          contact: data.contact || "",
          severity: data.severity || 3,
          status: status || "Waiting",
          admissionDateTime: admission,
          gender: data.gender || "Prefer not to say",
          emergencyContact: data.emergencyContact || "",
          diagnosis: data.diagnosis || "",
          assignedDoctor: data.assignedDoctor || "",
          ward: data.ward || "General",
          bedNumber: data.bedNumber || "",
          isICU: data.isICU || false,
          needsVentilator: data.needsVentilator || false,
          needsOxygen: data.needsOxygen || false,
          notes: data.notes || "",
          source: data.source || "manual",
          allocatedResource: data.allocatedResource || null,
          ...data,
        };
      });

      list.sort((a, b) => {
        const sevDiff = (b.severity || 0) - (a.severity || 0);
        if (sevDiff !== 0) return sevDiff;
        const aTime = a.admissionDateTime ? new Date(a.admissionDateTime).getTime() : 0;
        const bTime = b.admissionDateTime ? new Date(b.admissionDateTime).getTime() : 0;
        return bTime - aTime;
      });

      callback(list);
    },
    (error) => {
      console.error("Error listening to patients:", error);
    }
  );
}

/**
 * Get ambulance availability
 */
export function getAmbulanceAvailability(
  callback: (availableCount: number, totalCount: number) => void
): () => void {
  const q = query(collection(db, AMBULANCE_RESOURCES_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      let availableCount = 0;
      let totalCount = 0;

      snapshot.docs.forEach((d) => {
        const data = d.data() as AmbulanceResource;
        totalCount++;
        if (data.status === "Available") availableCount++;
      });

      callback(availableCount, totalCount);
    },
    (error) => console.error("Error listening to ambulance availability:", error)
  );
}

/**
 * Initialize ambulance resources
 */
export async function initializeAmbulanceResources(): Promise<void> {
  const totalAmbulances = 15;
  const batch: { ref: DocumentReference; data: AmbulanceResource }[] = [];

  for (let i = 1; i <= totalAmbulances; i++) {
    const ref = doc(collection(db, AMBULANCE_RESOURCES_COLLECTION));
    batch.push({
      ref,
      data: {
        id: `AMB-${i.toString().padStart(3, "0")}`,
        status: "Available",
        currentDispatchId: null,
        lastUpdated: serverTimestamp() as unknown as Timestamp, // TS fix
      },
    });
  }

  await runTransaction(db, async (tx) => {
    batch.forEach(({ ref, data }) => tx.set(ref, data));
  });
  console.log(`Initialized ${totalAmbulances} ambulance resources`);
}
