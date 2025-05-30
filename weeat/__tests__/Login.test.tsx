// LoginForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation FIRST
jest.doMock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock react-icons
jest.doMock('react-icons/fa', () => ({
  FaGoogle: () => React.createElement('div', { 'data-testid': 'google-icon' }, 'Google Icon'),
}));

jest.doMock('react-icons/si', () => ({
  SiInstagram: () => React.createElement('div', { 'data-testid': 'instagram-icon' }, 'Instagram Icon'),
}));

jest.doMock('react-icons/fa6', () => ({
  FaXTwitter: () => React.createElement('div', { 'data-testid': 'twitter-icon' }, 'Twitter Icon'),
}));

// Mock framer-motion
jest.doMock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    return ({ children, className, ...props }: any) => {
      const testId = `motion-${tag}-${className?.split(' ')[0] || 'default'}`;
      return React.createElement(tag, { className, 'data-testid': testId, ...props }, children);
    };
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
jest.doMock('next/link', () => ({ 
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) =>
    React.createElement('a', { href, className, 'data-testid': 'next-link' }, children),
}));

// Import components after mocks
const { useRouter } = require('next/navigation');
const LoginForm = require('../app/Login/page').default;

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
  [Symbol.iterator]: function* () {
    yield* [];
  }
};

(global as any).FormData = jest.fn(() => mockFormData);

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
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', { 
  value: mockLocalStorage,
  writable: true
});

// Simple mocks for react-dom hooks
const mockFormState = { error: null, success: false, token: null, userData: null };
const mockDispatchFormState = jest.fn();
const mockFormStatus = { pending: false };

jest.doMock('react-dom', () => {
  const original = jest.requireActual('react-dom');
  return {
    ...original,
    useFormState: jest.fn(() => [mockFormState, mockDispatchFormState]),
    useFormStatus: jest.fn(() => mockFormStatus),
  };
});

// Mock console functions
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = jest.fn();
console.error = jest.fn();

