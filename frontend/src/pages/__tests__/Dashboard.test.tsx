import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { patientsAPI, resourcesAPI, ambulanceAPI } from '@/utils/api';

// Mock the API modules
jest.mock('@/utils/api', () => ({
  patientsAPI: {
    getAll: jest.fn(),
    allocateResource: jest.fn(),
  },
  resourcesAPI: {
    getAll: jest.fn(),
    allocate: jest.fn(),
  },
  ambulanceAPI: {
    createDispatch: jest.fn(),
    getDispatches: jest.fn(),
    getAvailability: jest.fn(),
  },
  authAPI: {
    logout: jest.fn(),
  },
  getBaseUrl: jest.fn().mockResolvedValue('https://test-api.com/api'),
}));

// Mock Firebase modules
jest.mock('@/firebase/firestore', () => ({
  getAmbulanceAvailability: jest.fn(() => jest.fn()), // Returns unsubscribe function
  subscribePatients: jest.fn(() => jest.fn()), // Returns unsubscribe function
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'true'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
});

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    PROD: true,
    MODE: 'production',
  },
});

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Dashboard - Allocation Flow', () => {
  const mockPatients = [
    {
      id: 'patient-1',
      name: 'John Doe',
      age: 35,
      gender: 'Male' as const,
      contact: '1234567890',
      severity: 3,
      status: 'Waiting' as const,
    },
  ];

  const mockResources = {
    beds: { total: 200, available: 150, cleaning: 10 },
    icus: { total: 50, available: 30, cleaning: 5 },
    ventilators: { total: 30, available: 25 },
    oxygen: { total: 100, available: 75, empty: 10 },
    nurses: { total: 150, available: 120 },
    ambulances: { total: 20, available: 15, onTrip: 3, maintenance: 2 },
    wards: {
      'General': { total: 100, available: 80, cleaning: 5 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (patientsAPI.getAll as jest.Mock).mockResolvedValue(mockPatients);
    (resourcesAPI.getAll as jest.Mock).mockResolvedValue(mockResources);
    (resourcesAPI.getDoctors as jest.Mock).mockResolvedValue(['Dr. Smith']);
    (ambulanceAPI.getDispatches as jest.Mock).mockResolvedValue([]);
    (ambulanceAPI.getAvailability as jest.Mock).mockResolvedValue({ available: 5, total: 10 });
  });

  it('handles allocation failure gracefully and keeps patient in queue', async () => {
    // Mock allocation failure
    (patientsAPI.allocateResource as jest.Mock).mockRejectedValue(
      new Error('Patient allocation failed: Server error')
    );
    (resourcesAPI.allocate as jest.Mock).mockRejectedValue(
      new Error('Resource allocation failed: No resources available')
    );

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find the allocation button and click it
    const allocateButton = screen.getByText('Allocate');
    fireEvent.click(allocateButton);

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText('Allocate')).toBeInTheDocument(); // Button should be back to normal
    });

    // Patient should still be in the queue (not admitted)
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
  });

  it('shows allocation pending state during allocation', async () => {
    // Mock slow allocation
    let resolveAllocation: () => void;
    const allocationPromise = new Promise<void>(resolve => {
      resolveAllocation = resolve;
    });
    
    (patientsAPI.allocateResource as jest.Mock).mockReturnValue(allocationPromise);
    (resourcesAPI.allocate as jest.Mock).mockReturnValue(allocationPromise);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click allocate button
    const allocateButton = screen.getByText('Allocate');
    fireEvent.click(allocateButton);

    // Should show pending state
    await waitFor(() => {
      expect(screen.getByText('Allocating...')).toBeInTheDocument();
    });

    // Resolve the allocation
    resolveAllocation!();
    
    await waitFor(() => {
      expect(screen.getByText('Allocate')).toBeInTheDocument(); // Button back to normal
    });
  });

  it('successfully allocates resources when API calls succeed', async () => {
    const updatedPatient = { ...mockPatients[0], status: 'Admitted' as const, allocatedResource: 'beds' };
    
    (patientsAPI.allocateResource as jest.Mock).mockResolvedValue(updatedPatient);
    (resourcesAPI.allocate as jest.Mock).mockResolvedValue({ ...mockResources.beds, available: 149 });

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click allocate button
    const allocateButton = screen.getByText('Allocate');
    fireEvent.click(allocateButton);

    // Wait for successful allocation
    await waitFor(() => {
      expect(patientsAPI.allocateResource).toHaveBeenCalledWith('patient-1', 'beds');
      expect(resourcesAPI.allocate).toHaveBeenCalledWith('beds');
    });
  });

  it('handles dispatch creation with proper error handling', async () => {
    const mockDispatch = {
      id: 'dispatch-1',
      patientName: 'Jane Doe',
      assignedAmbulanceID: 'AMB-001',
    };

    (ambulanceAPI.createDispatch as jest.Mock).mockResolvedValue(mockDispatch);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Dispatch')).toBeInTheDocument();
    });

    // Fill out dispatch form
    fireEvent.change(screen.getByLabelText('Patient Name'), {
      target: { value: 'Jane Doe' }
    });
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '28' }
    });
    fireEvent.change(screen.getByLabelText('Contact'), {
      target: { value: '0987654321' }
    });
    fireEvent.change(screen.getByLabelText('Pickup Address'), {
      target: { value: '456 Oak St, City' }
    });

    // Submit dispatch
    fireEvent.click(screen.getByText('Dispatch Ambulance'));

    await waitFor(() => {
      expect(ambulanceAPI.createDispatch).toHaveBeenCalledWith({
        patientName: 'Jane Doe',
        age: 28,
        contactNumber: '0987654321',
        severityLevel: 3, // default
        pickupAddress: '456 Oak St, City',
      });
    });
  });

  it('handles dispatch creation failure', async () => {
    (ambulanceAPI.createDispatch as jest.Mock).mockRejectedValue(
      new Error('No ambulances available')
    );

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Dispatch')).toBeInTheDocument();
    });

    // Fill out and submit dispatch form
    fireEvent.change(screen.getByLabelText('Patient Name'), {
      target: { value: 'Jane Doe' }
    });
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '28' }
    });
    fireEvent.change(screen.getByLabelText('Contact'), {
      target: { value: '0987654321' }
    });
    fireEvent.change(screen.getByLabelText('Pickup Address'), {
      target: { value: '456 Oak St, City' }
    });

    fireEvent.click(screen.getByText('Dispatch Ambulance'));

    // Should handle error gracefully without crashing
    await waitFor(() => {
      expect(ambulanceAPI.createDispatch).toHaveBeenCalled();
    });
  });
});
