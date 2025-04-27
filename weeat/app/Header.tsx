"use client";

import { useState, useEffect, useRef } from 'react';
import { Package, ShoppingCart, Menu, User, Pencil, X, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  const sideMenuRef = useRef<HTMLDivElement | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    celular: ""
  });

  const [isEditing, setIsEditing] = useState({
    nombre: false,
    correo: false,
    celular: false
  });

  const [loading, setLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  interface Notification {
    type: 'success' | 'error';
    message: string;
  }

  const [notification, setNotification] = useState<Notification | null>(null);
  
  interface UserData {
    name: string;
    email: string;
    phone: string;
    id: number;
    [key: string]: string | number;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Run data fetch when component mounts
  useEffect(() => {
    fetchUserData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchUserData = async () => {
    setFetchAttempted(true);
    setIsDataLoading(true);
    setApiError(null);
    
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      // Check for authentication data
      if (!token || !userId) {
        console.error('Missing authentication data:', { token: !!token, userId: !!userId });
        throw new Error('No se encontró información de autenticación');
      }

      console.log(`Attempting to fetch user data for ID: ${userId}`);
      
      // First try the API endpoint
      try {
        const apiUrl = `http://localhost:8001/user/get/${userId}`;
        console.log(`Fetching from API: ${apiUrl}`);
        
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000 // 5 second timeout
        });

        console.log('API Response received:', response.status);

        if (response.data) {
          const user = response.data;
          setUserData(user);
          
          // Save fresh data to localStorage
          localStorage.setItem('userData', JSON.stringify(user));
          
          setFormData({
            nombre: user.name || "",
            correo: user.email || "",
            celular: user.phone || ""
          });
          
          console.log('User data successfully loaded from API');
          return; // Exit if API call succeeded
        } else {
          throw new Error('No se recibieron datos del servidor');
        }
      } catch (apiError) {
        // Log the API error but don't give up yet
        if (axios.isAxiosError(apiError)) {
          console.error('API fetch failed:', apiError.message);
          setApiError(`Error ${apiError.response?.status || 'de conexión'}: ${apiError.message}`);
        } else {
          console.error('API fetch error:', apiError);
          setApiError('Error al conectar con el servidor');
        }
        
        // Continue to localStorage fallback
        console.log('Falling back to localStorage...');
      }
      
      // Try to get user data from localStorage as fallback
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          
          setFormData({
            nombre: parsedUserData.name || "",
            correo: parsedUserData.email || "",
            celular: parsedUserData.phone || ""
          });
          
          console.log('User data loaded from localStorage successfully');
          showNotification('success', 'Datos cargados desde caché local');
          return;
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          throw new Error('Datos en caché inválidos');
        }
      } else {
        throw new Error('No se encontraron datos guardados');
      }
      
    } catch (error) {
      console.error('User data fetch failed completely:', error);
      setUserData(null);
      
      if (error instanceof Error) {
        showNotification('error', `Error: ${error.message}`);
      } else {
        showNotification('error', 'Error desconocido al cargar datos');
      }
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleEditing = (field: keyof typeof isEditing) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    
    // Reset field to original value if canceling edit
    if (isEditing[field] && userData) {
      setFormData(prev => ({
        ...prev,
        nombre: userData.name || "",
        correo: userData.email || "",
        celular: userData.phone || ""
      }));
    }
  };

  const saveChanges = async (field: 'nombre' | 'correo' | 'celular') => {
    if (!userData) {
      showNotification('error', 'No hay datos de usuario para actualizar');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = userData.id || localStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error('Se requiere autenticación');
      }

      const payload: { name?: string; email?: string; phone?: string } = {};
      
      switch(field) {
        case 'nombre':
          payload.name = formData.nombre;
          break;
        case 'correo':
          payload.email = formData.correo;
          break;
        case 'celular':
          payload.phone = formData.celular;
          break;
        default:
          throw new Error('Campo no válido');
      }

      console.log(`Updating ${field} with:`, payload);

      const apiUrl = `http://localhost:8001/user/edit/${userId}`;
      console.log(`Sending update to: ${apiUrl}`);
      
      const response = await axios.put(
        apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Update response:', response);

      if (response.data) {
        console.log('Update successful:', response.data);
        
        // Update both state and localStorage with new data
        const updatedUserData = {
          ...userData,
          ...payload
        };
        
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Update form data to match the new values
        setFormData(prev => ({
          ...prev,
          ...Object.entries(payload).reduce((acc, [key, value]) => {
            if (key === 'name') acc.nombre = value;
            if (key === 'email') acc.correo = value;
            if (key === 'phone') acc.celular = value;
            return acc;
          }, {} as typeof prev)
        }));
      }

      toggleEditing(field);
      showNotification('success', 'Datos actualizados con éxito');

    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      
      if (axios.isAxiosError(error)) {
        showNotification('error', 
          `Error: ${error.response?.status || ''} ${error.message}`
        );
      } else {
        showNotification('error', 'Error al actualizar los datos');
      }
    } finally {
      setLoading(false);
    }
  };

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
    
    // Redirect to login page
    router.push('/Login');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && event.target instanceof Node && !profileDropdownRef.current.contains(event.target) &&
          event.target instanceof Element && !event.target.closest('button[data-profile-toggle]')) {
        setProfileDropdownOpen(false);
      }
      
      if (sideMenuRef.current && event.target instanceof Node && !sideMenuRef.current.contains(event.target) &&
          event.target instanceof Element && !event.target.closest('button[data-menu-toggle]')) {
        setSideMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Display debugging info in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state:', {
        token: !!localStorage.getItem('token'),
        userId: localStorage.getItem('userId'),
        hasUserData: !!userData,
        fetchAttempted,
        apiError
      });
    }
  }, [userData, fetchAttempted, apiError]);

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
            <button className="text-white hover:text-orange-200 transition-colors duration-300">
              <ShoppingCart size={24} />
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
              {!userData && fetchAttempted && !isDataLoading && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </header>

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
                  <a href="#" className="block py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200">PERFIL</a>
                </li>
                <li>
                  <a href="#" className="block py-3 px-4 text-lg hover:bg-orange-100 rounded-md transition-colors duration-200">BILLETERA</a>
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

        <div 
          ref={profileDropdownRef}
          className={`fixed top-16 right-0 bg-white rounded-lg shadow-md z-30 w-80 border border-gray-200 transition-all duration-300 origin-top-right ${
            profileDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="p-6 flex flex-col items-center">
            {isDataLoading ? (
              <div className="w-full text-center mb-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              </div>
            ) : userData ? (
              <div className="w-full text-center mb-4">
                <h2 className="text-2xl font-bold text-orange-700">
                  ¡Hola, {userData.name || 'Usuario'}!
                </h2>
                <p className="text-gray-600 text-sm">Gestiona tu información personal</p>
              </div>
            ) : fetchAttempted ? (
              <div className="w-full text-center mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                <p>No se pudo cargar la información del usuario</p>
                {apiError && <p className="text-xs mt-1">{apiError}</p>}
                <button 
                  onClick={fetchUserData} 
                  className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  Intentar nuevamente
                </button>
              </div>
            ) : (
              <div className="w-full text-center mb-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <div className="w-24 h-24 rounded-full border border-gray-300 flex items-center justify-center hover:border-orange-400 transition-colors duration-200">
                <Pencil size={32} stroke="#000000" />
              </div>
            </div>

            {notification && (
              <div className={`w-full mb-4 p-3 rounded-md flex items-center ${
                notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {notification.type === 'success' ? 
                  <CheckCircle size={20} className="mr-2" /> : 
                  <AlertCircle size={20} className="mr-2" />
                }
                <span>{notification.message}</span>
              </div>
            )}

            <div className="w-full mb-5">
              <label className="block text-orange-700 font-bold text-xl mb-2">Nombre</label>
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre de usuario"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-md bg-orange-50 border ${
                    isEditing.nombre ? 'border-orange-500' : 'border-orange-200'
                  } placeholder-orange-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200 ${
                    isEditing.nombre ? '' : 'cursor-not-allowed'
                  }`}
                  disabled={!isEditing.nombre || isDataLoading}
                />
                {isEditing.nombre ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <button 
                      type="button" 
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      onClick={() => toggleEditing('nombre')}
                      disabled={loading}
                    >
                      <X size={18} />
                    </button>
                    <button 
                      type="button" 
                      className="text-green-500 hover:text-green-700 transition-colors duration-200"
                      onClick={() => saveChanges('nombre')}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500"></div>
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-orange-500 transition-colors duration-200"
                    onClick={() => toggleEditing('nombre')}
                    disabled={isDataLoading}
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>
              {userData && !isEditing.nombre && (
                <p className="mt-1 text-sm text-gray-500">
                  Actual: {userData.name || 'No establecido'}
                </p>
              )}
            </div>

            <div className="w-full mb-5">
              <label className="block text-orange-700 font-bold text-xl mb-2">Correo</label>
              <div className="relative">
                <input
                  type="email"
                  name="correo"
                  placeholder="Correo del usuario"
                  value={formData.correo}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-md bg-orange-50 border ${
                    isEditing.correo ? 'border-orange-500' : 'border-orange-200'
                  } placeholder-orange-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200 ${
                    isEditing.correo ? '' : 'cursor-not-allowed'
                  }`}
                  disabled={!isEditing.correo || isDataLoading}
                />
                {isEditing.correo ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <button 
                      type="button" 
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      onClick={() => toggleEditing('correo')}
                      disabled={loading}
                    >
                      <X size={18} />
                    </button>
                    <button 
                      type="button" 
                      className="text-green-500 hover:text-green-700 transition-colors duration-200"
                      onClick={() => saveChanges('correo')}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500"></div>
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-orange-500 transition-colors duration-200"
                    onClick={() => toggleEditing('correo')}
                    disabled={isDataLoading}
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>
              {userData && !isEditing.correo && (
                <p className="mt-1 text-sm text-gray-500">
                  Actual: {userData.email || 'No establecido'}
                </p>
              )}
            </div>

            <div className="w-full mb-8">
              <label className="block text-orange-700 font-bold text-xl mb-2">Celular</label>
              <div className="relative">
                <input
                  type="tel"
                  name="celular"
                  placeholder="Celular del usuario"
                  value={formData.celular}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-md bg-orange-50 border ${
                    isEditing.celular ? 'border-orange-500' : 'border-orange-200'
                  } placeholder-orange-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200 ${
                    isEditing.celular ? '' : 'cursor-not-allowed'
                  }`}
                  disabled={!isEditing.celular || isDataLoading}
                />
                {isEditing.celular ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <button 
                      type="button" 
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      onClick={() => toggleEditing('celular')}
                      disabled={loading}
                    >
                      <X size={18} />
                    </button>
                    <button 
                      type="button" 
                      className="text-green-500 hover:text-green-700 transition-colors duration-200"
                      onClick={() => saveChanges('celular')}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500"></div>
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-orange-500 transition-colors duration-200"
                    onClick={() => toggleEditing('celular')}
                    disabled={isDataLoading}
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>
              {userData && !isEditing.celular && (
                <p className="mt-1 text-sm text-gray-500">
                  Actual: {userData.phone || 'No establecido'}
                </p>
              )}
            </div>

            <div className="flex justify-center space-x-8 mb-8">
              <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-500 transition-all duration-200 hover:shadow-md cursor-pointer">
                <div className="text-2xl font-bold flex items-center justify-center" style={{color: "#4285F4"}}>G</div>
              </div>
              <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-pink-500 transition-all duration-200 hover:shadow-md cursor-pointer">
                <div className="text-2xl font-bold flex items-center justify-center" style={{color: "#E1306C"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <circle cx="12" cy="12" r="4"></circle>
                    <circle cx="17.5" cy="6.5" r="1.5"></circle>
                  </svg>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-black transition-all duration-200 hover:shadow-md cursor-pointer">
                <div className="text-2xl font-bold flex items-center justify-center">X</div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button 
                type="button"
                onClick={handleLogout}
                className="w-full px-8 py-3 bg-orange-500 text-white font-bold rounded-md text-lg hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                CERRAR SESIÓN
              </button>
              
              <button 
                type="button"
                disabled
                className="px-8 py-3 border-2 border-orange-500 text-orange-700 font-bold rounded-md text-lg opacity-70 hover:opacity-100 transition-opacity duration-200"
              >
                ELIMINAR CUENTA
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}