import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AmbulanceDispatch from '../AmbulanceDispatch';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, type }: any) => (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, ...props }: any) => (
    <input onChange={onChange} value={value} placeholder={placeholder} {...props} />
  )
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, value, placeholder, ...props }: any) => (
    <textarea onChange={onChange} value={value} placeholder={placeholder} {...props} />
  )
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

describe('AmbulanceDispatch', () => {
  const mockOnDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dispatch form with correct fields', () => {
    render(
      <AmbulanceDispatch
        onDispatch={mockOnDispatch}
        available={5}
      />
    );

    expect(screen.getByLabelText('Patient Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact')).toBeInTheDocument();
    expect(screen.getByLabelText('Severity Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Pickup Address')).toBeInTheDocument();
  });

  it('shows available ambulance count', () => {
    render(
      <AmbulanceDispatch
        onDispatch={mockOnDispatch}
        available={3}
      />
    );

    expect(screen.getByText('3 ambulances available')).toBeInTheDocument();
  });

  it('disables submit button when no ambulances available', () => {
    render(
      <AmbulanceDispatch
        onDispatch={mockOnDispatch}
        available={0}
      />
    );

    const submitButton = screen.getByText('No Ambulances Available');
    expect(submitButton).toBeDisabled();
  });

  it('calls onDispatch with correct data when form is submitted', async () => {
    mockOnDispatch.mockReturnValue(true);

    render(
      <AmbulanceDispatch
        onDispatch={mockOnDispatch}
        available={5}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Patient Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '35' }
    });
    fireEvent.change(screen.getByLabelText('Contact'), {
      target: { value: '1234567890' }
    });
    fireEvent.change(screen.getByLabelText('Severity Level'), {
      target: { value: '4' }
    });
    fireEvent.change(screen.getByLabelText('Pickup Address'), {
      target: { value: '123 Main St, City' }
    });

    // Submit the form
    fireEvent.click(screen.getByText('Dispatch Ambulance'));

    await waitFor(() => {
      expect(mockOnDispatch).toHaveBeenCalledWith({
        name: 'John Doe',
        age: 35,
        contact: '1234567890',
        pickupAddress: '123 Main St, City',
        condition: 'Unknown',
        severity: 4,
        priority: 'high'
      });
    });
  });

  it('resets form after successful dispatch', async () => {
    mockOnDispatch.mockReturnValue(true);

    render(
      <AmbulanceDispatch
        onDispatch={mockOnDispatch}
        available={5}
      />
    );

    // Fill out and submit form
    fireEvent.change(screen.getByLabelText('Patient Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '35' }
    });
    fireEvent.change(screen.getByLabelText('Contact'), {
      target: { value: '1234567890' }
    });
    fireEvent.change(screen.getByLabelText('Pickup Address'), {
      target: { value: '123 Main St, City' }
    });

    fireEvent.click(screen.getByText('Dispatch Ambulance'));

    await waitFor(() => {
      // Form should be reset
      expect(screen.getByLabelText('Patient Name')).toHaveValue('');
      expect(screen.getByLabelText('Age')).toHaveValue('');
      expect(screen.getByLabelText('Contact')).toHaveValue('');
      expect(screen.getByLabelText('Pickup Address')).toHaveValue('');
      // Severity should default back to 3
      expect(screen.getByLabelText('Severity Level')).toHaveValue('3');
    });
  });

  it('does not reset form when dispatch fails', async () => {
    mockOnDispatch.mockReturnValue(false);

    render(
      <AmbulanceDispatch
        onDispatch={mockOnDispatch}
        available={5}
      />
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText('Patient Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '35' }
    });
    fireEvent.change(screen.getByLabelText('Contact'), {
      target: { value: '1234567890' }
    });
    fireEvent.change(screen.getByLabelText('Pickup Address'), {
      target: { value: '123 Main St, City' }
    });

    fireEvent.click(screen.getByText('Dispatch Ambulance'));

    await waitFor(() => {
      // Form should NOT be reset when dispatch fails
      expect(screen.getByLabelText('Patient Name')).toHaveValue('John Doe');
      expect(screen.getByLabelText('Age')).toHaveValue('35');
      expect(screen.getByLabelText('Contact')).toHaveValue('1234567890');
      expect(screen.getByLabelText('Pickup Address')).toHaveValue('123 Main St, City');
    });
  });

  it('maps severity levels to correct priorities', async () => {
    mockOnDispatch.mockReturnValue(true);

    render(
      <AmbulanceDispatch
        onDispatch={mockOnDispatch}
        available={5}
      />
    );

    // Test severity 1 (low priority)
    fireEvent.change(screen.getByLabelText('Patient Name'), { target: { value: 'Patient 1' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Contact'), { target: { value: '111' } });
    fireEvent.change(screen.getByLabelText('Severity Level'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Pickup Address'), { target: { value: 'Address 1' } });

    fireEvent.click(screen.getByText('Dispatch Ambulance'));

    await waitFor(() => {
      expect(mockOnDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'low' })
      );
    });

    jest.clearAllMocks();

    // Test severity 5 (critical priority)
    fireEvent.change(screen.getByLabelText('Severity Level'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Dispatch Ambulance'));

    await waitFor(() => {
      expect(mockOnDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'critical' })
      );
    });
  });
});
