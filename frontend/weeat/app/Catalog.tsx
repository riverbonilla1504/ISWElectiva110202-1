import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import environment from '../environment';

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
    <section>
      <div className="w-full bg-[#FEF7ED]">
        <div className="max-w-1xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 uppercase tracking-wide">COMIDAS</h2>
          <div className="mb-6">
            <button className="bg-[#FF6900] text-white px-4 py-1 rounded-full font-medium text-sm">
              Filtros
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {foods.map((food) => (
              <div 
                key={food.id} 
                className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white hover:shadow-sm transition-shadow max-w-xs"
              >
                <div className="h-36 overflow-hidden">
                  {food.image_url ? (
                    <img 
                      src={food.image_url} 
                      alt={food.name} 
                      className="w-full h-full object-cover"
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
                  
                  <div className="mt-1 flex justify-between items-center">
                    <p className="font-bold text-sm text-gray-800">${food.price.toLocaleString()}COP</p>
                    <form action="/api/cart" method="POST">
                      <input type="hidden" name="foodId" value={food.id} />
                      <button className="bg-[#FF6900] text-white p-1 rounded-full hover:bg-[#E65C00] transition-colors">
                        <ShoppingCart size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 uppercase tracking-wide">OFERTA</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div key="pizza-pepperoni-offer" className="flex items-center p-4 bg-white rounded-lg max-w-md">
                <div className="w-24 h-24 mr-4">
                  <img src="/pizza-pepperoni.png" alt="Pizza Pepperoni" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#FF6900]">Pizza Pepperoni</h3>
                  <p className="text-xs text-gray-500 line-through">Antes $55000COP</p>
                  <p className="text-base font-bold text-[#FF6900]">Ahora $24000COP</p>
                  <button className="mt-2 bg-[#FF6900] text-white p-1 rounded-full hover:bg-[#E65C00] transition-colors">
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}