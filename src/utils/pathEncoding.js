/**
 * Utilidades para codificar y decodificar coordenadas en formato SVG Path
 * Convierte entre pares ordenados (x,y) y comandos de path SVG
 */

/**
 * Formatea un número para uso en paths SVG
 * Redondea a 3 decimales para reducir tamaño sin perder precisión visual
 *
 * @param {number} num - Número a formatear
 * @param {number} precision - Decimales de precisión (default: 3)
 * @returns {string} Número formateado
 */
export const formatNumber = (num, precision = 3) => {
  return Number(num.toFixed(precision)).toString();
};

/**
 * Convierte un par ordenado a comando MoveTo (M)
 *
 * @param {number} x - Coordenada X
 * @param {number} y - Coordenada Y
 * @param {boolean} relative - Si es relativo (m) o absoluto (M)
 * @returns {string} Comando SVG
 */
export const pointToMoveTo = (x, y, relative = false) => {
  const command = relative ? 'm' : 'M';
  return `${command} ${formatNumber(x)} ${formatNumber(y)}`;
};

/**
 * Convierte un par ordenado a comando LineTo (L)
 *
 * @param {number} x - Coordenada X
 * @param {number} y - Coordenada Y
 * @param {boolean} relative - Si es relativo (l) o absoluto (L)
 * @returns {string} Comando SVG
 */
export const pointToLineTo = (x, y, relative = false) => {
  const command = relative ? 'l' : 'L';
  return `${command} ${formatNumber(x)} ${formatNumber(y)}`;
};

/**
 * Convierte coordenadas de línea horizontal a comando H
 *
 * @param {number} x - Coordenada X
 * @param {boolean} relative - Si es relativo (h) o absoluto (H)
 * @returns {string} Comando SVG
 */
export const pointToHorizontalLine = (x, relative = false) => {
  const command = relative ? 'h' : 'H';
  return `${command} ${formatNumber(x)}`;
};

/**
 * Convierte coordenadas de línea vertical a comando V
 *
 * @param {number} y - Coordenada Y
 * @param {boolean} relative - Si es relativo (v) o absoluto (V)
 * @returns {string} Comando SVG
 */
export const pointToVerticalLine = (y, relative = false) => {
  const command = relative ? 'v' : 'V';
  return `${command} ${formatNumber(y)}`;
};

/**
 * Convierte puntos de curva cúbica Bézier a comando CurveTo (C)
 *
 * @param {Object} cp1 - Primer punto de control {x, y}
 * @param {Object} cp2 - Segundo punto de control {x, y}
 * @param {Object} end - Punto final {x, y}
 * @param {boolean} relative - Si es relativo (c) o absoluto (C)
 * @returns {string} Comando SVG
 */
export const pointsToCubicBezier = (cp1, cp2, end, relative = false) => {
  const command = relative ? 'c' : 'C';
  return `${command} ${formatNumber(cp1.x)} ${formatNumber(cp1.y)}, ${formatNumber(cp2.x)} ${formatNumber(cp2.y)}, ${formatNumber(end.x)} ${formatNumber(end.y)}`;
};

/**
 * Convierte puntos de curva cúbica Bézier suave a comando S
 *
 * @param {Object} cp2 - Segundo punto de control {x, y}
 * @param {Object} end - Punto final {x, y}
 * @param {boolean} relative - Si es relativo (s) o absoluto (S)
 * @returns {string} Comando SVG
 */
export const pointsToSmoothCubicBezier = (cp2, end, relative = false) => {
  const command = relative ? 's' : 'S';
  return `${command} ${formatNumber(cp2.x)} ${formatNumber(cp2.y)}, ${formatNumber(end.x)} ${formatNumber(end.y)}`;
};

/**
 * Convierte puntos de curva cuadrática Bézier a comando Q
 *
 * @param {Object} cp - Punto de control {x, y}
 * @param {Object} end - Punto final {x, y}
 * @param {boolean} relative - Si es relativo (q) o absoluto (Q)
 * @returns {string} Comando SVG
 */
