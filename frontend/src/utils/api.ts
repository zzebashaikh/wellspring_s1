// utils/api.ts
import { loginReceptionist } from "@/firebase/auth";
import { getRecentLogins, getReceptionistLogins } from "@/firebase/firestore";
import { auth } from "@/firebase/config";
import { 
  AllocationRequest, 
  ApiResponse, 
  LoginResponse,
  Receptionist,
  ReceptionistLogin,
  AmbulanceDispatch,
  AmbulanceDispatchInput
} from "@/types";

// Local types aligned with backend API and Dashboard usage
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  contact: string;
  emergencyContact?: string;
  diagnosis?: string;
  assignedDoctor?: string;
  ward?: string;
  bedNumber?: string;
  isICU?: boolean;
  needsVentilator?: boolean;
  needsOxygen?: boolean;
  severity: number; // 1-5 priority
  status: 'Waiting' | 'Admitted';
  notes?: string;
  admissionDateTime?: string;
  allocatedResource?: string;
}

export interface Resource {
  total: number;
  available: number;
  cleaning?: number;
  empty?: number;
  onTrip?: number;
  maintenance?: number;
}

// Use relative URLs for API calls - Vite proxy will handle routing to backend
const getBaseUrl = async (): Promise<string> => {
  // Prefer explicit backend URL if provided
  const explicit = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/api`;
  }
  // In development, use the proxy
  if (!import.meta.env.PROD) return '/api';
  // Fallback for production if not set
  return '/api';
};

// Simple console smoke test to verify token handling and API stability
export async function apiSmokeTest() {
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken(false) : null;
    console.log('[apiSmokeTest] Current user:', user?.uid || 'none');
    console.log('[apiSmokeTest] Token (first 16):', token ? token.slice(0, 16) + '...' : 'none');

    const [patients, resources, doctors, dispatches, availability] = await Promise.all([
      patientsAPI.getAll().catch((e) => ({ error: e?.message || String(e) })),
      resourcesAPI.getAll().catch((e) => ({ error: e?.message || String(e) })),
      resourcesAPI.getDoctors().catch((e) => ({ error: e?.message || String(e) })),
      ambulanceAPI.getDispatches(5).catch((e) => ({ error: e?.message || String(e) })),
      ambulanceAPI.getAvailability().catch((e) => ({ error: e?.message || String(e) })),
    ]);

    console.log('[apiSmokeTest] Patients:', patients);
    console.log('[apiSmokeTest] Resources:', resources);
    console.log('[apiSmokeTest] Doctors:', doctors);
    console.log('[apiSmokeTest] Dispatches:', dispatches);
    console.log('[apiSmokeTest] Ambulance availability:', availability);

    // Force refresh token and try one authedFetch ping to validate retry path
    const BASE_URL = await getBaseUrl();
    const fresh = user ? await user.getIdToken(true) : null;
    console.log('[apiSmokeTest] Fresh token (first 16):', fresh ? fresh.slice(0, 16) + '...' : 'none');
    const pingResp = await authedFetch(`${BASE_URL}/resources`);
    console.log('[apiSmokeTest] Ping /resources status:', pingResp.status);
    return {
      ok: true,
      patients,
      resources,
      doctors,
      dispatches,
      availability,
      tokenFirst16: token ? token.slice(0, 16) : null,
      freshFirst16: fresh ? fresh.slice(0, 16) : null,
    };
  } catch (e: any) {
    console.error('[apiSmokeTest] Failed:', e);
    return { ok: false, error: e?.message || String(e) };
  }
}

// Expose test in dev for easy console usage
if (typeof window !== 'undefined' && !(import.meta as any).env.PROD) {
  // @ts-ignore
  window.apiSmokeTest = apiSmokeTest;
}

// Firebase auth token helpers and authed fetch wrapper
const getValidIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("auth.currentUser is null. User might be signed out or anonymous.");
      return null;
    }
    // If forceRefresh is true, always fetch a fresh token
    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (err) {
    console.error("Failed to get Firebase ID token:", err);
    return null;
  }
};

export const authedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit & { retrying?: boolean }
): Promise<Response> => {
  const { retrying, headers: initHeaders, ...rest } = init || {};

  // Get token (no force) and attach
  let token = await getValidIdToken(false);
  const headers: Record<string, string> = {
    ...(typeof initHeaders === 'object' ? (initHeaders as Record<string, string>) : {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(input, { ...rest, headers });
  } catch (err) {
    console.error("Network error during fetch:", input, err);
    throw err;
  }

  // If unauthorized/forbidden, try once more with forced refresh
  if ((response.status === 401 || response.status === 403) && !retrying) {
    console.warn(`Received ${response.status}. Retrying once with forced token refresh...`);
    const freshToken = await getValidIdToken(true);
    const retryHeaders: Record<string, string> = {
      ...(typeof initHeaders === 'object' ? (initHeaders as Record<string, string>) : {}),
    };
    if (freshToken) retryHeaders['Authorization'] = `Bearer ${freshToken}`;
    try {
      return await fetch(input, { ...rest, headers: retryHeaders, // mark as retrying by passing flag
        // @ts-expect-error custom flag not part of RequestInit; only used internally
        retrying: true });
    } catch (err) {
      console.error("Network error during retry fetch:", input, err);
      throw err;
    }
  }

  return response;
};

// Safely parse JSON responses to avoid "Unexpected end of JSON input"
const parseJsonSafe = async (response: Response): Promise<any | null> => {
  try {
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type') || '';
    if (response.status === 204) return null;
    if (contentLength === '0') return null;
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      try { return JSON.parse(text); } catch { return null; }
    }
    return await response.json();
  } catch {
    return null;
  }
};

const buildApiError = async (response: Response, fallbackMessage: string) => {
  let message = `${fallbackMessage} (HTTP ${response.status} ${response.statusText || ''}).`;
  try {
    const maybeJson = await parseJsonSafe(response);
    if (maybeJson && (maybeJson.message || maybeJson.error)) {
      message = `${maybeJson.message || maybeJson.error} (HTTP ${response.status} ${response.statusText || ''}).`;
    } else {
      const text = await response.text();
      if (text) message = text;
    }
  } catch {
    // ignore
  }
  return new Error(message);
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<string | null> => {
    try {
      // For demo purposes, simulate successful login with demo credentials
      if (email === "receptionist@wellspring.com" && password === "demo123") {
        const mockToken = "demo-token-" + Date.now();
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("authToken", mockToken);
        console.log("Demo login successful, token:", mockToken);
        return mockToken;
      }
      
      // Try Firebase authentication for other credentials
      try {
        const idToken = await loginReceptionist(email, password);
        if (idToken) {
          localStorage.setItem("isAuthenticated", "true");
          // Storing token is optional; all API calls now fetch a fresh token automatically
          localStorage.setItem("authToken", idToken);
          console.log("Firebase login successful; token will be fetched dynamically per request.");
        }
        return idToken;
      } catch (firebaseError) {
        // If Firebase auth fails, still allow demo login
        if (email === "receptionist@wellspring.com" && password === "demo123") {
          const mockToken = "demo-token-" + Date.now();
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("authToken", mockToken);
          console.log("Fallback demo login successful, token:", mockToken);
          return mockToken;
        }
        throw firebaseError;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  verify: async (): Promise<LoginResponse> => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No token found");
    return { success: true };
  },

  logout: (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAuthenticated");
  },

  getCurrentUser: (): Receptionist | null => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    
    // In a real app, you'd decode the JWT token to get user info
    // For now, return a mock receptionist object
    return {
      uid: "mock-uid",
      email: "receptionist@wellspring.com",
      role: "receptionist",
      permissions: ["read:patients", "write:patients", "allocate:resources"]
    };
  },

  // Login tracking methods
  getRecentLogins: async (limitCount: number = 50): Promise<ReceptionistLogin[]> => {
    try {
      return await getRecentLogins(limitCount);
    } catch (error) {
      console.error("Error fetching recent logins:", error);
      throw error;
    }
  },

  getReceptionistLogins: async (uid: string, limitCount: number = 20): Promise<ReceptionistLogin[]> => {
    try {
      return await getReceptionistLogins(uid, limitCount);
    } catch (error) {
      console.error("Error fetching receptionist logins:", error);
      throw error;
    }
  }
};


// Patients API
export const patientsAPI = {
  getAll: async (): Promise<Patient[]> => {
    try {
      const BASE_URL = await getBaseUrl();
      const response = await authedFetch(`${BASE_URL}/patients`);
      
      if (!response.ok) {
        const error: any = await parseJsonSafe(response);
        throw new Error(error?.message || 'Failed to fetch patients');
      }
      
      const result: ApiResponse<Patient[]> | null = await parseJsonSafe(response);
      if (!result || !result.data) throw new Error('Unexpected server response for patients');
      return result.data!;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/patients/${id}`);
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to fetch patient');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  create: async (patientData: Omit<Patient, 'id' | 'status'>): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to create patient');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  update: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to update patient');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  delete: async (id: string): Promise<void> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/patients/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to delete patient');
    }
  },

  allocateResource: async (id: string, allocatedResource: string): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/patients/${id}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocatedResource }),
    });
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to allocate resource');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  }
};


// Resources API
export const resourcesAPI = {
  getAll: async (): Promise<any> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/resources`);
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to fetch resources');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  getByType: async (resourceType: string): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/resources/${resourceType}`);
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to fetch resource');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  update: async (resourceType: string, data: Partial<Resource>): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/resources/${resourceType}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to update resource');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  allocate: async (resourceType: string): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/resources/${resourceType}/allocate`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to allocate resource');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  release: async (resourceType: string): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/resources/${resourceType}/release`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      throw new Error((error && error.message) || 'Failed to release resource');
    }
    
    const result = await parseJsonSafe(response);
    return result?.data;
  },

  getDoctors: async (): Promise<string[]> => {
    const BASE_URL = await getBaseUrl();
    console.log("Getting doctors from:", BASE_URL);
    const response = await authedFetch(`${BASE_URL}/resources/doctors/list`);
    
    console.log("Doctors API response:", response.status, response.statusText);
    
    if (!response.ok) {
      const error = await parseJsonSafe(response);
      console.error("Doctors API error:", error);
      throw new Error((error && error.message) || 'Failed to fetch doctors');
    }
    
    const result = await parseJsonSafe(response);
    console.log("Doctors API result:", result);
    return (result && result.data) as string[];
  }
};

// Ambulance Dispatch API
export const ambulanceAPI = {
  createDispatch: async (dispatchData: AmbulanceDispatchInput): Promise<AmbulanceDispatch> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/ambulance/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatchData),
    });
    
    if (!response.ok) {
      throw await buildApiError(response, 'Failed to create ambulance dispatch');
    }
    const result = await parseJsonSafe(response);
    if (!result || !result.data) {
      throw new Error('Unexpected server response while creating dispatch');
    }
    return result.data;
  },

  getDispatches: async (limit: number = 50): Promise<AmbulanceDispatch[]> => {
    const BASE_URL = await getBaseUrl();
    console.log("Getting ambulance dispatches from:", BASE_URL);
    const response = await authedFetch(`${BASE_URL}/ambulance/dispatches?limit=${limit}`);
    
    console.log("Ambulance dispatches API response:", response.status, response.statusText);
    
    if (!response.ok) {
      const error = await buildApiError(response, 'Failed to fetch ambulance dispatches');
      console.error("Ambulance dispatches API error:", error);
      throw error;
    }
    const result = await parseJsonSafe(response);
    console.log("Ambulance dispatches API result:", result);
    return (result && result.data) || [];
  },

  getAvailability: async (): Promise<{ total: number; available: number; onTrip: number; maintenance: number }> => {
    const BASE_URL = await getBaseUrl();
    console.log("Getting ambulance availability from:", BASE_URL);
    const response = await authedFetch(`${BASE_URL}/ambulance/availability`);
    
    console.log("Ambulance availability API response:", response.status, response.statusText);
    
    if (!response.ok) {
      const error = await buildApiError(response, 'Failed to fetch ambulance availability');
      console.error("Ambulance availability API error:", error);
      throw error;
    }
    const result = await parseJsonSafe(response);
    console.log("Ambulance availability API result:", result);
    if (!result || !result.data) {
      return { total: 0, available: 0, onTrip: 0, maintenance: 0 };
    }
    return result.data;
  },

  updateDispatchStatus: async (dispatchId: string, status: 'Available' | 'En Route' | 'Busy'): Promise<void> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/ambulance/dispatch/${dispatchId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw await buildApiError(response, 'Failed to update dispatch status');
    }
  },

  initializeResources: async (): Promise<void> => {
    const BASE_URL = await getBaseUrl();
    const response = await authedFetch(`${BASE_URL}/ambulance/initialize`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw await buildApiError(response, 'Failed to initialize ambulance resources');
    }
  }
};
