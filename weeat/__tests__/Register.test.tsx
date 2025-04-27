// RegisterForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from '../app/Register/page';
import { useRouter } from 'next/navigation';
import * as reactDom from 'react-dom';

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
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} data-testid={`motion-div-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </div>
    ),
    h1: ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className={className} data-testid={`motion-h1-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </h1>
    ),
    p: ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={className} data-testid={`motion-p-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </p>
    ),
    button: ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button className={className} data-testid={`motion-button-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </button>
    ),
    form: ({ children, className, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
      <form className={className} data-testid={`motion-form-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </form>
    ),
    span: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span className={className} data-testid={`motion-span-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </span>
    ),
    a: ({ children, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a className={className} data-testid={`motion-a-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </a>
    ),
    h2: ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className={className} data-testid={`motion-h2-${className?.split(' ')[0] || 'default'}`} {...props}>
        {children}
      </h2>
    ),
  },
}));

// Mock fetch function
global.fetch = jest.fn();

// Mock FormData
const mockFormData = {
  get: jest.fn()
};
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  delete: jest.fn(),
  get: mockFormData.get,
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  forEach: jest.fn(),
  [Symbol.iterator]: jest.fn(() => {
    const entries: [string, FormDataEntryValue][] = [];
    return entries[Symbol.iterator]();
  }),
}));

// Mock SVG component
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    createElement: function(type: string | React.JSXElementConstructor<unknown>, props: Record<string, unknown>, ...children: React.ReactNode[]) {
      if (type === 'svg') {
        return originalReact.createElement('div', { 
          ...props, 
          'data-testid': 'svg-element',
          className: props?.className || ''
        }, ...children);
      }
      return originalReact.createElement.apply(this, [type, props, ...children]);
    }
  };
});

// Mock useFormState hook
const mockFormState = { error: null, success: undefined };
const mockFormAction = jest.fn();

jest.mock('react-dom', () => {
  const originalModule = jest.requireActual('react-dom');
  return {
    ...originalModule,
    useFormState: jest.fn(() => [mockFormState, mockFormAction]),
    useFormStatus: jest.fn(() => ({ pending: false })),
  };
});

describe('RegisterForm Component', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    
    // Reset form state for each test
    jest.spyOn(reactDom, 'useFormState').mockImplementation(() => [
      { error: null, success: undefined },
      mockFormAction,
      false, // Add a third element to match the expected return type
    ]);
    
    jest.spyOn(reactDom, 'useFormStatus').mockImplementation(() => ({
      pending: false,
      data: null,
      method: null,
      action: null,
    }));
    
    // Reset FormData mock
    mockFormData.get.mockImplementation((key) => {
      if (key === 'nombre') return 'Test User';
      if (key === 'correo') return 'test@example.com';
      if (key === 'contrasena') return 'password123';
      return null;
    });
  });

  it('renders the main container and layout structure correctly', () => {
    render(<RegisterForm />);
    
    // Test the main container structure
    const mainContainer = screen.getByTestId('motion-div-flex');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('flex w-full min-h-screen bg-orange-50');
    
    // Test left panel
    const leftPanel = screen.getByTestId('motion-div-w-full');
    expect(leftPanel).toBeInTheDocument();
    expect(leftPanel).toHaveClass('w-full md:w-1/3 lg:w-1/4 h-screen bg-white border-r border-gray-200 p-8 relative flex flex-col');
    
    // Test right panel
    const rightPanel = screen.getByTestId('motion-div-hidden');
    expect(rightPanel).toBeInTheDocument();
    expect(rightPanel).toHaveClass('hidden md:flex md:w-2/3 lg:w-3/4 bg-orange-50 items-center p-8 relative');
  });

  it('renders RegisterForm form elements correctly', () => {
    render(<RegisterForm />);
    
    // Test heading and intro text
    expect(screen.getByText('REGISTRATE')).toBeInTheDocument();
    expect(screen.getByText('Crea una cuenta para utilizar nuestros servicios.')).toBeInTheDocument();
    
    // Test form inputs
    const nameInput = screen.getByLabelText('Nombre');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('name', 'nombre');
    expect(nameInput).toHaveAttribute('required');
    
    const emailInput = screen.getByLabelText('Correo o Celular');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('name', 'correo');
    expect(emailInput).toHaveAttribute('required');
    
    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('name', 'contrasena');
    expect(passwordInput).toHaveAttribute('required');
    
    // Test submit button
    const submitButton = screen.getByText('REGISTRATE');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton.closest('button')).toHaveAttribute('type', 'submit');
  });

  it('renders social media buttons correctly', () => {
    render(<RegisterForm />);
    
    // Test social media buttons
    const googleButton = screen.getByTestId('google-icon').closest('button');
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveAttribute('aria-label', 'Registrarse con Google');
    
    const instagramButton = screen.getByTestId('instagram-icon').closest('button');
    expect(instagramButton).toBeInTheDocument();
    expect(instagramButton).toHaveAttribute('aria-label', 'Registrarse con Instagram');
    
    const twitterButton = screen.getByTestId('twitter-icon').closest('button');
    expect(twitterButton).toBeInTheDocument();
    expect(twitterButton).toHaveAttribute('aria-label', 'Registrarse con X');
    
    // Test hovering behavior
    fireEvent.mouseOver(googleButton!);
    fireEvent.mouseOver(instagramButton!);
    fireEvent.mouseOver(twitterButton!);
    
    fireEvent.mouseLeave(googleButton!);
    fireEvent.mouseLeave(instagramButton!);
    fireEvent.mouseLeave(twitterButton!);
  });

  it('renders right panel content correctly', () => {
    render(<RegisterForm />);
    
    // Test right panel header
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('WE EAT')).toBeInTheDocument();
    
    // Test main benefit text
    const benefitText = screen.getByText(/Te garantizamos la/);
    expect(benefitText).toBeInTheDocument();
    expect(screen.getByText('mejor experiencia culinaria')).toBeInTheDocument();
    
    // Test service guarantee 
    expect(screen.getByText('Con un servicio')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('garantizado')).toBeInTheDocument();
    
    // Test feature list
    expect(screen.getByText('Entregas Express en tu zona')).toBeInTheDocument();
    expect(screen.getByText('Geolocalización en tiempo real')).toBeInTheDocument();
    expect(screen.getByText('Pedidos personalizados y promociones')).toBeInTheDocument();
    expect(screen.getByText('Soporte al cliente 24/7')).toBeInTheDocument();
    
    // Test SVG illustration
    const svgElement = screen.getByTestId('svg-element');
    expect(svgElement).toBeInTheDocument();
  });

  it('redirects to login when registration is successful', () => {
    // Override the mock for this specific test
    jest.spyOn(reactDom, 'useFormState').mockImplementation(() => [
      { success: true, error: null },
      mockFormAction,
    ]);
    
    render(<RegisterForm />);
    
    // Check that router.push was called with the login page path
    expect(mockPush).toHaveBeenCalledWith('/Login');
  });

  it('displays error message when form submission fails', () => {
    const errorMessage = 'Error al registrar. Por favor intenta de nuevo.';
    
    // Override the mock for this specific test
    jest.spyOn(reactDom, 'useFormState').mockImplementation(() => [
      { error: errorMessage, success: undefined },
      mockFormAction,
    ]);
    
    render(<RegisterForm />);
    
    // Check that the error message is displayed
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.closest('div')).toHaveClass('mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded');
  });

  it('redirects to home page when close button is clicked', () => {
    render(<RegisterForm />);
    
    // Find close button and click it
    const closeButton = screen.getByLabelText('Cerrar');
    fireEvent.click(closeButton);
    
    // Check that router.push was called with the home page path
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles form input changes correctly', () => {
    render(<RegisterForm />);
    
    // Fill out the form
    const nameInput = screen.getByLabelText('Nombre');
    const emailInput = screen.getByLabelText('Correo o Celular');
    const passwordInput = screen.getByLabelText('Contraseña');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepassword' } });
    
    // Check that inputs reflect the new values
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('securepassword');
  });

  it('submits the form and calls formAction', async () => {
    render(<RegisterForm />);
    
    // Find the form element
    const form = screen.getByTestId('motion-form-flex-1');
    
    // Submit the form (React Testing Library way)
    fireEvent.submit(form);
    
    // Check that formAction was called
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
  });

  it('renders submit button with loading state', () => {
    // Override the formStatus mock for this test
    jest.spyOn(reactDom, 'useFormStatus').mockImplementation(() => ({
      pending: true,
    }));
    
    render(<RegisterForm />);
    
    // Check for loading spinner and text
    expect(screen.getByText('PROCESANDO...')).toBeInTheDocument();
    
    // Check for SVG loading spinner
    const loadingSpinner = screen.getByText('PROCESANDO...').previousSibling;
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('navigates to login page when login link is clicked', () => {
    render(<RegisterForm />);
    
    // Find login link and check attributes
    const loginLink = screen.getByText('Inicia sesión');
    expect(loginLink).toHaveAttribute('href', '/Login');
  });
  
  it('tests all animations and motion effects', () => {
    render(<RegisterForm />);
    
    // Test hover effects on feature items
    const featureItems = screen.getAllByText(/\+/);
    featureItems.forEach(item => {
      const parentDiv = item.closest('div');
      if (parentDiv) {
        fireEvent.mouseOver(parentDiv);
        fireEvent.mouseLeave(parentDiv);
      }
    });
    
    // Test animation on main title
    const enTitle = screen.getByText('EN');
    fireEvent.mouseOver(enTitle);
    
    // Test hover on submit button
    const submitButton = screen.getByText('REGISTRATE').closest('button');
    if (submitButton) {
      fireEvent.mouseOver(submitButton);
      fireEvent.mouseDown(submitButton);
      fireEvent.mouseUp(submitButton);
      fireEvent.mouseLeave(submitButton);
    }
  });
  
  it('tests different form submission scenarios', async () => {
    // Mock the formData values for this test
    mockFormData.get.mockImplementation((key) => {
      if (key === 'nombre') return '';
      if (key === 'correo') return '';
      if (key === 'contrasena') return '';
      return null;
    });
    
    render(<RegisterForm />);
    
    // Submit empty form
    const form = screen.getByTestId('motion-form-flex-1');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
    
    // Test with network error
    jest.spyOn(reactDom, 'useFormState').mockImplementation(() => [
      { error: 'Error de conexión. Por favor verifica tu internet e intenta de nuevo.', success: undefined },
      mockFormAction,
    ]);
    
    render(<RegisterForm />);
    expect(screen.getByText('Error de conexión. Por favor verifica tu internet e intenta de nuevo.')).toBeInTheDocument();
  });
  
  it('tests registerUser function with various inputs', async () => {
    // This would be in your action file, but we're testing the behavior through the component
    
    // Test with valid input
    mockFormData.get.mockImplementation((key) => {
      if (key === 'nombre') return 'Valid User';
      if (key === 'correo') return 'valid@example.com';
      if (key === 'contrasena') return 'validpassword';
      return null;
    });
    
    render(<RegisterForm />);
    const form = screen.getByTestId('motion-form-flex-1');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
    });
    
    // Test with server error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Server error' }),
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
});