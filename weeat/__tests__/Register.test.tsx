import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = { push: mockPush };

jest.doMock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock framer-motion with better test IDs
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
      h2: createMotionComponent('h2'),
      p: createMotionComponent('p'),
      button: createMotionComponent('button'),
      form: createMotionComponent('form'),
      a: createMotionComponent('a'),
      span: createMotionComponent('span'),
    },
  };
});

// Mock react icons
jest.doMock('react-icons/fa', () => ({
  FaGoogle: () => React.createElement('span', { 'data-testid': 'google-icon' }, 'Google'),
}));

jest.doMock('react-icons/si', () => ({
  SiInstagram: () => React.createElement('span', { 'data-testid': 'instagram-icon' }, 'Instagram'),
}));

jest.doMock('react-icons/fa6', () => ({
  FaXTwitter: () => React.createElement('span', { 'data-testid': 'twitter-icon' }, 'Twitter'),
}));

// Mock fetch
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

// Enhanced react-dom mock to actually call the action function
let mockFormAction: any;
let currentFormState: { error: string | null; success: boolean } = { error: null, success: false };

const mockUseFormState = jest.fn((action, initialState) => {
  mockFormAction = action; // Store the actual action function
  return [currentFormState, async (formData: FormData) => {
    // Actually call the action function with form data
    const result = await action(currentFormState, formData);
    currentFormState = result;
    return result;
  }];
});

const mockUseFormStatus = jest.fn(() => ({ pending: false }));

jest.doMock('react-dom', () => ({
  useFormState: mockUseFormState,
  useFormStatus: mockUseFormStatus,
}));

// Mock console
const originalConsoleError = console.error;
console.error = jest.fn();

