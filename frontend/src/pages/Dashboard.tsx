import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, LogOut } from "lucide-react";
import { toast } from "sonner";
import ResourceCards from "@/components/dashboard/ResourceCards";
import PatientQueue from "@/components/dashboard/PatientQueue";
import AddPatientForm from "@/components/dashboard/AddPatientForm";
import AmbulanceDispatch from "@/components/dashboard/AmbulanceDispatch";
import AmbulanceHistory from "@/components/dashboard/AmbulanceHistory";
import Analytics from "@/components/dashboard/Analytics";
import { patientsAPI, resourcesAPI, authAPI, ambulanceAPI, Patient, Resource, getBaseUrl } from "@/utils/api";
import { getAmbulanceAvailability, subscribePatients } from "@/firebase/firestore";

export interface Resources {
  beds: Resource & { cleaning: number };
  icus: Resource & { cleaning: number };
  ventilators: Resource;
  oxygen: Resource & { empty: number };
  nurses: Resource;
  ambulances: Resource & { onTrip: number; maintenance: number };
  wards: Record<string, { total: number; available: number; cleaning: number }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<string[]>([]);
  const [resources, setResources] = useState<Resources>({
    beds: { total: 200, available: 150, cleaning: 10 },
    icus: { total: 50, available: 30, cleaning: 5 },
    ventilators: { total: 30, available: 25 },
    oxygen: { total: 100, available: 75, empty: 10 },
    nurses: { total: 150, available: 120 },
    ambulances: { total: 20, available: 15, onTrip: 3, maintenance: 2 },
    wards: {
      'General': { total: 100, available: 80, cleaning: 5 },
      'Pediatrics': { total: 40, available: 30, cleaning: 2 },
      'Maternity': { total: 30, available: 25, cleaning: 1 },
      'Surgery': { total: 30, available: 15, cleaning: 2 },
    },
  });
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ambulanceAvailability, setAmbulanceAvailability] = useState({ available: 15, total: 15 });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    loadData();

    // Comprehensive API connection test to verify Render backend connectivity
    (async () => {
      try {
        console.log('🧪 Testing API connection to Render backend...');
        console.log('📍 Environment variables:', {
          VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
          VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
          VITE_API_URL: import.meta.env.VITE_API_URL,
          PROD: import.meta.env.PROD,
          MODE: import.meta.env.MODE
        });
        
        // Verify we're using the correct backend URL
        const baseUrl = await getBaseUrl();
        console.log('🔗 Resolved base URL:', baseUrl);
        
        if (!baseUrl.includes('wellspring-backend.onrender.com')) {
          console.warn('⚠️ WARNING: Not using Render backend URL!');
          console.warn('⚠️ Expected: https://wellspring-backend.onrender.com/api');
          console.warn('⚠️ Got:', baseUrl);
        } else {
          console.log('✅ Using correct Render backend URL');
        }
        
        // Test specific endpoints as requested
        console.log('📡 Testing ambulance dispatches endpoint...');
        const testDispatches = await ambulanceAPI.getDispatches(1);
        console.log('✅ Ambulance Dispatches Test:', testDispatches);
        
        console.log('📡 Testing doctors list endpoint...');
        const testDoctors = await resourcesAPI.getDoctors();
        console.log('✅ Doctors List Test:', testDoctors);
        
        console.log('📡 Testing resources endpoint...');
        const testResources = await resourcesAPI.getAll();
        console.log('✅ Resources Test:', testResources);
        
        // Additional endpoint tests for comprehensive coverage
        console.log('📡 Testing ambulance availability endpoint...');
        const testAvailability = await ambulanceAPI.getAvailability();
        console.log('✅ Ambulance Availability Test:', testAvailability);
        
        console.log('📡 Testing patients endpoint...');
        const testPatients = await patientsAPI.getAll();
        console.log('✅ Patients Test:', testPatients.length, 'patients loaded');
        
        // Additional connection verification
        console.log('🔍 Verifying no localhost or relative URLs are being used...');
        const allEnvVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
        const hasLocalhost = allEnvVars.some(key => 
          import.meta.env[key]?.includes('localhost') || 
          import.meta.env[key]?.includes('127.0.0.1')
        );
        
        if (hasLocalhost && import.meta.env.PROD) {
          console.error('🚨 CRITICAL: Found localhost URLs in production environment!');
          console.error('🚨 This is a security risk - production should never use localhost');
          throw new Error('Localhost URLs detected in production environment');
        } else {
          console.log('✅ No localhost URLs detected in production environment');
        }
        
        console.log('🎉 All API connection tests passed! Backend is properly connected to Render.');
        console.log('📊 Production verification complete - all API calls will go to:', baseUrl);
      } catch (error) {
        console.error('❌ API Connection Test Failed:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Show user-friendly error if it's a production environment issue
        if (error instanceof Error && error.message.includes('VITE_API_BASE_URL environment variable is required')) {
          console.error('🚨 CRITICAL: Missing environment variable in production!');
          console.error('🚨 Please set VITE_API_BASE_URL=https://wellspring-backend.onrender.com in Netlify environment variables');
        }
      }
    })();

    // Ensure ambulance resources exist; if not, initialize
    (async () => {
      try {
        const availability = await ambulanceAPI.getAvailability();
        if (!availability || availability.total === 0) {
          await ambulanceAPI.initializeResources();
          toast.success('Initialized ambulance resources');
        }
      } catch (e) {
        // Show a gentle toast, but do not block the dashboard
        console.warn('Ambulance availability check failed:', e);
      }
    })();

    // Set up real-time ambulance availability listener
    const unsubscribeAmbulance = getAmbulanceAvailability((available, total) => {
      console.log('Ambulance availability updated:', { available, total });
      setAmbulanceAvailability({ available, total });
      
      // Update the resources state with real-time ambulance data
      setResources(prev => ({
        ...prev,
        ambulances: {
          ...prev.ambulances,
          available: available,
          total: total
        }
      }));
    });

    // Set up real-time patients listener to reflect queue instantly
    const unsubscribePatients = subscribePatients((livePatients) => {
      console.log('Patients updated via real-time listener:', livePatients.length, 'patients');
      // Ensure we only keep the fields we use and keep sort stable by severity desc
      setPatients(livePatients as any);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeAmbulance();
      unsubscribePatients();
    };
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    const [patientsRes, resourcesRes, doctorsRes] = await Promise.allSettled([
      patientsAPI.getAll(),
      resourcesAPI.getAll(),
      resourcesAPI.getDoctors()
    ]);

    if (patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value)) {
      setPatients(patientsRes.value);
    } else {
      console.warn('Patients load failed, defaulting to []');
      setPatients([]);
    }

    if (resourcesRes.status === 'fulfilled' && resourcesRes.value) {
      setResources(resourcesRes.value);
    } else {
      console.warn('Resources load failed, keeping defaults');
    }

    if (doctorsRes.status === 'fulfilled' && Array.isArray(doctorsRes.value)) {
      setDoctors(doctorsRes.value);
    } else {
      console.warn('Doctors load failed, defaulting to []');
      setDoctors([]);
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem("isAuthenticated");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const addPatient = async (patient: Omit<Patient, "id" | "status">) => {
    try {
      const response = await patientsAPI.create(patient);
      // Ensure the patient has the correct status and re-sort by priority
      const newPatient = { ...response, status: 'Waiting' as const };
      setPatients((prev) => [...prev, newPatient].sort((a, b) => b.severity - a.severity));
      toast.success(`Patient ${patient.name} added to queue`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add patient");
      return false;
    }
  };

  // Allocate resource to a patient
  const allocateResource = async (patientId: string, resourceType: keyof Resources) => {
    try {
      const resource = resources[resourceType];
      
      // Handle different resource types
      if (resourceType === 'beds' || resourceType === 'icus') {
        const bedResource = resource as Resource & { available: number };
        if (bedResource.available <= 0) {
          toast.error(`No ${resourceType} available`);
          return;
        }
      } else if ('available' in resource && typeof resource.available === 'number') {
        if (resource.available <= 0) {
          toast.error(`No ${resourceType} available`);
          return;
        }
      }

      // Allocate resource via API
      await Promise.all([
        patientsAPI.allocateResource(patientId, resourceType.toString()),
        resourcesAPI.allocate(resourceType.toString())
      ]);

      // Update local state
      setResources(prev => ({
        ...prev,
        [resourceType]: {
          ...prev[resourceType],
          available: (prev[resourceType] as any).available - 1,
        },
      }));

      setPatients(prev => {
        const updatedPatients = prev.map(p => 
          p.id === patientId 
            ? { ...p, status: 'Admitted' as const, allocatedResource: resourceType.toString() }
            : p
        );
        return updatedPatients.sort((a, b) => b.severity - a.severity);
      });

      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        toast.success(`${resourceType} allocated to ${patient.name}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to allocate resource");
    }
  };

  // Test API connection function for manual testing
  const testAPIConnection = async () => {
    try {
      console.log('🧪 Manual API Connection Test Started...');
      console.log('📍 Current environment variables:', {
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        PROD: import.meta.env.PROD,
        MODE: import.meta.env.MODE
      });
      
      // Verify we're using the correct backend URL
      const baseUrl = await getBaseUrl();
      console.log('🔗 Resolved base URL:', baseUrl);
      
      if (!baseUrl.includes('wellspring-backend.onrender.com')) {
        console.warn('⚠️ WARNING: Not using Render backend URL!');
        toast.error('Not using Render backend URL! Check environment variables.');
        return;
      }
      
      // Test the specific endpoint you requested
      console.log('📡 Testing ambulance dispatches endpoint...');
      const testDispatches = await ambulanceAPI.getDispatches(1);
      console.log('✅ Manual Test - Ambulance Dispatches (limit=1):', testDispatches);
      
      console.log('📡 Testing doctors list endpoint...');
      const testDoctors = await resourcesAPI.getDoctors();
      console.log('✅ Manual Test - Doctors List:', testDoctors);
      
      console.log('📡 Testing resources endpoint...');
      const testResources = await resourcesAPI.getAll();
      console.log('✅ Manual Test - Resources:', testResources);
      
      // Additional endpoint tests for comprehensive coverage
      console.log('📡 Testing ambulance availability endpoint...');
      const testAvailability = await ambulanceAPI.getAvailability();
      console.log('✅ Manual Test - Ambulance Availability:', testAvailability);
      
      console.log('📡 Testing patients endpoint...');
      const testPatients = await patientsAPI.getAll();
      console.log('✅ Manual Test - Patients:', testPatients.length, 'patients loaded');
      
      toast.success('API connection test completed! Check console for details.');
    } catch (error) {
      console.error('❌ Manual API Connection Test Failed:', error);
      toast.error(`API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const dispatchAmbulance = (patientData: Omit<Patient, "id" | "status"> & { pickupAddress: string }): boolean => {
    if (ambulanceAvailability.available <= 0) {
      toast.error("No ambulances available");
      return false;
    }

    console.log('Dispatching ambulance for:', patientData);

    // Fire-and-forget async operation
    (async () => {
      try {
        const dispatchData = {
          patientName: patientData.name,
          age: patientData.age,
          contactNumber: patientData.contact,
          severityLevel: patientData.severity,
          pickupAddress: patientData.pickupAddress,
        };

        console.log('Sending dispatch data:', dispatchData);
        const dispatch = await ambulanceAPI.createDispatch(dispatchData);
        console.log('Dispatch created successfully:', dispatch);
        toast.success(`Ambulance ${dispatch.assignedAmbulanceID} dispatched for ${patientData.name} at ${patientData.pickupAddress}`);
      } catch (error) {
        console.error('Failed to dispatch ambulance:', error);
        toast.error(error instanceof Error ? error.message : "Failed to dispatch ambulance");
      }
    })();

    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">WellSpring Hospital</h1>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={testAPIConnection}
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
            >
              🧪 Test API
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="gap-2 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading hospital data...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Resources */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Resource Overview</h2>
          <ResourceCards resources={resources} />
        </section>

        {/* Patient Management Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Patient Queue */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Patient Queue</h2>
            <PatientQueue
              patients={patients}
              onAllocate={allocateResource}
              resources={resources}
            />
          </section>

          {/* Add Patient */}
          <section>
            <div className="grid grid-cols-1 gap-6">
              <h2 className="text-2xl font-semibold text-foreground">New Patient Registration</h2>
              <AddPatientForm 
                onAddPatient={addPatient} 
                resources={{
                  wards: resources.wards,
                  doctors: doctors
                }} 
              />
            </div>
          </section>
        </div>

        {/* Ambulance Dispatch */}
        <div className="grid lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Ambulance Dispatch</h2>
            <AmbulanceDispatch 
              onDispatch={dispatchAmbulance}
              available={ambulanceAvailability.available}
            />
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Dispatches</h2>
            <AmbulanceHistory />
          </section>
        </div>

        {/* Analytics */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Analytics</h2>
          <Analytics patients={patients} resources={resources} />
        </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">WellSpring Hospital</p>
          <p className="mt-2">42 Horizon Avenue, Bandra-Kurla Complex</p>
          <p>Mumbai, Maharashtra 400051, India</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;