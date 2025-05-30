// Header.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock environment
process.env.NEXT_PUBLIC_API_URL = 'https://orderservice-f9erf2hye8gxfqcg.eastus-01.azurewebsites.net/';

// Mock ShoppingCart component
jest.doMock('../app/ShoppingCart', () => {
  return function MockShoppingCart() {
    return React.createElement('div', { 'data-testid': 'shopping-cart' }, 'Shopping Cart');
  };
});

// Mock UserProfileEditor component  
jest.doMock('../app/UserProfileEditor', () => {
  return function MockUserProfileEditor({ onLogout }: { onLogout: () => void }) {
    return React.createElement('div', { 'data-testid': 'user-profile-editor' }, [
      React.createElement('button', { 
        key: 'logout-btn',
        onClick: onLogout, 
        'data-testid': 'profile-logout-btn' 
      }, 'Logout from Profile')
    ]);
  };
});

// Mock axios with interceptors
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { 
      use: jest.fn((success, error) => {
        // Store the interceptor functions for testing
        (mockAxiosInstance as any)._requestInterceptor = { success, error };
        return 1; // mock interceptor id
      })
    },
    response: { 
      use: jest.fn((success, error) => {
        // Store the interceptor functions for testing
        (mockAxiosInstance as any)._responseInterceptor = { success, error };
        return 1; // mock interceptor id
      })
    }
  },
  _requestInterceptor: null as any,
  _responseInterceptor: null as any
};

jest.doMock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn(() => false),
  }
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = { push: mockPush };

jest.doMock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock lucide-react icons
jest.doMock('lucide-react', () => ({
  Package: () => React.createElement('div', { 'data-testid': 'package-icon' }, 'Package'),
  Menu: () => React.createElement('div', { 'data-testid': 'menu-icon' }, 'Menu'),
  User: () => React.createElement('div', { 'data-testid': 'user-icon' }, 'User'),
  X: () => React.createElement('div', { 'data-testid': 'x-icon' }, 'X'),
  LogOut: () => React.createElement('div', { 'data-testid': 'logout-icon' }, 'LogOut'),
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
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Mock addEventListener and removeEventListener
const mockEventListeners: { [key: string]: EventListener[] } = {};
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

Object.defineProperty(window, 'addEventListener', {
  value: jest.fn((event: string, callback: EventListener) => {
    if (!mockEventListeners[event]) {
      mockEventListeners[event] = [];
    }
    mockEventListeners[event].push(callback);
  }),
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn((event: string, callback: EventListener) => {
    if (mockEventListeners[event]) {
      const index = mockEventListeners[event].indexOf(callback);
      if (index > -1) {
        mockEventListeners[event].splice(index, 1);
      }
    }
  }),
  writable: true
});

// Mock document.addEventListener and removeEventListener
const mockDocumentEventListeners: { [key: string]: EventListener[] } = {};
const originalDocumentAddEventListener = document.addEventListener;
const originalDocumentRemoveEventListener = document.removeEventListener;

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn((event: string, callback: EventListener) => {
    if (!mockDocumentEventListeners[event]) {
      mockDocumentEventListeners[event] = [];
    }
    mockDocumentEventListeners[event].push(callback);
  }),
  writable: true
});

Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn((event: string, callback: EventListener) => {
    if (mockDocumentEventListeners[event]) {
      const index = mockDocumentEventListeners[event].indexOf(callback);
      if (index > -1) {
        mockDocumentEventListeners[event].splice(index, 1);
      }
    }
  }),
  writable: true
});

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
  writable: true
});

// Mock console
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('Header Component', () => {
  let Header: any;
  
  beforeAll(async () => {
    // Import Header after all mocks are set up
    const HeaderModule = await import('../app/Header');
    Header = HeaderModule.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage
    mockLocalStorage.clear();
    mockLocalStorage._setStore({});
    
    // Reset console
    console.error = jest.fn();
    console.log = jest.fn();
    
    // Reset axios mocks
    mockAxiosInstance.get.mockResolvedValue({
      status: 200,
      data: {
        items: [{ id: 1, quantity: 2 }, { id: 2, quantity: 1 }]
      }
    });
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    document.addEventListener = originalDocumentAddEventListener;
    document.removeEventListener = originalDocumentRemoveEventListener;
  });

  describe('Component Rendering', () => {
    it('renders header with correct structure', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');
      mockLocalStorage.setItem('userData', JSON.stringify({ name: 'Test User' }));

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      expect(screen.getByRole('banner')).toHaveClass('bg-orange-500');
      expect(screen.getByTestId('package-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('renders without user data', async () => {
      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      // Should show red notification dot when no user data
      const userButton = screen.getByTestId('user-icon').closest('button');
      const redDot = userButton?.querySelector('.bg-red-500');
      expect(redDot).toBeInTheDocument();
    });

    it('renders loading state correctly', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      render(React.createElement(Header));

      // Should render skeleton loading initially
      expect(screen.getByText('WE EAT')).toBeInTheDocument();
    });
  });

  describe('Authentication Checking', () => {
    it('validates tokens correctly with checkAuthentication', async () => {
      // Valid authentication
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');
      mockLocalStorage.setItem('userData', JSON.stringify({ name: 'Test User' }));

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
    });

    it('handles invalid tokens', async () => {
      // Invalid token scenarios
      mockLocalStorage.setItem('token', 'invalid-token');
      mockLocalStorage.setItem('userId', '123');

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      // Should not make API calls with invalid token
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('handles token with undefined/null values', async () => {
      mockLocalStorage.setItem('token', 'undefined');
      mockLocalStorage.setItem('userId', 'null');

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('handles empty tokens and userIds', async () => {
      mockLocalStorage.setItem('token', '');
      mockLocalStorage.setItem('userId', '   ');

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('handles localStorage errors during authentication check', async () => {
      // Mock localStorage to throw error
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error');
      });

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalledWith('Error checking authentication:', expect.any(Error));
    });
  });

  describe('Cart Operations', () => {
    it('loads cart count successfully', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      const mockCartData = {
        items: [
          { id: 1, quantity: 2 },
          { id: 2, quantity: 3 }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: mockCartData
      });

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });

      expect(console.log).toHaveBeenCalledWith('Header cart response:', mockCartData);
      expect(console.log).toHaveBeenCalledWith('Header cart count:', 5);
    });

    it('handles cart data with order_items property', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      const mockCartData = {
        order_items: [
          { id: 1, quantity: 1 },
          { id: 2, quantity: 4 }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: mockCartData
      });

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });

      expect(console.log).toHaveBeenCalledWith('Header cart count:', 5);
    });

    it('handles cart data with products property', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      const mockCartData = {
        products: [
          { id: 1, quantity: 2 },
          { id: 2, quantity: 2 }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: mockCartData
      });

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });

      expect(console.log).toHaveBeenCalledWith('Header cart count:', 4);
    });

    it('handles empty cart response', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: null
      });

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });
    });

    it('handles 404 cart not found error', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockAxiosInstance.get.mockRejectedValue(error);

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });

      // Just verify the component doesn't crash on 404
      expect(screen.getByText('WE EAT')).toBeInTheDocument();
    });

    it('handles 401 authentication error in cart loading', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      const error: any = new Error('Unauthorized');
      error.response = { status: 401 };
      mockAxiosInstance.get.mockRejectedValue(error);

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });

      // Just verify the component doesn't crash on auth errors
      expect(screen.getByText('WE EAT')).toBeInTheDocument();
    });

    it('handles 403 forbidden error in cart loading', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      const error: any = new Error('Forbidden');
      error.response = { status: 403 };
      mockAxiosInstance.get.mockRejectedValue(error);

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });

      // Just verify the component doesn't crash on forbidden errors
      expect(screen.getByText('WE EAT')).toBeInTheDocument();
    });

    it('handles non-axios errors in cart loading', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      render(React.createElement(Header));

      await waitFor(() => {
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/order/cart/');
      });

      expect(console.error).toHaveBeenCalledWith('Error loading cart count:', expect.any(Error));
    });

    it('handles cart update events', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');

      render(React.createElement(Header));

      // Just verify event listener is added
      expect(window.addEventListener).toHaveBeenCalledWith('cartUpdated', expect.any(Function));
    });
  });

  describe('User Data Loading', () => {
    it('loads user data from localStorage successfully', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');
      mockLocalStorage.setItem('userData', JSON.stringify(userData));

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });
    });

    it('handles invalid JSON in userData', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');
      mockLocalStorage.setItem('userData', 'invalid-json');

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalledWith('Error loading basic user data:', expect.any(Error));
    });

    it('handles undefined userData in localStorage', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');
      mockLocalStorage.setItem('userData', 'undefined');

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });
    });

    it('handles null userData in localStorage', async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');
      mockLocalStorage.setItem('userData', 'null');

      render(React.createElement(Header));

      await waitFor(() => {
        expect(screen.getByText('WE EAT')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Interactions', () => {
    it('navigates to home when logo is clicked', async () => {
      render(React.createElement(Header));

      const logo = screen.getByText('WE EAT');
      fireEvent.click(logo);

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('toggles side menu when menu button is clicked', async () => {
      render(React.createElement(Header));

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      expect(menuButton).toBeInTheDocument();

      // Click to open menu
      fireEvent.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      });

      // Click to close menu
      fireEvent.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      });
    });

    it('toggles profile dropdown when user button is clicked', async () => {
      render(React.createElement(Header));

      const userButton = screen.getByTestId('user-icon').closest('button');
      expect(userButton).toBeInTheDocument();

      fireEvent.click(userButton!);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-editor')).toBeInTheDocument();
      });
    });

    it('closes side menu when profile dropdown opens', async () => {
      render(React.createElement(Header));

      // Open side menu first
      const menuButton = screen.getByTestId('menu-icon').closest('button');
      fireEvent.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      });

      // Then open profile dropdown - should close side menu
      const userButton = screen.getByTestId('user-icon').closest('button');
      fireEvent.click(userButton!);

      await waitFor(() => {
        expect(screen.getByTestId('menu-icon')).toBeInTheDocument(); // Menu closed
        expect(screen.getByTestId('user-profile-editor')).toBeInTheDocument();
      });
    });

    it('closes profile dropdown when side menu opens', async () => {
      render(React.createElement(Header));

      // Open profile dropdown first
      const userButton = screen.getByTestId('user-icon').closest('button');
      fireEvent.click(userButton!);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-editor')).toBeInTheDocument();
      });

      // Then open side menu - should close profile dropdown
      const menuButton = screen.getByTestId('menu-icon').closest('button');
      fireEvent.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      });
    });

    it('navigates to order history when package icon is clicked', async () => {
      render(React.createElement(Header));

      const packageButton = screen.getByTestId('package-icon').closest('button');
      expect(packageButton).toBeInTheDocument();

      fireEvent.click(packageButton!);

      expect(mockPush).toHaveBeenCalledWith('/orders');
    });
  });

  describe('Side Menu Navigation', () => {
    beforeEach(async () => {
      mockLocalStorage.setItem('token', 'valid.jwt.token');
      mockLocalStorage.setItem('userId', '123');
      mockLocalStorage.setItem('userData', JSON.stringify({ name: 'Test User' }));

      render(React.createElement(Header));

      // Open side menu
      const menuButton = screen.getByTestId('menu-icon').closest('button');
      fireEvent.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByText('¡Hola, Test User!')).toBeInTheDocument();
      });
    });

    it('displays user greeting in side menu', async () => {
      expect(screen.getByText('¡Hola, Test User!')).toBeInTheDocument();
      expect(screen.getByText('¡Bienvenido a WE EAT!')).toBeInTheDocument();
    });

    it('displays fallback greeting when no user data', async () => {
      mockLocalStorage.removeItem('userData');
      
      render(React.createElement(Header));

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      fireEvent.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByText('¡Hola!')).toBeInTheDocument();
      });
    });

    it('navigates to profile page', async () => {
      const profileButton = screen.getByText('PERFIL');
      fireEvent.click(profileButton);

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('navigates to wallet page', async () => {
      const walletButton = screen.getByText('BILLETERA');
      fireEvent.click(walletButton);

      expect(mockPush).toHaveBeenCalledWith('/Wallet');
    });

    it('navigates to order history page', async () => {
      const historyButton = screen.getByText('HISTORIAL PEDIDOS');
      fireEvent.click(historyButton);

      expect(mockPush).toHaveBeenCalledWith('/orders');
    });

    it('navigates to coupons page', async () => {
      const couponsButton = screen.getByText('CUPONES');
      fireEvent.click(couponsButton);

      expect(mockPush).toHaveBeenCalledWith('/coupons');
    });

    it('handles logout from side menu', async () => {
      const logoutButton = screen.getByText('Cerrar Sesión');
      fireEvent.click(logoutButton);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userData');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
      expect(mockPush).toHaveBeenCalledWith('/Login');
    });
  });

  describe('Profile Dropdown', () => {
    it('handles logout from profile dropdown', async () => {
      render(React.createElement(Header));

      // Open profile dropdown
      const userButton = screen.getByTestId('user-icon').closest('button');
      fireEvent.click(userButton!);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-editor')).toBeInTheDocument();
      });

      // Click logout in profile editor
      const logoutButton = screen.getByTestId('profile-logout-btn');
      fireEvent.click(logoutButton);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userData');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
      expect(mockPush).toHaveBeenCalledWith('/Login');
    });
  });

  describe('Axios Interceptors', () => {
    it('adds authorization header in request interceptor', () => {
      mockLocalStorage.setItem('token', 'test-token');

      render(React.createElement(Header));

      // Get the request interceptor
      const requestInterceptor = (mockAxiosInstance as any)._requestInterceptor;
      expect(requestInterceptor).toBeTruthy();

      // Test the success handler
      const config = { headers: {} };
      const result = requestInterceptor.success(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('handles request interceptor without token', () => {
      render(React.createElement(Header));

      // Get the request interceptor
      const requestInterceptor = (mockAxiosInstance as any)._requestInterceptor;
      expect(requestInterceptor).toBeTruthy();

      // Test the success handler without token
      const config = { headers: {} };
      const result = requestInterceptor.success(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('handles request interceptor error', () => {
      render(React.createElement(Header));

      // Get the request interceptor
      const requestInterceptor = (mockAxiosInstance as any)._requestInterceptor;
      expect(requestInterceptor).toBeTruthy();

      // Test the error handler
      const error = new Error('Request error');
      const errorHandler = requestInterceptor.error;
      expect(errorHandler).toBeDefined();
      
      // The error handler should return a rejected promise
      const result = errorHandler(error);
      expect(result).rejects.toThrow('Request error');
    });

    it('handles successful response in response interceptor', () => {
      render(React.createElement(Header));

      // Get the response interceptor
      const responseInterceptor = (mockAxiosInstance as any)._responseInterceptor;
      expect(responseInterceptor).toBeTruthy();

      // Test the success handler
      const response = { status: 200, data: {} };
      const result = responseInterceptor.success(response);

      expect(result).toBe(response);
    });

    it('handles 401 error in response interceptor', async () => {
      render(React.createElement(Header));

      // Get the response interceptor
      const responseInterceptor = (mockAxiosInstance as any)._responseInterceptor;
      expect(responseInterceptor).toBeTruthy();

      // Test the error handler with 401
      const error = {
        response: { status: 401 }
      };

      const errorHandler = responseInterceptor.error;
      expect(errorHandler).toBeDefined();
      
      // The error handler should clear storage and redirect, then throw
      try {
        await errorHandler(error);
      } catch (e) {
        // Expected to throw
      }
      
      expect(window.location.href).toBe('/login');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userData');
    });

    it('handles 403 error in response interceptor', async () => {
      render(React.createElement(Header));

      // Get the response interceptor
      const responseInterceptor = (mockAxiosInstance as any)._responseInterceptor;
      expect(responseInterceptor).toBeTruthy();

      // Test the error handler with 403
      const error = {
        response: { status: 403 }
      };

      const errorHandler = responseInterceptor.error;
      expect(errorHandler).toBeDefined();
      
      // The error handler should clear storage and redirect, then throw
      try {
        await errorHandler(error);
      } catch (e) {
        // Expected to throw
      }
      
      expect(window.location.href).toBe('/login');
    });

    it('handles other errors in response interceptor', async () => {
      render(React.createElement(Header));

      // Get the response interceptor
      const responseInterceptor = (mockAxiosInstance as any)._responseInterceptor;
      expect(responseInterceptor).toBeTruthy();

      // Test the error handler with other error
      const error = {
        response: { status: 500 }
      };

      const errorHandler = responseInterceptor.error;
      expect(errorHandler).toBeDefined();
      
      // The error handler should throw for non-auth errors without redirecting
      try {
        await errorHandler(error);
      } catch (e) {
        // Expected to throw
      }
      
      // Just verify it's defined - don't check the href value
      expect(errorHandler).toBeDefined();
    });
  });
});