export const pointsToQuadraticBezier = (cp, end, relative = false) => {
  const command = relative ? 'q' : 'Q';
  return `${command} ${formatNumber(cp.x)} ${formatNumber(cp.y)}, ${formatNumber(end.x)} ${formatNumber(end.y)}`;
};

/**
 * Convierte punto de curva cuadrática suave a comando T
 *
 * @param {Object} end - Punto final {x, y}
 * @param {boolean} relative - Si es relativo (t) o absoluto (T)
 * @returns {string} Comando SVG
 */
export const pointToSmoothQuadraticBezier = (end, relative = false) => {
  const command = relative ? 't' : 'T';
  return `${command} ${formatNumber(end.x)} ${formatNumber(end.y)}`;
};

/**
 * Convierte parámetros de arco elíptico a comando A
 *
 * @param {number} rx - Radio X
 * @param {number} ry - Radio Y
 * @param {number} xAxisRotation - Rotación del eje X en grados
 * @param {boolean} largeArcFlag - Flag de arco grande
 * @param {boolean} sweepFlag - Flag de dirección del arco
 * @param {Object} end - Punto final {x, y}
 * @param {boolean} relative - Si es relativo (a) o absoluto (A)
 * @returns {string} Comando SVG
 */
export const pointsToArc = (rx, ry, xAxisRotation, largeArcFlag, sweepFlag, end, relative = false) => {
  const command = relative ? 'a' : 'A';
  const laf = largeArcFlag ? 1 : 0;
  const sf = sweepFlag ? 1 : 0;
  return `${command} ${formatNumber(rx)} ${formatNumber(ry)} ${formatNumber(xAxisRotation)} ${laf} ${sf} ${formatNumber(end.x)} ${formatNumber(end.y)}`;
};

/**
 * Genera comando ClosePath (Z)
 *
 * @returns {string} Comando SVG
 */
export const closePath = () => {
  return 'Z';
};

/**
 * Construye un path completo desde un array de comandos
 *
 * @param {Array} commands - Array de strings de comandos
 * @returns {string} String de path SVG completo
 */
export const buildPathString = (commands) => {
  return commands.filter(cmd => cmd && cmd.trim()).join(' ');
};

/**
 * Convierte un array de puntos a un path de líneas (polyline)
 *
 * @param {Array} points - Array de objetos {x, y}
 * @param {boolean} closed - Si el path debe cerrarse
 * @param {boolean} relative - Si usar comandos relativos
 * @returns {string} String de path SVG
 */
export const pointsToPath = (points, closed = false, relative = false) => {
  if (!points || points.length === 0) return '';

  const commands = [];

  // Primer punto es siempre MoveTo
  commands.push(pointToMoveTo(points[0].x, points[0].y, false));

  // Resto de puntos son LineTo
  for (let i = 1; i < points.length; i++) {
    if (relative) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      commands.push(pointToLineTo(dx, dy, true));
    } else {
      commands.push(pointToLineTo(points[i].x, points[i].y, false));
    }
  }

  // Cerrar el path si se solicita
  if (closed) {
    commands.push(closePath());
  }

  return buildPathString(commands);
};

/**
 * Convierte un rectángulo a path
 *
 * @param {number} x - Coordenada X superior izquierda
 * @param {number} y - Coordenada Y superior izquierda
 * @param {number} width - Ancho
 * @param {number} height - Alto
 * @param {number} rx - Radio de esquina X (opcional)
 * @param {number} ry - Radio de esquina Y (opcional)
 * @returns {string} String de path SVG
 */
