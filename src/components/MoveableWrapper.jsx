import React, { useRef, useEffect, useState } from 'react';
import Moveable from 'react-moveable';

/**
 * MoveableWrapper Component
 *
 * Componente que envuelve elementos SVG con react-moveable para proporcionar
 * capacidades de transformación visual: arrastrar, escalar, rotar.
 *
 * Características:
 * - Draggable: Arrastrar elementos
 * - Resizable: Redimensionar con handles
 * - Rotatable: Rotar elementos
 * - Snappable: Snap a grid, guías y otros elementos
 * - Groupable: Selección múltiple (futuro)
 */
export const MoveableWrapper = ({
  target,
  container,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onRotateStart,
  onRotate,
  onRotateEnd,
  bounds,
  snapThreshold = 5,
  snapGap = 10,
  isDisplayObjectSnapBound = true,
  isDisplaySnapDigit = true,
  snapDigit = 0,
  draggable = true,
  resizable = true,
  rotatable = true,
  snappable = true,
  keepRatio = false,
  throttleDrag = 0,
  throttleResize = 0,
  throttleRotate = 0,
  renderDirections = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
  edge = false,
  zoom = 1,
  origin = true,
  padding = { left: 0, top: 0, right: 0, bottom: 0 },
}) => {
  const moveableRef = useRef(null);
  const [guidelines, setGuidelines] = useState([]);

  /**
   * Genera guías horizontales y verticales para snapping
   */
  useEffect(() => {
    if (!container || !snappable) return;

    const containerRect = container.getBoundingClientRect();
    const horizontalGuidelines = [];
    const verticalGuidelines = [];

    // Guías en el centro del contenedor
    horizontalGuidelines.push(containerRect.height / 2);
    verticalGuidelines.push(containerRect.width / 2);

    // Guías en los bordes del contenedor
    horizontalGuidelines.push(0, containerRect.height);
    verticalGuidelines.push(0, containerRect.width);

    // Grid guides cada 50px (opcional)
    if (snapGap > 0) {
      for (let i = snapGap; i < containerRect.width; i += snapGap) {
        verticalGuidelines.push(i);
      }
      for (let i = snapGap; i < containerRect.height; i += snapGap) {
        horizontalGuidelines.push(i);
      }
    }

    setGuidelines({
      horizontal: horizontalGuidelines,
      vertical: verticalGuidelines,
    });
  }, [container, snappable, snapGap]);

  /**
   * Encuentra elementos hermanos para snapping
   */
  const getElementGuidelines = () => {
    if (!container || !target) return [];

    const elements = [];
    const containerChildren = Array.from(container.querySelectorAll('*'));

    containerChildren.forEach((el) => {
      // Skip el elemento actual y sus padres/hijos
      if (el === target || el.contains(target) || target.contains(el)) {
        return;
      }

      // Solo elementos visibles con dimensiones
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        elements.push(el);
      }
    });

    return elements;
  };

  if (!target) {
    return null;
  }

  return (
    <Moveable
      ref={moveableRef}
      target={target}
      container={container}
      // Draggable
      draggable={draggable}
      throttleDrag={throttleDrag}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      // Resizable
      resizable={resizable}
      keepRatio={keepRatio}
      throttleResize={throttleResize}
      renderDirections={renderDirections}
      edge={edge}
      onResizeStart={onResizeStart}
      onResize={onResize}
      onResizeEnd={onResizeEnd}
      // Rotatable
      rotatable={rotatable}
      throttleRotate={throttleRotate}
      onRotateStart={onRotateStart}
      onRotate={onRotate}
      onRotateEnd={onRotateEnd}
      // Snappable
      snappable={snappable}
      snapThreshold={snapThreshold}
      isDisplaySnapDigit={isDisplaySnapDigit}
      isDisplayInnerSnapDigit={isDisplaySnapDigit}
      isDisplayObjectSnapBound={isDisplayObjectSnapBound}
      snapDigit={snapDigit}
      snapGap={snapGap}
      horizontalGuidelines={guidelines.horizontal}
      verticalGuidelines={guidelines.vertical}
      elementGuidelines={snappable ? getElementGuidelines() : []}
      // Configuración visual
      origin={origin}
      zoom={zoom}
      padding={padding}
      bounds={bounds}
      // Estilos personalizados
      className="moveable-control-box"
    />
  );
};

export default MoveableWrapper;
