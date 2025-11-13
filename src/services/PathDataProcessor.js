import { SVGPathData, encodeSVGPath } from 'svg-pathdata';

/**
 * PathDataProcessor Service
 *
 * Servicio centralizado para manipulación de paths SVG usando svg-pathdata.
 * Proporciona acceso directo a puntos de control Bézier (C1, C2, Q1) y puntos
 * de anclaje, permitiendo edición precisa de curvas.
 *
 * Características:
 * - Parser de cadena 'd' a AST (Abstract Syntax Tree)
 * - Normalización a comandos absolutos
 * - Acceso directo a puntos de control y anclaje
 * - Modificación de segmentos Bézier
 * - Regeneración de comandos Path
 * - Utilidades geométricas (inversión, cálculos)
 */

export class PathDataProcessor {
  /**
   * @param {string} pathString - Cadena 'd' del path SVG
   */
  constructor(pathString = '') {
    this.originalPathString = pathString;
    this.pathData = null;
    this.commands = [];
    this.isNormalized = false;

    if (pathString) {
      this.parse(pathString);
    }
  }

  /**
   * Parsea una cadena 'd' de path SVG a AST
   * @param {string} pathString - Cadena 'd' del path
   * @returns {PathDataProcessor} this para chaining
   */
  parse(pathString) {
    try {
      this.originalPathString = pathString;
      this.pathData = new SVGPathData(pathString);
      this.commands = this.pathData.commands;
      this.isNormalized = false;
      return this;
    } catch (error) {
      console.error('Error parseando path:', error);
      this.commands = [];
      return this;
    }
  }

  /**
   * Normaliza todos los comandos a absolutos (Mayúsculas)
   * Convierte comandos relativos (minúsculas) a absolutos
   * @returns {PathDataProcessor} this para chaining
   */
  normalize() {
    if (!this.pathData) {
      console.warn('PathDataProcessor: No hay path data para normalizar');
      return this;
    }

    try {
      // SVGPathData proporciona normalización automática
      this.pathData = this.pathData.toAbs();
      this.commands = this.pathData.commands;
      this.isNormalized = true;
      return this;
    } catch (error) {
      console.error('Error normalizando path:', error);
      return this;
    }
  }

  /**
   * Obtiene todos los segmentos del path con información detallada
   * @returns {Array<Object>} Array de segmentos con puntos de control
   */
  getSegments() {
    if (!this.commands.length) {
      return [];
    }

    const segments = [];
    let currentPoint = { x: 0, y: 0 };
    let startPoint = { x: 0, y: 0 };

    this.commands.forEach((cmd, index) => {
      const segment = {
        index,
        type: cmd.type,
        command: this.getCommandName(cmd.type),
        points: [],
        controlPoints: [],
        startPoint: { ...currentPoint },
      };

      switch (cmd.type) {
        case SVGPathData.MOVE_TO:
          currentPoint = { x: cmd.x, y: cmd.y };
          startPoint = { ...currentPoint };
          segment.points.push({ x: cmd.x, y: cmd.y, type: 'anchor' });
          break;

        case SVGPathData.LINE_TO:
          segment.points.push({ x: cmd.x, y: cmd.y, type: 'anchor' });
          currentPoint = { x: cmd.x, y: cmd.y };
          break;

        case SVGPathData.HORIZ_LINE_TO:
          segment.points.push({ x: cmd.x, y: currentPoint.y, type: 'anchor' });
          currentPoint.x = cmd.x;
          break;

        case SVGPathData.VERT_LINE_TO:
          segment.points.push({ x: currentPoint.x, y: cmd.y, type: 'anchor' });
          currentPoint.y = cmd.y;
          break;

        case SVGPathData.CURVE_TO: // Cubic Bézier
          segment.controlPoints.push(
            { x: cmd.x1, y: cmd.y1, type: 'C1', label: 'Control 1' },
            { x: cmd.x2, y: cmd.y2, type: 'C2', label: 'Control 2' }
          );
          segment.points.push({ x: cmd.x, y: cmd.y, type: 'anchor' });
          currentPoint = { x: cmd.x, y: cmd.y };
          break;

        case SVGPathData.SMOOTH_CURVE_TO: // Smooth cubic Bézier
          segment.controlPoints.push(
            { x: cmd.x2, y: cmd.y2, type: 'C2', label: 'Control 2' }
          );
          segment.points.push({ x: cmd.x, y: cmd.y, type: 'anchor' });
          currentPoint = { x: cmd.x, y: cmd.y };
          break;

        case SVGPathData.QUAD_TO: // Quadratic Bézier
          segment.controlPoints.push(
            { x: cmd.x1, y: cmd.y1, type: 'Q1', label: 'Control Q' }
          );
          segment.points.push({ x: cmd.x, y: cmd.y, type: 'anchor' });
          currentPoint = { x: cmd.x, y: cmd.y };
          break;

        case SVGPathData.SMOOTH_QUAD_TO: // Smooth quadratic Bézier
          segment.points.push({ x: cmd.x, y: cmd.y, type: 'anchor' });
          currentPoint = { x: cmd.x, y: cmd.y };
          break;

        case SVGPathData.ARC: // Arco elíptico
          segment.points.push({ x: cmd.x, y: cmd.y, type: 'anchor' });
          segment.controlPoints.push(
            { rx: cmd.rX, ry: cmd.rY, type: 'radii', label: 'Radios' },
            { xAxisRotation: cmd.xRot, type: 'rotation', label: 'Rotación' },
            { largeArc: cmd.lArcFlag, sweep: cmd.sweepFlag, type: 'flags', label: 'Flags' }
          );
          currentPoint = { x: cmd.x, y: cmd.y };
          break;

        case SVGPathData.CLOSE_PATH:
          segment.points.push({ ...startPoint, type: 'anchor' });
          currentPoint = { ...startPoint };
          break;

        default:
          console.warn('Tipo de comando desconocido:', cmd.type);
      }

      segment.endPoint = { ...currentPoint };
      segments.push(segment);
    });

    return segments;
  }

  /**
   * Obtiene el nombre legible del comando
   * @param {number} type - Tipo de comando SVGPathData
   * @returns {string} Nombre del comando
   */
  getCommandName(type) {
    const names = {
      [SVGPathData.MOVE_TO]: 'M - Move To',
      [SVGPathData.LINE_TO]: 'L - Line To',
      [SVGPathData.HORIZ_LINE_TO]: 'H - Horizontal Line',
      [SVGPathData.VERT_LINE_TO]: 'V - Vertical Line',
      [SVGPathData.CURVE_TO]: 'C - Cubic Bézier',
      [SVGPathData.SMOOTH_CURVE_TO]: 'S - Smooth Cubic',
      [SVGPathData.QUAD_TO]: 'Q - Quadratic Bézier',
      [SVGPathData.SMOOTH_QUAD_TO]: 'T - Smooth Quadratic',
      [SVGPathData.ARC]: 'A - Arc',
      [SVGPathData.CLOSE_PATH]: 'Z - Close Path',
    };
    return names[type] || 'Unknown';
  }

  /**
   * Obtiene todos los puntos de anclaje del path
   * @returns {Array<Object>} Array de puntos de anclaje { x, y, segmentIndex }
   */
  getAnchorPoints() {
    const segments = this.getSegments();
    const anchors = [];

    segments.forEach((segment, index) => {
      segment.points.forEach(point => {
        if (point.type === 'anchor') {
          anchors.push({
            x: point.x,
            y: point.y,
            segmentIndex: index,
            segmentType: segment.command,
          });
        }
      });
    });

    return anchors;
  }

  /**
   * Obtiene todos los puntos de control del path
   * @returns {Array<Object>} Array de puntos de control
   */
  getControlPoints() {
    const segments = this.getSegments();
    const controls = [];

    segments.forEach((segment, index) => {
      segment.controlPoints.forEach(point => {
        if (point.x !== undefined && point.y !== undefined) {
          controls.push({
            x: point.x,
            y: point.y,
            type: point.type,
            label: point.label,
            segmentIndex: index,
            segmentType: segment.command,
          });
        }
      });
    });

    return controls;
  }

  /**
   * Modifica un punto de anclaje
   * @param {number} segmentIndex - Índice del segmento
   * @param {Object} newPosition - Nueva posición { x, y }
   * @returns {PathDataProcessor} this para chaining
   */
  updateAnchorPoint(segmentIndex, newPosition) {
    if (!this.commands[segmentIndex]) {
      console.warn('PathDataProcessor: Índice de segmento inválido');
      return this;
    }

    const cmd = this.commands[segmentIndex];

    // Actualizar punto final del segmento
    if (cmd.x !== undefined) cmd.x = newPosition.x;
    if (cmd.y !== undefined) cmd.y = newPosition.y;

    return this;
  }

  /**
   * Modifica un punto de control de una curva Bézier
   * @param {number} segmentIndex - Índice del segmento
   * @param {string} controlType - Tipo de control: 'C1', 'C2', 'Q1'
   * @param {Object} newPosition - Nueva posición { x, y }
   * @returns {PathDataProcessor} this para chaining
   */
  updateControlPoint(segmentIndex, controlType, newPosition) {
    if (!this.commands[segmentIndex]) {
      console.warn('PathDataProcessor: Índice de segmento inválido');
      return this;
    }

    const cmd = this.commands[segmentIndex];

    switch (controlType) {
      case 'C1':
        if (cmd.type === SVGPathData.CURVE_TO) {
          cmd.x1 = newPosition.x;
          cmd.y1 = newPosition.y;
        }
        break;

      case 'C2':
        if (cmd.type === SVGPathData.CURVE_TO || cmd.type === SVGPathData.SMOOTH_CURVE_TO) {
          cmd.x2 = newPosition.x;
          cmd.y2 = newPosition.y;
        }
        break;

      case 'Q1':
        if (cmd.type === SVGPathData.QUAD_TO) {
          cmd.x1 = newPosition.x;
          cmd.y1 = newPosition.y;
        }
        break;

      default:
        console.warn('PathDataProcessor: Tipo de control desconocido:', controlType);
    }

    return this;
  }

  /**
   * Invierte la dirección del path
   * @returns {PathDataProcessor} this para chaining
   */
  reverse() {
    if (!this.pathData) {
      console.warn('PathDataProcessor: No hay path data para invertir');
      return this;
    }

    try {
      // Invertir el orden de los comandos
      const reversedCommands = [];
      const segments = this.getSegments();

      // El último punto se convierte en el primer MOVE_TO
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.endPoint) {
        reversedCommands.push({
          type: SVGPathData.MOVE_TO,
          x: lastSegment.endPoint.x,
          y: lastSegment.endPoint.y,
        });
      }

      // Invertir segmentos
      for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i];
        const cmd = this.commands[i];

        if (cmd.type === SVGPathData.MOVE_TO) {
          continue; // Skip MOVE_TO original
        }

        if (cmd.type === SVGPathData.CLOSE_PATH) {
          continue; // Skip CLOSE_PATH por ahora
        }

        // Crear comando invertido
        const reversedCmd = { ...cmd };
        reversedCmd.x = segment.startPoint.x;
        reversedCmd.y = segment.startPoint.y;

        // Invertir puntos de control
        if (cmd.type === SVGPathData.CURVE_TO) {
          reversedCmd.x1 = cmd.x2;
          reversedCmd.y1 = cmd.y2;
          reversedCmd.x2 = cmd.x1;
          reversedCmd.y2 = cmd.y1;
        }

        reversedCommands.push(reversedCmd);
      }

      this.commands = reversedCommands;
      this.pathData = new SVGPathData(reversedCommands);
      return this;
    } catch (error) {
      console.error('Error invirtiendo path:', error);
      return this;
    }
  }

  /**
   * Convierte el path a un array de comandos en formato de cadena
   * @returns {Array<string>} Array de comandos como strings
   */
  toCommandStrings() {
    return this.commands.map(cmd => {
      switch (cmd.type) {
        case SVGPathData.MOVE_TO:
          return `M ${cmd.x} ${cmd.y}`;
        case SVGPathData.LINE_TO:
          return `L ${cmd.x} ${cmd.y}`;
        case SVGPathData.CURVE_TO:
          return `C ${cmd.x1} ${cmd.y1}, ${cmd.x2} ${cmd.y2}, ${cmd.x} ${cmd.y}`;
        case SVGPathData.QUAD_TO:
          return `Q ${cmd.x1} ${cmd.y1}, ${cmd.x} ${cmd.y}`;
        case SVGPathData.ARC:
          return `A ${cmd.rX} ${cmd.rY} ${cmd.xRot} ${cmd.lArcFlag} ${cmd.sweepFlag} ${cmd.x} ${cmd.y}`;
        case SVGPathData.CLOSE_PATH:
          return 'Z';
        default:
          return '';
      }
    });
  }

  /**
   * Regenera la cadena 'd' del path desde el AST modificado
   * @returns {string} Cadena 'd' del path
   */
  toString() {
    if (!this.commands.length) {
      return '';
    }

    try {
      return encodeSVGPath(this.commands);
    } catch (error) {
      console.error('Error convirtiendo path a string:', error);
      return this.originalPathString;
    }
  }

  /**
   * Obtiene información de debug del processor
   * @returns {Object} Información de debug
   */
  getDebugInfo() {
    return {
      originalPathString: this.originalPathString,
      commandCount: this.commands.length,
      isNormalized: this.isNormalized,
      segments: this.getSegments().length,
      anchorPoints: this.getAnchorPoints().length,
      controlPoints: this.getControlPoints().length,
      commands: this.commands.map(cmd => this.getCommandName(cmd.type)),
    };
  }

  /**
   * Clona el processor
   * @returns {PathDataProcessor} Nuevo processor con los mismos datos
   */
  clone() {
    const cloned = new PathDataProcessor(this.toString());
    cloned.isNormalized = this.isNormalized;
    return cloned;
  }

  /**
   * Limpia el processor
   */
  clear() {
    this.originalPathString = '';
    this.pathData = null;
    this.commands = [];
    this.isNormalized = false;
  }
}

/**
 * Factory function para crear una instancia del processor
 * @param {string} pathString - Cadena 'd' del path SVG
 * @returns {PathDataProcessor} Nueva instancia del processor
 */
export function createPathDataProcessor(pathString) {
  return new PathDataProcessor(pathString);
}

export default PathDataProcessor;
