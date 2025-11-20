import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';
import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente modal draggable reutilizable
 *
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Controla si el modal está abierto
 * @param {function} props.onClose - Callback al cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {number} props.width - Ancho del modal en píxeles (default: 600)
 * @param {number} props.maxHeight - Altura máxima del modal en píxeles (default: 700)
 * @param {Object} props.defaultPosition - Posición inicial del modal {x, y}
 * @param {number} props.zIndex - Z-index del modal (default: 50)
 * @param {string} props.storageKey - Clave para persistir posición en localStorage
 * @param {boolean} props.showOverlay - Muestra overlay con blur (default: true)
 * @param {boolean} props.closeOnOverlayClick - Cierra al hacer click en overlay (default: true)
 */
export const DraggableModal = ({
  isOpen,
  onClose,
  title,
  children,
  width = 600,
  maxHeight = 700,
  defaultPosition,
  zIndex = 50,
  storageKey,
  showOverlay = true,
  closeOnOverlayClick = true
}) => {
  const [position, setPosition] = useState(() => {
    // Intentar cargar posición guardada si storageKey está definido
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`modal-position-${storageKey}`);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading modal position:', error);
      }
    }

    // Usar posición por defecto o centrar en la pantalla
    if (defaultPosition) {
      return defaultPosition;
    }

    // Calcular el ancho y alto real del modal con responsive constraints
    const modalWidth = Math.min(width, window.innerWidth - 32); // 32px = 2rem
    const modalHeight = Math.min(maxHeight, window.innerHeight - 32);

    return {
      x: Math.max(16, (window.innerWidth - modalWidth) / 2), // mínimo 16px del borde
      y: Math.max(16, (window.innerHeight - modalHeight) / 2)
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef(null);

  // Guardar posición cuando el modal se cierra o cambia de posición
  useEffect(() => {
    if (storageKey && !isOpen) {
      try {
        localStorage.setItem(`modal-position-${storageKey}`, JSON.stringify(position));
      } catch (error) {
        console.error('Error saving modal position:', error);
      }
    }
  }, [position, isOpen, storageKey]);

  // Resetear posición cuando se abre por primera vez sin posición guardada
  useEffect(() => {
    if (isOpen && !storageKey && !defaultPosition) {
      const modalWidth = Math.min(width, window.innerWidth - 32);
      const modalHeight = Math.min(maxHeight, window.innerHeight - 32);

      setPosition({
        x: Math.max(16, (window.innerWidth - modalWidth) / 2),
        y: Math.max(16, (window.innerHeight - modalHeight) / 2)
      });
    }
  }, [isOpen, width, maxHeight, storageKey, defaultPosition]);

  if (!isOpen) {
    console.log('🚫 DraggableModal: isOpen =', isOpen, '- NOT rendering. Title:', title);
    return null;
  }

  console.log('✅ DraggableModal: isOpen =', isOpen, '- RENDERING. Title:', title, 'Position:', position, 'zIndex:', zIndex);
  console.log('📍 Portal target:', document.body, 'Children count:', document.body?.children.length);

  /**
   * Maneja el cambio de posición durante el arrastre
   */
  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  /**
   * Maneja el click en el overlay
   */
  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  console.log('🚪 Creando portal con ReactDOM.createPortal...');

  return ReactDOM.createPortal(
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          style={{ zIndex }}
          onClick={handleOverlayClick}
        />
      )}

      {/* Modal Draggable */}
      <Draggable
        nodeRef={nodeRef}
        handle=".drag-handle"
        defaultPosition={position}
        onDrag={handleDrag}
        onStart={() => setIsDragging(true)}
        onStop={() => setIsDragging(false)}
      >
        <div
          ref={nodeRef}
          className="fixed bg-popover border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden max-w-[calc(100vw-2rem)]"
          style={{
            width: `min(${width}px, calc(100vw - 2rem))`,
            maxHeight: `min(${maxHeight}px, calc(100vh - 2rem))`,
            zIndex: zIndex + 10,
            cursor: isDragging ? 'grabbing' : 'auto',
            left: 0,
            top: 0
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Drag Handle */}
          <div className="drag-handle flex items-center justify-between p-4 border-b bg-muted/20 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2">
              <GripVertical size={18} className="text-muted-foreground" />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="Cerrar"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </Draggable>
    </>,
    document.body
  );
};

export default DraggableModal;
