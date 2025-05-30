"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart as ShoppingCartIcon, Plus, Minus, AlertCircle } from 'lucide-react';
import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import Image from 'next/image';

// Types
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  id_product: number;
}

interface UserData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface ProductDetailsResponse {
  id_product: number;
  name: string;
  description: string;
  price: string;
  picture: string;
}

interface ApiErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
}

interface CreateOrderPayload {
  customer_id: number;
  product_id?: number;
  quantity?: number;
  status?: string;
  product_name?: string;
  product_price?: number;
  product_description?: string;
  product_image?: string;
}

// API configuration
const ORDER_API_URL = 'https://orderservice-f9erf2hye8gxfqcg.eastus-01.azurewebsites.net';
const CATALOG_API_URL = 'https://catalogservice-fvgefddfdpcteehg.eastus-01.azurewebsites.net';

// Create axios instance with default config
const api = axios.create({
  baseURL: ORDER_API_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Create axios instance for catalog service
const catalogApi = axios.create({
  baseURL: CATALOG_API_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor to automatically add auth token for both APIs
const addAuthToken = (config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

api.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
catalogApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Add response interceptor to handle auth errors for both APIs
const handleAuthError = (error: AxiosError) => {
  if (error.response?.status === 403 || error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleAuthError);
catalogApi.interceptors.response.use((response) => response, handleAuthError);

export default function ShoppingCart() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  // Improved check authentication function
  const checkAuthentication = (): { token: string | null; userId: string | null; isAuthenticated: boolean } => {
    if (typeof window === "undefined") {
      return { token: null, userId: null, isAuthenticated: false };
    }
    
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      // More thorough token validation
      const isValidToken = token && 
        token.trim().length > 0 && 
        !token.includes('undefined') && 
        !token.includes('null') &&
        token.split('.').length === 3; // Basic JWT format check
      
      const isValidUserId = userId && 
        userId.trim().length > 0 && 
        !userId.includes('undefined') && 
        !userId.includes('null');
      
      return { 
        token: isValidToken ? token : null, 
        userId: isValidUserId ? userId : null, 
        isAuthenticated: !!(isValidToken && isValidUserId) 
      };
    } catch (error) {
      console.error('Error checking authentication:', error);
      return { token: null, userId: null, isAuthenticated: false };
    }
  };

  // Update authentication state
  const updateAuthState = useCallback(() => {
    const { isAuthenticated: authStatus } = checkAuthentication();
    setIsAuthenticated(authStatus);
    setAuthInitialized(true);
  }, []);

  // Load user data
  const loadUserData = useCallback(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData && storedUserData !== 'undefined' && storedUserData !== 'null') {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        console.log('User data loaded for shopping cart:', parsedUserData);
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      setUserData(null);
    }
  }, []);

  // New error handling function
  const handleApiError = useCallback((error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearAuthData();
        setError('Sesión expirada. Redirigiendo...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 404) {
        console.log('No cart found - this is normal for new users');
        setCartItems([]);
        setCurrentOrderId(null);
      } else {
        const errorData = error.response?.data as ApiErrorResponse;
        const errorMessage = errorData?.error || errorData?.detail || errorData?.message || 'Error desconocido';
        setError(`Error ${error.response?.status || 'de conexión'}: ${errorMessage}`);
      }
    } else if (error instanceof Error) {
      setError(`Error: ${error.message}`);
    } else {
      setError('Error desconocido al procesar la operación');
    }
  }, []);

  // Initialize component
  useEffect(() => {
    updateAuthState();
    loadUserData();
  }, [updateAuthState, loadUserData]);

  // Load cart when authentication is ready
  const loadCart = useCallback(async () => {
    if (!authInitialized) return;

    if (!isAuthenticated) {
      setCartItems([]);
      setCurrentOrderId(null);
      console.log('User not authenticated, clearing cart');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/order/cart/');
      console.log('Cart response:', response.data);

      const orderData = response.data;

      if (orderData) {
        setCurrentOrderId(orderData.id || orderData.id_order || null);

        let items = [];
        if (orderData.items && Array.isArray(orderData.items)) {
          items = orderData.items;
        } else if (orderData.order_items && Array.isArray(orderData.order_items)) {
          items = orderData.order_items;
        } else if (orderData.products && Array.isArray(orderData.products)) {
          items = orderData.products;
        }

        const formattedItems: CartItem[] = await Promise.all(
          items.map(async (item: CartItem) => {
            let productDetails = null;
            
            if (!item.name || !item.price) {
              try {
                productDetails = await fetchProductDetails(item.id_product);
              } catch (productError) {
                console.warn(`Could not fetch details for product ${item.id_product}:`, productError);
              }
            }

            return {
              id: item.id,
              id_product: item.id_product,
              name: item.name || productDetails?.name || `Producto ${item.id_product}`,
              price: item.price || (productDetails ? parseFloat(productDetails.price) : 0),
              quantity: parseInt(String(item.quantity || '1')),
              image: item.image || productDetails?.picture || '/placeholder-food.png'
            };
          })
        );

        setCartItems(formattedItems);
        console.log('Cart loaded successfully:', formattedItems);
      } else {
        setCartItems([]);
        setCurrentOrderId(null);
        console.log('No cart data found');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      handleApiError(error);
      setCartItems([]);
      setCurrentOrderId(null);
    } finally {
      setIsLoading(false);
    }
  }, [authInitialized, isAuthenticated, handleApiError]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Listen for cart update events from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('Cart update event received, reloading cart...');
      loadCart();
    };

    // Listen for custom cart update events
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [loadCart]);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setError(type === 'error' ? message : null);
    if (type === 'success') {
      console.log('Success:', message);
    }
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  // Clear authentication data
  const clearAuthData = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
    setIsAuthenticated(false);
    setUserData(null);
    setCartItems([]);
    setCurrentOrderId(null);
  };

  // Function to fetch product details from catalog
  const fetchProductDetails = async (productId: number): Promise<ProductDetailsResponse | null> => {
    try {
      console.log(`Fetching product details for ID: ${productId}`);
      const response = await catalogApi.get(`/catalog/product/${productId}/`);
      console.log('Product details response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product details for ${productId}:`, error);
      return null;
    }
  };

  // Add product to order with complete product information
  const addProductToOrder = async (productId: number, quantity: number = 1) => {
    try {
      if (!currentOrderId) {
        console.log('No current order, creating new one...');
        const productDetails = await fetchProductDetails(productId);
        
        if (productDetails) {
          const orderId = await createOrder(productId, productDetails);
          if (orderId) {
            await loadCart();
            showNotification('success', 'Producto agregado al carrito');
          }
        }
        return;
      }

      console.log(`Adding product ${productId} to order ${currentOrderId}`);
      
      const productDetails = await fetchProductDetails(productId);
      
      const payload = {
        status: 'pending',
        product_id: productId,
        quantity: quantity,
        ...(productDetails && {
          product_name: productDetails.name,
          product_price: productDetails.price,
          product_description: productDetails.description,
          product_image: productDetails.picture
        })
      };

      const response = await api.post(`/order/${currentOrderId}/add-product/`, payload);
      console.log('Product added to order:', response.data);
      
      await loadCart();
      showNotification('success', 'Producto agregado al carrito');
    } catch (error) {
      console.error('Error adding product to order:', error);
      handleApiError(error);
    }
  };

  // Create order with complete product information
  const createOrder = async (initialProductId?: number, productData?: ProductDetailsResponse): Promise<number | null> => {
    try {
      const { userId } = checkAuthentication();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const payload: CreateOrderPayload = {
        customer_id: parseInt(userId),
      };

      if (initialProductId && productData) {
        payload.product_id = initialProductId;
        payload.quantity = 1;
        payload.status = 'pending';
        payload.product_name = productData.name;
        payload.product_price = parseFloat(productData.price);
        payload.product_description = productData.description;
        payload.product_image = productData.picture;
      }

      console.log('Creating order with payload:', payload);
      const response = await api.post('/order/create/', payload);
      
      const orderId = response.data?.id || response.data?.id_order;
      if (!orderId) {
        throw new Error('No se recibió ID de orden válido');
      }

      setCurrentOrderId(orderId);
      console.log('Order created successfully:', orderId);
      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      handleApiError(error);
      return null;
    }
  };

  const updateProductQuantity = async (productId: number, newQuantity: number) => {
    if (!currentOrderId || newQuantity < 0) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Check authentication
      const { isAuthenticated: authStatus } = checkAuthentication();
      if (!authStatus) {
        throw new Error('Usuario no autenticado');
      }
      
      if (newQuantity === 0) {
        await removeProductFromOrder(productId);
        return;
      }

      console.log(`Updating product ${productId} quantity to ${newQuantity}`);
      // Since there's no update endpoint, we'll remove and re-add with new quantity
      await removeProductFromOrder(productId);
      await addProductToOrder(productId, newQuantity);
    } catch (error) {
      console.error('Error updating product quantity:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          const errorDetail = error.response?.data?.detail || error.message;
          showNotification('error', `Sesión expirada: ${errorDetail}`);
          clearAuthData();
        } else {
          showNotification('error', `Error actualizando cantidad: ${error.message}`);
        }
      } else if (error instanceof Error) {
        showNotification('error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Remove product from order
  const removeProductFromOrder = async (productId: number) => {
    if (!currentOrderId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const { isAuthenticated: authStatus } = checkAuthentication();
      if (!authStatus) {
        throw new Error('Usuario no autenticado');
      }
      
      console.log(`Removing product ${productId} from order ${currentOrderId}`);
      await api.delete(`/order/${currentOrderId}/delete-product/${productId}/`);
      
      await loadCart();
      showNotification('success', 'Producto eliminado del carrito');
    } catch (error) {
      console.error('Error removing product from order:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // UI Event Handlers
  const toggleCart = () => {
    // Check authentication before opening cart
    const { isAuthenticated: authStatus } = checkAuthentication();
    if (!authStatus) {
      showNotification('error', 'Debes iniciar sesión para ver tu carrito');
      return;
    }
    setIsCartOpen(!isCartOpen);
  };

  const increaseQuantity = async (productId: number) => {
    const currentItem = cartItems.find(item => item.id_product === productId);
    if (currentItem) {
      await updateProductQuantity(productId, currentItem.quantity + 1);
    }
  };

  const decreaseQuantity = async (productId: number) => {
    const currentItem = cartItems.find(item => item.id_product === productId);
    if (currentItem && currentItem.quantity > 1) {
      await updateProductQuantity(productId, currentItem.quantity - 1);
    }
  };

  const removeItem = async (productId: number) => {
    await removeProductFromOrder(productId);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!currentOrderId || cartItems.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const { isAuthenticated: authStatus } = checkAuthentication();
      if (!authStatus) {
        throw new Error('Usuario no autenticado');
      }

      console.log(`Processing checkout for order ${currentOrderId}`);
      
      // Update order status to pending
      await api.post(`/order/${currentOrderId}/status/pending/`);

      // Clear cart after successful checkout
      setCartItems([]);
      setCurrentOrderId(null);
      setIsCartOpen(false);
      showNotification('success', '¡Orden procesada exitosamente!');
      alert('¡Orden procesada exitosamente! Procediendo al checkout...');
    } catch (error) {
      console.error('Error during checkout:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry cart loading
  const retryLoadCart = () => {
    loadCart();
  };

  // Debug function to check auth state
  const debugAuthState = () => {
    const authState = checkAuthentication();
    console.log('Debug Auth State:', {
      ...authState,
      token: authState.token ? `${authState.token.substring(0, 10)}...` : null,
      authInitialized,
      isAuthenticated
    });
  };

  // Close cart when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && event.target && !cartRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('button[data-cart-toggle]')) {
        setIsCartOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <button
        className="text-white hover:text-orange-200 transition-colors duration-300 relative"
        onClick={toggleCart}
        data-cart-toggle
        disabled={isLoading}
      >
        <ShoppingCartIcon size={24} />
        {getTotalItems() > 0 && isAuthenticated && (
          <span className="absolute -top-2 -right-2 bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {getTotalItems()}
          </span>
        )}
      </button>

      {/* Cart Dropdown */}
      <div
        ref={cartRef}
        className={`absolute top-10 right-0 -translate-x-24 bg-white rounded-lg shadow-md z-30 w-[28rem] border border-gray-200 transition-all duration-300 origin-top-right ${
          isCartOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-3">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 flex items-center">
              <AlertCircle size={16} className="mr-2" />
              <span className="block sm:inline text-xs">{error}</span>
              <button
                className="ml-auto text-red-700 hover:text-red-900 font-bold"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* User greeting */}
          {userData && isAuthenticated && (
            <div className="text-center mb-3 p-2 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700">
                Carrito de {userData.name || 'Usuario'}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <p className="text-gray-500 mt-2">Cargando...</p>
            </div>
          )}

          {/* Not Authenticated State */}
          {!isAuthenticated && !isLoading && authInitialized && (
            <div className="text-center py-6">
              <AlertCircle size={48} className="mx-auto text-orange-300 mb-3" />
              <p className="text-gray-700 text-lg mb-2">Inicia sesión</p>
              <p className="text-gray-500 text-sm mb-3">Debes iniciar sesión para ver tu carrito</p>
              <button
                onClick={debugAuthState}
                className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300"
              >
                Debug Auth
              </button>
            </div>
          )}

          {/* Empty Cart State */}
          {cartItems.length === 0 && !isLoading && isAuthenticated && authInitialized && (
            <div className="text-center py-6">
              <ShoppingCartIcon size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-lg mb-2">Tu carrito está vacío</p>
              <p className="text-gray-400 text-sm">Agrega productos para comenzar tu pedido</p>
              {error && (
                <button
                  onClick={retryLoadCart}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm"
                >
                  Intentar nuevamente
                </button>
              )}
            </div>
          )}

          {/* Cart Items */}
          {cartItems.length > 0 && !isLoading && isAuthenticated && (
            <>
              <div className="max-h-64 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={`${item.id}-${item.id_product}`} className="flex items-center justify-between border-b border-gray-100 py-3 px-1">
                    <div className="flex items-center flex-1">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <Image
                          src={item.image || '/placeholder-food.png'}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-500">${item.price.toLocaleString()} COP c/u</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseQuantity(item.id_product)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLoading || item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="mx-1 font-medium text-gray-700 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item.id_product)}
                          className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLoading}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-700 text-sm">
                          ${(item.price * item.quantity).toLocaleString()} COP
                        </p>
                        <button
                          onClick={() => removeItem(item.id_product)}
                          className="text-red-500 text-xs hover:underline hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLoading}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-gray-800 mb-1">
                    Total: ${calculateTotal().toLocaleString()} COP
                  </p>
                  <p className="text-sm text-gray-500">
                    {getTotalItems()} {getTotalItems() === 1 ? 'artículo' : 'artículos'} en tu carrito
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || cartItems.length === 0}
                >
                  {isLoading ? 'PROCESANDO...' : 'PAGAR AHORA'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}