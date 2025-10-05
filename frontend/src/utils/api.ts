// utils/api.ts
import { loginReceptionist } from "@/firebase/auth";
import { getRecentLogins, getReceptionistLogins } from "@/firebase/firestore";
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


// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
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
          localStorage.setItem("authToken", idToken);
          console.log("Firebase login successful, token:", idToken);
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
      const response = await fetch(`${BASE_URL}/patients`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const error: any = await response.json();
        throw new Error(error.message || 'Failed to fetch patients');
      }
      
      const result: ApiResponse<Patient[]> = await response.json();
      return result.data!;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch patient');
    }
    
    const result = await response.json();
    return result.data;
  },

  create: async (patientData: Omit<Patient, 'id' | 'status'>): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create patient');
    }
    
    const result = await response.json();
    return result.data;
  },

  update: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update patient');
    }
    
    const result = await response.json();
    return result.data;
  },

  delete: async (id: string): Promise<void> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete patient');
    }
  },

  allocateResource: async (id: string, allocatedResource: string): Promise<Patient> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/patients/${id}/allocate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ allocatedResource }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to allocate resource');
    }
    
    const result = await response.json();
    return result.data;
  }
};


// Resources API
export const resourcesAPI = {
  getAll: async (): Promise<any> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/resources`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch resources');
    }
    
    const result = await response.json();
    return result.data;
  },

  getByType: async (resourceType: string): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/resources/${resourceType}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch resource');
    }
    
    const result = await response.json();
    return result.data;
  },

  update: async (resourceType: string, data: Partial<Resource>): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/resources/${resourceType}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update resource');
    }
    
    const result = await response.json();
    return result.data;
  },

  allocate: async (resourceType: string): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/resources/${resourceType}/allocate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to allocate resource');
    }
    
    const result = await response.json();
    return result.data;
  },

  release: async (resourceType: string): Promise<Resource> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/resources/${resourceType}/release`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to release resource');
    }
    
    const result = await response.json();
    return result.data;
  },

  getDoctors: async (): Promise<string[]> => {
    const BASE_URL = await getBaseUrl();
    console.log("Getting doctors from:", BASE_URL);
    const response = await fetch(`${BASE_URL}/resources/doctors/list`, {
      headers: getAuthHeaders(),
    });
    
    console.log("Doctors API response:", response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json();
      console.error("Doctors API error:", error);
      throw new Error(error.message || 'Failed to fetch doctors');
    }
    
    const result = await response.json();
    console.log("Doctors API result:", result);
    return result.data;
  }
};

// Ambulance Dispatch API
export const ambulanceAPI = {
  createDispatch: async (dispatchData: AmbulanceDispatchInput): Promise<AmbulanceDispatch> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/ambulance/dispatch`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    const response = await fetch(`${BASE_URL}/ambulance/dispatches?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    
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
    const response = await fetch(`${BASE_URL}/ambulance/availability`, {
      headers: getAuthHeaders(),
    });
    
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
    const response = await fetch(`${BASE_URL}/ambulance/dispatch/${dispatchId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw await buildApiError(response, 'Failed to update dispatch status');
    }
  },

  initializeResources: async (): Promise<void> => {
    const BASE_URL = await getBaseUrl();
    const response = await fetch(`${BASE_URL}/ambulance/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw await buildApiError(response, 'Failed to initialize ambulance resources');
    }
  }
};
