import React from 'react';

/**
 * Componente Container - Envuelve toda la interfaz de la aplicación
 * Proporciona un contexto global y estructura para la aplicación
 */
export const Container = ({ children, className = '' }) => {
  return (
    <div
      className={`pictoforge-container h-screen w-screen overflow-hidden border-b flex flex-col relative ${className}`}
    >
      {children}
    </div>
  );
};

export default Container;
