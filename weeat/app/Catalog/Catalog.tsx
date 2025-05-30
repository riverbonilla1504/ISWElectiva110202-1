"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import environment from '../../environment';
import Background from '../Background';

interface Food {
  id_product: number;
  name: string;
  description: string;
  state: boolean;
  price: string;
  discount: string;
  picture: string;
}

// API configuration
const CATALOG_API_URL = 'https://catalogservice-fvgefddfdpcteehg.eastus-01.azurewebsites.net';
const ORDER_API_URL = 'https://orderservice-f9erf2hye8gxfqcg.eastus-01.azurewebsites.net';

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

// Create axios instance for order service
const orderApi = axios.create({
  baseURL: ORDER_API_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor to automatically add auth token
const addAuthToken = (config: any) => {
  config.headers = config.headers || {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

catalogApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
orderApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Add response interceptor to handle auth errors
const handleAuthError = (error: any) => {
  if (error.response?.status === 403 || error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

catalogApi.interceptors.response.use((response) => response, handleAuthError);
orderApi.interceptors.response.use((response) => response, handleAuthError);

export default function Catalog() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  // Check authentication status
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

  // Load foods from API
  const loadFoods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await catalogApi.get('/catalog/');
      console.log('Catalog response:', response.data);
      setFoods(response.data);
    } catch (error) {
      console.error('Error fetching food items:', error);
      setError('Error al cargar las comidas');
    } finally {
      setIsLoading(false);
    }
  };

  // Add to cart function
  const addToCart = async (food: Food) => {
    try {
      const { isAuthenticated, userId } = checkAuthentication();
      if (!isAuthenticated || !userId) {
        setError('Debes iniciar sesión para agregar items al carrito');
        return;
      }

      if (!food.id_product) {
        console.error('Missing id_product for food item:', food);
        setError('Error: Información del producto incompleta');
        return;
      }

      setAddingToCart(food.id_product);
      setError(null);

      let orderId;
      
      try {
        // Try to get existing cart first
        const cartResponse = await orderApi.get('/order/cart/');
        console.log('Cart response:', cartResponse.data);
        
        // Check if we have a valid cart response
        if (cartResponse.data && (cartResponse.data.id || cartResponse.data.id_order)) {
          orderId = cartResponse.data.id || cartResponse.data.id_order;
          console.log('Found existing cart:', orderId);
        } else {
          // If no valid cart, create new one
          throw new Error('No valid cart found');
        }
      } catch (error) {
        console.log('Creating new cart...');
        try {
          // Create a new order with the initial product and complete product info
          const createCartResponse = await orderApi.post('/order/create/', {
            customer_id: parseInt(userId),
            product_id: food.id_product,
            quantity: 1,
            status: 'pending',
            // Include complete product information
            product_name: food.name,
            product_price: parseFloat(food.price),
            product_description: food.description,
            product_image: food.picture
          });
          
          console.log('Create cart response:', createCartResponse.data);
          
          // Verify the create response - check for both id and id_order
          if (!createCartResponse.data || (!createCartResponse.data.id && !createCartResponse.data.id_order)) {
            console.error('Invalid create cart response:', createCartResponse.data);
            throw new Error('Failed to create new order - invalid response');
          }
          
          orderId = createCartResponse.data.id || createCartResponse.data.id_order;
          console.log('Created new cart with ID:', orderId);
          
          // Since we created the cart with the product, dispatch update event
          window.dispatchEvent(new Event('cartUpdated'));
          return;
          
        } catch (createError) {
          console.error('Error creating new cart:', createError);
          if (axios.isAxiosError(createError)) {
            const errorDetail = createError.response?.data?.error || createError.response?.data?.detail || createError.message;
            console.error('Error detail:', errorDetail);
            setError(`Error al crear carrito: ${errorDetail}`);
          } else {
            setError('Error al crear nuevo carrito');
          }
          return;
        }
      }

      // If we have an existing cart, add the item to it
      if (!orderId || typeof orderId !== 'number') {
        console.error('Invalid order ID:', orderId);
        setError('Error: No se pudo obtener o crear un carrito válido');
        return;
      }

      console.log(`Adding product ${food.id_product} to existing cart ${orderId}`);
      
      // Add item to existing cart with complete product information
      const addResponse = await orderApi.post(`/order/${orderId}/add-product/`, {
        product_id: food.id_product,
        quantity: 1,
        // Include complete product information
        product_name: food.name,
        product_price: parseFloat(food.price),
        product_description: food.description,
        product_image: food.picture
      });

      console.log('Add product response:', addResponse.data);

      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else {
          const errorDetail = error.response?.data?.error || error.response?.data?.detail || error.message;
          console.error('Error detail:', errorDetail);
          setError(`Error al agregar al carrito: ${errorDetail}`);
        }
      } else if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setAddingToCart(null);
    }
  };

  // Load foods on component mount
  useEffect(() => {
    loadFoods();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FFF9F0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6900]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF9F0] min-h-screen relative">
      {/* Background */}
      <span className="fixed inset-0 z-[0]">
        <Background />
      </span>

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 flex items-center">
          <AlertCircle size={16} className="mr-2" />
          <span>{error}</span>
          <button
            className="ml-4 text-red-700 hover:text-red-900 font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <section className="max-w-7xl mx-auto pl-2 pr-2 py-6 relative z-10">
        {/* COMIDAS Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 uppercase tracking-wide">COMIDAS</h2>
          <div className="mb-6">
            <button className="bg-[#FF6900] text-white px-4 py-1 rounded-full font-medium text-sm hover:bg-[#E65C00] transition-all duration-300 transform hover:scale-105">
              Filtros
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {foods.map((food) => (
              <div 
                key={food.id_product} 
                className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:border-[#FF6900]"
              >
                <div className="h-36 overflow-hidden">
                  {food.picture ? (
                    <img 
                      src={food.picture} 
                      alt={food.name} 
                      className="w-full h-full object-cover transition-all duration-500 hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ShoppingCart size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="text-lg font-bold text-[#FF6900] truncate">{food.name}</h3>
                  <p className="text-xs text-gray-600 h-10 overflow-hidden">{food.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">${parseFloat(food.price).toLocaleString()}COP</p>
                      {parseFloat(food.discount) < 1 && (
                        <p className="text-xs text-green-600">
                          {(100 - parseFloat(food.discount) * 100).toFixed(0)}% OFF
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(food)}
                      disabled={addingToCart === food.id_product || !food.state}
                      className={`bg-[#FF6900] text-white p-2 rounded-full hover:bg-[#E65C00] transition-all duration-300 transform hover:scale-110 hover:rotate-12 disabled:opacity-50 disabled:cursor-not-allowed ${
                        addingToCart === food.id_product ? 'animate-spin' : ''
                      }`}
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                  {!food.state && (
                    <p className="text-xs text-red-600 mt-1">No disponible</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* OFERTA Section */}
        <div className="mt-8 border-t-4 border-[#FF6900] pt-2">
          <h2 className="text-2xl font-bold mb-6 uppercase tracking-wide mt-2">OFERTA</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pizza Pepperoni Offer */}
            <div className="flex items-center bg-white p-3 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-102 hover:border-[#FF6900]">
              <div className="w-28 h-28 mr-2">
                <img 
                  src="/pizzapeperoni.png" 
                  alt="Pizza Pepperoni" 
                  className="w-full h-full object-contain transition-all duration-500 hover:scale-110 hover:rotate-3"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#FF6900]">Pizza Pepperoni</h3>
                <p className="text-sm text-gray-500 line-through">Antes $55000COP</p>
                <p className="text-lg font-bold text-[#FF6900]">Ahora $24000COP</p>
                <button 
                  onClick={() => addToCart({
                    id_product: 1,
                    name: 'Pizza Pepperoni',
                    description: 'Pizza Pepperoni en oferta',
                    state: true,
                    price: '24000.00',
                    discount: '0.56',
                    picture: '/pizzapeperoni.png'
                  })}
                  disabled={addingToCart === 1}
                  className={`mt-2 bg-[#FF6900] text-white p-2 rounded-full hover:bg-[#E65C00] transition-all duration-300 transform hover:scale-110 ${
                    addingToCart === 1 ? 'animate-spin' : ''
                  }`}
                >
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
            
            {/* Hamburguesa Casera Offer */}
            <div className="flex items-center bg-white p-3 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-102 hover:border-[#FF6900]">
              <div className="w-28 h-28 mr-2">
                <img 
                  src="/hamburguer.png" 
                  alt="Hamburguesa Casera" 
                  className="w-full h-full object-contain transition-all duration-500 hover:scale-110 hover:rotate-3"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#FF6900]">Hamburguesa Casera</h3>
                <p className="text-sm text-gray-500 line-through">Antes $30000COP</p>
                <p className="text-lg font-bold text-[#FF6900]">Ahora $20000COP</p>
                <button 
                  onClick={() => addToCart({
                    id_product: 2,
                    name: 'Hamburguesa Casera',
                    description: 'Hamburguesa Casera en oferta',
                    state: true,
                    price: '20000.00',
                    discount: '0.33',
                    picture: '/hamburguer.png'
                  })}
                  disabled={addingToCart === 2}
                  className={`mt-2 bg-[#FF6900] text-white p-2 rounded-full hover:bg-[#E65C00] transition-all duration-300 transform hover:scale-110 ${
                    addingToCart === 2 ? 'animate-spin' : ''
                  }`}
                >
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}