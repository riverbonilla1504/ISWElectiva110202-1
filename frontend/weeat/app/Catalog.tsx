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
    return <div className="text-center py-10 text-red-500">Error al cargar las comidas</div>;
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-3xl font-bold mb-4 text-gray-700 uppercase tracking-wide">COMIDAS</h2>
      <div className="mb-6">
        <form action="/menus">
          <button className="bg-[#FF6900] text-white px-4 py-1 rounded-full font-medium">
            MENÚS
          </button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {foods.map((food) => (
          <div 
            key={food.id} 
            className="border border-gray-200 rounded-lg p-2 flex flex-col shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-40 mb-2 overflow-hidden rounded-md">
              <img 
                src={food.image_url} 
                alt={food.name} 
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="text-xl font-bold text-[#FF6900]">{food.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{food.description}</p>
            
            <div className="mt-auto flex justify-between items-center">
              <p className="font-bold">${food.price.toLocaleString()}COP</p>
              <form action="/api/cart" method="POST">
                <input type="hidden" name="foodId" value={food.id} />
                <button className="bg-[#FF6900] text-white p-2 rounded-full hover:bg-[#E65C00] transition-colors">
                  <ShoppingCart size={20} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}