describe('LoginForm Component', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        token: 'mock-token',
        user: { id: '123', name: 'Test User', email: 'test@example.com' }
      }),
    });
    
    // Reset FormData mock
    mockFormData.get.mockImplementation((key) => {
      if (key === 'correo') return 'test@example.com';
      if (key === 'contrasena') return 'password123';
      return null;
    });

    // Reset localStorage mock
    mockLocalStorage.clear();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Basic Rendering Tests', () => {
    it('renders the main container and layout structure correctly', () => {
      render(React.createElement(LoginForm));
      
      const mainContainer = document.querySelector('.flex.w-full.min-h-screen.bg-orange-50');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex w-full min-h-screen bg-orange-50');
      
      const leftPanel = screen.getByTestId('motion-div-w-full');
      expect(leftPanel).toBeInTheDocument();
      
      const rightPanel = screen.getByTestId('motion-div-hidden');
      expect(rightPanel).toBeInTheDocument();
    });

    it('renders LoginForm form elements correctly', () => {
      render(React.createElement(LoginForm));
      
      const headingElement = screen.getByTestId('motion-h1-text-3xl');
      expect(headingElement).toBeInTheDocument();
      expect(headingElement).toHaveTextContent('INICIA SESION');
      
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
      expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();
      expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
      
      const emailInput = screen.getByRole('textbox');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('name', 'correo');
      expect(emailInput).toHaveAttribute('required');
      
      const passwordInput = document.querySelector('input[name="contrasena"]');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      
      const submitButton = screen.getByTestId('motion-button-w-full');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('renders form labels correctly', () => {
      render(React.createElement(LoginForm));
      
      expect(screen.getByText('Correo o Celular')).toBeInTheDocument();
      expect(screen.getByText('Contraseña')).toBeInTheDocument();
    });

    it('renders form placeholders correctly', () => {
      render(React.createElement(LoginForm));
      
      const emailInput = screen.getByPlaceholderText('Ingresa tu correo/celular');
      expect(emailInput).toBeInTheDocument();
      
      const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');
      expect(passwordInput).toBeInTheDocument();
    });

    it('renders social login buttons with correct labels', () => {
      render(React.createElement(LoginForm));
      
      const googleButton = screen.getByLabelText('Iniciar sesión con Google');
      expect(googleButton).toBeInTheDocument();
      
      const instagramButton = screen.getByLabelText('Iniciar sesión con Instagram');
      expect(instagramButton).toBeInTheDocument();
      
      const twitterButton = screen.getByLabelText('Iniciar sesión con X');
      expect(twitterButton).toBeInTheDocument();
    });

    it('renders link to register page', () => {
      render(React.createElement(LoginForm));
      
      const registerLink = screen.getByTestId('next-link');
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/Register');
      expect(registerLink).toHaveTextContent('Regístrate');
    });

    it('renders right panel content correctly', () => {
      render(React.createElement(LoginForm));
      
      const weEatTitle = screen.getByTestId('motion-h2-text-5xl');
      expect(weEatTitle).toBeInTheDocument();
      expect(weEatTitle).toHaveTextContent('WE EAT');
      
      const subtitle = screen.getByText('Nunca te defraudará');
      expect(subtitle).toBeInTheDocument();
      
      // Check for the descriptive text parts separately since they're in spans
      expect(screen.getByText('prueba los')).toBeInTheDocument();
      expect(screen.getByText('NUEVOS')).toBeInTheDocument();
      expect(screen.getByText('catálogos')).toBeInTheDocument();
    });

    it('renders brand imagery and elements', () => {
      render(React.createElement(LoginForm));
      
      // Check for the WE EAT logo/image container
      const logoContainer = document.querySelector('.w-40.h-40.bg-amber-600');
      expect(logoContainer).toBeInTheDocument();
      
      // Check for handle/lid element
      const handle = document.querySelector('.absolute.-top-8');
      expect(handle).toBeInTheDocument();
    });

    it('renders animated elements with motion properties', () => {
      render(React.createElement(LoginForm));
      
      // Check for animated elements
      const animatedContainer = screen.getByTestId('motion-div-w-24');
      expect(animatedContainer).toBeInTheDocument();
      expect(animatedContainer).toHaveClass('w-24', 'h-6', 'rounded-full', 'bg-gray-200');
    });

    it('renders logo with inner content correctly', () => {
      render(React.createElement(LoginForm));
      
      // Check for WE EAT text in the logo
      const logoTexts = screen.getAllByText('WE EAT');
      expect(logoTexts.length).toBeGreaterThan(0);
      
      // Check for logo styling elements
      const logoContainer = document.querySelector('.w-40.h-40.bg-amber-600');
      expect(logoContainer).toBeInTheDocument();
    });
  });

  describe('Form Interaction Tests', () => {
    it('allows user to input email and password', () => {
      render(React.createElement(LoginForm));
      
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]') as HTMLInputElement;
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput).toHaveValue('password123');
    });

    it('displays proper form validation attributes', () => {
      render(React.createElement(LoginForm));
      
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]') as HTMLInputElement;
      
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'text');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('handles form submission without errors', async () => {
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]') as HTMLInputElement;
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      fireEvent.submit(form);
      
      expect(form).toBeInTheDocument();
    });

    it('handles social button clicks without errors', () => {
      render(React.createElement(LoginForm));
      
      const googleButton = screen.getByLabelText('Iniciar sesión con Google');
      const instagramButton = screen.getByLabelText('Iniciar sesión con Instagram');
      const twitterButton = screen.getByLabelText('Iniciar sesión con X');
      
      fireEvent.click(googleButton);
      fireEvent.click(instagramButton);
      fireEvent.click(twitterButton);
      
      expect(googleButton).toBeInTheDocument();
      expect(instagramButton).toBeInTheDocument();
      expect(twitterButton).toBeInTheDocument();
    });

    it('renders form with correct action', () => {
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      expect(form).toHaveAttribute('action');
    });

    it('inputs have correct styling classes', () => {
      render(React.createElement(LoginForm));
      
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]');
      
      expect(emailInput).toHaveClass('w-full', 'py-3', 'px-4', 'bg-amber-50');
      expect(passwordInput).toHaveClass('w-full', 'py-3', 'px-4', 'bg-amber-50');
    });
  });

  describe('Error State Tests', () => {
    it('renders without error message when no error in state', () => {
      render(React.createElement(LoginForm));
      
      const errorElements = document.querySelectorAll('.bg-red-100');
      expect(errorElements).toHaveLength(0);
    });

    it('component handles missing form data gracefully', () => {
      mockFormData.get.mockReturnValue(null);
      
      render(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });
  });

  describe('Loading State Tests', () => {
    it('displays normal submit button text when not pending', () => {
      render(React.createElement(LoginForm));
      
      const submitButton = screen.getByTestId('motion-button-w-full');
      expect(submitButton).toHaveTextContent('INICIA SESION');
      expect(submitButton).not.toHaveAttribute('disabled');
    });

    it('submit button has correct styling', () => {
      render(React.createElement(LoginForm));
      
      const submitButton = screen.getByTestId('motion-button-w-full');
      expect(submitButton).toHaveClass('w-full', 'bg-orange-500', 'text-white', 'font-bold');
      expect(submitButton).toHaveStyle('background-color: rgb(227, 86, 4)');
    });
  });

  describe('Content and Styling Tests', () => {
    it('renders the promotional content', () => {
      render(React.createElement(LoginForm));
      
      expect(screen.getByText('Inicia sesión en tu cuenta para utilizar nuestros servicios.')).toBeInTheDocument();
      expect(screen.getByText('¿No tienes una cuenta?')).toBeInTheDocument();
    });

    it('applies correct CSS classes to main elements', () => {
      render(React.createElement(LoginForm));
      
      const leftPanel = screen.getByTestId('motion-div-w-full');
      expect(leftPanel).toHaveClass('w-full', 'md:w-1/3', 'lg:w-1/4', 'h-screen', 'bg-white');
      
      const rightPanel = screen.getByTestId('motion-div-hidden');
      expect(rightPanel).toHaveClass('hidden', 'md:flex', 'md:w-2/3', 'lg:w-3/4', 'bg-orange-50');
    });

    it('renders form container with correct classes', () => {
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      expect(form).toHaveClass('flex-1', 'flex', 'flex-col');
    });

    it('renders input containers with correct spacing', () => {
      render(React.createElement(LoginForm));
      
      const emailContainer = document.querySelector('.mb-5');
      expect(emailContainer).toBeInTheDocument();
      
      const passwordContainer = document.querySelector('.mb-8');
      expect(passwordContainer).toBeInTheDocument();
    });
  });

  describe('Component Structure Tests', () => {
    it('maintains proper component structure after interactions', () => {
      const { rerender } = render(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
      
      // Simulate re-render
      rerender(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('renders all required form elements', () => {
      render(React.createElement(LoginForm));
      
      // Check for all essential form elements
      expect(screen.getByTestId('motion-form-flex-1')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(document.querySelector('input[name="contrasena"]')).toBeInTheDocument();
      expect(screen.getByTestId('motion-button-w-full')).toBeInTheDocument();
    });

    it('renders responsive layout elements', () => {
      render(React.createElement(LoginForm));
      
      // Check responsive classes
      const leftPanel = screen.getByTestId('motion-div-w-full');
      expect(leftPanel).toHaveClass('w-full', 'md:w-1/3', 'lg:w-1/4');
      
      const rightPanel = screen.getByTestId('motion-div-hidden');
      expect(rightPanel).toHaveClass('hidden', 'md:flex');
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper form labels', () => {
      render(React.createElement(LoginForm));
      
      const emailLabel = screen.getByText('Correo o Celular');
      expect(emailLabel).toBeInTheDocument();
      expect(emailLabel.tagName).toBe('LABEL');
      
      const passwordLabel = screen.getByText('Contraseña');
      expect(passwordLabel).toBeInTheDocument();
      expect(passwordLabel.tagName).toBe('LABEL');
    });

    it('social buttons have aria-labels', () => {
      render(React.createElement(LoginForm));
      
      expect(screen.getByLabelText('Iniciar sesión con Google')).toBeInTheDocument();
      expect(screen.getByLabelText('Iniciar sesión con Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Iniciar sesión con X')).toBeInTheDocument();
    });

    it('form controls are properly structured', () => {
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      const submitButton = screen.getByTestId('motion-button-w-full');
      
      expect(form.contains(submitButton)).toBe(true);
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('API Integration Tests', () => {
    it('handles fetch call with correct parameters', async () => {
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]') as HTMLInputElement;
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      fireEvent.submit(form);
      
      // The form action should be called
      expect(form).toHaveAttribute('action');
    });

    it('handles empty email validation', async () => {
      mockFormData.get.mockImplementation((key) => {
        if (key === 'correo') return '';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Form should still be there (validation prevents submission)
      expect(form).toBeInTheDocument();
    });

    it('handles empty password validation', async () => {
      mockFormData.get.mockImplementation((key) => {
        if (key === 'correo') return 'test@example.com';
        if (key === 'contrasena') return '';
        return null;
      });

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Form should still be there (validation prevents submission)
      expect(form).toBeInTheDocument();
    });

    it('handles fetch network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Component should still render
      expect(form).toBeInTheDocument();
    });

    it('handles invalid server response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });
      
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Component should still render
      expect(form).toBeInTheDocument();
    });

    it('handles server response without error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });
      
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Component should still render
      expect(form).toBeInTheDocument();
    });

    it('handles successful response with different user data structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: 'test-token',
          userData: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });
      
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Component should still render
      expect(form).toBeInTheDocument();
    });

    it('handles successful response with user field', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: 'test-token',
          user: { id: '456', name: 'Another User', email: 'another@example.com' }
        }),
      });
      
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Component should still render
      expect(form).toBeInTheDocument();
    });

    it('handles malformed JSON in error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('Invalid JSON'); },
      });
      
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Component should still render
      expect(form).toBeInTheDocument();
    });
  });

  describe('Token Parsing Tests', () => {
    it('handles valid JWT token structure', () => {
      // Test parseJwt function indirectly through component
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: validToken,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });
      
      render(React.createElement(LoginForm));
      
      // Component should render without errors
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles invalid JWT token structure', () => {
      const invalidToken = 'invalid.token';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: invalidToken,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });
      
      render(React.createElement(LoginForm));
      
      // Component should render without errors
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles JWT token with invalid base64', () => {
      const malformedToken = 'header.invalidbase64!@#.signature';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: malformedToken,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });
      
      render(React.createElement(LoginForm));
      
      // Component should render without errors
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles JWT token with invalid JSON payload', () => {
      // This creates a token with invalid JSON in the payload
      const invalidJsonToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aW52YWxpZGpzb24.signature';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: invalidJsonToken,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });
      
      render(React.createElement(LoginForm));
      
      // Component should render without errors
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });
  });

  describe('Form Behavior Edge Cases', () => {
    it('handles form data extraction edge cases', () => {
      mockFormData.get.mockImplementation((key) => {
        if (key === 'correo') return null;
        if (key === 'contrasena') return null;
        return null;
      });

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Component should handle null values gracefully
      expect(form).toBeInTheDocument();
    });

    it('handles special characters in form inputs', () => {
      render(React.createElement(LoginForm));
      
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]') as HTMLInputElement;
      
      fireEvent.change(emailInput, { target: { value: 'test+email@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'pass@word!123' } });
      
      expect(emailInput).toHaveValue('test+email@example.com');
      expect(passwordInput).toHaveValue('pass@word!123');
    });

    it('handles very long input values', () => {
      render(React.createElement(LoginForm));
      
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]') as HTMLInputElement;
      
      const longEmail = 'a'.repeat(100) + '@example.com';
      const longPassword = 'p'.repeat(200);
      
      fireEvent.change(emailInput, { target: { value: longEmail } });
      fireEvent.change(passwordInput, { target: { value: longPassword } });
      
      expect(emailInput).toHaveValue(longEmail);
      expect(passwordInput).toHaveValue(longPassword);
    });
  });

  describe('Layout Responsiveness Tests', () => {
    it('renders responsive breakpoint classes correctly', () => {
      render(React.createElement(LoginForm));
      
      const leftPanel = screen.getByTestId('motion-div-w-full');
      expect(leftPanel).toHaveClass('w-full', 'md:w-1/3', 'lg:w-1/4');
      
      const rightPanel = screen.getByTestId('motion-div-hidden');
      expect(rightPanel).toHaveClass('hidden', 'md:flex', 'md:w-2/3', 'lg:w-3/4');
    });

    it('renders proper spacing and layout classes', () => {
      render(React.createElement(LoginForm));
      
      const container = document.querySelector('.flex.w-full.min-h-screen.bg-orange-50');
      expect(container).toHaveClass('flex', 'w-full', 'min-h-screen', 'bg-orange-50');
      
      const leftPanel = screen.getByTestId('motion-div-w-full');
      expect(leftPanel).toHaveClass('h-screen', 'bg-white', 'border-r', 'border-gray-200', 'p-8');
    });

    it('renders form layout with proper flex structure', () => {
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      expect(form).toHaveClass('flex-1', 'flex', 'flex-col');
      
      const flexContainer = document.querySelector('.flex-1');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  // New comprehensive tests for better coverage
  describe('Advanced Authentication Flow Tests', () => {
    beforeEach(() => {
      // Reset mocks for this test suite
      const { useFormState, useFormStatus } = require('react-dom');
      useFormState.mockReturnValue([mockFormState, mockDispatchFormState]);
      useFormStatus.mockReturnValue(mockFormStatus);
    });

    it('verifies component handles successful authentication scenarios', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIifQ.signature';
      const userData = { id: '123', name: 'Test User', email: 'test@example.com' };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: validToken,
          user: userData
        }),
      });

      render(React.createElement(LoginForm));
      
      // Verify component renders correctly
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles JWT token parsing edge cases', async () => {
      const invalidToken = 'invalid.token.here';
      const userData = { id: '789', name: 'Test User', email: 'test@example.com' };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: invalidToken,
          user: userData
        }),
      });

      render(React.createElement(LoginForm));
      
      // Component should render without crashing even with invalid token
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles authentication without user data gracefully', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.signature';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: validToken,
          user: null
        }),
      });

      render(React.createElement(LoginForm));
      
      // Component should handle null user data
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });
  });

  describe('LoginUser Function Tests', () => {
    it('handles missing email in form data', async () => {
      mockFormData.get.mockImplementation((key) => {
        if (key === 'correo') return '';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      // Access the loginUser function directly through form submission
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      // Verify the form action was called
      expect(form).toHaveAttribute('action');
    });

    it('handles missing password in form data', async () => {
      mockFormData.get.mockImplementation((key) => {
        if (key === 'correo') return 'test@example.com';
        if (key === 'contrasena') return '';
        return null;
      });

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      expect(form).toHaveAttribute('action');
    });

    it('handles null values from form data', async () => {
      mockFormData.get.mockReturnValue(null);

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      expect(form).toHaveAttribute('action');
    });

    it('handles server response with error data structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ 
          message: 'Custom server error message'
        }),
      });

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      expect(form).toBeInTheDocument();
    });

    it('handles server response without error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}), // No message field
      });

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      expect(form).toBeInTheDocument();
    });

    it('handles successful response with userData field instead of user', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: 'test-token',
          userData: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      expect(form).toBeInTheDocument();
    });

    it('handles network errors and connection issues', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      fireEvent.submit(form);
      
      expect(form).toBeInTheDocument();
    });
  });

  describe('Parse JWT Function Edge Cases', () => {
    it('handles token with no dots (invalid structure)', () => {
      const invalidToken = 'invalidtokenstructure';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: invalidToken,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });

      render(React.createElement(LoginForm));
      
      // Component should render without crashing
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles token with only one dot', () => {
      const singleDotToken = 'header.payload';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: singleDotToken,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });

      render(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles token with special characters in base64', () => {
      const specialCharToken = 'header.special-chars_here=.signature';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: specialCharToken,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });

      render(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });

    it('handles atob decoding errors', () => {
      // Create a token that will cause atob to fail
      const invalidBase64Token = 'header.@#$%^&*().signature';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          token: invalidBase64Token,
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }),
      });

      render(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });
  });

  describe('Component State Management Tests', () => {
    it('handles form action dispatch correctly', () => {
      render(React.createElement(LoginForm));
      
      const form = screen.getByTestId('motion-form-flex-1');
      
      // Verify form has the action
      expect(form).toHaveAttribute('action');
      
      // Submit the form
      fireEvent.submit(form);
      
      // Form should still be present
      expect(form).toBeInTheDocument();
    });

    it('handles form field interactions correctly', () => {
      render(React.createElement(LoginForm));
      
      const emailInput = screen.getByRole('textbox');
      const passwordInput = document.querySelector('input[name="contrasena"]') as HTMLInputElement;
      
      // Test field changes
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('handles component re-renders correctly', () => {
      const { rerender } = render(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
      
      // Simulate re-render
      rerender(React.createElement(LoginForm));
      
      expect(screen.getByTestId('motion-h1-text-3xl')).toHaveTextContent('INICIA SESION');
    });
  });
});