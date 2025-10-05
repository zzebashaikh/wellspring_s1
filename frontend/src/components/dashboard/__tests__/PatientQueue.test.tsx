import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientQueue } from '../PatientQueue';
import { Patient, Resources } from '@/pages/Dashboard';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, className }: any) => <div className={className}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

const mockResources: Resources = {
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
};

const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    name: 'John Doe',
    age: 35,
    gender: 'Male',
    contact: '1234567890',
    severity: 3,
    status: 'Waiting'
  }
];

describe('PatientQueue', () => {
  const mockOnAllocate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders patients in waiting status', () => {
    render(
      <PatientQueue
        patients={mockPatients}
        onAllocate={mockOnAllocate}
        resources={mockResources}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Age: 35 years')).toBeInTheDocument();
  });

  it('handles Select component controlled behavior correctly', () => {
    render(
      <PatientQueue
        patients={mockPatients}
        onAllocate={mockOnAllocate}
        resources={mockResources}
      />
    );

    // The Select should be controlled with an empty string default value
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('');
  });

  it('shows allocation pending state when allocating', async () => {
    // Mock async allocation that takes time
    mockOnAllocate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <PatientQueue
        patients={mockPatients}
        onAllocate={mockOnAllocate}
        resources={mockResources}
      />
    );

    // Select a resource
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'beds' } });

    // Click allocate button
    const allocateButton = screen.getByText('Allocate');
    fireEvent.click(allocateButton);

    // Should show pending state
    expect(screen.getByText('Allocating...')).toBeInTheDocument();
    expect(allocateButton).toBeDisabled();
  });

  it('handles allocation errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock allocation that throws an error
    mockOnAllocate.mockRejectedValue(new Error('Allocation failed'));

    render(
      <PatientQueue
        patients={mockPatients}
        onAllocate={mockOnAllocate}
        resources={mockResources}
      />
    );

    // Select a resource and try to allocate
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'beds' } });

    const allocateButton = screen.getByText('Allocate');
    fireEvent.click(allocateButton);

    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should log error and reset button state
    expect(consoleError).toHaveBeenCalledWith('Allocation failed:', expect.any(Error));
    expect(screen.getByText('Allocate')).toBeInTheDocument(); // Button should be back to normal

    consoleError.mockRestore();
  });

  it('does not show patients with non-Waiting status', () => {
    const patientsWithAdmitted = [
      ...mockPatients,
      {
        id: 'patient-2',
        name: 'Jane Doe',
        age: 28,
        gender: 'Female',
        contact: '0987654321',
        severity: 2,
        status: 'Admitted' as const
      }
    ];

    render(
      <PatientQueue
        patients={patientsWithAdmitted}
        onAllocate={mockOnAllocate}
        resources={mockResources}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