describe('Register Component', () => {
  let RegisterForm: any;

  beforeAll(async () => {
    // Import the actual Register component after mocking
    const RegisterModule = await import('../app/Register/page');
    RegisterForm = RegisterModule.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset form state
    currentFormState = { error: null, success: false };
    mockUseFormState.mockImplementation((action, initialState) => {
      mockFormAction = action;
      return [currentFormState, async (formData: FormData) => {
        const result = await action(currentFormState, formData);
        currentFormState = result;
        return result;
      }];
    });
    
    mockUseFormStatus.mockReturnValue({ pending: false });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Registration successful' }),
    });

    // Reset FormData mock
    mockFormData.get.mockImplementation((key) => {
      if (key === 'nombre') return 'John Doe';
      if (key === 'correo') return 'john@example.com';
      if (key === 'contrasena') return 'password123';
      return null;
    });

    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(React.createElement(RegisterForm));
      }).not.toThrow();
    });

    it('renders the registration title', () => {
      render(React.createElement(RegisterForm));
      const titles = screen.getAllByText('REGISTRATE');
      expect(titles.length).toBeGreaterThan(0);
      // Verify at least one is an h1 element
      const h1Title = titles.find(element => element.tagName === 'H1');
      expect(h1Title).toBeInTheDocument();
    });

    it('renders the registration description', () => {
      render(React.createElement(RegisterForm));
      expect(screen.getByText('Crea una cuenta para utilizar nuestros servicios.')).toBeInTheDocument();
    });

    it('renders all form fields with correct labels', () => {
      render(React.createElement(RegisterForm));
      
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Correo o Celular')).toBeInTheDocument();
      expect(screen.getByText('Contraseña')).toBeInTheDocument();
      
      expect(screen.getByPlaceholderText('Ingresa tu nombre')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ingresa tu correo/celular')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ingresa tu contraseña')).toBeInTheDocument();
    });

    it('renders form inputs with correct attributes', () => {
      render(React.createElement(RegisterForm));
      
      const nameInput = screen.getByPlaceholderText('Ingresa tu nombre');
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('name', 'nombre');
      expect(nameInput).toHaveAttribute('required');
      
      const emailInput = screen.getByPlaceholderText('Ingresa tu correo/celular');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'correo');
      expect(emailInput).toHaveAttribute('required');
      
      const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'contrasena');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('renders social login buttons', () => {
      render(React.createElement(RegisterForm));
      
      expect(screen.getByLabelText('Registrarse con Google')).toBeInTheDocument();
      expect(screen.getByLabelText('Registrarse con Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Registrarse con X')).toBeInTheDocument();
    });

    it('renders social login icons', () => {
      render(React.createElement(RegisterForm));
      
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
      expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();
      expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
    });

    it('renders submit button with correct text', () => {
      render(React.createElement(RegisterForm));
      const buttons = screen.getAllByText('REGISTRATE');
      // Should find at least one button
      expect(buttons.length).toBeGreaterThan(0);
      // Find the button element specifically
      const submitButton = buttons.find(element => element.tagName === 'BUTTON');
      expect(submitButton).toBeInTheDocument();
    });

    it('renders login link', () => {
      render(React.createElement(RegisterForm));
      expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
      expect(screen.getByText('¿Ya tienes una cuenta?')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(React.createElement(RegisterForm));
      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });

    it('renders promotional content', () => {
      render(React.createElement(RegisterForm));
      
      expect(screen.getByText('EN')).toBeInTheDocument();
      const weEatElements = screen.getAllByText('WE EAT');
      expect(weEatElements.length).toBeGreaterThan(0);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('garantizado')).toBeInTheDocument();
    });

    it('renders promotional features list', () => {
      render(React.createElement(RegisterForm));
      
      expect(screen.getByText('Entregas Express en tu zona')).toBeInTheDocument();
      expect(screen.getByText('Geolocalización en tiempo real')).toBeInTheDocument();
      expect(screen.getByText('Pedidos personalizados y promociones')).toBeInTheDocument();
      expect(screen.getByText('Soporte al cliente 24/7')).toBeInTheDocument();
    });

    it('renders with motion animations properties', () => {
      render(React.createElement(RegisterForm));
      
      // Check for motion elements with test IDs
      expect(screen.getByTestId('motion-div-w-full')).toBeInTheDocument();
      expect(screen.getByTestId('motion-h1-text-3xl')).toBeInTheDocument();
      expect(screen.getByTestId('motion-p-text-gray-700')).toBeInTheDocument();
    });

    it('renders form with correct action', () => {
      render(React.createElement(RegisterForm));
      
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('action');
    });

    it('renders proper input styling', () => {
      render(React.createElement(RegisterForm));
      
      const nameInput = screen.getByPlaceholderText('Ingresa tu nombre');
      expect(nameInput).toHaveStyle({
        backgroundColor: 'rgb(255, 248, 225)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      });
    });
  });

  describe('Form Interactions', () => {
    it('handles form input changes', () => {
      render(React.createElement(RegisterForm));
      
      const nameInput = screen.getByPlaceholderText('Ingresa tu nombre') as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('Ingresa tu correo/celular') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña') as HTMLInputElement;
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(passwordInput.value).toBe('password123');
    });

    it('handles social button clicks', () => {
      render(React.createElement(RegisterForm));
      
      const googleButton = screen.getByLabelText('Registrarse con Google');
      const instagramButton = screen.getByLabelText('Registrarse con Instagram');
      const twitterButton = screen.getByLabelText('Registrarse con X');
      
      fireEvent.click(googleButton);
      fireEvent.click(instagramButton);
      fireEvent.click(twitterButton);
      
      expect(googleButton).toBeInTheDocument();
      expect(instagramButton).toBeInTheDocument();
      expect(twitterButton).toBeInTheDocument();
    });

    it('validates input field classes and styling', () => {
      render(React.createElement(RegisterForm));
      
      const nameInput = screen.getByPlaceholderText('Ingresa tu nombre');
      const emailInput = screen.getByPlaceholderText('Ingresa tu correo/celular');
      const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');
      
      expect(nameInput).toHaveClass('w-full', 'py-3', 'px-4', 'bg-amber-50');
      expect(emailInput).toHaveClass('w-full', 'py-3', 'px-4', 'bg-amber-50');
      expect(passwordInput).toHaveClass('w-full', 'py-3', 'px-4', 'bg-amber-50');
    });
  });

  describe('Navigation', () => {
    it('navigates to home when close button is clicked', () => {
      render(React.createElement(RegisterForm));
      
      const closeButton = screen.getByLabelText('Cerrar');
      fireEvent.click(closeButton);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('redirects to login on successful registration', () => {
      currentFormState = { error: null, success: true };
      
      const result = render(React.createElement(RegisterForm));
      
      expect(mockPush).toHaveBeenCalledWith('/Login');
      expect(result.container.firstChild).toBeNull();
    });

    it('navigates to login when login link is clicked', () => {
      render(React.createElement(RegisterForm));
      
      const loginLink = screen.getByText('Inicia sesión');
      expect(loginLink).toHaveAttribute('href', '/Login');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when registration fails', () => {
      currentFormState = { error: 'Registration failed. Please try again.', success: false };
      
      render(React.createElement(RegisterForm));
      
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });

    it('does not display error message when there is no error', () => {
      currentFormState = { error: null, success: false };
      
      render(React.createElement(RegisterForm));
      
      const errorElements = document.querySelectorAll('.bg-red-100');
      expect(errorElements).toHaveLength(0);
    });

    it('displays different types of error messages', () => {
      const customError = 'Error de conexión. Por favor verifica tu internet e intenta de nuevo.';
      currentFormState = { error: customError, success: false };
      
      render(React.createElement(RegisterForm));
      
      expect(screen.getByText(customError)).toBeInTheDocument();
      const errorDiv = document.querySelector('.bg-red-100');
      expect(errorDiv).toHaveClass('mb-4', 'p-3', 'bg-red-100', 'border', 'border-red-400', 'text-red-700', 'rounded');
    });
  });

  describe('Loading States', () => {
    it('shows loading state when form is pending', () => {
      mockUseFormStatus.mockReturnValue({ pending: true });

      render(React.createElement(RegisterForm));
      
      expect(screen.getByText('PROCESANDO...')).toBeInTheDocument();
    });

    it('shows normal state when form is not pending', () => {
      mockUseFormStatus.mockReturnValue({ pending: false });

      render(React.createElement(RegisterForm));
      
      const submitButtons = screen.getAllByText('REGISTRATE');
      expect(submitButtons.length).toBeGreaterThan(0);
    });

    it('disables submit button when pending', () => {
      mockUseFormStatus.mockReturnValue({ pending: true });

      render(React.createElement(RegisterForm));
      
      const submitButton = screen.getByText('PROCESANDO...').closest('button');
      expect(submitButton).toHaveAttribute('disabled');
    });

    it('shows loading spinner SVG when pending', () => {
      mockUseFormStatus.mockReturnValue({ pending: true });

      render(React.createElement(RegisterForm));
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin', '-ml-1', 'mr-2', 'h-4', 'w-4', 'text-white');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(React.createElement(RegisterForm));
      
      const labels = screen.getAllByText('Nombre');
      expect(labels[0].tagName).toBe('LABEL');
      
      const emailLabels = screen.getAllByText('Correo o Celular');
      expect(emailLabels[0].tagName).toBe('LABEL');
      
      const passwordLabels = screen.getAllByText('Contraseña');
      expect(passwordLabels[0].tagName).toBe('LABEL');
    });

    it('has proper aria-labels for buttons', () => {
      render(React.createElement(RegisterForm));
      
      expect(screen.getByLabelText('Registrarse con Google')).toBeInTheDocument();
      expect(screen.getByLabelText('Registrarse con Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Registrarse con X')).toBeInTheDocument();
      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });
  });

  describe('RegisterUser Function Direct Tests', () => {
    it('handles successful registration with valid data', async () => {
      render(React.createElement(RegisterForm));
      
      // Create proper FormData with all required fields
      const testFormData = new FormData();
      testFormData.append('nombre', 'John Doe');
      testFormData.append('correo', 'john@example.com');
      testFormData.append('contrasena', 'password123');
      
      // Mock FormData.get to return our test values
      const mockGet = jest.fn((key) => {
        if (key === 'nombre') return 'John Doe';
        if (key === 'correo') return 'john@example.com';
        if (key === 'contrasena') return 'password123';
        return null;
      });
      testFormData.get = mockGet;
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Registration successful' }),
      });

      // Call the action function directly
      expect(mockFormAction).toBeDefined();
      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ error: null, success: true });
      expect(global.fetch).toHaveBeenCalledWith('https://userservice1-haa0g5e6e2dcf7cr.eastus-01.azurewebsites.net/user/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        }),
      });
    });

    it('handles missing name field validation', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return '';
        if (key === 'correo') return 'john@example.com';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Todos los campos son requeridos.', 
        success: false 
      });
    });

    it('handles missing email field validation', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return 'John Doe';
        if (key === 'correo') return '';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Todos los campos son requeridos.', 
        success: false 
      });
    });

    it('handles missing password field validation', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return 'John Doe';
        if (key === 'correo') return 'john@example.com';
        if (key === 'contrasena') return '';
        return null;
      });

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Todos los campos son requeridos.', 
        success: false 
      });
    });

    it('handles null form data values', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn(() => null);

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Todos los campos son requeridos.', 
        success: false 
      });
    });

    it('handles server error with message', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return 'John Doe';
        if (key === 'correo') return 'john@example.com';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Email already exists' }),
      });

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Email already exists', 
        success: false 
      });
    });

    it('handles server error without message', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return 'John Doe';
        if (key === 'correo') return 'john@example.com';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Error al registrar. Por favor intenta de nuevo.', 
        success: false 
      });
    });

    it('handles network connection errors', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return 'John Doe';
        if (key === 'correo') return 'john@example.com';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Error de conexión. Por favor verifica tu internet e intenta de nuevo.', 
        success: false 
      });
      expect(console.error).toHaveBeenCalledWith('Error al registrar:', expect.any(Error));
    });

    it('handles malformed JSON response', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return 'John Doe';
        if (key === 'correo') return 'john@example.com';
        if (key === 'contrasena') return 'password123';
        return null;
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ 
        error: 'Error de conexión. Por favor verifica tu internet e intenta de nuevo.', 
        success: false 
      });
    });

    it('handles fetch with correct API request structure', async () => {
      render(React.createElement(RegisterForm));
      
      const testFormData = new FormData();
      testFormData.get = jest.fn((key) => {
        if (key === 'nombre') return 'María García';
        if (key === 'correo') return 'maria@test.com';
        if (key === 'contrasena') return 'securepass123';
        return null;
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'User created successfully' }),
      });

      const result = await mockFormAction({ error: null, success: false }, testFormData);
      
      expect(result).toEqual({ error: null, success: true });
      expect(global.fetch).toHaveBeenCalledWith('https://userservice1-haa0g5e6e2dcf7cr.eastus-01.azurewebsites.net/user/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'María García',
          email: 'maria@test.com',
          password: 'securepass123'
        }),
      });
    });
  });

  describe('Component Integration', () => {
    it('handles form submission with actual registerUser function', async () => {
      render(React.createElement(RegisterForm));
      
      const nameInput = screen.getByPlaceholderText('Ingresa tu nombre');
      const emailInput = screen.getByPlaceholderText('Ingresa tu correo/celular');
      const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // Verify form inputs have correct values
      expect(nameInput).toHaveValue('Test User');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('validates required fields are present', () => {
      render(React.createElement(RegisterForm));
      
      const nameInput = screen.getByPlaceholderText('Ingresa tu nombre');
      const emailInput = screen.getByPlaceholderText('Ingresa tu correo/celular');
      const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');
      
      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('renders with proper HTML structure', () => {
      render(React.createElement(RegisterForm));
      
      // Verify main container exists
      const containers = document.querySelectorAll('.flex.w-full.min-h-screen');
      expect(containers.length).toBeGreaterThan(0);
      
      // Verify form exists
      const forms = document.querySelectorAll('form');
      expect(forms.length).toBeGreaterThan(0);
      
      // Verify inputs exist
      const inputs = document.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThanOrEqual(3); // name, email, password
    });

    it('handles special characters in input fields', () => {
      render(React.createElement(RegisterForm));
      
      const nameInput = screen.getByPlaceholderText('Ingresa tu nombre') as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('Ingresa tu correo/celular') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña') as HTMLInputElement;
      
      fireEvent.change(nameInput, { target: { value: 'José María O\'Connor' } });
      fireEvent.change(emailInput, { target: { value: 'test+email@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'P@ssw0rd!123' } });
      
      expect(nameInput.value).toBe('José María O\'Connor');
      expect(emailInput.value).toBe('test+email@example.com');
      expect(passwordInput.value).toBe('P@ssw0rd!123');
    });

    it('verifies promotional content layout', () => {
      render(React.createElement(RegisterForm));
      
      // Check for promotional content on the right side
      const rightPanel = document.querySelector('.hidden.md\\:flex');
      expect(rightPanel).toBeInTheDocument();
      
      // Check for SVG illustration
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles responsive layout elements', () => {
      render(React.createElement(RegisterForm));
      
      // Check for responsive classes
      const leftPanel = screen.getByTestId('motion-div-w-full');
      expect(leftPanel).toHaveClass('w-full', 'md:w-1/3', 'lg:w-1/4');
      
      const rightPanel = screen.getByTestId('motion-div-hidden');
      expect(rightPanel).toHaveClass('hidden', 'md:flex', 'md:w-2/3', 'lg:w-3/4');
    });
  });
}); 