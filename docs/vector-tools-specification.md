# Especificación Completa: Herramientas de Selección y Edición Vectorial

## Objetivo
Implementar el comportamiento estándar de herramientas vectoriales basado en Adobe Illustrator, siguiendo las mejores prácticas profesionales de edición vectorial.

## Estado Actual vs. Estado Deseado

### ✅ Implementado (Fase 1 y 2 - Básico y Transformaciones)
- [x] Single-SVG architecture (un solo SVG con grupos)
- [x] Bounding box visible con handles
- [x] NodeEditor básico (visualización de nodos)
- [x] Handles con tamaño constante (no escalan con zoom)
- [x] Líneas auxiliares de Bézier
- [x] Límites del canvas (artboard) visibles y no seleccionables
- [x] Flecha blanca puede seleccionar elementos directamente y muestra bounding box
- [x] Drag con Shift constraint (45°) y Alt duplication
- [x] Escala con corner handles + Shift (proporcional) + Alt (desde centro)
- [x] Rotación con top handle + Shift (15° snapping)
- [x] Marquee selection (box drag con intersección)

### ⏳ Pendiente (Fases 2-6)

#### Fase 2: Herramienta de Selección (Flecha Negra - V)
- [x] **Selección por marquee** (box selection por arrastre)
- [x] **Transformaciones con handles del bounding box**:
  - [x] Handles de esquina: escala bidimensional
  - [x] Handles de rotación funcionales
- [x] **Modificadores de transformación**:
  - [x] `Shift`: restricción a 45°/90°, escala proporcional
  - [x] `Alt/Option`: duplicación, escala desde centro
  - [x] `Shift+Alt`: duplicación restringida
- [ ] **Cursor feedback** sobre objetos (mostrar ícono de bounding box)
- [ ] **Modo de aislamiento** (doble click en grupos)

#### Fase 3: Herramienta de Selección Directa (Flecha Blanca - A)
- [ ] **Selección de nodos individuales**:
  - [ ] Click en nodo para seleccionar
  - [ ] `Shift+Click` para selección múltiple
  - [ ] Marquee selection (solo nodos interceptados)
- [ ] **Drag de nodos** (mover posición)
- [ ] **Selección y manipulación de segmentos**
- [ ] **Manipulación de handles de Bézier**:
  - [ ] Drag de handle: ajuste simétrico de curvatura
  - [ ] `Alt+Drag` de handle: ajuste asimétrico (independiente)
  - [ ] Click en handle: eliminar (convierte a línea recta)
- [ ] **Modificadores**:
  - [ ] `Shift`: restricción a 45° en movimiento
  - [ ] `Alt/Option`: duplicación de segmento
- [ ] **Cursor feedback diferenciado**:
  - [ ] Cursor sobre nodo: cuadrado sólido
  - [ ] Cursor sobre segmento: línea
  - [ ] Cursor sobre handle: círculo con flecha

#### Fase 4: Herramienta Pluma (Pen Tool - P)
- [ ] **Crear puntos de ancla** por click
- [ ] **Crear curvas Bézier** arrastrando al crear punto
- [ ] **Cerrar paths** (click en primer punto)
- [ ] **Modificadores**:
  - [ ] `Ctrl/Cmd`: activación temporal de Direct Selection
  - [ ] `Alt/Option`: acceso a Anchor Point Tool (conversión)
- [ ] **Cursor feedback**:
  - [ ] Icono de pluma estándar
  - [ ] Indicador de cierre de path
  - [ ] Indicador de conversión de punto

#### Fase 5: Nudging y Teclado
- [ ] **Nudging básico** (flechas del teclado)
- [ ] **Nudging acelerado** (`Shift+Flechas`)
- [ ] **Configuración de incrementos** en preferencias
- [ ] **Atajos de teclado**:
  - [ ] `V`: Selección (Flecha Negra)
  - [ ] `A`: Selección Directa (Flecha Blanca)
  - [ ] `P`: Pluma
  - [ ] `Shift+C`: Anchor Point Tool
  - [ ] `Ctrl/Cmd+3`: Ocultar elementos
  - [ ] `Esc`: Salir de modo de aislamiento

#### Fase 6: Gestión de Grupos y Estructura
- [ ] **Modo de aislamiento** (Isolation Mode)
- [ ] **Bloquear/Desbloquear elementos**
- [ ] **Ocultar/Mostrar elementos**
- [ ] **Navegación de jerarquía** con doble click

---

## Modelo Jerárquico de Selección

### Nivel Superior: Objeto/Entidad (Flecha Negra - V)
Manipulación de unidades completas:
- Paths simples
- Formas geométricas (círculos, rectángulos)
- Grupos de elementos
- Operaciones: mover, rotar, escalar

### Nivel Inferior: Sub-elemento/Geometría (Flecha Blanca - A)
Manipulación de componentes estructurales:
- **Puntos de Ancla (Nodos)**: fijan posición clave
  - Nodos Suaves (Smooth Points): curvatura continua
  - Nodos de Esquina (Corner Points): ángulo discontinuo
- **Segmentos de Ruta**: líneas o curvas entre nodos
- **Handles de Bézier**: vectores tangenciales que controlan curvatura

