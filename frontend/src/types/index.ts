// types/index.ts
import { Timestamp } from "firebase/firestore";

export interface Receptionist {
  uid: string;
  email: string;
  displayName?: string;
  role: 'receptionist';
  permissions: string[];
}

export interface ReceptionistLogin {
  id?: string; // Document ID
  name: string; // Receptionist name
  uid: string; // Firebase UID
  email: string; // Receptionist email
  loginTime: Timestamp; // Server timestamp
  loginTimeLocal?: string; // Local timestamp as ISO string
}

export interface AuthToken {
  token: string;
  expiresAt: number;
  user: Receptionist;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: Receptionist;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'waiting' | 'in_progress' | 'completed';
  assignedBed?: number;
  assignedDoctor?: string;
  notes?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  contact?: string;
  emergencyContact?: string;
  admissionDateTime?: string;
  diagnosis?: string;
  bedNumber?: string;
  ward?: string;
  isICU?: boolean;
  needsVentilator?: boolean;
  needsOxygen?: boolean;
  severity?: number;
  allocatedResource?: string;
}

export interface Resource {
  type: string;
  total: number;
  available: number;
  cleaning?: number;
  empty?: number;
  onTrip?: number;
  maintenance?: number;
}

export interface AllocationRequest {
  patientId: string;
  resourceType: string;
  bed?: number;
}

export interface AllocationResponse {
  success: boolean;
  allocation?: {
    patientId: string;
    resourceType: string;
    resourceId: string;
    allocatedAt: string;
  };
  error?: string;
}

// Firebase specific types
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface FirebaseAuthError {
  code: string;
  message: string;
}

export interface FirebaseAuthResult {
  user: FirebaseUser;
  credential?: any;
}

// Firestore specific types
export interface FirestoreError {
  code: string;
  message: string;
}

export interface FirestoreWriteResult {
  id: string;
  success: boolean;
  error?: string;
}

// Ambulance Dispatch types
export interface AmbulanceDispatch {
  id?: string;
  patientName: string;
  age: number;
  contactNumber: string;
  severityLevel: number; // 1-5
  pickupAddress: string;
  assignedAmbulanceID?: string;
  dispatchTime: Timestamp;
  ambulanceStatus: 'Available' | 'En Route' | 'Busy';
  dispatchedBy?: string; // Receptionist UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AmbulanceDispatchInput {
  patientName: string;
  age: number;
  contactNumber: string;
  severityLevel: number;
  pickupAddress: string;
}

export interface AmbulanceResource {
  id: string;
  status: 'Available' | 'En Route' | 'Busy' | 'Maintenance';
  currentDispatchId?: string;
  lastUpdated: Timestamp;
}
