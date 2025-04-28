// Header.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../app/Header';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('axios');

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon">Package Icon</div>,
  ShoppingCart: () => <div data-testid="cart-icon">Cart Icon</div>,
  Menu: () => <div data-testid="menu-icon">Menu Icon</div>,
  User: () => <div data-testid="user-icon">User Icon</div>,
  Pencil: () => <div data-testid="pencil-icon">Pencil Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
  CheckCircle: () => <div data-testid="check-icon">Check Icon</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert Icon</div>,
  LogOut: () => <div data-testid="logout-icon">Logout Icon</div>,
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    getAllItems: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Header Component', () => {
  const mockPush = jest.fn();
  const mockResponseData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '123456789',
    id: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock axios get response
    (axios.get as jest.Mock).mockResolvedValue({
      status: 200,
      data: mockResponseData
    });
    
    // Setup localStorage with mock data
    mockLocalStorage.setItem('token', 'fake-token');
    mockLocalStorage.setItem('userId', '1');
    mockLocalStorage.setItem('userData', JSON.stringify(mockResponseData));
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  it('renders the header with correct elements', () => {
    render(<Header />);
    
    // Test main header elements
    expect(screen.getByText('WE EAT')).toBeInTheDocument();
    expect(screen.getByTestId('package-icon')).toBeInTheDocument();
    expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('opens and closes profile dropdown when user icon is clicked', async () => {
    render(<Header />);
    
    // Profile dropdown should be initially closed (opacity-0)
    const profileDropdown = screen.getByText('¡Hola, Test User!').closest('div');
    expect(profileDropdown).toHaveClass('opacity-0');
    
    // Click user icon to open profile dropdown
    const userIcon = screen.getByTestId('user-icon').closest('button');
    fireEvent.click(userIcon!);
    
    // Dropdown should now be open (opacity-100)
    expect(profileDropdown).toHaveClass('opacity-100');
    
    // Click elsewhere to close dropdown
    fireEvent.mouseDown(document.body);
    
    // Wait for dropdown to close
    await waitFor(() => {
      expect(profileDropdown).toHaveClass('opacity-0');
    });
  });

  it('opens and closes side menu when menu icon is clicked', async () => {
    render(<Header />);
    
    // Side menu should be initially closed (translate-x-full)
    const sideMenu = screen.getByText('¡Bienvenido a WE EAT!').closest('div');
    expect(sideMenu?.parentElement).toHaveClass('translate-x-full');
    
    // Click menu icon to open side menu
    const menuIcon = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuIcon!);
    
    // Side menu should now be open (translate-x-0)
    expect(sideMenu?.parentElement).toHaveClass('translate-x-0');
    
    // Click elsewhere to close side menu
    fireEvent.mouseDown(document.body);
    
    // Wait for side menu to close
    await waitFor(() => {
      expect(sideMenu?.parentElement).toHaveClass('translate-x-full');
    });
  });

  it('fetches user data on mount', async () => {
    render(<Header />);
    
    // Should display username from API
    await waitFor(() => {
      expect(screen.getByText('¡Hola, Test User!')).toBeInTheDocument();
    });
    
    // Should have called axios.get
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/user/get/1/'),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer fake-token'
        }
      })
    );
  });

  it('loads user data from localStorage when API fails', async () => {
    // Mock API failure
    (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<Header />);
    
    // Should still display username from localStorage
    await waitFor(() => {
      expect(screen.getByText('¡Hola, Test User!')).toBeInTheDocument();
    });
    
    // Should show notification about loading from cache
    expect(screen.getByText('Datos cargados desde caché local')).toBeInTheDocument();
  });

  it('allows editing user name', async () => {
    // Mock successful update
    (axios.put as jest.Mock).mockResolvedValue({
      data: {
        ...mockResponseData,
        name: 'Updated Name'
      }
    });
    
    render(<Header />);
    
    // Click edit button for name field
    const nameEditButton = screen.getAllByTestId('pencil-icon')[0].closest('button');
    fireEvent.click(nameEditButton!);
    
    // Input should now be enabled
    const nameInput = screen.getByPlaceholderText('Nombre de usuario');
    expect(nameInput).not.toHaveAttribute('disabled');
    
    // Change input value
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    // Click save button
    const saveButton = screen.getAllByTestId('check-icon')[0].closest('button');
    fireEvent.click(saveButton!);
    
    // Should call axios.put with correct data
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/user/edit/1/'),
        { name: 'Updated Name' },
        expect.any(Object)
      );
    });
    
    // Should show success notification
    expect(screen.getByText('Datos actualizados con éxito')).toBeInTheDocument();
  });

  it('allows editing user email', async () => {
    // Mock successful update
    (axios.put as jest.Mock).mockResolvedValue({
      data: {
        ...mockResponseData,
        email: 'updated@example.com'
      }
    });
    
    render(<Header />);
    
    // Click edit button for email field
    const emailEditButton = screen.getAllByTestId('pencil-icon')[1].closest('button');
    fireEvent.click(emailEditButton!);
    
    // Input should now be enabled
    const emailInput = screen.getByPlaceholderText('Correo del usuario');
    expect(emailInput).not.toHaveAttribute('disabled');
    
    // Change input value
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    
    // Click save button
    const saveButton = screen.getAllByTestId('check-icon')[1].closest('button');
    fireEvent.click(saveButton!);
    
    // Should call axios.put with correct data
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/user/edit/1/'),
        { email: 'updated@example.com' },
        expect.any(Object)
      );
    });
  });

  it('allows editing user phone number', async () => {
    // Mock successful update
    (axios.put as jest.Mock).mockResolvedValue({
      data: {
        ...mockResponseData,
        phone: '987654321'
      }
    });
    
    render(<Header />);
    
    // Click edit button for phone field
    const phoneEditButton = screen.getAllByTestId('pencil-icon')[2].closest('button');
    fireEvent.click(phoneEditButton!);
    
    // Input should now be enabled
    const phoneInput = screen.getByPlaceholderText('Celular del usuario');
    expect(phoneInput).not.toHaveAttribute('disabled');
    
    // Change input value
    fireEvent.change(phoneInput, { target: { value: '987654321' } });
    
    // Click save button
    const saveButton = screen.getAllByTestId('check-icon')[2].closest('button');
    fireEvent.click(saveButton!);
    
    // Should call axios.put with correct data
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/user/edit/1/'),
        { phone: '987654321' },
        expect.any(Object)
      );
    });
  });

  it('handles API errors when updating user data', async () => {
    // Mock API failure
    (axios.put as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'Validation error' }
      },
      message: 'Request failed with status code 400'
    });
    
    render(<Header />);
    
    // Click edit button for name field
    const nameEditButton = screen.getAllByTestId('pencil-icon')[0].closest('button');
    fireEvent.click(nameEditButton!);
    
    // Change input value
    const nameInput = screen.getByPlaceholderText('Nombre de usuario');
    fireEvent.change(nameInput, { target: { value: 'Invalid Name' } });
    
    // Click save button
    const saveButton = screen.getAllByTestId('check-icon')[0].closest('button');
    fireEvent.click(saveButton!);
    
    // Should show error notification
    await waitFor(() => {
      expect(screen.getByText(/Error: 400/)).toBeInTheDocument();
    });
  });

  it('handles logout correctly', async () => {
    render(<Header />);
    
    // Open profile dropdown
    const userIcon = screen.getByTestId('user-icon').closest('button');
    fireEvent.click(userIcon!);
    
    // Click logout button
    const logoutButton = screen.getAllByText('CERRAR SESIÓN')[0].closest('button');
    fireEvent.click(logoutButton!);
    
    // Should clear localStorage
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userData');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
    
    // Should redirect to login page
    expect(mockPush).toHaveBeenCalledWith('/Login');
  });

  it('shows loading state while fetching user data', () => {
    // Don't resolve axios promise yet to keep loading state
    (axios.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<Header />);
    
    // Should show loading elements
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('handles case when no user data exists', async () => {
    // Clear localStorage
    mockLocalStorage.clear();
    
    // Mock API failure
    (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<Header />);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la información del usuario')).toBeInTheDocument();
    });
    
    // Should have retry button
    const retryButton = screen.getByText('Intentar nuevamente');
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(retryButton);
    
    // Should try to fetch user data again
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('cancels editing when X button is clicked', async () => {
    render(<Header />);
    
    // Click edit button for name field
    const nameEditButton = screen.getAllByTestId('pencil-icon')[0].closest('button');
    fireEvent.click(nameEditButton!);
    
    // Change input value
    const nameInput = screen.getByPlaceholderText('Nombre de usuario');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    
    // Click cancel button (X)
    const cancelButton = screen.getAllByTestId('x-icon')[0].closest('button');
    fireEvent.click(cancelButton!);
    
    // Input should be disabled again
    expect(nameInput).toHaveAttribute('disabled');
    
    // Input value should be reset to original
    expect(nameInput).toHaveValue('Test User');
  });
});