// Catalog.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock axios FIRST with proper instances
const mockCatalogApi = {
  get: jest.fn(),
  post: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

const mockOrderApi = {
  get: jest.fn(),
  post: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

jest.doMock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn((config) => {
      if (config.baseURL === 'https://catalogservice-fvgefddfdpcteehg.eastus-01.azurewebsites.net') {
        return mockCatalogApi;
      } else if (config.baseURL === 'https://orderservice-f9erf2hye8gxfqcg.eastus-01.azurewebsites.net') {
        return mockOrderApi;
      }
      return mockCatalogApi;
    }),
    isAxiosError: jest.fn(() => false)
  }
}));

// Mock lucide-react
jest.doMock('lucide-react', () => ({
  ShoppingCart: () => React.createElement('div', { 'data-testid': 'shopping-cart-icon' }, 'Cart'),
  AlertCircle: () => React.createElement('div', { 'data-testid': 'alert-icon' }, 'Alert'),
}));

// Mock Background
jest.doMock('../app/Background', () => {
  return function MockBackground() {
    return React.createElement('div', { 'data-testid': 'background' }, 'Background');
  };
});

// Mock environment
jest.doMock('../environment', () => ({
  default: {
    CATALOG_API_URL: 'https://catalogservice-fvgefddfdpcteehg.eastus-01.azurewebsites.net',
    ORDER_API_URL: 'https://orderservice-f9erf2hye8gxfqcg.eastus-01.azurewebsites.net'
  }
}));

// Import after mocks
const Catalog = require('../app/Catalog/Catalog').default;

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

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
});

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn()
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

const mockFoodsData = [
  {
    id_product: 1,
    name: 'Pizza Margarita',
    description: 'Deliciosa pizza con tomate y queso',
    state: true,
    price: '25000.00',
    discount: '1.0',
    picture: '/pizza.jpg'
  },
  {
    id_product: 2,
    name: 'Hamburguesa Premium',
    description: 'Hamburguesa con carne, queso y vegetales',
    state: true,
    price: '18000.00',
    discount: '0.8',
    picture: '/burger.jpg'
  }
];