export const rectToPath = (x, y, width, height, rx = 0, ry = 0) => {
  if (rx === 0 && ry === 0) {
    // Rectángulo sin esquinas redondeadas
    return buildPathString([
      pointToMoveTo(x, y),
      pointToHorizontalLine(x + width),
      pointToVerticalLine(y + height),
      pointToHorizontalLine(x),
      closePath()
    ]);
  }

  // Rectángulo con esquinas redondeadas
  const effectiveRx = Math.min(rx, width / 2);
  const effectiveRy = Math.min(ry || rx, height / 2);

  return buildPathString([
    pointToMoveTo(x + effectiveRx, y),
    pointToHorizontalLine(x + width - effectiveRx),
    pointsToArc(effectiveRx, effectiveRy, 0, false, true, { x: x + width, y: y + effectiveRy }),
    pointToVerticalLine(y + height - effectiveRy),
    pointsToArc(effectiveRx, effectiveRy, 0, false, true, { x: x + width - effectiveRx, y: y + height }),
    pointToHorizontalLine(x + effectiveRx),
    pointsToArc(effectiveRx, effectiveRy, 0, false, true, { x: x, y: y + height - effectiveRy }),
    pointToVerticalLine(y + effectiveRy),
    pointsToArc(effectiveRx, effectiveRy, 0, false, true, { x: x + effectiveRx, y: y }),
    closePath()
  ]);
};

/**
 * Convierte un círculo a path
 *
 * @param {number} cx - Centro X
 * @param {number} cy - Centro Y
 * @param {number} r - Radio
 * @returns {string} String de path SVG
 */
export const circleToPath = (cx, cy, r) => {
  return buildPathString([
    pointToMoveTo(cx + r, cy),
    pointsToArc(r, r, 0, false, true, { x: cx + r, y: cy + 2 * r }),
    pointsToArc(r, r, 0, false, true, { x: cx + r, y: cy }),
    closePath()
  ]);
};

/**
 * Convierte una elipse a path
 *
 * @param {number} cx - Centro X
 * @param {number} cy - Centro Y
 * @param {number} rx - Radio X
 * @param {number} ry - Radio Y
 * @returns {string} String de path SVG
 */
export const ellipseToPath = (cx, cy, rx, ry) => {
  return buildPathString([
    pointToMoveTo(cx + rx, cy),
    pointsToArc(rx, ry, 0, false, true, { x: cx - rx, y: cy }),
    pointsToArc(rx, ry, 0, false, true, { x: cx + rx, y: cy }),
    closePath()
  ]);
};

/**
 * Parsea un string de comando de path y extrae las coordenadas
 *
 * @param {string} command - Comando de path (ej: "M 10 20" o "L 30 40")
 * @returns {Object} Objeto con tipo de comando y coordenadas
 */
export const parsePathCommand = (command) => {
  const trimmed = command.trim();
  const commandType = trimmed[0];
  const coords = trimmed
    .slice(1)
    .trim()
    .split(/[\s,]+/)
    .map(parseFloat)
    .filter(n => !isNaN(n));

  return {
    type: commandType,
    coords,
    isRelative: commandType === commandType.toLowerCase()
  };
};

/**
 * Convierte coordenadas relativas a absolutas
 *
 * @param {Object} command - Comando parseado con tipo y coords
 * @param {Object} currentPos - Posición actual {x, y}
 * @returns {Object} Coordenadas absolutas
 */
