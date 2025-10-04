// firebase/firebase.ts
// Re-export db so other modules can import from './firebase'
import { db } from "./config";
export default db;
export { db };
