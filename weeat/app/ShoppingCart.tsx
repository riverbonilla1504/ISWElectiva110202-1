"use client";

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart as ShoppingCartIcon, Plus, Minus } from 'lucide-react';

export default function ShoppingCart() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([
    { 
      id: 1, 
      name: 'Hawaiano', 
      price: 4000, 
      quantity: 1, 
      image: '/hawaiano.jpg'
    }
  ]);
  const cartRef = useRef<HTMLDivElement>(null);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
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
      >
        <ShoppingCartIcon size={24} />
        {cartItems.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {cartItems.reduce((total, item) => total + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Cart Dropdown - Modificado para estar más a la izquierda y tener más ancho */}
      <div 
        ref={cartRef}
        className={`absolute top-10 right-0 -translate-x-24 bg-white rounded-lg shadow-md z-30 w-[28rem] border border-gray-200 transition-all duration-300 origin-top-right ${
          isCartOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b border-gray-100 py-2 px-1">
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => decreaseQuantity(item.id)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="mx-1 font-medium text-gray-700">{item.quantity}</span>
                      
                      <button 
                        onClick={() => increaseQuantity(item.id)}
                        className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white"
                      >
                        <Plus size={16} />
                      </button>
                      
                      <div className="ml-2 text-right">
                        <p className="font-bold text-gray-700">${item.price.toLocaleString()}COP</p>
                        <button 
                          onClick={() => removeItem(item.id)} 
                          className="text-red-500 text-sm hover:underline mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 text-center">
                <p className="text-lg font-bold text-gray-800 mb-2">
                  Total: ${calculateTotal().toLocaleString()}COP
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Aquí puedes ver todo lo que está en tu carrito
                </p>
                
                <button 
                  className="w-full py-2 bg-orange-500 text-white font-bold rounded hover:bg-orange-600 transition-colors duration-200"
                >
                  PAGAR AHORA
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}