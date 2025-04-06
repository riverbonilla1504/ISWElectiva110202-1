"use client";

import { Search, Package, ShoppingCart, Menu, User } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-orange-500 py-3 px-4 flex items-center justify-start w-full shadow-md">
        <div className="text-white font-bold text-2xl tracking-wide mr-4">
            WE EAT
        </div>
        
        <div className="relative hidden md:block flex-grow max-w-md">
            <input
                type="text"
                placeholder="Realiza una búsqueda"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-1 rounded-full w-full text-sm focus:outline-none bg-white border-2 border-gray-300 placeholder-black"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Search size={18} />
            </button>
        </div>
        
        <div className="flex items-center gap-5 ml-auto">
            <button className="text-white hidden sm:block">
                <Package size={24} />
            </button>
            <button className="text-white">
                <ShoppingCart size={24} />
            </button>
            <button 
                className="text-white md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                <Menu size={24} />
            </button>
            <button className="text-white hidden md:block">
                <Menu size={24} />
            </button>
            <div className="bg-white rounded-full h-10 w-10 flex items-center justify-center">
                <User size={20} className="text-gray-600" />
            </div>
        </div>
        
        {mobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 bg-white shadow-md p-4 z-10">
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Realiza una búsqueda"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-3 pr-10 py-2 rounded-full w-full text-sm focus:outline-none bg-white border-2 border-gray-300 placeholder-black"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Search size={18} />
                    </button>
                </div>
                <nav>
                    <ul className="space-y-3">
                        <li className="py-2 border-b border-gray-200">Comidas</li>
                        <li className="py-2 border-b border-gray-200">Ofertas</li>
                        <li className="py-2 border-b border-gray-200">Mi Cuenta</li>
                        <li className="py-2">Ayuda</li>
                    </ul>
                </nav>
            </div>
        )}
    </header>
  );
}