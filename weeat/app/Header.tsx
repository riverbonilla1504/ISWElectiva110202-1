"use client";

import { useState, useEffect, useRef } from 'react';
import { Package, Menu, User, X, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import UserProfileEditor from './UserProfileEditor';
import ShoppingCart from './ShoppingCart'; // Import the backend shopping cart component

// Types
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  id_product: number;
}

interface Order {
  id?: number;
  id_order?: number; // Added to match backend response
  items: CartItem[];
  total: number;
  status: string;
}

interface UserData {
  name: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Environment configuration
const environment = {
  apiUrl: 'https://orderservice-f9erf2hye8gxfqcg.eastus-01.azurewebsites.net/'
};

// Create axios instance with default config
const api = axios.create({
  baseURL: environment.apiUrl,
  timeout: 10000,
});

// Add request interceptor to automatically add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      // Redirect to login
      window.location.href = '/Login';
    }
    return Promise.reject(error);
  }
);

export default function Header() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  const sideMenuRef = useRef<HTMLDivElement | null>(null);

  // User data state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Cart state for header display (will be synced with backend)
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load cart count for header display
  const loadCartCount = async () => {
    try {
      const { isAuthenticated } = checkAuthentication();
      if (!isAuthenticated) {
        setCartItemCount(0);
        return;
      }

      setIsCartLoading(true);
      setError(null);
      
      const response = await api.get('/order/cart/');
      console.log('Header cart response:', response.data);
      
      const orderData = response.data;
      
      if (orderData) {
        // Check if we have items in the response
        let items = [];
        if (orderData.items && Array.isArray(orderData.items)) {
          items = orderData.items;
        } else if (orderData.order_items && Array.isArray(orderData.order_items)) {
          items = orderData.order_items;
        } else if (orderData.products && Array.isArray(orderData.products)) {
          items = orderData.products;
        }
        
        const totalItems = items.reduce((total: number, item: any) => {
          const quantity = parseInt(item.quantity || '1');
          return total + quantity;
        }, 0);
        
        console.log('Header cart count:', totalItems);
        setCartItemCount(totalItems);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartItemCount(0);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
        } else if (error.response?.status === 404) {
          // No cart exists yet - this is normal
          console.log('No cart exists for header count');
          setCartItemCount(0);
        }
      }
    } finally {
      setIsCartLoading(false);
    }
  };

  // Basic user data fetch for header display
  useEffect(() => {
    const fetchBasicUserData = () => {
      setIsDataLoading(true);
      try {
        const { isAuthenticated } = checkAuthentication();
        if (!isAuthenticated) {
          setUserData(null);
          return;
        }

        const storedUserData = localStorage.getItem('userData');
        if (storedUserData && storedUserData !== 'undefined' && storedUserData !== 'null') {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Error loading basic user data:', error);
        setUserData(null);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchBasicUserData();
    loadCartCount(); // Load cart count on component mount
  }, []);

  // Refresh cart count when cart operations happen
  const handleCartUpdate = () => {
    loadCartCount();
  };

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartChange = () => {
      loadCartCount();
    };

    // Listen for custom cart update events
    window.addEventListener('cartUpdated', handleCartChange);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartChange);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (sideMenuOpen) setSideMenuOpen(false);
  };

  const toggleSideMenu = () => {
    setSideMenuOpen(!sideMenuOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    
    // Reset the user data state
    setUserData(null);
    setCartItemCount(0);
    
    // Redirect to login page
    router.push('/Login');
  };

  // Navigation handlers
  const handleProfileNavigation = () => {
    setSideMenuOpen(false);
    router.push('/profile');
  };

  const handleWalletNavigation = () => {
    setSideMenuOpen(false);
    router.push('/Wallet');
  };

  const handleOrderHistoryNavigation = () => {
    setSideMenuOpen(false);
    router.push('/orders');
  };

  const handleCouponsNavigation = () => {
    setSideMenuOpen(false);
    router.push('/coupons');
  };

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close profile dropdown when clicking outside
      if (profileDropdownRef.current && event.target instanceof Node && 
          !profileDropdownRef.current.contains(event.target) &&
          !(event.target as HTMLElement).closest('button[data-profile-toggle]')) {
        setProfileDropdownOpen(false);
      }
      
      // Close side menu when clicking outside
      if (sideMenuRef.current && event.target instanceof Node && 
          !sideMenuRef.current.contains(event.target) &&
          !(event.target as HTMLElement).closest('button[data-menu-toggle]')) {
        setSideMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="relative">
        <header className="bg-orange-500 py-3 px-4 flex items-center justify-between w-full shadow-md z-30 relative">
          <div className="flex items-center">
            <h1 className="text-white font-bold text-2xl tracking-wide cursor-pointer" onClick={() => router.push('/')}>
              WE EAT
            </h1>
          </div>
          
          <div className="flex items-center gap-5">
            <button 
              className="text-white hover:text-orange-200 transition-colors duration-300"
              onClick={handleOrderHistoryNavigation}
              title="Historial de pedidos"
            >
              <Package size={24} />
            </button>

            {/* Shopping Cart Component - now using the backend version */}
            <div className="relative">
              <ShoppingCart />
            </div>

            <button
              className="text-white hover:text-orange-200 transition-colors duration-300"
              onClick={toggleSideMenu}
              data-menu-toggle
            >
              {sideMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <button
              className="relative bg-white hover:bg-orange-100 rounded-full h-10 w-10 flex items-center justify-center transition-colors duration-300"
              onClick={toggleProfileDropdown}
              data-profile-toggle
            >
              <User size={20} className="text-gray-600" />
              {!userData && !isDataLoading && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Side Menu */}
        <div
          ref={sideMenuRef}
          className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-white shadow-xl z-20 transition-all duration-300 ease-in-out transform ${
            sideMenuOpen ? 'translate-x-0 w-full md:w-96' : 'translate-x-full w-0'
          }`}
        >
          <div className="p-6 h-full overflow-y-auto">
            {isDataLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-7 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : userData ? (
              <h2 className="text-2xl font-bold text-orange-700 mb-2">
                ¡Hola, {userData.name || 'Usuario'}!
              </h2>
            ) : (
              <h2 className="text-2xl font-bold text-orange-700 mb-2">¡Hola!</h2>
            )}
            <p className="text-gray-600 mb-6">¡Bienvenido a WE EAT!</p>
            
            <nav>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={handleProfileNavigation}
                    className="w-full text-left py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200"
                  >
                    PERFIL
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleWalletNavigation}
                    className="w-full text-left py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200"
                  >
                    BILLETERA
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleOrderHistoryNavigation}
                    className="w-full text-left py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200"
                  >
                    HISTORIAL PEDIDOS
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleCouponsNavigation}
                    className="w-full text-left py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200"
                  >
                    CUPONES
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200 flex items-center gap-2 text-red-600"
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Profile Dropdown */}
        <div
          ref={profileDropdownRef}
          className={`fixed top-16 right-0 bg-white rounded-lg shadow-md z-30 w-80 border border-gray-200 transition-all duration-300 origin-top-right ${
            profileDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <UserProfileEditor onLogout={handleLogout} />
        </div>
      </div>
    </>
  );
}