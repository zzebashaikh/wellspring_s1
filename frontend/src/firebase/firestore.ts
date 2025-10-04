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
  increment
} from "firebase/firestore";
import { db } from "./config";
import { ReceptionistLogin, AmbulanceDispatch, AmbulanceDispatchInput, AmbulanceResource } from "@/types";

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
    console.log("Starting to record login for:", { uid, email, displayName });
    
    // Create the login data object
    const loginData = {
      name: displayName || email.split('@')[0], // Use displayName or extract name from email
      uid,
      email,
      loginTime: serverTimestamp(), // Use serverTimestamp() directly
      loginTimeLocal: new Date().toISOString() // Store as ISO string for better compatibility
    };

    console.log("Login data to be saved:", loginData);

    const docRef = await addDoc(collection(db, RECEPTIONIST_LOGINS_COLLECTION), loginData);
    console.log("Login recorded successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error recording login:", error);
    throw new Error(`Failed to record login: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Subscribe to ambulance dispatch history in real-time
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

  return onSnapshot(q, (querySnapshot) => {
    const list: AmbulanceDispatch[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data() as any;
      list.push({ id: d.id, ...data } as AmbulanceDispatch);
    });
    callback(list);
  }, (error) => {
    console.error('Error listening to ambulance dispatches:', error);
  });
}

/**
 * Get recent receptionist logins (for admin purposes)
 */
export async function getRecentLogins(limitCount: number = 50): Promise<ReceptionistLogin[]> {
  try {
    const q = query(
      collection(db, RECEPTIONIST_LOGINS_COLLECTION),
      orderBy("loginTime", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const logins: ReceptionistLogin[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logins.push({
        id: doc.id,
        name: data.name,
        uid: data.uid,
        email: data.email,
        loginTime: data.loginTime,
        loginTimeLocal: data.loginTimeLocal
      });
    });

    return logins;
  } catch (error) {
    console.error("Error fetching recent logins:", error);
    throw new Error(`Failed to fetch logins: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get logins for a specific receptionist
 */
export async function getReceptionistLogins(uid: string, limitCount: number = 20): Promise<ReceptionistLogin[]> {
  try {
    const q = query(
      collection(db, RECEPTIONIST_LOGINS_COLLECTION),
      orderBy("loginTime", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const logins: ReceptionistLogin[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.uid === uid) {
        logins.push({
          id: doc.id,
          name: data.name,
          uid: data.uid,
          email: data.email,
          loginTime: data.loginTime,
          loginTimeLocal: data.loginTimeLocal
        });
      }
    });

    return logins;
  } catch (error) {
    console.error("Error fetching receptionist logins:", error);
    throw new Error(`Failed to fetch receptionist logins: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new ambulance dispatch record
 */
export async function createAmbulanceDispatch(
  dispatchData: AmbulanceDispatchInput,
  receptionistUid?: string
): Promise<string> {
  try {
    console.log("Creating ambulance dispatch:", dispatchData);
    
    // First, find an available ambulance
    const availableAmbulance = await findAvailableAmbulance();
    if (!availableAmbulance) {
      throw new Error("No ambulances available for dispatch");
    }

    // Create dispatch data
    const dispatchRecord: Omit<AmbulanceDispatch, 'id'> = {
      ...dispatchData,
      assignedAmbulanceID: availableAmbulance.id,
      dispatchTime: serverTimestamp() as Timestamp,
      ambulanceStatus: 'En Route',
      dispatchedBy: receptionistUid,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Use transaction to ensure atomicity
    const dispatchId = await runTransaction(db, async (transaction) => {
      // Create dispatch record
      const dispatchRef = doc(collection(db, AMBULANCE_DISPATCH_COLLECTION));
      transaction.set(dispatchRef, dispatchRecord);

      // Update ambulance status
      const ambulanceRef = doc(db, AMBULANCE_RESOURCES_COLLECTION, availableAmbulance.id);
      transaction.update(ambulanceRef, {
        status: 'En Route',
        currentDispatchId: dispatchRef.id,
        lastUpdated: serverTimestamp(),
      });

      return dispatchRef.id;
    });

    console.log("Ambulance dispatch created successfully with ID:", dispatchId);
    return dispatchId;
  } catch (error) {
    console.error("Error creating ambulance dispatch:", error);
    throw new Error(`Failed to create dispatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find an available ambulance
 */
export async function findAvailableAmbulance(): Promise<AmbulanceResource | null> {
  try {
    const q = query(
      collection(db, AMBULANCE_RESOURCES_COLLECTION),
      where("status", "==", "Available"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as AmbulanceResource;
  } catch (error) {
    console.error("Error finding available ambulance:", error);
    throw new Error(`Failed to find available ambulance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all ambulance dispatch records
 */
export async function getAmbulanceDispatches(limitCount: number = 50): Promise<AmbulanceDispatch[]> {
  try {
    const q = query(
      collection(db, AMBULANCE_DISPATCH_COLLECTION),
      orderBy("dispatchTime", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const dispatches: AmbulanceDispatch[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      dispatches.push({
        id: doc.id,
        ...data
      } as AmbulanceDispatch);
    });

    return dispatches;
  } catch (error) {
    console.error("Error fetching ambulance dispatches:", error);
    throw new Error(`Failed to fetch dispatches: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update ambulance dispatch status
 */
export async function updateAmbulanceDispatchStatus(
  dispatchId: string,
  status: 'Available' | 'En Route' | 'Busy'
): Promise<void> {
  try {
    const dispatchRef = doc(db, AMBULANCE_DISPATCH_COLLECTION, dispatchId);
    await updateDoc(dispatchRef, {
      ambulanceStatus: status,
      updatedAt: serverTimestamp(),
    });

    // If status is Available, also update the ambulance resource
    if (status === 'Available') {
      const dispatchDoc = await getDocs(query(
        collection(db, AMBULANCE_DISPATCH_COLLECTION),
        where("__name__", "==", dispatchId)
      ));
      
      if (!dispatchDoc.empty) {
        const dispatchData = dispatchDoc.docs[0].data();
        if (dispatchData.assignedAmbulanceID) {
          const ambulanceRef = doc(db, AMBULANCE_RESOURCES_COLLECTION, dispatchData.assignedAmbulanceID);
          await updateDoc(ambulanceRef, {
            status: 'Available',
            currentDispatchId: null,
            lastUpdated: serverTimestamp(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error updating ambulance dispatch status:", error);
    throw new Error(`Failed to update dispatch status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get real-time ambulance availability count
 */
export function getAmbulanceAvailability(
  callback: (availableCount: number, totalCount: number) => void
): () => void {
  const q = query(collection(db, AMBULANCE_RESOURCES_COLLECTION));
  
  return onSnapshot(q, (querySnapshot) => {
    let availableCount = 0;
    let totalCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalCount++;
      if (data.status === 'Available') {
        availableCount++;
      }
    });

    callback(availableCount, totalCount);
  }, (error) => {
    console.error("Error listening to ambulance availability:", error);
  });
}

/**
 * Subscribe to patients collection in real-time
 * Normalizes status casing and converts admissionDateTime to ISO string
 */
export function subscribePatients(
  callback: (patients: Array<{
    id: string;
    name: string;
    age: number;
    contact: string;
    severity: number;
    status: 'Waiting' | 'Admitted';
    [key: string]: any;
  }>) => void
): () => void {
  const q = query(collection(db, PATIENTS_COLLECTION), orderBy('admissionDateTime', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const list: any[] = [];
    querySnapshot.forEach((d) => {
      const data: any = d.data();
      let status = data.status;
      
      // Normalize status values
      if (status === 'waiting') status = 'Waiting';
      if (status === 'in_progress') status = 'Admitted';
      if (status === 'Admitted') status = 'Admitted'; // Keep as is
      if (status === 'Waiting') status = 'Waiting'; // Keep as is

      let admission = data.admissionDateTime;
      if (admission && admission.toDate) {
        admission = admission.toDate().toISOString();
      }

      // Ensure all required fields are present with defaults
      const patient = {
        id: d.id,
        name: data.name || 'Unknown',
        age: data.age || 0,
        contact: data.contact || '',
        severity: data.severity || 3,
        status: status || 'Waiting',
        admissionDateTime: admission,
        gender: data.gender || 'Prefer not to say',
        emergencyContact: data.emergencyContact || '',
        diagnosis: data.diagnosis || '',
        assignedDoctor: data.assignedDoctor || '',
        ward: data.ward || 'General',
        bedNumber: data.bedNumber || '',
        isICU: data.isICU || false,
        needsVentilator: data.needsVentilator || false,
        needsOxygen: data.needsOxygen || false,
        notes: data.notes || '',
        source: data.source || 'manual',
        allocatedResource: data.allocatedResource || null,
        ...data // Include any other fields
      };

      list.push(patient);
    });

    // Sort by severity desc then by admissionDateTime desc
    list.sort((a, b) => {
      const sevDiff = (b.severity || 0) - (a.severity || 0);
      if (sevDiff !== 0) return sevDiff;
      const aTime = a.admissionDateTime ? new Date(a.admissionDateTime).getTime() : 0;
      const bTime = b.admissionDateTime ? new Date(b.admissionDateTime).getTime() : 0;
      return bTime - aTime;
    });

    console.log('Patients updated via real-time listener:', list.length, 'patients');
    callback(list as any);
  }, (error) => {
    console.error('Error listening to patients:', error);
  });
}

/**
 * Initialize ambulance resources (run once to set up the collection)
 */
export async function initializeAmbulanceResources(): Promise<void> {
  try {
    const totalAmbulances = 15;
    const batch = [];

    for (let i = 1; i <= totalAmbulances; i++) {
      const ambulanceRef = doc(collection(db, AMBULANCE_RESOURCES_COLLECTION));
      batch.push({
        ref: ambulanceRef,
        data: {
          id: `AMB-${i.toString().padStart(3, '0')}`,
          status: 'Available',
          currentDispatchId: null,
          lastUpdated: serverTimestamp(),
        }
      });
    }

    // Use transaction to create all ambulances
    await runTransaction(db, async (transaction) => {
      batch.forEach(({ ref, data }) => {
        transaction.set(ref, data);
      });
    });

    console.log(`Initialized ${totalAmbulances} ambulance resources`);
  } catch (error) {
    console.error("Error initializing ambulance resources:", error);
    throw new Error(`Failed to initialize ambulance resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
