"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Catalog from "./Catalog/Catalog";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking for token in localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setIsLoggedIn(true);
    } else {
      // Redirect to login if not authenticated
      router.push('/Login');
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-orange-600 text-lg">Cargando...</div>
      </div>
    );
  }

  // Only render if user is logged in (otherwise they would have been redirected)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen font-['Poppins']">
      <Header />
      <main className="flex-grow bg-gray-50">
        <Catalog />
      </main>
    </div>
  );
}