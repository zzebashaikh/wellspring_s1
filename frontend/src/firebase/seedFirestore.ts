// firebase/seedFirestore.ts
// Seeds Firestore for the hospital dashboard
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase.ts";

// Resource type definitions
interface SimpleResource {
  total: number;
  available: number;
  cleaning?: number;
  empty?: number;
  onTrip?: number;
  maintenance?: number;
}

interface WardsResource {
  General: { total: number; available: number; cleaning: number };
  Pediatrics: { total: number; available: number; cleaning: number };
  Maternity: { total: number; available: number; cleaning: number };
  Surgery: { total: number; available: number; cleaning: number };
}

export async function seedFirestore(): Promise<void> {
  // Collection refs
  const resourcesCol = collection(db, "resources");
  const patientsCol = collection(db, "patients");
  const allocationsCol = collection(db, "allocations");

  // Documents under resources
  const resources: Record<string, SimpleResource | WardsResource> = {
    beds: { total: 200, available: 150, cleaning: 10 },
    icus: { total: 50, available: 30, cleaning: 5 },
    ventilators: { total: 30, available: 25 },
    oxygen: { total: 100, available: 75, empty: 10 },
    nurses: { total: 150, available: 120 },
    ambulances: { total: 20, available: 15, onTrip: 3, maintenance: 2 },
    wards: {
      General: { total: 100, available: 80, cleaning: 5 },
      Pediatrics: { total: 40, available: 30, cleaning: 2 },
      Maternity: { total: 30, available: 25, cleaning: 1 },
      Surgery: { total: 30, available: 15, cleaning: 2 },
    },
  };

  // Seed each resource document
  const writes: Promise<void>[] = Object.entries(resources).map(([key, value]) =>
    setDoc(doc(resourcesCol, key), value as any)
  );

  // Ensure empty collections exist in code path (Firestore has no explicit empty collection creation)
  // We simply reference them without adding docs, as requested.
  void patientsCol; // no-op reference
  void allocationsCol; // no-op reference

  await Promise.all(writes);

  // Log success
  // eslint-disable-next-line no-console
  console.log("✅ Firestore seeded successfully!");
}

// Execute when run directly via ts-node (ESM-friendly)
seedFirestore().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to seed Firestore:", err);
  process.exitCode = 1;
});

