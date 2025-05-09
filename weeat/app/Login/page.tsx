"use client"

import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import { SiInstagram } from 'react-icons/si';
import { FaXTwitter } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';

interface LoginState {
  error: string | null;
  success: boolean;
  token: string | null;
  userData: { id: string | number; name: string; email: string } | null; 
}

// Function to decode JWT token
function parseJwt(token: string) {
  try {
    // Split the token into its three parts (header, payload, signature)
    const base64Url = token.split('.')[1];
    // Replace characters that are not valid for base64 URL encoding
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Decode the base64 string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    // Parse the JSON string
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
  }
}

async function loginUser(prevState: LoginState, formData: FormData) {
  try {
    const email = formData.get('correo') as string;
    const password = formData.get('contrasena') as string;
    
    if (!email || !password) {
      return { 
        error: 'Todos los campos son requeridos.',
        success: false,
        token: null,
        userData: null
      };
    }
    
    const response = await fetch('http://localhost:8001/user/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        error: errorData.message || 'Credenciales inválidas. Por favor intenta de nuevo.',
        success: false,
        token: null,
        userData: null
      };
    }
    
    const data = await response.json();
    
    // Ensure we have the userData structure
    const userData = data.user || data.userData || data;
    
    // Return both token and user data
    return { 
      success: true, 
      token: data.token,
      userData: userData,
      error: null
    };
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    return { 
      error: 'Error de conexión. Por favor verifica tu internet e intenta de nuevo.',
      success: false,
      token: null,
      userData: null
    };
  }
}

function FormSubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <motion.button
      type="submit"
      className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-md text-center mb-6"
      style={{ backgroundColor: '#E35604' }}
      whileHover={{ scale: 1.03, boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.15)" }}
      whileTap={{ scale: 0.98 }}
      disabled={pending}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      {pending ? (
        <span className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          PROCESANDO...
        </span>
      ) : (
        "INICIA SESION"
      )}
    </motion.button>
  );
}

const LoginForm: React.FC = () => {
  const router = useRouter();
  const [formState, formAction] = useFormState(loginUser, { 
    error: null, 
    success: false, 
    token: null,
    userData: null 
  });
  
  React.useEffect(() => {
    if (formState.success && formState.token && formState.userData) {
      // Save token to localStorage
      localStorage.setItem('token', formState.token);
      
      // Extract and save token payload information
      const tokenPayload = parseJwt(formState.token);
      if (tokenPayload) {
        localStorage.setItem('tokenPayload', JSON.stringify(tokenPayload));
        
        // If the ID is in the token payload but not in userData, use it
        if (tokenPayload.id && !formState.userData.id) {
          localStorage.setItem('userId', String(tokenPayload.id));
        }
      }
      
      // Save user ID specifically for the header component
      if (formState.userData.id) {
        localStorage.setItem('userId', String(formState.userData.id));
      }
      
      // Save complete user data as JSON string
      localStorage.setItem('userData', JSON.stringify(formState.userData));
      
      // Create a session data object that combines all important information
      const sessionData = {
        token: formState.token,
        userData: formState.userData,
        tokenPayload: tokenPayload || {},
        lastLogin: new Date().toISOString()
      };
      
      // Store the complete session data
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
      
      console.log('Login successful! Stored data:', {
        token: formState.token,
        userId: formState.userData.id || (tokenPayload?.id || 'No ID found'),
        userData: formState.userData,
        tokenPayload: tokenPayload
      });
      
      router.push('/Ubication');
    }
  }, [formState.success, formState.token, formState.userData, router]);

  return (
    <div className="flex w-full min-h-screen bg-orange-50">
      <motion.div 
        className="w-full md:w-1/3 lg:w-1/4 h-screen bg-white border-r border-gray-200 p-8 flex flex-col"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-orange-600 mb-5"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          INICIA SESION
        </motion.h1>
        
        <motion.p 
          className="text-gray-700 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Inicia sesión en tu cuenta para utilizar nuestros servicios.
        </motion.p>
        
        {formState.error && (
          <motion.div 
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {formState.error}
          </motion.div>
        )}
        
        <motion.div 
          className="flex gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.button 
            className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100"
            aria-label="Iniciar sesión con Google"
            whileHover={{ scale: 1.1, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
            type="button"
          >
            <FaGoogle className="text-xl text-red-500" />
          </motion.button>
          <motion.button 
            className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100"
            aria-label="Iniciar sesión con Instagram"
            whileHover={{ scale: 1.1, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
            type="button"
          >
            <SiInstagram className="text-xl text-pink-600" />
          </motion.button>
          <motion.button 
            className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100"
            aria-label="Iniciar sesión con X"
            whileHover={{ scale: 1.1, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
            type="button"
          >
            <FaXTwitter className="text-xl" />
          </motion.button>
        </motion.div>
        
        <motion.form 
          action={formAction}
          className="flex-1 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex-1">
            <motion.div 
              className="mb-5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Correo o Celular
              </label>
              <input
                type="text"
                name="correo"
                placeholder="Ingresa tu correo/celular"
                className="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                style={{
                  backgroundColor: '#FFF8E1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                required
              />
            </motion.div>
            
            <motion.div 
              className="mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="contrasena"
                placeholder="Ingresa tu contraseña"
                className="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                style={{
                  backgroundColor: '#FFF8E1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                required
              />
            </motion.div>
          </div>
          
          <div>
            <FormSubmitButton />
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-gray-700 text-sm">
                ¿No tienes una cuenta? {" "}
                <Link href="/Register" className="text-orange-600 font-medium hover:underline">
                  Regístrate
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.form>
      </motion.div>
      
      <motion.div 
        className="hidden md:flex md:w-2/3 lg:w-3/4 bg-orange-50 items-center justify-center p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div 
          className="max-w-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <motion.div className="mb-12 text-center">
            <motion.h2 
              className="text-5xl font-light text-gray-700 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className="font-bold text-orange-800">WE EAT</span>
            </motion.h2>
            
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <h3 className="text-3xl font-bold text-orange-600">
                Nunca te defraudará
              </h3>
              <p className="text-2xl text-orange-800">
                prueba los <span className="text-gray-400 font-bold">NUEVOS</span> <span className="text-orange-600">catálogos</span>
              </p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="flex flex-col items-center justify-center mt-16"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div 
              className="w-24 h-6 rounded-full bg-gray-200 mb-8 opacity-50"
              animate={{ 
                width: ["6rem", "6.5rem", "6rem"],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <motion.div 
              className="w-40 h-40 bg-amber-600 rounded-lg relative"
              whileHover={{ y: -5 }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-8 border-t-4 border-l-4 border-r-4 border-gray-500 rounded-t-full" />
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-white font-bold">WE EAT</p>
                <div className="w-12 h-3 bg-gray-300 mt-2 mx-auto" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginForm;