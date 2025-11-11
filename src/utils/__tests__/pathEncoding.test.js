import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  pointToMoveTo,
  pointToLineTo,
  pointsToCubicBezier,
  pointsToQuadraticBezier,
  pointsToPath,
  rectToPath,
  circleToPath,
  parsePathCommand,
  relativeToAbsolute,
  absoluteToRelative,
  buildPathString
} from '../pathEncoding';

describe('pathEncoding', () => {
  describe('formatNumber', () => {
    it('redondea a 3 decimales por defecto', () => {
      expect(formatNumber(1.23456789)).toBe('1.235');
      expect(formatNumber(10.1)).toBe('10.1');
      expect(formatNumber(5)).toBe('5');
    });

    it('respeta la precisión especificada', () => {
      expect(formatNumber(1.23456, 2)).toBe('1.23');
      expect(formatNumber(1.23456, 4)).toBe('1.2346');
    });

    it('elimina ceros innecesarios', () => {
      expect(formatNumber(1.000)).toBe('1');
      expect(formatNumber(1.200)).toBe('1.2');
    });
  });

  describe('Comandos básicos', () => {
    it('pointToMoveTo genera comando M correcto', () => {
      expect(pointToMoveTo(10, 20)).toBe('M 10 20');
      expect(pointToMoveTo(10, 20, true)).toBe('m 10 20');
    });

    it('pointToLineTo genera comando L correcto', () => {
      expect(pointToLineTo(30, 40)).toBe('L 30 40');
      expect(pointToLineTo(30, 40, true)).toBe('l 30 40');
    });

    it('pointsToCubicBezier genera comando C correcto', () => {
      const cp1 = { x: 10, y: 20 };
      const cp2 = { x: 30, y: 40 };
      const end = { x: 50, y: 60 };

      expect(pointsToCubicBezier(cp1, cp2, end)).toBe('C 10 20, 30 40, 50 60');
      expect(pointsToCubicBezier(cp1, cp2, end, true)).toBe('c 10 20, 30 40, 50 60');
    });

    it('pointsToQuadraticBezier genera comando Q correcto', () => {
      const cp = { x: 10, y: 20 };
      const end = { x: 30, y: 40 };

      expect(pointsToQuadraticBezier(cp, end)).toBe('Q 10 20, 30 40');
      expect(pointsToQuadraticBezier(cp, end, true)).toBe('q 10 20, 30 40');
    });
  });

  describe('pointsToPath', () => {
    it('convierte array de puntos a path abierto', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 }
      ];

      const result = pointsToPath(points, false);
      expect(result).toBe('M 0 0 L 10 10 L 20 0');
    });

    it('convierte array de puntos a path cerrado', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 }
      ];

      const result = pointsToPath(points, true);
      expect(result).toBe('M 0 0 L 10 10 L 20 0 Z');
    });

    it('maneja un solo punto', () => {
      const points = [{ x: 5, y: 5 }];
      const result = pointsToPath(points, false);
      expect(result).toBe('M 5 5');
    });

    it('devuelve string vacío para array vacío', () => {
      expect(pointsToPath([], false)).toBe('');
      expect(pointsToPath(null, false)).toBe('');
    });

    it('genera comandos relativos cuando se especifica', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ];

      const result = pointsToPath(points, false, true);
      expect(result).toContain('M 0 0');
      expect(result).toContain('l 10 10');
    });
  });

  describe('Formas a paths', () => {
    it('rectToPath convierte rectángulo sin esquinas redondeadas', () => {
      const result = rectToPath(10, 20, 100, 50);
      expect(result).toContain('M 10 20');
      expect(result).toContain('H 110'); // x + width
      expect(result).toContain('V 70'); // y + height
      expect(result).toContain('Z');
    });

    it('rectToPath convierte rectángulo con esquinas redondeadas', () => {
      const result = rectToPath(10, 20, 100, 50, 5);
      expect(result).toContain('M 15 20'); // x + rx
      expect(result).toContain('A 5 5');
      expect(result).toContain('Z');
    });

    it('circleToPath convierte círculo', () => {
      const result = circleToPath(50, 50, 25);
      expect(result).toContain('M 75 50'); // cx + r
      expect(result).toContain('A 25 25');
      expect(result).toContain('Z');
    });
  });

  describe('parsePathCommand', () => {
    it('parsea comando MoveTo absoluto', () => {
      const result = parsePathCommand('M 10 20');
      expect(result).toEqual({
        type: 'M',
        coords: [10, 20],
        isRelative: false
      });
    });

    it('parsea comando LineTo relativo', () => {
      const result = parsePathCommand('l 5 10');
      expect(result).toEqual({
        type: 'l',
        coords: [5, 10],
        isRelative: true
      });
    });

    it('parsea comando con múltiples coordenadas', () => {
      const result = parsePathCommand('C 10 20, 30 40, 50 60');
      expect(result.type).toBe('C');
      expect(result.coords).toEqual([10, 20, 30, 40, 50, 60]);
      expect(result.isRelative).toBe(false);
    });

    it('parsea comando con espacios variados', () => {
      const result = parsePathCommand('M   10   20  ');
      expect(result.coords).toEqual([10, 20]);
    });

    it('ignora valores no numéricos', () => {
      const result = parsePathCommand('M 10 abc 20');
      expect(result.coords).toEqual([10, 20]);
    });
  });

  describe('relativeToAbsolute', () => {
    it('convierte MoveTo relativo a absoluto', () => {
      const command = { type: 'm', coords: [10, 20], isRelative: true };
      const currentPos = { x: 50, y: 50 };

      const result = relativeToAbsolute(command, currentPos);

      expect(result.type).toBe('M');
      expect(result.coords).toEqual([60, 70]);
      expect(result.isRelative).toBe(false);
    });

    it('convierte LineTo relativo a absoluto', () => {
      const command = { type: 'l', coords: [10, 20], isRelative: true };
      const currentPos = { x: 100, y: 100 };

      const result = relativeToAbsolute(command, currentPos);

      expect(result.coords).toEqual([110, 120]);
    });

    it('no modifica comando absoluto', () => {
      const command = { type: 'L', coords: [10, 20], isRelative: false };
      const result = relativeToAbsolute(command, { x: 50, y: 50 });

      expect(result.coords).toEqual([10, 20]);
      expect(result.isRelative).toBe(false);
    });

    it('convierte comando H horizontal relativo', () => {
      const command = { type: 'h', coords: [15], isRelative: true };
      const result = relativeToAbsolute(command, { x: 10, y: 20 });

      expect(result.type).toBe('H');
      expect(result.coords).toEqual([25]);
    });

    it('convierte comando V vertical relativo', () => {
      const command = { type: 'v', coords: [15], isRelative: true };
      const result = relativeToAbsolute(command, { x: 10, y: 20 });

      expect(result.type).toBe('V');
      expect(result.coords).toEqual([35]);
    });

    it('convierte comando C (curva cúbica) relativo', () => {
      const command = { type: 'c', coords: [5, 5, 10, 10, 15, 15], isRelative: true };
      const result = relativeToAbsolute(command, { x: 100, y: 100 });

      expect(result.type).toBe('C');
      expect(result.coords).toEqual([105, 105, 110, 110, 115, 115]);
    });
  });

  describe('absoluteToRelative', () => {
    it('convierte MoveTo absoluto a relativo', () => {
      const command = { type: 'M', coords: [60, 70], isRelative: false };
      const currentPos = { x: 50, y: 50 };

      const result = absoluteToRelative(command, currentPos);

      expect(result.type).toBe('m');
      expect(result.coords).toEqual([10, 20]);
      expect(result.isRelative).toBe(true);
    });

    it('no modifica comando relativo', () => {
      const command = { type: 'l', coords: [10, 20], isRelative: true };
      const result = absoluteToRelative(command, { x: 50, y: 50 });

      expect(result.coords).toEqual([10, 20]);
      expect(result.isRelative).toBe(true);
    });
  });

  describe('buildPathString', () => {
    it('une comandos con espacios', () => {
      const commands = ['M 0 0', 'L 10 10', 'L 20 0', 'Z'];
      expect(buildPathString(commands)).toBe('M 0 0 L 10 10 L 20 0 Z');
    });

    it('filtra comandos vacíos', () => {
      const commands = ['M 0 0', '', 'L 10 10', null, 'Z'];
      expect(buildPathString(commands)).toBe('M 0 0 L 10 10 Z');
    });

    it('maneja array vacío', () => {
      expect(buildPathString([])).toBe('');
    });
  });

  describe('Casos de uso reales', () => {
    it('genera path completo para triángulo', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 86.6 }
      ];

      const path = pointsToPath(points, true);
      expect(path).toContain('M 0 0');
      expect(path).toContain('L 100 0');
      expect(path).toContain('L 50 86.6');
      expect(path).toContain('Z');
    });

    it('genera path con curvas', () => {
      const commands = [
        pointToMoveTo(0, 0),
        pointsToCubicBezier({ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 30, y: 0 }),
        'Z'
      ];

      const path = buildPathString(commands);
      expect(path).toBe('M 0 0 C 10 10, 20 10, 30 0 Z');
    });

    it('convierte serie de comandos relativos a absolutos', () => {
      let currentPos = { x: 0, y: 0 };

      const commands = [
        { type: 'm', coords: [10, 10], isRelative: true },
        { type: 'l', coords: [20, 0], isRelative: true },
        { type: 'l', coords: [0, 20], isRelative: true }
      ];

      const absoluteCommands = commands.map(cmd => {
        const abs = relativeToAbsolute(cmd, currentPos);
        // Actualizar posición actual
        if (cmd.type.toLowerCase() === 'm' || cmd.type.toLowerCase() === 'l') {
          currentPos.x = abs.coords[abs.coords.length - 2];
          currentPos.y = abs.coords[abs.coords.length - 1];
        }
        return abs;
      });

      expect(absoluteCommands[0].coords).toEqual([10, 10]);
      expect(absoluteCommands[1].coords).toEqual([30, 10]);
      expect(absoluteCommands[2].coords).toEqual([30, 30]);
    });
  });

  describe('Precisión numérica', () => {
    it('mantiene precisión en coordenadas pequeñas', () => {
      const result = pointToMoveTo(0.001, 0.001);
      expect(result).toBe('M 0.001 0.001');
    });

    it('formatea correctamente números grandes', () => {
      const result = pointToLineTo(1234.5678, 9876.5432);
      expect(result).toBe('L 1234.568 9876.543');
    });

    it('maneja números negativos', () => {
      const result = pointToMoveTo(-10.5, -20.7);
      expect(result).toBe('M -10.5 -20.7');
    });
  });
});
