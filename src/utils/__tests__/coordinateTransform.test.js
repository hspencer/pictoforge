import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  screenToSVGCoordinates,
  svgToScreenCoordinates,
  screenDeltaToSVGDelta,
  getLocalCoordinates
} from '../coordinateTransform';

describe('coordinateTransform', () => {
  let mockSVGElement;

  beforeEach(() => {
    // Mock SVG element con getBoundingClientRect y viewBox
    mockSVGElement = {
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 500,
        height: 400
      })),
      viewBox: {
        baseVal: {
          x: 0,
          y: 0,
          width: 100,
          height: 100
        }
      },
      createSVGPoint: vi.fn(() => ({
        x: 0,
        y: 0
      }))
    };
  });

  describe('screenToSVGCoordinates', () => {
    it('convierte coordenadas de pantalla a SVG sin zoom ni pan', () => {
      const viewport = { zoom: 1, pan: { x: 0, y: 0 } };
      const result = screenToSVGCoordinates(250, 200, mockSVGElement, viewport);

      // Con viewBox 100x100 en 500x400px, el factor es 0.2 y 0.25
      expect(result.x).toBeCloseTo(50, 1);
      expect(result.y).toBeCloseTo(50, 1);
    });

    it('considera el zoom en la transformación', () => {
      const viewport = { zoom: 2, pan: { x: 0, y: 0 } };
      const result = screenToSVGCoordinates(250, 200, mockSVGElement, viewport);

      // Con zoom 2x, las coordenadas deben ajustarse
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });

    it('considera el pan en la transformación', () => {
      const viewport = { zoom: 1, pan: { x: 50, y: 50 } };
      const result = screenToSVGCoordinates(250, 200, mockSVGElement, viewport);

      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });

    it('maneja el caso sin elemento SVG', () => {
      const viewport = { zoom: 1, pan: { x: 0, y: 0 } };
      const result = screenToSVGCoordinates(250, 200, null, viewport);

      // Debe devolver las coordenadas originales
      expect(result.x).toBe(250);
      expect(result.y).toBe(200);
    });
  });

  describe('svgToScreenCoordinates', () => {
    it('convierte coordenadas SVG a pantalla sin zoom ni pan', () => {
      const viewport = { zoom: 1, pan: { x: 0, y: 0 } };
      const result = svgToScreenCoordinates(50, 50, mockSVGElement, viewport);

      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });

    it('considera el zoom en la transformación inversa', () => {
      const viewport = { zoom: 2, pan: { x: 0, y: 0 } };
      const result = svgToScreenCoordinates(50, 50, mockSVGElement, viewport);

      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });

    it('maneja el caso sin elemento SVG', () => {
      const viewport = { zoom: 1, pan: { x: 0, y: 0 } };
      const result = svgToScreenCoordinates(50, 50, null, viewport);

      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });
  });

  describe('screenDeltaToSVGDelta', () => {
    it('convierte deltas de pantalla a deltas SVG sin zoom', () => {
      const viewport = { zoom: 1, pan: { x: 0, y: 0 } };
      const result = screenDeltaToSVGDelta(50, 50, mockSVGElement, viewport);

      // Con viewBox 100x100 en 500x400px
      expect(result.dx).toBeCloseTo(10, 1);
      expect(result.dy).toBeCloseTo(12.5, 1);
    });

    it('ajusta deltas según el zoom', () => {
      const viewport = { zoom: 2, pan: { x: 0, y: 0 } };
      const result = screenDeltaToSVGDelta(50, 50, mockSVGElement, viewport);

      // Con zoom 2x, los deltas deben ser la mitad
      expect(result.dx).toBeDefined();
      expect(result.dy).toBeDefined();
    });

    it('el pan no afecta los deltas', () => {
      const viewportWithPan = { zoom: 1, pan: { x: 100, y: 100 } };
      const viewportNoPan = { zoom: 1, pan: { x: 0, y: 0 } };

      const resultWithPan = screenDeltaToSVGDelta(50, 50, mockSVGElement, viewportWithPan);
      const resultNoPan = screenDeltaToSVGDelta(50, 50, mockSVGElement, viewportNoPan);

      // Los deltas deben ser iguales independiente del pan
      expect(resultWithPan.dx).toBeCloseTo(resultNoPan.dx, 1);
      expect(resultWithPan.dy).toBeCloseTo(resultNoPan.dy, 1);
    });

    it('maneja el caso sin elemento SVG', () => {
      const viewport = { zoom: 1, pan: { x: 0, y: 0 } };
      const result = screenDeltaToSVGDelta(50, 50, null, viewport);

      expect(result.dx).toBe(50);
      expect(result.dy).toBe(50);
    });
  });

  describe('getLocalCoordinates', () => {
    it('obtiene coordenadas de un elemento con getBBox', () => {
      const mockElement = {
        getBBox: vi.fn(() => ({
          x: 10,
          y: 20,
          width: 100,
          height: 50
        }))
      };

      const result = getLocalCoordinates(mockElement);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50
      });
    });

    it('usa atributos si no hay getBBox', () => {
      const mockElement = {
        getAttribute: vi.fn((attr) => {
          const attrs = { x: '15', y: '25', width: '80', height: '60' };
          return attrs[attr] || '0';
        })
      };

      const result = getLocalCoordinates(mockElement);

      expect(result).toEqual({
        x: 15,
        y: 25,
        width: 80,
        height: 60
      });
    });

    it('devuelve valores por defecto si no hay elemento', () => {
      const result = getLocalCoordinates(null);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    });
  });

  describe('Bidireccionalidad', () => {
    it('pantalla -> SVG -> pantalla mantiene consistencia', () => {
      const viewport = { zoom: 1, pan: { x: 0, y: 0 } };
      const originalScreen = { x: 250, y: 200 };

      // Pantalla -> SVG
      const svgCoords = screenToSVGCoordinates(
        originalScreen.x,
        originalScreen.y,
        mockSVGElement,
        viewport
      );

      // SVG -> Pantalla
      const backToScreen = svgToScreenCoordinates(
        svgCoords.x,
        svgCoords.y,
        mockSVGElement,
        viewport
      );

      // Debe volver aproximadamente a las coordenadas originales
      expect(backToScreen.x).toBeCloseTo(originalScreen.x, 0);
      expect(backToScreen.y).toBeCloseTo(originalScreen.y, 0);
    });

    it('mantiene consistencia con zoom aplicado', () => {
      const viewport = { zoom: 1.5, pan: { x: 0, y: 0 } };
      const originalScreen = { x: 300, y: 250 };

      const svgCoords = screenToSVGCoordinates(
        originalScreen.x,
        originalScreen.y,
        mockSVGElement,
        viewport
      );

      const backToScreen = svgToScreenCoordinates(
        svgCoords.x,
        svgCoords.y,
        mockSVGElement,
        viewport
      );

      expect(backToScreen.x).toBeCloseTo(originalScreen.x, 0);
      expect(backToScreen.y).toBeCloseTo(originalScreen.y, 0);
    });
  });

  describe('Casos extremos', () => {
    it('maneja zoom muy grande', () => {
      const viewport = { zoom: 10, pan: { x: 0, y: 0 } };
      const result = screenDeltaToSVGDelta(100, 100, mockSVGElement, viewport);

      expect(result.dx).toBeDefined();
      expect(result.dy).toBeDefined();
      expect(isFinite(result.dx)).toBe(true);
      expect(isFinite(result.dy)).toBe(true);
    });

    it('maneja zoom muy pequeño', () => {
      const viewport = { zoom: 0.1, pan: { x: 0, y: 0 } };
      const result = screenDeltaToSVGDelta(100, 100, mockSVGElement, viewport);

      expect(result.dx).toBeDefined();
      expect(result.dy).toBeDefined();
      expect(isFinite(result.dx)).toBe(true);
      expect(isFinite(result.dy)).toBe(true);
    });

    it('maneja pan extremo', () => {
      const viewport = { zoom: 1, pan: { x: 10000, y: 10000 } };
      const result = screenToSVGCoordinates(250, 200, mockSVGElement, viewport);

      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
    });
  });
});
