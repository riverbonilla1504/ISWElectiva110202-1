import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import environment from '../../environment';
import Background from '../Background';

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

async function getFoods() {
  try {
    const response = await axios.get(`${environment.apiUrl}/catalog/`);
    return response.data as Food[];
  } catch (error) {
    console.error('Error fetching food items:', error);
    return null;
  }
}

export default async function Catalog() {
  const foods = await getFoods();
  
  if (!foods) {
    return <span className="text-center py-10 text-red-500">Error al cargar las comidas</span>;
  }

  return (
    <div className="bg-[#FFF9F0] min-h-screen relative">
      {/* Background - Fixed and full screen */}
      <span className="fixed inset-0 z-[0]">
        <Background />
      </span>
      {/* Main Content - Minimal padding */}
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
                key={food.id} 
                className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:border-[#FF6900]"
              >
                <div className="h-36 overflow-hidden">
                  {food.image_url ? (
                    <img 
                      src={food.image_url} 
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
                    <p className="font-bold text-sm">${food.price.toLocaleString()}COP</p>
                    <form action="/api/cart" method="POST">
                      <input type="hidden" name="foodId" value={food.id} />
                      <button className="bg-[#FF6900] text-white p-2 rounded-full hover:bg-[#E65C00] transition-all duration-300 transform hover:scale-110 hover:rotate-12">
                        <ShoppingCart size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* OFERTA Section - keeping as mockup */}
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
                <button className="mt-2 bg-[#FF6900] text-white p-2 rounded-full hover:bg-[#E65C00] transition-all duration-300 transform hover:scale-110">
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
                <button className="mt-2 bg-[#FF6900] text-white p-2 rounded-full hover:bg-[#E65C00] transition-all duration-300 transform hover:scale-110">
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