export const relativeToAbsolute = (command, currentPos = { x: 0, y: 0 }) => {
  if (!command.isRelative) {
    return command;
  }

  const absoluteCoords = [...command.coords];
  const type = command.type.toUpperCase();

  switch (type) {
    case 'M':
    case 'L':
    case 'T':
      // Comandos con pares x,y
      for (let i = 0; i < absoluteCoords.length; i += 2) {
        absoluteCoords[i] += currentPos.x;
        absoluteCoords[i + 1] += currentPos.y;
      }
      break;

    case 'H':
      // Línea horizontal
      absoluteCoords[0] += currentPos.x;
      break;

    case 'V':
      // Línea vertical
      absoluteCoords[0] += currentPos.y;
      break;

    case 'C':
      // Curva cúbica: cp1x, cp1y, cp2x, cp2y, x, y
      for (let i = 0; i < absoluteCoords.length; i += 6) {
        absoluteCoords[i] += currentPos.x;
        absoluteCoords[i + 1] += currentPos.y;
        absoluteCoords[i + 2] += currentPos.x;
        absoluteCoords[i + 3] += currentPos.y;
        absoluteCoords[i + 4] += currentPos.x;
        absoluteCoords[i + 5] += currentPos.y;
      }
      break;

    case 'S':
    case 'Q':
      // Curvas con punto de control: cpx, cpy, x, y
      for (let i = 0; i < absoluteCoords.length; i += 4) {
        absoluteCoords[i] += currentPos.x;
        absoluteCoords[i + 1] += currentPos.y;
        absoluteCoords[i + 2] += currentPos.x;
        absoluteCoords[i + 3] += currentPos.y;
      }
      break;

    case 'A':
      // Arco: rx, ry, rotation, large-arc, sweep, x, y
      for (let i = 0; i < absoluteCoords.length; i += 7) {
        absoluteCoords[i + 5] += currentPos.x;
        absoluteCoords[i + 6] += currentPos.y;
      }
      break;
  }

  return {
    type,
    coords: absoluteCoords,
    isRelative: false
  };
};

/**
 * Convierte coordenadas absolutas a relativas
 *
 * @param {Object} command - Comando parseado con tipo y coords
 * @param {Object} currentPos - Posición actual {x, y}
 * @returns {Object} Coordenadas relativas
 */
export const absoluteToRelative = (command, currentPos = { x: 0, y: 0 }) => {
  if (command.isRelative) {
    return command;
  }

  const relativeCoords = [...command.coords];
  const type = command.type.toLowerCase();

  switch (command.type.toUpperCase()) {
    case 'M':
    case 'L':
    case 'T':
      for (let i = 0; i < relativeCoords.length; i += 2) {
        relativeCoords[i] -= currentPos.x;
        relativeCoords[i + 1] -= currentPos.y;
      }
      break;

    case 'H':
      relativeCoords[0] -= currentPos.x;
      break;

    case 'V':
      relativeCoords[0] -= currentPos.y;
      break;

    case 'C':
      for (let i = 0; i < relativeCoords.length; i += 6) {
        relativeCoords[i] -= currentPos.x;
        relativeCoords[i + 1] -= currentPos.y;
        relativeCoords[i + 2] -= currentPos.x;
        relativeCoords[i + 3] -= currentPos.y;
        relativeCoords[i + 4] -= currentPos.x;
        relativeCoords[i + 5] -= currentPos.y;
      }
      break;

    case 'S':
    case 'Q':
      for (let i = 0; i < relativeCoords.length; i += 4) {
        relativeCoords[i] -= currentPos.x;
        relativeCoords[i + 1] -= currentPos.y;
        relativeCoords[i + 2] -= currentPos.x;
        relativeCoords[i + 3] -= currentPos.y;
      }
      break;

    case 'A':
      for (let i = 0; i < relativeCoords.length; i += 7) {
        relativeCoords[i + 5] -= currentPos.x;
        relativeCoords[i + 6] -= currentPos.y;
      }
      break;
  }

  return {
    type,
    coords: relativeCoords,
    isRelative: true
  };
};

/**
 * Simplifica un path eliminando comandos redundantes
 *
 * @param {string} pathString - String de path SVG
 * @returns {string} Path simplificado
 */
export const simplifyPath = (pathString) => {
  // TODO: Implementar simplificación de path
  // - Combinar líneas consecutivas en la misma dirección
  // - Convertir líneas cortas a comandos H/V cuando sea apropiado
  // - Eliminar puntos redundantes
  return pathString;
};