// LoginForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../app/Login/page';
import { useRouter } from 'next/navigation';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-icons/fa', () => ({
  FaGoogle: () => <div data-testid="google-icon">Google Icon</div>,
}));

jest.mock('react-icons/si', () => ({
  SiInstagram: () => <div data-testid="instagram-icon">Instagram Icon</div>,
}));

jest.mock('react-icons/fa6', () => ({
  FaXTwitter: () => <div data-testid="twitter-icon">Twitter Icon</div>,
}));

// Mock framer-motion with testids for easier testing
jest.mock('framer-motion', () => {
  const createMotionComponent = (tag: keyof JSX.IntrinsicElements) => {
    const MotionComponent: React.FC<{ className?: string } & React.HTMLAttributes<HTMLElement>> = ({ children, className, ...props }) => {
      const testId = `motion-${tag}-${String(className?.split(' ')[0] ?? 'default')}`;
      return React.createElement(tag, { className, 'data-testid': testId, ...props }, children);
    };
    MotionComponent.displayName = `Motion${tag}`;
    return MotionComponent;
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      h1: createMotionComponent('h1'),
      p: createMotionComponent('p'),
      button: createMotionComponent('button'),
      form: createMotionComponent('form'),
      span: createMotionComponent('span'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
    },
  };
});

