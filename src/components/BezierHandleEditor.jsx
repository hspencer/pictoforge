import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SVG } from '@svgdotjs/svg.js';
import { usePathDataProcessor } from '../hooks/usePathDataProcessor';

/**
 * BezierHandleEditor Component
 *
 * Editor visual de puntos de control Bézier usando eventos nativos del mouse.
 * Más ligero y sin dependencias externas problemáticas.
 */
export const BezierHandleEditor = ({
  pathElement,
  coordinateTransformer,
  containerRef,
  svgContainerRef,
  onPathUpdate,
  zoom = 1,
  panzoomState = { scale: 1, x: 0, y: 0 },
}) => {
  const overlayRef = useRef(null);
  const svgInstanceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const dragStateRef = useRef(null);

  const {
    segments,
    anchorPoints,
    controlPoints,
    updateControlPoint,
    updateAnchorPoint,
    toString: getUpdatedPathString,
    isReady: isPathReady,
  } = usePathDataProcessor({
    pathString: pathElement?.getAttribute('d') || '',
    autoNormalize: true,
  });

  // Refs para evitar loop infinito en keyboard handlers
  const updateControlPointRef = useRef(updateControlPoint);
  const updateAnchorPointRef = useRef(updateAnchorPoint);
  const getUpdatedPathStringRef = useRef(getUpdatedPathString);
  const pathElementRef = useRef(pathElement);

  // Actualizar refs cuando cambien las funciones
  useEffect(() => {
    updateControlPointRef.current = updateControlPoint;
    updateAnchorPointRef.current = updateAnchorPoint;
    getUpdatedPathStringRef.current = getUpdatedPathString;
    pathElementRef.current = pathElement;
  }, [updateControlPoint, updateAnchorPoint, getUpdatedPathString, pathElement]);

  useEffect(() => {
    if (!overlayRef.current || svgInstanceRef.current) return;

    try {
      // Obtener el viewBox del SVG principal
      const mainSvg = svgContainerRef.current?.querySelector('svg');
      if (mainSvg) {
        const viewBox = mainSvg.getAttribute('viewBox');
        if (viewBox) {
          overlayRef.current.setAttribute('viewBox', viewBox);
          console.log('📐 ViewBox aplicado al overlay:', viewBox);
        }
      }

      const svgInstance = SVG(overlayRef.current);
      svgInstanceRef.current = svgInstance;
      setIsReady(true);
      console.log('✅ BezierHandleEditor initialized');
    } catch (error) {
      console.error('❌ Error:', error);
    }

    return () => {
      if (svgInstanceRef.current) {
        svgInstanceRef.current.clear();
        svgInstanceRef.current = null;
      }
    };
  }, [svgContainerRef]);

  // Ahora que el overlay tiene la misma transformación que el SVG,
  // solo necesitamos las coordenadas SVG directamente (sin transformación adicional)
  const svgToScreen = useCallback(
    (svgX, svgY) => {
      // El overlay ya tiene aplicado el transform de panzoom,
      // así que simplemente devolvemos las coordenadas SVG
      return { x: svgX, y: svgY };
    },
    []
  );

  const screenToSvg = useCallback(
    (screenX, screenY) => {
      if (!coordinateTransformer?.screenToSvg) {
        return { x: screenX / zoom, y: screenY / zoom };
      }
      return coordinateTransformer.screenToSvg(screenX, screenY);
    },
    [coordinateTransformer, zoom]
  );

  const handleMouseDown = useCallback((e, handleData) => {
    e.stopPropagation();
    e.preventDefault();

    dragStateRef.current = {
      ...handleData,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
    };

    console.log(`🎯 Drag Start: ${handleData.type}`);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragStateRef.current?.isDragging) return;

      const { type, segmentIndex, circle, line, anchorScreenPos } = dragStateRef.current;

      const screenX = e.clientX;
      const screenY = e.clientY;

      if (circle) {
        circle.center(screenX, screenY);
      }
      if (line && anchorScreenPos) {
        line.plot(screenX, screenY, anchorScreenPos.x, anchorScreenPos.y);
      }

      const svgPos = screenToSvg(screenX, screenY);

      if (type === 'anchor') {
        updateAnchorPoint(segmentIndex, { x: svgPos.x, y: svgPos.y });
      } else {
        updateControlPoint(segmentIndex, type, { x: svgPos.x, y: svgPos.y });
      }

      const updatedPathString = getUpdatedPathString();
      if (pathElement && updatedPathString) {
        pathElement.setAttribute('d', updatedPathString);
      }
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current?.isDragging) return;

      console.log(`✅ Drag End: ${dragStateRef.current.type}`);

      if (dragStateRef.current.circle) {
        dragStateRef.current.circle.scale(1);
      }

      if (onPathUpdate) {
        const updatedPathString = getUpdatedPathString();
        onPathUpdate(updatedPathString);
      }

      dragStateRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    screenToSvg,
    updateControlPoint,
    updateAnchorPoint,
    getUpdatedPathString,
    pathElement,
    onPathUpdate,
  ]);

  useEffect(() => {
    if (!isReady || !isPathReady || !svgInstanceRef.current) return;

    svgInstanceRef.current.clear();

    console.log('🎨 Rendering handles:', {
      controlPoints: controlPoints.length,
      anchorPoints: anchorPoints.length,
    });

    const colors = {
      C1: '#ff6b6b',
      C2: '#4ecdc4',
      Q1: '#ffe66d',
      anchor: '#00aaff',
    };

    const svg = svgInstanceRef.current;

    controlPoints.forEach((point) => {
      const { segmentIndex, type } = point;
      const color = colors[type] || '#999';

      const screenPos = svgToScreen(point.x, point.y);
      const anchorScreenPos = svgToScreen(
        segments[segmentIndex].endPoint.x,
        segments[segmentIndex].endPoint.y
      );

      // Tamaño en unidades del viewBox (100x100)
      const circleSize = 2;
      const lineWidth = 0.3;
      const strokeWidth = 0.3;
      const dashSize = 0.5;

      const line = svg
        .line(screenPos.x, screenPos.y, anchorScreenPos.x, anchorScreenPos.y)
        .stroke({ color: color, width: lineWidth, opacity: 0.6, dasharray: `${dashSize},${dashSize}` });

      const circle = svg
        .circle(circleSize)
        .center(screenPos.x, screenPos.y)
        .fill(color)
        .stroke({ color: '#fff', width: strokeWidth })
        .css({ cursor: 'move', pointerEvents: 'all' });

      // Texto con tamaño en unidades del viewBox
      const fontSize = 2;
      const textOffset = 2.5;
      const textStrokeWidth = 0.15;

      svg
        .text(type)
        .move(screenPos.x + textOffset, screenPos.y - 2.5)
        .font({ size: fontSize, family: 'monospace', weight: 'bold' })
        .fill(color)
        .stroke({ color: '#000', width: textStrokeWidth });

      // Hacer el handle accesible con teclado
      circle.node.setAttribute('role', 'button');
      circle.node.setAttribute('tabindex', '0');
      circle.node.setAttribute('aria-label', `${type} control point for segment ${segmentIndex}`);
      circle.node.setAttribute('aria-describedby', 'bezier-handle-instructions');

      // Mouse events
      circle.node.addEventListener('mousedown', (e) => {
        circle.scale(1.4);
        handleMouseDown(e, { type, segmentIndex, circle, line, anchorScreenPos });
      });

      // Keyboard events (Arrow keys para mover handles)
      circle.node.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();

          // Obtener posición actual
          const currentPos = { x: point.x, y: point.y };
          const step = e.shiftKey ? 10 : 1;

          let newX = currentPos.x;
          let newY = currentPos.y;

          switch (e.key) {
            case 'ArrowUp':
              newY -= step;
              break;
            case 'ArrowDown':
              newY += step;
              break;
            case 'ArrowLeft':
              newX -= step;
              break;
            case 'ArrowRight':
              newX += step;
              break;
          }

          // Usar refs para evitar re-render loop
          updateControlPointRef.current(segmentIndex, type, { x: newX, y: newY });

          const updatedPathString = getUpdatedPathStringRef.current();
          if (pathElementRef.current && updatedPathString) {
            pathElementRef.current.setAttribute('d', updatedPathString);
          }

          // Feedback visual
          circle.scale(1.2);
          setTimeout(() => circle.scale(1), 100);

          console.log(`⌨️  Keyboard move ${type}: ${e.key} (step: ${step})`);
        }

        // Enter/Space para "activar" el handle (feedback visual)
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          circle.scale(1.4);
          setTimeout(() => circle.scale(1), 200);
        }
      });
    });

    anchorPoints.forEach((point) => {
      const screenPos = svgToScreen(point.x, point.y);

      // Tamaño en unidades del viewBox (100x100)
      const rectSize = 1.5;
      const rectStrokeWidth = 0.3;

      const rect = svg
        .rect(rectSize, rectSize)
        .center(screenPos.x, screenPos.y)
        .fill(colors.anchor)
        .stroke({ color: '#fff', width: rectStrokeWidth })
        .css({ cursor: 'move', pointerEvents: 'all' });

      // Hacer el anchor accesible con teclado
      rect.node.setAttribute('role', 'button');
      rect.node.setAttribute('tabindex', '0');
      rect.node.setAttribute('aria-label', `Anchor point for segment ${point.segmentIndex}`);
      rect.node.setAttribute('aria-describedby', 'bezier-handle-instructions');

      // Mouse events
      rect.node.addEventListener('mousedown', (e) => {
        rect.scale(1.4);
        handleMouseDown(e, {
          type: 'anchor',
          segmentIndex: point.segmentIndex,
          circle: rect,
          line: null,
          anchorScreenPos: null,
        });
      });

      // Keyboard events
      rect.node.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();

          const currentPos = { x: point.x, y: point.y };
          const step = e.shiftKey ? 10 : 1;

          let newX = currentPos.x;
          let newY = currentPos.y;

          switch (e.key) {
            case 'ArrowUp':
              newY -= step;
              break;
            case 'ArrowDown':
              newY += step;
              break;
            case 'ArrowLeft':
              newX -= step;
              break;
            case 'ArrowRight':
              newX += step;
              break;
          }

          // Usar refs para evitar re-render loop
          updateAnchorPointRef.current(point.segmentIndex, { x: newX, y: newY });

          const updatedPathString = getUpdatedPathStringRef.current();
          if (pathElementRef.current && updatedPathString) {
            pathElementRef.current.setAttribute('d', updatedPathString);
          }

          // Feedback visual
          rect.scale(1.2);
          setTimeout(() => rect.scale(1), 100);

          console.log(`⌨️  Keyboard move anchor: ${e.key} (step: ${step})`);
        }

        // Enter/Space para "activar"
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          rect.scale(1.4);
          setTimeout(() => rect.scale(1), 200);
        }
      });
    });
  }, [
    isReady,
    isPathReady,
    controlPoints,
    anchorPoints,
    segments,
    svgToScreen,
    handleMouseDown,
    panzoomState.scale,
    panzoomState.x,
    panzoomState.y,
  ]);

  if (!pathElement) {
    return null;
  }

  return (
    <>
      {/* Instrucciones ocultas para lectores de pantalla */}
      <div
        id="bezier-handle-instructions"
        className="sr-only"
        role="region"
        aria-label="Bezier handle editor instructions"
      >
        Use arrow keys to move control points and anchor points. Hold Shift for larger movements (10 units). Press Tab to navigate between handles. Press Enter or Space to select a handle.
      </div>

      <svg
        ref={overlayRef}
        className="bezier-handle-editor"
        role="application"
        aria-label="Bezier curve editor overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default BezierHandleEditor;
