"use client";

import { useState, useEffect, useCallback } from 'react';

interface Card {
  id_card: number;
  card_number: string;
  expiry_date: string;
  hidden: boolean;
  cardholder_name?: string;
  isDeleting?: boolean;
}

import axios from 'axios';
import { PlusCircle, Eye, EyeOff, Trash2, CreditCard, AlertCircle, Wallet as WalletIcon, X } from 'lucide-react';
import Header from "../Header";

export default function Wallet() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    name: '',
    cvv: ''
  });
  
  const [isAddingCard, setIsAddingCard] = useState(false);
  interface FormErrors {
    number?: string;
    expiry?: string;
    name?: string;
    cvv?: string;
  }

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const apiUrl = 'https://payment-dseqbhehdkdwbucg.eastus-01.azurewebsites.net/payment';
  
  const getUserId = () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        return userId;
      }
      
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        if (parsedUserData && parsedUserData.id) {
          return parsedUserData.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };
  
  const getAuthToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };
  
  const fetchCards = useCallback(async () => {
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      setError('Usuario no autenticado');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const endpoint = `${apiUrl}/get/${parseInt(userId, 10)}/`;
      console.log(`Fetching cards from: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Cards fetched successfully', response.data);
      
      if (Array.isArray(response.data)) {
        const cardsWithHidden = response.data.map((card: Card) => ({
          ...card,
          hidden: true
        }));
        setCards(cardsWithHidden);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Formato de respuesta inesperado del servidor');
        setCards([]);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      
      if (axios.isAxiosError(error)) {
        console.log('Error status:', error.response?.status);
        console.log('Error data:', error.response?.data);
        
        const statusCode = error.response?.status || 'de conexión';
        let errorMessage = 'Error desconocido';
        
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(`Error ${statusCode}: ${errorMessage}`);
      } else {
        setError('Error al cargar las tarjetas');
      }
      
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state:', {
        token: !!getAuthToken(),
        userId: getUserId(),
        cards: cards.length
      });
    }
  }, [cards]);
  
  const toggleCardVisibility = (id_card: number) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id_card === id_card ? { ...card, hidden: !card.hidden } : card
      )
    );
  };
  
  const deleteCard = async (id_card: number) => {
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      setError('Usuario no autenticado');
      return;
    }
    
    try {
      setCards(prevCards => 
        prevCards.map(card => 
          card.id_card === id_card ? { ...card, isDeleting: true } : card
        )
      );
      
      const deleteEndpoint = `${apiUrl}/delete/${parseInt(userId, 10)}/`;
      console.log(`Deleting card with id_card ${id_card} from: ${deleteEndpoint}`);
      
      const response = await axios.delete(deleteEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { id_card: id_card }
      });
      
      console.log('Card deleted successfully', response.data);
      
      setTimeout(() => {
        setCards(prevCards => prevCards.filter(card => card.id_card !== id_card));
      }, 500);
      
      setError(null);
    } catch (error) {
      console.error('Error deleting card:', error);
      
      setCards(prevCards => 
        prevCards.map(card => 
          card.id_card === id_card ? { ...card, isDeleting: false } : card
        )
      );
      
      if (axios.isAxiosError(error)) {
        console.log('Error status:', error.response?.status);
        console.log('Error data:', error.response?.data);
        
        const statusCode = error.response?.status || 'de conexión';
        let errorMessage = 'Error desconocido';
        
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(`Error ${statusCode}: ${errorMessage}`);
      } else {
        setError('Error al eliminar la tarjeta');
      }
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number') {
      const cleanValue = value.replace(/\D/g, '');
      const truncatedValue = cleanValue.slice(0, 16);
      const formattedValue = truncatedValue.replace(/(\d{4})(?=\d)/g, '$1 ');
      
      setNewCard(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    if (name === 'expiry') {
      const cleanValue = value.replace(/\D/g, '');
      const truncatedValue = cleanValue.slice(0, 4);
      
      let formattedValue = truncatedValue;
      if (truncatedValue.length > 2) {
        formattedValue = `${truncatedValue.slice(0, 2)}/${truncatedValue.slice(2)}`;
      }
      
      setNewCard(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    if (name === 'cvv') {
      const cleanValue = value.replace(/\D/g, '');
      const truncatedValue = cleanValue.slice(0, 4);
      setNewCard(prev => ({ ...prev, [name]: truncatedValue }));
      return;
    }
    
    setNewCard(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!newCard.number || newCard.number.replace(/\s/g, '').length !== 16) {
      errors.number = 'Número de tarjeta debe tener 16 dígitos';
    }
    
    if (!newCard.expiry || !newCard.expiry.match(/^\d{2}\/\d{2}$/)) {
      errors.expiry = 'Formato de fecha inválido (MM/YY)';
    } else {
      const [month, year] = newCard.expiry.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
        errors.expiry = 'Mes inválido (1-12)';
      } else if (
        parseInt(year, 10) < currentYear || 
        (parseInt(year, 10) === currentYear && parseInt(month, 10) < currentMonth)
      ) {
        errors.expiry = 'La tarjeta está vencida';
      }
    }
    
    if (!newCard.name) {
      errors.name = 'Ingrese el nombre del titular';
    } else if (newCard.name.length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }
    
    if (!newCard.cvv || newCard.cvv.length < 3) {
      errors.cvv = 'CVV inválido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const addNewCard = async () => {
    if (!validateForm()) {
      return;
    }
    
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      setError('Usuario no autenticado');
      return;
    }
    
    const formattedCardNumber = newCard.number.replace(/\s/g, '');
    
    const [month, year] = newCard.expiry.split('/');
    const formattedExpDate = `20${year}-${month}-01`;
    
    try {
      const addEndpoint = `${apiUrl}/add/`;
      console.log(`Adding card to: ${addEndpoint}`);
      
      const response = await axios.post(addEndpoint, {
        id_user: parseInt(userId, 10),
        cardholder_name: newCard.name,
        card_number: formattedCardNumber,
        exp_date: formattedExpDate
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Card added successfully:', response.data);
      
      const newCardData = {
        id_card: response.data.id_card || response.data.id,
        card_number: formattedCardNumber,
        expiry_date: formattedExpDate, 
        cardholder_name: newCard.name,
        hidden: true
      };
      
      setCards(prevCards => [...prevCards, newCardData]);
      
      setNewCard({
        number: '',
        expiry: '',
        name: '',
        cvv: ''
      });
      
      setIsAddingCard(false);
      setFormErrors({});
    } catch (error) {
      console.error('Error adding card:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || error.message;
        setError(`Error ${error.response?.status || 'de conexión'}: ${errorMessage}`);
      } else {
        setError('Error al agregar la tarjeta');
      }
    }
  };
  
  const formatCardNumberForDisplay = (number: string, hidden: boolean) => {
    if (hidden) {
      return `**** **** **** ${number.slice(-4)}`;
    } else {
      return number.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
  };
  
  const formatExpiryDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    
    try {
      if (date.includes('-') && date.length >= 7) {
        return date.substring(0, 7);
      }
      return date;
    } catch (error) {
      console.error('Error formatting expiry date:', error);
      return 'N/A';
    }
  };
  
  const resetForm = () => {
    setIsAddingCard(false);
    setFormErrors({});
    setNewCard({number: '', expiry: '', name: '', cvv: ''});
    setError(null);
  };
  
  const toggleAddCardForm = () => {
    setIsAddingCard(!isAddingCard);
    if (isAddingCard) {
      setFormErrors({});
      setNewCard({number: '', expiry: '', name: '', cvv: ''});
      setError(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-4">
            <CreditCard size={24} className="text-orange-600 mr-2" />
            <h1 className="text-2xl font-bold text-orange-800">BILLETERA</h1>
          </div>
          
          <p className="text-gray-700 mb-6">
            Aquí puedes agregar tarjetas debito visa para usarlas en tu billetera al pagar
          </p>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <div className="flex items-center">
                <AlertCircle size={20} className="mr-2" />
                <p>{error}</p>
              </div>
              <button 
                onClick={() => {fetchCards(); setError(null);}} 
                className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Intentar nuevamente
              </button>
            </div>
          )}
          
          <div className="mb-6">
            <button
              onClick={toggleAddCardForm}
              className="bg-orange-500 text-white py-3 px-6 rounded-md flex items-center justify-center hover:bg-orange-600 transition-colors shadow-md w-full md:w-64"
            >
              <PlusCircle size={20} className="mr-2" />
              <span className="font-bold">AGREGAR TARJETA</span>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-6">
            <div className={`w-full ${isAddingCard ? 'md:w-1/2' : 'md:w-full'} transition-all duration-300 ease-in-out`}>
              {isLoading ? (
                <div className="bg-white p-6 rounded-lg text-center shadow-md min-h-48 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                  <p className="text-gray-600 mt-3">Cargando tarjetas...</p>
                </div>
              ) : cards.length > 0 ? (
                <div className="space-y-4">
                  {cards.map(card => (
                    <div 
                      key={card.id_card}
                      className={`bg-gradient-to-r from-orange-100 to-white rounded-lg p-6 shadow-md border border-orange-200 transition-all duration-500 ease-in-out hover:shadow-lg ${
                        card.isDeleting 
                          ? 'opacity-0 max-h-0 p-0 my-0 scale-95 overflow-hidden' 
                          : 'opacity-100 max-h-96'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                            <WalletIcon size={16} className="text-white" />
                          </div>
                          <h2 className="text-xl font-bold text-orange-800">WE EAT</h2>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => toggleCardVisibility(card.id_card)}
                            className="p-2 hover:bg-orange-100 rounded-full transition-colors"
                            aria-label={card.hidden ? "Mostrar número" : "Ocultar número"}
                          >
                            {card.hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button 
                            onClick={() => deleteCard(card.id_card)}
                            className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600"
                            aria-label="Eliminar tarjeta"
                            disabled={card.isDeleting}
                          >
                            <Trash2 size={18} className={card.isDeleting ? "animate-spin" : ""} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="w-12 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded mb-3 flex items-center justify-center">
                          <CreditCard size={16} className="text-white" />
                        </div>
                        <div className="text-lg font-medium tracking-wider font-mono">
                          {formatCardNumberForDisplay(card.card_number, card.hidden)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="text-gray-700">
                          <div className="text-xs text-gray-500 mb-1">EXPIRA</div>
                          {formatExpiryDate(card.expiry_date)}
                        </div>
                        {card.cardholder_name && (
                          <div className="text-gray-700 text-right">
                            <div className="text-xs text-gray-500 mb-1">TITULAR</div>
                            <div className="uppercase">{card.cardholder_name}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg text-center shadow-md min-h-48 flex flex-col items-center justify-center">
                  <WalletIcon size={48} className="text-orange-300 mb-3" />
                  <p className="text-gray-600 mb-2">No tienes tarjetas agregadas aún.</p>
                  <p className="text-gray-500 flex items-center text-sm">
                    <AlertCircle size={14} className="mr-1 text-orange-400" />
                    Agrega una tarjeta para comenzar
                  </p>
                </div>
              )}
            </div>
            
            <div className={`w-full md:w-1/2 transition-all duration-300 ease-in-out ${
              isAddingCard 
                ? 'opacity-100 visible' 
                : 'opacity-0 invisible h-0 md:h-auto'
            }`}>
              {isAddingCard && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 transition-all duration-300">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-orange-800">Agregar nueva tarjeta</h2>
                    <button 
                      onClick={resetForm}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Cerrar formulario"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Número de tarjeta</label>
                    <input
                      type="text"
                      name="number"
                      value={newCard.number}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none"
                    />
                    {formErrors.number && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.number}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Fecha de expiración</label>
                      <input
                        type="text"
                        name="expiry"
                        value={newCard.expiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none"
                      />
                      {formErrors.expiry && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.expiry}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={newCard.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none"
                      />
                      {formErrors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.cvv}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Nombre del titular</label>
                    <input
                      type="text"
                      name="name"
                      value={newCard.name}
                      onChange={handleInputChange}
                      placeholder="NOMBRE APELLIDO"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-3 mt-8">
                    <button
                      onClick={addNewCard}
                      className="w-full bg-orange-500 text-white py-3 px-6 rounded-md hover:bg-orange-600 transition-colors font-bold"
                    >
                      GUARDAR
                    </button>
                    <button
                      onClick={resetForm}
                      className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 transition-colors font-bold"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}