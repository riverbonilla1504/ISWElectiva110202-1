"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, MapPin, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from "../Header";
import Background from "../Background";

const UbicationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasExistingLocation, setHasExistingLocation] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/Login');
      return;
    }

    const existingLocation = localStorage.getItem('userLocation');
    if (existingLocation) {
      setAddress(existingLocation);
      setHasExistingLocation(true);
    } else {
      setIsEditingLocation(true);
    }
  }, [router]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setError('');
  };

  const handleContinueWithExisting = () => {
    router.push('/');
  };

  const handleChangeLocation = () => {
    setIsEditingLocation(true);
  };

  const handleSaveLocation = async () => {
    if (!address.trim()) {
      setError('Por favor ingresa una ubicación');
      return;
    }

    setIsLoading(true);
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Usuario no encontrado');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('userLocation', address);
      
      const locationData = localStorage.getItem('locationCoordinates');
      if (locationData) {
        console.log('Location coordinates stored:', JSON.parse(locationData));
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Error al guardar la ubicación. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'WE_EAT_App'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error connecting to geocoding service');
      }
      
      const data = await response.json();
      
      localStorage.setItem(
        'locationCoordinates', 
        JSON.stringify({ latitude, longitude })
      );
      
      if (data.display_name) {
        return data.display_name;
      }
      
      const addressComponents = [];
      
      const address = data.address || {};
      if (address.road) addressComponents.push(address.road);
      if (address.house_number) addressComponents.push(address.house_number);
      if (address.suburb) addressComponents.push(address.suburb);
      if (address.city || address.town) addressComponents.push(address.city || address.town);
      if (address.state) addressComponents.push(address.state);
      
      return addressComponents.length > 0 
        ? addressComponents.join(', ')
        : `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
      
    } catch (error) {
      console.error('Geocoding error:', error);
      return `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
    }
  };

  const detectLocation = () => {
    setIsLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('La geolocalización no está disponible en tu navegador');
      setIsLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const formattedAddress = await getAddressFromCoordinates(latitude, longitude);
          setAddress(formattedAddress);
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error getting address:', err);
          setError('Error al obtener la dirección. Por favor, inténtelo manualmente.');
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsLoading(false);
        
        if (err.code === 1) {
          setError('Permiso de ubicación denegado. Por favor, ingresa tu dirección manualmente.');
        } else {
          setError('Error al detectar la ubicación. Por favor, ingresa tu dirección manualmente.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <span className="fixed inset-0 z-[0]">
        <Background />
      </span>
      <Header />
      
      <main className="flex-1 p-6 flex flex-col items-center z-10 relative">
        <motion.h1 
          className="text-4xl font-bold text-orange-600 mb-10 text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          UBICACION
        </motion.h1>

        <motion.div 
          className="mb-10 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative w-40 h-40 flex items-center justify-center">
            <Map className="w-full h-full text-orange-300 absolute" strokeWidth={1.5} />
            <MapPin className="w-16 h-16 text-red-500 absolute" strokeWidth={2} />
          </div>
        </motion.div>

        <motion.div 
          className="w-full max-w-md"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {hasExistingLocation && !isEditingLocation ? (
            <>
              <div className="bg-cream-100 rounded-lg p-4 mb-4 border border-amber-200">
                <div className="text-center text-gray-800 py-2">
                  <p className="font-medium mb-2">Ubicación actual:</p>
                  <p className="text-lg">{address}</p>
                </div>
              </div>
              
              <motion.button 
                className="w-full bg-orange-500 text-center py-3 rounded-lg text-white font-bold hover:bg-orange-600 transition-colors mb-4"
                onClick={handleContinueWithExisting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continuar con esta ubicación
              </motion.button>
              
              <motion.button 
                className="w-full bg-amber-400 text-center py-3 rounded-lg text-orange-800 font-bold border-b-4 border-orange-500 hover:bg-amber-300 transition-colors"
                onClick={handleChangeLocation}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cambiar ubicación
              </motion.button>
            </>
          ) : (
            <>
              <div className="bg-cream-100 rounded-lg p-4 mb-4 border border-amber-200">
                <input 
                  type="text" 
                  placeholder="ESCRIBE TU UBICACION AQUI" 
                  className="w-full py-3 px-4 text-center bg-transparent text-gray-800 focus:outline-none"
                  value={address}
                  onChange={handleAddressChange}
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <motion.p 
                  className="text-red-500 text-center mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}

              {showSuccess && (
                <motion.p 
                  className="text-green-600 text-center mb-4 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ¡Ubicación guardada correctamente!
                </motion.p>
              )}

              <motion.button 
                className="w-full bg-amber-400 text-center py-3 rounded-lg text-orange-800 font-bold border-b-4 border-orange-500 hover:bg-amber-300 transition-colors mb-4 flex items-center justify-center gap-2"
                onClick={detectLocation}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Detectando...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Detecta tu ubicacion aqui
                  </>
                )}
              </motion.button>

              <motion.button 
                className="w-full bg-orange-500 text-center py-3 rounded-lg text-white font-bold hover:bg-orange-600 transition-colors"
                onClick={handleSaveLocation}
                disabled={isLoading || !address.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Guardando...' : 'Guardar Ubicación'}
              </motion.button>
              
              {hasExistingLocation && (
                <motion.button 
                  className="w-full bg-gray-300 text-center py-3 rounded-lg text-gray-700 font-medium hover:bg-gray-400 transition-colors mt-4"
                  onClick={() => setIsEditingLocation(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancelar
                </motion.button>
              )}
            </>
          )}
        </motion.div>

        <motion.p 
          className="text-sm text-gray-600 text-center max-w-md mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Realizamos esto con el propósito de encontrar la ubicación exacta de tu domicilio para realizar las entregas de tus pedidos correctamente, tus datos se tratan de manera segura
        </motion.p>
      </main>
    </div>
  );
};

export default UbicationPage;