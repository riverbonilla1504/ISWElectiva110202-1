"use client";

import { useState, useEffect, useRef } from 'react';
import { Package, ShoppingCart as ShoppingCartIcon, Menu, User, X, LogOut, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserProfileEditor from './UserProfileEditor';

export default function Header() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  const sideMenuRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState([
    { 
      id: 1, 
      name: 'Hawaiano', 
      price: 4000, 
      quantity: 1, 
      image: '/hawaiano.jpg'
    }
  ]);

  // User data state - minimal data needed in the Header
  interface UserData {
    name: string;
    [key: string]: string | number | boolean | null | undefined; // Specify possible types for additional properties
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Shopping Cart Functions
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
    if (sideMenuOpen) setSideMenuOpen(false);
  };

  const increaseQuantity = (id: number) => {
    setCartItems(
      cartItems.map(item => 
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id: number) => {
    setCartItems(
      cartItems.map(item => 
        item.id === id && item.quantity > 1 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Basic user data fetch for header display
  useEffect(() => {
    const fetchBasicUserData = () => {
      setIsDataLoading(true);
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
        }
      } catch (error) {
        console.error('Error loading basic user data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchBasicUserData();
  }, []);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (sideMenuOpen) setSideMenuOpen(false);
    if (isCartOpen) setIsCartOpen(false);
  };

  const toggleSideMenu = () => {
    setSideMenuOpen(!sideMenuOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
    if (isCartOpen) setIsCartOpen(false);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');

    // Reset the user data state
    setUserData(null);

    // Redirect to login page
    router.push('/Login');
  };

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close profile dropdown when clicking outside
      if (profileDropdownRef.current && event.target instanceof Node && !profileDropdownRef.current.contains(event.target) &&
          !(event.target as HTMLElement).closest('button[data-profile-toggle]')) {
        setProfileDropdownOpen(false);
      }

      // Close side menu when clicking outside
      if (sideMenuRef.current && event.target instanceof Node && !sideMenuRef.current.contains(event.target) &&
          !(event.target as HTMLElement).closest('button[data-menu-toggle]')) {
        setSideMenuOpen(false);
      }

      // Close cart when clicking outside
      if (cartRef.current && event.target instanceof Node && !cartRef.current.contains(event.target) &&
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
    <>
      <div className="relative">
        <header className="bg-orange-500 py-3 px-4 flex items-center justify-between w-full shadow-md z-30 relative">
          <div className="flex items-center">
            <h1 className="text-white font-bold text-2xl tracking-wide">WE EAT</h1>
          </div>

          <div className="flex items-center gap-5">
            <button className="text-white hover:text-orange-200 transition-colors duration-300">
              <Package size={24} />
            </button>
            
            {/* Shopping Cart Button */}
            <button 
              className="text-white hover:text-orange-200 transition-colors duration-300 relative"
              onClick={toggleCart}
              data-cart-toggle
            >
              <ShoppingCartIcon size={24} />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {cartItems.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
            
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

        {/* Shopping Cart Dropdown - Modificado para estar más a la izquierda y tener más ancho */}
        <div 
          ref={cartRef}
          className={`absolute top-16 right-0 -translate-x-24 bg-white rounded-lg shadow-md z-30 w-96 border border-gray-200 transition-all duration-300 origin-top-right ${
            isCartOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-700">Carrito</h2>
              <button 
                onClick={toggleCart}
                className="text-gray-500 hover:text-orange-500"
              >
                <X size={20} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center border-b border-gray-100 py-3">
                      <div className="w-16 h-16 rounded overflow-hidden mr-3 bg-orange-100 flex-shrink-0">
                        {/* Placeholder for product image */}
                        <div className="w-full h-full bg-orange-200 flex items-center justify-center">
                          <span className="text-xs text-orange-800">Imagen</span>
                        </div>
                      </div>
                      <div className="flex-grow mr-2">
                        <h3 className="font-medium text-orange-700">{item.name}</h3>
                        <p className="text-orange-500 font-bold">${item.price.toLocaleString()}COP</p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => decreaseQuantity(item.id)}
                          className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 hover:bg-orange-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="mx-2 font-medium text-gray-700">{item.quantity}</span>
                        <button 
                          onClick={() => increaseQuantity(item.id)}
                          className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600"
                        >
                          <Plus size={14} />
                        </button>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">Aquí puedes ver todo lo que está en tu carrito</p>
                  </div>
                  <div className="text-right mb-4">
                    <p className="text-lg font-bold text-orange-700">Total: ${calculateTotal().toLocaleString()}COP</p>
                  </div>
                  <button 
                    className="w-full py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 transition-colors duration-200"
                  >
                    PAGAR AHORA
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Side Menu */}
        <div
          ref={sideMenuRef}
          className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-white shadow-xl z-20 transition-all duration-300 ease-in-out transform ${sideMenuOpen ? 'translate-x-0 w-full md:w-96' : 'translate-x-full w-0'
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
                  <a href="#" className="block py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200">PERFIL</a>
                </li>
                <li>
                  <a href="/Wallet" className="block py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200">BILLETERA</a>
                </li>
                <li>
                  <a href="#" className="block py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200">HISTORIAL PEDIDOS</a>
                </li>
                <li>
                  <a href="#" className="block py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200">CUPONES</a>
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

        {/* Profile Dropdown - Now using the UserProfileEditor component */}
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