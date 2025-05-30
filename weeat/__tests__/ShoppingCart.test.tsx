import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShoppingCart from '../app/ShoppingCart';

// Mock axios completely before importing the component
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { 
        use: jest.fn().mockReturnValue(1),
      },
      response: { 
        use: jest.fn().mockReturnValue(1),
      }
    }
  };

  return {
    default: mockAxiosInstance,
    create: jest.fn(() => mockAxiosInstance),
    ...mockAxiosInstance
  };
});

// Get the mocked axios
const axios = require('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ShoppingCart: () => <div data-testid="cart-icon">Cart Icon</div>,
  Plus: () => <div data-testid="plus-icon">Plus Icon</div>,
  Minus: () => <div data-testid="minus-icon">Minus Icon</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert Icon</div>,
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

// Mock window.addEventListener for cart events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

describe('ShoppingCart Component', () => {
  const mockUserData = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '123456789'
  };

  const mockCartItems = [
    {
      id: 1,
      name: 'Pizza',
      price: 15.99,
      quantity: 2,
      id_product: 101,
      image: 'pizza.jpg'
    },
    {
      id: 2,
      name: 'Burger',
      price: 8.50,
      quantity: 1,
      id_product: 102,
      image: 'burger.jpg'
    }
  ];

  const mockOrder = {
    id: 1,
    items: mockCartItems,
    total: 40.48,
    status: 'pending'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Setup default localStorage values
    mockLocalStorage.setItem('token', 'fake-token.payload.signature');
    mockLocalStorage.setItem('userId', '1');
    mockLocalStorage.setItem('userData', JSON.stringify(mockUserData));

    // Reset all mock implementations
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAxios.put.mockReset();
    mockedAxios.delete.mockReset();
    
    // Reset interceptor mocks
    mockedAxios.interceptors.request.use.mockClear();
    mockedAxios.interceptors.response.use.mockClear();
  });

  it('renders the shopping cart button', () => {
    render(<ShoppingCart />);
    
    expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
  });

  it('opens and closes cart when button is clicked', () => {
    render(<ShoppingCart />);
    
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    
    // Click to open cart
    fireEvent.click(cartButton!);
    
    expect(screen.getByText('Carrito de Compras')).toBeInTheDocument();
    
    // Click outside to close
    fireEvent.mouseDown(document.body);
    
    // Cart should close (this would require checking if the cart panel is hidden)
  });

  it('loads cart items on mount when authenticated', async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockOrder
    });

    render(<ShoppingCart />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/order/get/1/');
    });
  });

  it('displays cart items when loaded', async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockOrder
    });

    render(<ShoppingCart />);

    // Open cart
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    fireEvent.click(cartButton!);

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('$15.99')).toBeInTheDocument();
      expect(screen.getByText('$8.50')).toBeInTheDocument();
    });
  });

  it('calculates total price correctly', async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockOrder
    });

    render(<ShoppingCart />);

    // Open cart
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    fireEvent.click(cartButton!);

    await waitFor(() => {
      expect(screen.getByText('$40.48')).toBeInTheDocument();
    });
  });

  it('updates item quantity', async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockOrder
    });
    
    mockedAxios.put.mockResolvedValue({
      data: { ...mockOrder, items: [{ ...mockCartItems[0], quantity: 3 }, mockCartItems[1]] }
    });

    render(<ShoppingCart />);

    // Open cart
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    fireEvent.click(cartButton!);

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    // Click plus button for first item
    const plusButtons = screen.getAllByTestId('plus-icon');
    fireEvent.click(plusButtons[0].closest('button')!);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        '/order/update-item/1/',
        expect.objectContaining({
          id_product: 101,
          quantity: 3
        })
      );
    });
  });

  it('removes item when quantity reaches zero', async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockOrder
    });
    
    mockedAxios.delete.mockResolvedValue({
      data: { message: 'Item removed' }
    });

    render(<ShoppingCart />);

    // Open cart
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    fireEvent.click(cartButton!);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Click minus button for second item (quantity 1, should remove)
    const minusButtons = screen.getAllByTestId('minus-icon');
    fireEvent.click(minusButtons[1].closest('button')!);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith('/order/remove-item/1/', {
        data: { id_product: 102 }
      });
    });
  });

  it('handles checkout process', async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockOrder
    });
    
    mockedAxios.post.mockResolvedValue({
      data: { success: true, order_id: 1 }
    });

    render(<ShoppingCart />);

    // Open cart
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    fireEvent.click(cartButton!);

    await waitFor(() => {
      expect(screen.getByText('Finalizar Compra')).toBeInTheDocument();
    });

    // Click checkout button
    const checkoutButton = screen.getByText('Finalizar Compra');
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/order/checkout/1/');
    });
  });

  it('shows empty cart message when no items', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { items: [], total: 0, status: 'pending' }
    });

    render(<ShoppingCart />);

    // Open cart
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    fireEvent.click(cartButton!);

    await waitFor(() => {
      expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });
  });

  it('handles authentication errors', async () => {
    mockedAxios.get.mockRejectedValue({
      response: { status: 401 }
    });

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    });

    render(<ShoppingCart />);

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userData');
    });
  });

  it('shows cart item count badge', async () => {
    mockedAxios.get.mockResolvedValue({
      data: mockOrder
    });

    render(<ShoppingCart />);

    await waitFor(() => {
      // Badge should show total quantity (2 + 1 = 3)
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('handles loading states', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ShoppingCart />);

    // Open cart
    const cartButton = screen.getByTestId('cart-icon').closest('button');
    fireEvent.click(cartButton!);

    expect(screen.getByText('Cargando carrito...')).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    render(<ShoppingCart />);

    await waitFor(() => {
      // Open cart to see error message
      const cartButton = screen.getByTestId('cart-icon').closest('button');
      fireEvent.click(cartButton!);
      
      expect(screen.getByText(/Error al cargar el carrito/)).toBeInTheDocument();
    });
  });

  it('validates token format correctly', () => {
    // Test with invalid token
    mockLocalStorage.setItem('token', 'invalid-token');
    
    render(<ShoppingCart />);

    // Should not make API calls with invalid token
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('listens for cart update events', () => {
    render(<ShoppingCart />);

    expect(mockAddEventListener).toHaveBeenCalledWith('cartUpdated', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = render(<ShoppingCart />);

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('cartUpdated', expect.any(Function));
  });

  it('handles concurrent cart updates', async () => {
    // First API call
    mockedAxios.get.mockResolvedValueOnce({
      data: mockOrder
    });

    // Second API call (simulating concurrent update)
    mockedAxios.put.mockResolvedValueOnce({
      data: { ...mockOrder, items: [{ ...mockCartItems[0], quantity: 3 }] }
    });

    render(<ShoppingCart />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Simulate another cart update
    fireEvent(window, new Event('cartUpdated'));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
}); 