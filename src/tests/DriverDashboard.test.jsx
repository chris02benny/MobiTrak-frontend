import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DriverDashboard from '../pages/DriverDashboard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock Supabase
jest.mock('../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-driver-id',
              full_name: 'Test Driver',
              is_available_for_hire: true,
              profile_complete: true,
              rating: 4.5,
              total_trips: 10
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Mock AuthContext
const mockUser = {
  id: 'test-driver-id',
  email: 'driver@test.com',
  access_token: 'test-token'
};

const MockAuthProvider = ({ children }) => (
  <AuthProvider value={{ user: mockUser }}>
    {children}
  </AuthProvider>
);

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('DriverDashboard', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders driver dashboard with loading state', () => {
    renderWithProviders(<DriverDashboard />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders driver dashboard with data', async () => {
    renderWithProviders(<DriverDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Driver Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, Test Driver')).toBeInTheDocument();
    });
  });

  it('displays driver statistics', async () => {
    renderWithProviders(<DriverDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Total Trips')).toBeInTheDocument();
      expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    });
  });

  it('shows availability toggle button', async () => {
    renderWithProviders(<DriverDashboard />);
    
    await waitFor(() => {
      const availabilityButton = screen.getByText('Available');
      expect(availabilityButton).toBeInTheDocument();
    });
  });

  it('displays quick actions', async () => {
    renderWithProviders(<DriverDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('View Assignments')).toBeInTheDocument();
      expect(screen.getByText('View Rentals')).toBeInTheDocument();
    });
  });

  it('shows profile completion alert when profile incomplete', async () => {
    // Mock incomplete profile
    const { supabase } = require('../utils/supabase');
    supabase.from.mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-driver-id',
              full_name: 'Test Driver',
              profile_complete: false
            },
            error: null
          }))
        }))
      }))
    });

    renderWithProviders(<DriverDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(screen.getByText('Complete your driver profile to start receiving job offers from businesses.')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    // Mock error
    const { supabase } = require('../utils/supabase');
    supabase.from.mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }))
    });

    renderWithProviders(<DriverDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });
});