---

## Tabla de Modificadores Globales

| Herramienta | Modificador | Acción Mouse | Resultado |
|-------------|-------------|--------------|-----------|
| **Selección (V)** | Ninguno | Drag objeto | Movimiento libre |
| **Selección (V)** | `Shift` | Drag objeto | Movimiento restringido (45°/90°) |
| **Selección (V)** | `Alt/Option` | Drag objeto | Duplicación |
| **Selección (V)** | `Shift+Alt` | Drag objeto | Duplicación restringida |
| **Selección (V)** | `Shift` | Drag handle bbox | Escala proporcional |
| **Selección (V)** | `Alt/Option` | Drag handle bbox | Escala desde centro |
| **Selección Directa (A)** | Ninguno | Drag nodo | Movimiento libre del nodo |
| **Selección Directa (A)** | `Shift` | Drag nodo | Movimiento restringido (45°) |
| **Selección Directa (A)** | `Alt/Option` | Drag segmento | Duplicación de segmento |
| **Selección Directa (A)** | `Alt/Option` | Drag handle | Ajuste asimétrico de curva |
| **Pluma (P)** | `Ctrl/Cmd` | Click/Drag | Activación temporal de A |
| **Pluma (P)** | `Alt/Option` | Click nodo | Conversión de punto |
| **Cualquiera** | `Shift` | Flechas teclado | Nudging acelerado (×10) |

---

## Lenguaje Consistente de Modificadores

### `Alt/Option`: "Crear excepción" o "Divergir"
- En Flecha Negra: **Duplicación** (crea copia, preserva original)
- En Flecha Blanca + handle: **Asimetría** (rompe simetría de curva)
- En Flecha Blanca + segmento: **Duplicación de segmento**
- En Pluma: **Conversión** de tipo de punto

### `Shift`: "Restricción" o "Control"
- En drag con mouse: **Restricción geométrica** (45°, 90°, proporcional)
- En nudging con teclado: **Aceleración** (×10 la distancia base)
- Siempre impone **mayor rigor** en la ejecución

### `Ctrl/Cmd`: "Acceso temporal" o "Conmutación"
- Activa temporalmente **Selección Directa (A)** desde otras herramientas
- Permite corrección in-situ sin cambiar de herramienta
- Maximiza eficiencia en flujo de trabajo

---

## Retroalimentación del Cursor (Cursor Feedback)

### Flecha Negra (V)
- **Sobre objeto**: Ícono de cuadro delimitador pequeño junto a flecha
- **Sobre handle de esquina**: Doble flecha (dirección de escala)
- **Cerca de esquina**: Cursor curvo (rotación)

### Flecha Blanca (A)
- **Sobre nodo**: Cuadrado sólido pequeño
- **Sobre segmento**: Línea recta o curva pequeña
- **Sobre handle**: Círculo pequeño con flecha

### Pluma (P)
- **Crear punto**: Ícono de pluma estándar
- **Cerrar path**: Ícono con círculo pequeño
- **Con `Alt/Option`**: Ícono de conversión de punto

---

## Estados de Nodos (Visualización)

- **Nodo seleccionado**: Cuadrado sólido azul (color de capa)
- **Nodo no seleccionado**: Cuadrado hueco
- **Handles visibles**: Solo en nodos seleccionados
- **Líneas auxiliares**: Punteadas, conectan nodo con handles

---

## Prioridades de Implementación

### Crítico (Fase 2)
1. Drag de elementos con Flecha Negra
2. Modificadores básicos (`Shift`, `Alt`)
3. Transformación con handles del bounding box

### Alto (Fase 3)
1. Drag de nodos con Flecha Blanca
2. Manipulación de handles de Bézier
3. Selección múltiple de nodos

### Medio (Fase 4)
1. Herramienta Pluma básica
2. Creación de puntos y curvas
3. Modificadores de Pluma

### Bajo (Fases 5-6)
1. Nudging con teclado
2. Modo de aislamiento
3. Gestión de visibilidad

---

## Notas de Implementación

### Arquitectura Actual
- ✅ Single-SVG system con grupos separados
- ✅ Coordinate transformation system (SVGWorld)
- ✅ Handles con tamaño constante (píxeles)
- ✅ `vectorEffect="non-scaling-stroke"`

### Pendientes Técnicos
- [ ] Sistema de selección múltiple (Set de IDs)
- [ ] Historial de transformaciones (undo/redo extendido)
- [ ] Detección de hover con hit testing preciso
- [ ] Marquee selection (box drag)
- [ ] Restricción angular con `Shift` (snap to 45°)
- [ ] Duplicación con `Alt/Option`
- [ ] Gestión de modificadores de teclado global

### Consideraciones UX
- Cursor feedback debe ser **inmediato** (hover)
- Transformaciones deben ser **fluidas** (60fps)
- Modificadores deben ser **consistentes** (lenguaje global)
- Shortcuts deben ser **estándar de industria** (V, A, P)

---

## Referencias
Basado en el comportamiento estándar de Adobe Illustrator CS6+, siguiendo las mejores prácticas de la industria para software de edición vectorial profesional.