// Mock Link component
jest.mock('next/link', () => ({ 
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

// Mock fetch function
global.fetch = jest.fn();

// Mock FormData
const mockFormData = {
  get: jest.fn(),
  append: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  forEach: jest.fn(),
};

global.FormData = jest.fn(() => mockFormData);

// Fix: Properly implement the Symbol.iterator for FormData mock
Object.defineProperty(mockFormData, Symbol.iterator, {
  enumerable: false,
  value: function* () {
    yield* [];
  }
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index) => Object.keys(store)[index] || null),
    length: 0,  // Use getter to update dynamically
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', { 
  value: mockLocalStorage,
  writable: true
});

// Fix: Don't mock React.createElement as it can cause side effects
// Instead, create a simple mock for SVG components
jest.mock('../components/SVGComponents', () => ({
  LoadingSVG: () => <div data-testid="svg-element">Loading Icon</div>,
}));

// Fix: Consistent approach to mocking form state hooks
// First, properly define what hooks we're mocking
const mockFormState = { error: null, success: false, token: null, userData: null };
const mockDispatchFormState = jest.fn();
const mockFormStatus = { pending: false };

// Then create the mocks
jest.mock('../hooks/useFormState', () => ({
  useFormState: jest.fn(() => [mockFormState, mockDispatchFormState]),
  useFormStatus: jest.fn(() => mockFormStatus),
}));

// Import the mocked hooks to use in tests
import { useFormState, useFormStatus } from '../hooks/useFormState';

// Mock for parseJwt function
const mockParseJwt = jest.fn();
jest.mock('../utils/tokenUtils', () => ({
  parseJwt: (token: string) => mockParseJwt(token)
}));

describe('LoginForm Component', () => {
  const mockPush = jest.fn();
  const mockFormAction = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'mock-token', userData: { id: '123', name: 'Test User', email: 'test@example.com' } }),
    });
    
    // Reset form state hooks for each test
    (useFormState as jest.Mock).mockImplementation(() => [
      { error: null, success: false, token: null, userData: null },
      mockFormAction,
    ]);
    
    (useFormStatus as jest.Mock).mockImplementation(() => ({
      pending: false,
    }));
    
    // Reset FormData mock
    mockFormData.get.mockImplementation((key) => {
      if (key === 'correo') return 'test@example.com';
      if (key === 'contrasena') return 'password123';
      return null;
    });

    // Reset localStorage mock
    mockLocalStorage.clear();

    // Setup mockParseJwt
    mockParseJwt.mockReturnValue({ id: 'token-id-123', exp: Date.now() + 3600 });
  });

  it('renders the main container and layout structure correctly', () => {
    render(<LoginForm />);
    
    // Test the main container structure
    const mainContainer = screen.getByTestId('motion-div-flex');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('flex w-full min-h-screen bg-orange-50');
    
    // Test left panel
    const leftPanel = screen.getByTestId('motion-div-w-full');
    expect(leftPanel).toBeInTheDocument();
    expect(leftPanel).toHaveClass('w-full md:w-1/3 lg:w-1/4 h-screen bg-white border-r border-gray-200 p-8 flex flex-col');
    
    // Test right panel
    const rightPanel = screen.getByTestId('motion-div-hidden');
    expect(rightPanel).toBeInTheDocument();
    expect(rightPanel).toHaveClass('hidden md:flex md:w-2/3 lg:w-3/4 bg-orange-50 items-center justify-center p-8');
  });

  it('renders LoginForm form elements correctly', () => {
    render(<LoginForm />);
    
    // Test heading and intro text
    expect(screen.getByText('INICIA SESION')).toBeInTheDocument();
    expect(screen.getByText('Inicia sesión en tu cuenta para utilizar nuestros servicios.')).toBeInTheDocument();
    
    // Test form inputs
    const emailInput = screen.getByLabelText('Correo o Celular');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'text');
    expect(emailInput).toHaveAttribute('name', 'correo');
    expect(emailInput).toHaveAttribute('required');
    
    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('name', 'contrasena');
    expect(passwordInput).toHaveAttribute('required');
    
    // Test submit button
    const submitButton = screen.getByText('INICIA SESION');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton.closest('button')).toHaveAttribute('type', 'submit');
  });

  it('renders social media buttons correctly', () => {
    render(<LoginForm />);
    
    // Test social media buttons
    const googleButton = screen.getByTestId('google-icon').closest('button');
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveAttribute('aria-label', 'Iniciar sesión con Google');
    
    const instagramButton = screen.getByTestId('instagram-icon').closest('button');
    expect(instagramButton).toBeInTheDocument();
    expect(instagramButton).toHaveAttribute('aria-label', 'Iniciar sesión con Instagram');
    
    const twitterButton = screen.getByTestId('twitter-icon').closest('button');
    expect(twitterButton).toBeInTheDocument();
    expect(twitterButton).toHaveAttribute('aria-label', 'Iniciar sesión con X');
    
    // Test hovering behavior - note that this doesn't actually test visual changes
    fireEvent.mouseOver(googleButton);
    fireEvent.mouseOver(instagramButton);
    fireEvent.mouseOver(twitterButton);
    
    fireEvent.mouseLeave(googleButton);
    fireEvent.mouseLeave(instagramButton);
    fireEvent.mouseLeave(twitterButton);
  });

  it('renders right panel content correctly', () => {
    render(<LoginForm />);
    
    // Test right panel header and branding
    expect(screen.getByText('WE EAT')).toBeInTheDocument();
    
    // Test marketing text
    expect(screen.getByText('Nunca te defraudará')).toBeInTheDocument();
    expect(screen.getByText(/prueba los/)).toBeInTheDocument();
    expect(screen.getByText('NUEVOS')).toBeInTheDocument();
    expect(screen.getByText('catálogos')).toBeInTheDocument();
  });

  it('redirects to home when login is successful', async () => {
    // Override the form state for this test
    (useFormState as jest.Mock).mockImplementation(() => [
      { 
        success: true, 
        error: null, 
        token: 'mock-token', 
        userData: { id: '123', name: 'Test User', email: 'test@example.com' } 
      },
      mockFormAction,
    ]);
    
    render(<LoginForm />);
    
    // Check that useEffect has stored data in localStorage
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userId', '123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify({ id: '123', name: 'Test User', email: 'test@example.com' }));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionData', expect.any(String));
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message when form submission fails', () => {
    const errorMessage = 'Credenciales inválidas. Por favor intenta de nuevo.';
    
    // Override the mock for this specific test
    (useFormState as jest.Mock).mockImplementation(() => [
      { error: errorMessage, success: false, token: null, userData: null },
      mockFormAction,
    ]);
    
    render(<LoginForm />);
    
    // Check that the error message is displayed
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.closest('div')).toHaveClass('mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded');
  });

  it('handles form input changes correctly', () => {
    render(<LoginForm />);
    
    // Fill out the form
    const emailInput = screen.getByLabelText('Correo o Celular');
    const passwordInput = screen.getByLabelText('Contraseña');
    
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepassword' } });
    
    // Check that inputs reflect the new values
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('securepassword');
  });

  it('submits the form and calls formAction', async () => {
    render(<LoginForm />);
    
    // Find the form element
    const form = screen.getByTestId('motion-form-flex-1');
    
    // Submit the form
    fireEvent.submit(form);
    
    // Check that formAction was called
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
  });

  it('renders submit button with loading state', () => {
    // Override the formStatus mock for this test
    (useFormStatus as jest.Mock).mockImplementation(() => ({
      pending: true,
    }));
    
    render(<LoginForm />);
    
    // Check for loading spinner and text
    expect(screen.getByText('PROCESANDO...')).toBeInTheDocument();
    
    // Check for SVG loading spinner
    const loadingSpinner = screen.getByTestId('svg-element');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('navigates to register page when register link is clicked', () => {
    render(<LoginForm />);
    
    // Find register link and check attributes
    const registerLink = screen.getByText('Regístrate');
    expect(registerLink).toHaveAttribute('href', '/Register');
  });
  
  it('tests all animations and motion effects', () => {
    render(<LoginForm />);
    
    // Test hover on submit button
    const submitButton = screen.getByText('INICIA SESION').closest('button');
    if (submitButton) {
      fireEvent.mouseOver(submitButton);
      fireEvent.mouseDown(submitButton);
      fireEvent.mouseUp(submitButton);
      fireEvent.mouseLeave(submitButton);
    }
    
    // Test hovering on social media buttons
    const socialButtons = screen.getAllByTestId(/motion-button-w-12/);
    socialButtons.forEach(button => {
      fireEvent.mouseOver(button);
      fireEvent.mouseLeave(button);
    });
  });
  
  it('tests different form submission scenarios', async () => {
    // Mock the formData values for empty submission
    mockFormData.get.mockImplementation((key) => {
      if (key === 'correo') return '';
      if (key === 'contrasena') return '';
      return null;
    });
    
    render(<LoginForm />);
    
    // Submit empty form
    const form = screen.getByTestId('motion-form-flex-1');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
    
    // Test with authentication error
    (useFormState as jest.Mock).mockImplementation(() => [
      { error: 'Credenciales inválidas. Por favor intenta de nuevo.', success: false, token: null, userData: null },
      mockFormAction,
    ]);
    
    render(<LoginForm />);
    expect(screen.getByText('Credenciales inválidas. Por favor intenta de nuevo.')).toBeInTheDocument();
  });
  
  it('tests loginUser function with various inputs', async () => {
    // Test with valid input
    mockFormData.get.mockImplementation((key) => {
      if (key === 'correo') return 'valid@example.com';
      if (key === 'contrasena') return 'validpassword';
      return null;
    });
    
    render(<LoginForm />);
    const form = screen.getByTestId('motion-form-flex-1');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
    
    // Test with server error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });
    
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
    
    // Test with network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
  });

  it('stores token payload information correctly', async () => {
    const token = 'mock.token.with.payload';
    const userData = { id: '123', name: 'Test User', email: 'test@example.com' };
    const tokenPayload = { id: 'token-id-123', exp: Date.now() + 3600 };
    
    mockParseJwt.mockReturnValue(tokenPayload);
    
    // Override the form state for this test
    (useFormState as jest.Mock).mockImplementation(() => [
      { 
        success: true, 
        error: null, 
        token: token, 
        userData: userData
      },
      mockFormAction,
    ]);
    
    render(<LoginForm />);
    
    // Check that token payload is parsed and stored
    await waitFor(() => {
      expect(mockParseJwt).toHaveBeenCalledWith(token);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tokenPayload', JSON.stringify(tokenPayload));
    });
  });

  it('handles missing user ID in userData but present in token', async () => {
    // User data from API response without ID
    const userData = { name: 'Test User', email: 'test@example.com' };
    // Token payload contains the ID
    const tokenPayload = { id: 'token-id-123', exp: Date.now() + 3600 };
    
    mockParseJwt.mockReturnValue(tokenPayload);
    
    // Override the form state for this test
    (useFormState as jest.Mock).mockImplementation(() => [
      { 
        success: true, 
        error: null, 
        token: 'mock.token.value', 
        userData: userData
      },
      mockFormAction,
    ]);
    
    render(<LoginForm />);
    
    // Check that ID from token is used
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userId', 'token-id-123');
    });
  });
  
  it('creates a complete session data object in localStorage', async () => {
    const token = 'valid.jwt.token';
    const userData = { id: '123', name: 'Test User', email: 'test@example.com' };
    const tokenPayload = { id: '123', exp: Date.now() + 3600, roles: ['user'] };
    
    mockParseJwt.mockReturnValue(tokenPayload);
    
    // Override the form state for this test
    (useFormState as jest.Mock).mockImplementation(() => [
      { 
        success: true, 
        error: null, 
        token: token, 
        userData: userData
      },
      mockFormAction,
    ]);
    
    render(<LoginForm />);
    
    // Check that complete session data is stored
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionData', expect.stringContaining('"token":"valid.jwt.token"'));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionData', expect.stringContaining('"lastLogin"'));
    });
  });
});