'use client';

import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import { SiInstagram } from 'react-icons/si';
import { FaXTwitter } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';

async function registerUser(prevState: { error: any; success?: boolean }, formData: FormData) {  
  try {
    const name = formData.get('nombre') as string;
    const email = formData.get('correo') as string;
    const password = formData.get('contrasena') as string;
    
    if (!name || !email || !password) {
      return { error: 'Todos los campos son requeridos.' };
    }
    
    const response = await fetch('http://localhost:8001/user/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'Error al registrar. Por favor intenta de nuevo.' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error al registrar:', err);
    return { error: 'Error de conexión. Por favor verifica tu internet e intenta de nuevo.' };
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
        "REGISTRATE"
      )}
    </motion.button>
  );
}

const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [formState, formAction] = useFormState(registerUser, { error: null, success: undefined });
  
  if (formState.success) {
    router.push('/Login');
    return null;
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-orange-50">
      <motion.div 
        className="w-full md:w-1/3 lg:w-1/4 h-screen bg-white border-r border-gray-200 p-8 relative flex flex-col"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button 
          className="absolute top-4 right-4 text-orange-500 font-bold text-2xl"
          aria-label="Cerrar"
          whileHover={{ scale: 1.1, rotate: 90 }}
          transition={{ duration: 0.2 }}
          onClick={() => router.push('/')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#FF8C00" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="white" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="white" />
          </svg>
        </motion.button>
        
        <motion.h1 
          className="text-3xl font-bold text-orange-600 mt-4 mb-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          REGISTRATE
        </motion.h1>
        
        <motion.p 
          className="text-gray-700 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Crea una cuenta para utilizar nuestros servicios.
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
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button 
            className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 hover:border-red-400 hover:shadow-md"
            aria-label="Registrarse con Google"
            variants={itemVariants}
            whileHover={{ scale: 1.1, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
            type="button"
          >
            <FaGoogle className="text-xl text-red-500" />
          </motion.button>
          <motion.button 
            className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 hover:border-pink-400 hover:shadow-md"
            aria-label="Registrarse con Instagram"
            variants={itemVariants}
            whileHover={{ scale: 1.1, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
            type="button"
          >
            <SiInstagram className="text-xl text-pink-600" />
          </motion.button>
          <motion.button 
            className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-600 hover:shadow-md"
            aria-label="Registrarse con X"
            variants={itemVariants}
            whileHover={{ scale: 1.1, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
            type="button"
          >
            <FaXTwitter className="text-xl" />
          </motion.button>
        </motion.div>
        
        <motion.form 
          action={formAction} 
          className="flex-1 flex flex-col"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex-1">
            <motion.div className="mb-5" variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                placeholder="Ingresa tu nombre"
                className="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300 hover:shadow-md"
                style={{
                  backgroundColor: '#FFF8E1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                required
              />
            </motion.div>
            
            <motion.div className="mb-5" variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Correo o Celular
              </label>
              <input
                type="email"
                name="correo"
                placeholder="Ingresa tu correo/celular"
                className="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300 hover:shadow-md"
                style={{
                  backgroundColor: '#FFF8E1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                required
              />
            </motion.div>
            
            <motion.div className="mb-8" variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="contrasena"
                placeholder="Ingresa tu contraseña"
                className="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300 hover:shadow-md"
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
              variants={itemVariants}
            >
              <p className="text-gray-700 text-sm">
                ¿Ya tienes una cuenta? {" "}
                <motion.a 
                  href="/Login" 
                  className="text-orange-600 font-medium"
                  whileHover={{ color: "#BA4500", textDecoration: "underline" }}
                >
                  Inicia sesión
                </motion.a>
              </p>
            </motion.div>
          </div>
        </motion.form>
      </motion.div>
      
      <motion.div 
        className="hidden md:flex md:w-2/3 lg:w-3/4 bg-orange-50 items-center p-8 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div 
          className="max-w-lg pl-8 ml-4"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <motion.div 
            className="mb-12 text-left"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <motion.h2 
              className="flex items-start"
              whileHover={{ scale: 1.03 }}
            >
              <motion.span 
                className="text-6xl font-bold text-orange-800"
                animate={{ 
                  textShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 2px 4px rgba(0,0,0,0.3)", "0px 0px 0px rgba(0,0,0,0)"],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                EN
              </motion.span>
              <motion.span 
                className="text-5xl font-light text-gray-700 ml-4 pt-1"
                animate={{ 
                  color: ["#374151", "#E35604", "#374151"]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                WE EAT
              </motion.span>
            </motion.h2>
            
            <motion.p 
              className="text-orange-800 text-xl mt-8 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Te garantizamos la <span className="font-bold">mejor experiencia culinaria</span><br />
              con entregas rápidas y alimentos de la más alta calidad.
            </motion.p>
            
            <motion.div 
              className="flex items-center mt-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <span className="text-orange-800 text-xl mr-2">Con un servicio</span>
              <motion.span 
                className="text-5xl font-bold text-orange-600"
                animate={{ 
                  scale: [1, 1.1, 1],
                  textShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 4px 8px rgba(227, 86, 4, 0.4)", "0px 0px 0px rgba(0,0,0,0)"],
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                100%
              </motion.span>
              <span className="text-orange-800 text-xl ml-2">garantizado</span>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="space-y-6 text-orange-800 text-2xl font-bold mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 1.6, staggerChildren: 0.3 }}
          >
            <motion.div 
              className="flex items-center"
              variants={itemVariants}
              whileHover={{ x: 10, color: "#E35604" }}
            >
              <motion.span 
                className="text-orange-600 mr-3 text-3xl"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut"
                }}
              >
                +
              </motion.span> 
              Entregas Express en tu zona
            </motion.div>
            <motion.div 
              className="flex items-center"
              variants={itemVariants}
              whileHover={{ x: 10, color: "#E35604" }}
            >
              <motion.span 
                className="text-orange-600 mr-3 text-3xl"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                  delay: 0.3
                }}
              >
                +
              </motion.span> 
              Geolocalización en tiempo real
            </motion.div>
            <motion.div 
              className="flex items-center"
              variants={itemVariants}
              whileHover={{ x: 10, color: "#E35604" }}
            >
              <motion.span 
                className="text-orange-600 mr-3 text-3xl"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                  delay: 0.6
                }}
              >
                +
              </motion.span> 
              Pedidos personalizados y promociones
            </motion.div>
            <motion.div 
              className="flex items-center"
              variants={itemVariants}
              whileHover={{ x: 10, color: "#E35604" }}
            >
              <motion.span 
                className="text-orange-600 mr-3 text-3xl"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                  delay: 0.9
                }}
              >
                +
              </motion.span> 
              Soporte al cliente 24/7
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Bike illustration positioned to the far right */}
        <motion.div 
          className="absolute right-12 top-1/2 transform -translate-y-1/2 w-1/3"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="250" r="40" fill="#FFF8E1" opacity="0.5"/>

            <g>
              <circle cx="80" cy="230" r="40" fill="none" stroke="#333" stroke-width="6"/>
              <circle cx="300" cy="230" r="40" fill="none" stroke="#333" stroke-width="6"/>
              <circle cx="80" cy="230" r="36" fill="none" stroke="#666" stroke-width="2"/>
              <circle cx="300" cy="230" r="36" fill="none" stroke="#666" stroke-width="2"/>
              <circle cx="80" cy="230" r="5" fill="#333"/>
              <circle cx="300" cy="230" r="5" fill="#333"/>
              
              <g stroke="#888" stroke-width="2">
                <line x1="80" y1="230" x2="80" y2="190"/>
                <line x1="80" y1="230" x2="80" y2="270"/>
                <line x1="80" y1="230" x2="40" y2="230"/>
                <line x1="80" y1="230" x2="120" y2="230"/>
                <line x1="80" y1="230" x2="60" y2="210"/>
                <line x1="80" y1="230" x2="100" y2="210"/>
                <line x1="80" y1="230" x2="60" y2="250"/>
                <line x1="80" y1="230" x2="100" y2="250"/>
                <line x1="300" y1="230" x2="300" y2="190"/>
                <line x1="300" y1="230" x2="300" y2="270"/>
                <line x1="300" y1="230" x2="260" y2="230"/>
                <line x1="300" y1="230" x2="340" y2="230"/>
                <line x1="300" y1="230" x2="280" y2="210"/>
                <line x1="300" y1="230" x2="320" y2="210"/>
                <line x1="300" y1="230" x2="280" y2="250"/>
                <line x1="300" y1="230" x2="320" y2="250"/>
              </g>
              
              <path d="M80,230 L135,160 L220,160 L300,230" fill="none" stroke="#E35604" stroke-width="8" stroke-linejoin="round"/>
              <path d="M135,160 L170,230" fill="none" stroke="#E35604" stroke-width="8"/>
              <path d="M220,160 L170,230" fill="none" stroke="#E35604" stroke-width="8"/>

              <path d="M135,160 L125,130" fill="none" stroke="#333" stroke-width="6"/>
              <line x1="125" y1="130" x2="105" y2="140" stroke="#333" stroke-width="6"/>
              
              <path d="M220,160 L240,140" fill="none" stroke="#333" stroke-width="6"/>
              <ellipse cx="245" cy="140" rx="10" ry="5" fill="#333"/>
              
              <circle cx="170" cy="230" r="10" fill="#888"/>
              <line x1="170" y1="230" x2="155" y2="255" stroke="#333" stroke-width="4"/>
              <line x1="170" y1="230" x2="185" y2="205" stroke="#333" stroke-width="4"/>
              <circle cx="155" cy="255" r="5" fill="#333"/>
              <circle cx="185" cy="205" r="5" fill="#333"/>
            </g>
            
            <g>
              <rect x="235" y="110" width="70" height="60" rx="5" fill="#E35604"/>
              <rect x="235" y="100" width="70" height="10" rx="3" fill="#E35604"/>
              <rect x="240" y="115" width="60" height="50" rx="3" fill="#FFF8E1"/>
              <text x="270" y="145" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="#E35604">WE EAT</text>
              <path d="M240,150 L300,150" stroke="#E35604" stroke-width="2"/>
              <path d="M265,130 L275,130" stroke="#E35604" stroke-width="2"/>
              <path d="M250,155 L290,155" stroke="#E35604" stroke-width="1"/>
              <path d="M250,160" stroke="#E35604" stroke-width="1"/>

              <path d="M270,170 L270,140" fill="none" stroke="#333" stroke-width="4"/>
              <path d="M270,170 L220,160" fill="none" stroke="#333" stroke-width="4"/>
            </g>
            
            <ellipse cx="200" cy="270" rx="120" ry="10" fill="#E35604" opacity="0.2"/>
            
            <g stroke="#E35604" stroke-width="2" stroke-linecap="round" opacity="0.7">
              <path d="M40,220 L20,220" />
              <path d="M35,200 L15,195" />
              <path d="M50,185 L35,175" />
              
              <path d="M340,220 L360,220" />
              <path d="M345,200 L365,195" />
              <path d="M330,185 L345,175" />
            </g>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterForm;