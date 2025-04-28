"use client";

import React from 'react';
import { Pizza, Utensils, Clock, ShoppingBag, Sandwich, Coffee, ChefHat } from 'lucide-react';

interface PigzasBackgroundProps {
  iconCount?: number;
  zIndex?: number;
  className?: string;
}

export default function PigzasBackground({ 
  iconCount = 650, 
  zIndex = -1,
  className = ""
}: PigzasBackgroundProps) {
  const icons = React.useMemo(() => [
    Pizza, Utensils, Clock, ShoppingBag, Sandwich, Coffee, ChefHat
  ], []);

  const generateIcons = React.useCallback(() => {
    const iconElements = [];
    
    for (let i = 0; i < iconCount; i++) {
      const IconComponent = icons[Math.floor(Math.random() * icons.length)];
      const size = Math.floor(Math.random() * 16) + 12;
      const opacity = (Math.random() * 0.07) + 0.03;
      const rotation = Math.random() * 360;
      const top = `${Math.random() * 100}%`;
      const left = `${Math.random() * 100}%`;
      
      iconElements.push(
        <section
          key={i}
          className="absolute"
          style={{
            top,
            left,
            transform: `rotate(${rotation}deg)`,
            opacity
          }}
        >
          <IconComponent 
            size={size} 
            className="text-[var(--accent)]" 
          />
        </section>
      );
    }
    
    return iconElements;
  }, [icons, iconCount]);

  const [iconsToRender] = React.useState(() => generateIcons());

  return (
    <section 
      className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none ${className}`}
      style={{ 
        zIndex, 
        position: 'fixed'
      }}
      aria-hidden="true"
    >
      {iconsToRender}
    </section>
  );
}