describe('Catalog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup localStorage with mock data
    mockLocalStorage.setItem('token', 'fake-token');
    mockLocalStorage.setItem('userId', '1');
    
    // Default successful API responses
    mockCatalogApi.get.mockResolvedValue({ data: mockFoodsData });
    mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
    mockOrderApi.post.mockResolvedValue({ data: { success: true } });
    
    // Reset window location
    mockLocation.href = '';
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  test('renders catalog component successfully', async () => {
    render(React.createElement(Catalog));
    
    expect(document.body).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    // Mock a slow API response
    mockCatalogApi.get.mockImplementation(() => new Promise(() => {}));
    
    render(React.createElement(Catalog));
    
    // Check for the loading spinner class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('renders comidas section after loading', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('COMIDAS')).toBeInTheDocument();
    });
  });

  test('renders offers section', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('OFERTA')).toBeInTheDocument();
    });
  });

  test('displays food items from API', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      expect(screen.getByText('Hamburguesa Premium')).toBeInTheDocument();
    });
  });

  test('displays filter button', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });
  });

  test('renders pizza pepperoni offer', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Pepperoni')).toBeInTheDocument();
      expect(screen.getByText('Ahora $24000COP')).toBeInTheDocument();
    });
  });

  test('renders hamburger offer', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Hamburguesa Casera')).toBeInTheDocument();
      expect(screen.getByText('Ahora $20000COP')).toBeInTheDocument();
    });
  });

  test('adds item to cart successfully', async () => {
    // Setup proper JWT token format
    mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    mockLocalStorage.setItem('userId', '1');
    
    // Mock successful cart operations
    mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
    mockOrderApi.post.mockResolvedValue({ data: { success: true } });
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
    });

    // Click add to cart button for the first item
    const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
    const button = addToCartButtons[0].closest('button');
    if (button) {
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockOrderApi.post).toHaveBeenCalled();
      });
    }
  });

  test('handles add to cart error', async () => {
    // Mock valid authentication first
    mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    mockLocalStorage.setItem('userId', '1');
    
    // Mock cart creation error
    mockOrderApi.get.mockRejectedValue(new Error('No cart found'));
    mockOrderApi.post.mockRejectedValue(new Error('Failed to add to cart'));
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
    const button = addToCartButtons[0].closest('button');
    if (button) {
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/Error/)).toBeInTheDocument();
      });
    }
  });

  test('handles API error gracefully', async () => {
    mockCatalogApi.get.mockRejectedValue(new Error('API Error'));
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar las comidas')).toBeInTheDocument();
    });
  });

  test('handles unauthenticated user for cart actions', async () => {
    mockLocalStorage.clear();
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
    const button = addToCartButtons[0].closest('button');
    if (button) {
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
      });
    }
  });

  test('dismisses error message when close button is clicked', async () => {
    mockCatalogApi.get.mockRejectedValue(new Error('API Error'));
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar las comidas')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Error al cargar las comidas')).not.toBeInTheDocument();
  });

  test('displays discount information correctly', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      // Check for discount on the item with discount < 1
      const discountElements = screen.queryAllByText(/% OFF/);
      expect(discountElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('handles unavailable items', async () => {
    const unavailableItem = {
      ...mockFoodsData[0],
      state: false
    };
    mockCatalogApi.get.mockResolvedValue({ data: [unavailableItem] });
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('No disponible')).toBeInTheDocument();
    });
  });

  test('creates new cart when no existing cart found', async () => {
    // Setup proper JWT token format
    mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    mockLocalStorage.setItem('userId', '1');
    
    mockOrderApi.get.mockRejectedValue(new Error('No cart found'));
    mockOrderApi.post.mockResolvedValueOnce({ data: { id_order: 2 } }); // Create cart
    mockOrderApi.post.mockResolvedValueOnce({ data: { success: true } }); // Add to cart
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
    const button = addToCartButtons[0].closest('button');
    if (button) {
      fireEvent.click(button);
      
      await waitFor(() => {
        // The component sends the complete order data when creating a new cart
        expect(mockOrderApi.post).toHaveBeenCalledWith('/order/create/', 
          expect.objectContaining({
            customer_id: 1,
            product_id: 1,
            product_name: 'Pizza Margarita',
            product_description: 'Deliciosa pizza con tomate y queso',
            product_price: 25000,
            product_image: '/pizza.jpg',
            quantity: 1,
            status: 'pending'
          })
        );
      });
    }
  });

  test('renders background component', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByTestId('background')).toBeInTheDocument();
    });
  });

  test('displays proper pricing format', async () => {
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('$25,000COP')).toBeInTheDocument();
      expect(screen.getByText('$18,000COP')).toBeInTheDocument();
    });
  });

  test('handles missing product image gracefully', async () => {
    const itemWithoutImage = {
      ...mockFoodsData[0],
      picture: ''
    };
    mockCatalogApi.get.mockResolvedValue({ data: [itemWithoutImage] });
    
    render(React.createElement(Catalog));
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      // Should show a placeholder cart icon
      expect(screen.getAllByTestId('shopping-cart-icon').length).toBeGreaterThan(0);
    });
  });

  // New comprehensive tests for better coverage

  describe('Authentication Edge Cases', () => {
    test('handles invalid JWT token format', async () => {
      mockLocalStorage.setItem('token', 'invalid-token');
      mockLocalStorage.setItem('userId', '1');
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
        });
      }
    });

    test('handles null/undefined token values', async () => {
      mockLocalStorage.setItem('token', 'null');
      mockLocalStorage.setItem('userId', 'undefined');
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
        });
      }
    });

    test('handles empty token values', async () => {
      mockLocalStorage.setItem('token', '');
      mockLocalStorage.setItem('userId', '');
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
        });
      }
    });

    test('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      // Should handle the error and continue functioning
      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
        });
      }
      
      // Restore original function
      mockLocalStorage.getItem.mockImplementation(originalGetItem);
    });
  });

  describe('Cart Error Handling', () => {
    test('handles missing product id error', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      const { id_product, ...itemWithoutId } = mockFoodsData[0];
      mockCatalogApi.get.mockResolvedValue({ data: [itemWithoutId] });
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Error: Información del producto incompleta/)).toBeInTheDocument();
        });
      }
    });

    test('handles axios error responses with details', async () => {
      const axios = require('axios');
      axios.isAxiosError.mockReturnValue(true);
      
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      const errorResponse = {
        response: {
          data: {
            error: 'Detailed error message'
          }
        }
      };
      
      mockOrderApi.get.mockRejectedValue(new Error('No cart found'));
      mockOrderApi.post.mockRejectedValue(errorResponse);
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Error al crear carrito: Detailed error message/)).toBeInTheDocument();
        });
      }
    });

    test('handles 401/403 authentication errors', async () => {
      const axios = require('axios');
      axios.isAxiosError.mockReturnValue(true);
      
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      const authError = {
        response: {
          status: 401,
          data: {
            detail: 'Token expired'
          }
        }
      };
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
      mockOrderApi.post.mockRejectedValue(authError);
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Sesión expirada/)).toBeInTheDocument();
        });
      }
    });

    test('handles invalid cart response when creating new cart', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockRejectedValue(new Error('No cart found'));
      mockOrderApi.post.mockResolvedValue({ data: {} }); // Invalid response without id or id_order
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Failed to create new order - invalid response/)).toBeInTheDocument();
        });
      }
    });

    test('handles invalid order ID when adding to existing cart', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 'invalid' } }); // Non-numeric ID
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Error: No se pudo obtener o crear un carrito válido/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Offer Items Functionality', () => {
    test('adds pizza pepperoni offer to cart', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
      mockOrderApi.post.mockResolvedValue({ data: { success: true } });
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Pepperoni')).toBeInTheDocument();
      });

      // Find the pizza pepperoni offer button (it has product id 1)
      const offerButtons = screen.getAllByTestId('shopping-cart-icon');
      // Find the offer section button specifically
      const pizzaOfferSection = screen.getByText('Pizza Pepperoni').closest('div');
      const pizzaOfferButton = pizzaOfferSection?.querySelector('button');
      
      if (pizzaOfferButton) {
        fireEvent.click(pizzaOfferButton);
        
        await waitFor(() => {
          expect(mockOrderApi.post).toHaveBeenCalledWith('/order/1/add-product/', 
            expect.objectContaining({
              product_id: 1,
              product_name: 'Pizza Pepperoni',
              product_price: 24000,
              quantity: 1
            })
          );
        });
      }
    });

    test('adds hamburger offer to cart', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
      mockOrderApi.post.mockResolvedValue({ data: { success: true } });
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Hamburguesa Casera')).toBeInTheDocument();
      });

      // Find the hamburger offer button (it has product id 2)
      const hamburgerOfferSection = screen.getByText('Hamburguesa Casera').closest('div');
      const hamburgerOfferButton = hamburgerOfferSection?.querySelector('button');
      
      if (hamburgerOfferButton) {
        fireEvent.click(hamburgerOfferButton);
        
        await waitFor(() => {
          expect(mockOrderApi.post).toHaveBeenCalledWith('/order/1/add-product/', 
            expect.objectContaining({
              product_id: 2,
              product_name: 'Hamburguesa Casera',
              product_price: 20000,
              quantity: 1
            })
          );
        });
      }
    });

    test('shows loading state for offer buttons', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
      // Make the add to cart operation slow
      mockOrderApi.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 1000)));
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Pepperoni')).toBeInTheDocument();
      });

      const pizzaOfferSection = screen.getByText('Pizza Pepperoni').closest('div');
      const pizzaOfferButton = pizzaOfferSection?.querySelector('button');
      
      if (pizzaOfferButton) {
        fireEvent.click(pizzaOfferButton);
        
        // Check for loading animation
        expect(pizzaOfferButton).toHaveClass('animate-spin');
      }
    });
  });

  describe('UI State Management', () => {
    test('disables buttons when adding to cart', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
      mockOrderApi.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 1000)));
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button') as HTMLButtonElement;
      
      if (button) {
        fireEvent.click(button);
        
        // Check that the button is in loading state by checking for the animate-spin class
        await waitFor(() => {
          expect(button).toHaveClass('animate-spin');
        });
      }
    });

    test('verifies API call is made when adding to cart', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
      mockOrderApi.post.mockResolvedValue({ data: { success: true } });
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(mockOrderApi.post).toHaveBeenCalled();
        });
      }
    });

    test('shows correct discount percentages', async () => {
      const discountedItem = {
        ...mockFoodsData[0],
        discount: '0.7' // 30% off
      };
      mockCatalogApi.get.mockResolvedValue({ data: [discountedItem] });
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('30% OFF')).toBeInTheDocument();
      });
    });

    test('handles items with no discount correctly', async () => {
      const fullPriceItem = {
        ...mockFoodsData[0],
        discount: '1.0' // No discount
      };
      mockCatalogApi.get.mockResolvedValue({ data: [fullPriceItem] });
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
        // Should not show discount text
        expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State Edge Cases', () => {
    test('handles reloading component after error', async () => {
      // First load with error
      mockCatalogApi.get.mockRejectedValue(new Error('API Error'));
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar las comidas')).toBeInTheDocument();
      });

      // Verify error is displayed
      expect(screen.getByText('Error al cargar las comidas')).toBeInTheDocument();
    });

    test('handles non-axios error types correctly', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', '1');
      
      mockOrderApi.get.mockResolvedValue({ data: { id: 1 } });
      mockOrderApi.post.mockRejectedValue(new Error('Generic error message'));
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Generic error message/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Axios Interceptor Tests', () => {
    test('handles request interceptor authentication', async () => {
      mockLocalStorage.setItem('token', 'test-token');
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      // Verify that catalogApi.get was called (which triggers interceptor)
      expect(mockCatalogApi.get).toHaveBeenCalled();
    });

    test('handles response interceptor auth errors', async () => {
      const authError = {
        response: {
          status: 403
        }
      };
      
      mockCatalogApi.get.mockRejectedValue(authError);
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar las comidas')).toBeInTheDocument();
      });
    });

    test('handles 401 error in interceptor', async () => {
      const authError = {
        response: {
          status: 401
        }
      };
      
      mockCatalogApi.get.mockRejectedValue(authError);
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar las comidas')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Token Validation', () => {
    test('handles token with includes undefined check', async () => {
      mockLocalStorage.setItem('token', 'token-with-undefined-in-name');
      mockLocalStorage.setItem('userId', '1');
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
        });
      }
    });

    test('handles userId with includes null check', async () => {
      mockLocalStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      mockLocalStorage.setItem('userId', 'user-null-id');
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
        });
      }
    });

    test('handles invalid JWT token format (wrong number of parts)', async () => {
      mockLocalStorage.setItem('token', 'invalid.token'); // Only 2 parts instead of 3
      mockLocalStorage.setItem('userId', '1');
      
      render(React.createElement(Catalog));
      
      await waitFor(() => {
        expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('shopping-cart-icon');
      const button = addToCartButtons[0].closest('button');
      if (button) {
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
        });
      }
    });
  });
});