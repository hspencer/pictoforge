# PictoForge - Editor SVG Semántico

Un editor/visor de SVG avanzado con etiquetado semántico, diseñado para trabajar con modelos de lenguaje generativo.

![PictoForge](./examples/pictoforge.png)

## Características Principales

### Interfaz de Tres Paneles
- **Panel Superior**: Entrada de texto con carga de archivos SVG por drag & drop
- **Panel Izquierdo**: Jerarquía de elementos SVG con iconos apropiados y panel de estilos CSS
- **Panel Central**: Visor SVG interactivo con herramientas de edición y vista de código alternativa

### Selección Bidireccional ("Round Trip Interface")
- Seleccionar elementos en la jerarquía los resalta en el visor
- Hacer clic en elementos del SVG los selecciona en la jerarquía
- Auto-expansión de la ruta hacia elementos seleccionados

### Herramientas de Edición
- **Flecha negra**: Herramienta de selección
- **Flecha blanca**: Herramienta de movimiento de vista (pan)
- **Pluma**: Herramienta de edición (preparada para futuras funcionalidades)
- Zoom in/out, reseteo de vista, descarga de SVG

### Sistema de Estilos
- Visualización de clases CSS definidas en el SVG
- Aplicación/remoción dinámica de estilos a elementos
- Vista previa de propiedades CSS (fill, stroke, stroke-linejoin, etc.)

### Herramientas Avanzadas
- Guardar, deshacer/rehacer (preparado)
- Copiar, duplicar y eliminar elementos (preparado)
- Vista de código SVG editable con numeración de líneas
- Estadísticas en tiempo real (número de elementos y estilos)

### Características Adicionales
- Tema claro/oscuro
- Interfaz responsive y profesional
- Animaciones suaves y micro-interacciones
- Manejo de errores y validación de archivos SVG

## Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/hspencer/pictoforge.git
cd pictoforge

# Instalar dependencias
npm install
# o
pnpm install
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
# o
pnpm run dev

# La aplicación estará disponible en http://localhost:5173
```

### Construcción para Producción
```bash
# Construir para producción
npm run build
# o
pnpm run build

# Los archivos se generarán en la carpeta 'dist/'
```

## Arquitectura del Proyecto

```
pictoforge/
├── public/                 # Archivos estáticos
├── src/
│   ├── assets/            # Recursos (SVGs de ejemplo)
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes de UI (shadcn/ui)
│   │   ├── AdvancedTools.jsx
│   │   ├── CodeView.jsx
│   │   ├── FileLoadDemo.jsx
│   │   ├── StylePanel.jsx
│   │   ├── SVGHierarchy.jsx
│   │   ├── SVGViewer.jsx
│   │   └── TextInput.jsx
│   ├── hooks/            # Hooks personalizados
│   │   └── useSVGParser.js
│   ├── lib/              # Utilidades
│   ├── App.jsx           # Componente principal
│   ├── App.css           # Estilos personalizados
│   ├── index.css         # Estilos globales
│   └── main.jsx          # Punto de entrada
├── components.json        # Configuración shadcn/ui
├── package.json
├── vite.config.js
└── README.md
```

## 🧩 Componentes Principales

### `useSVGParser` (Hook)
Hook personalizado que maneja:
- Parseo de contenido SVG
- Extracción de jerarquía de elementos
- Extracción de estilos CSS
- Búsqueda y navegación de elementos

### `SVGHierarchy`
Componente que muestra:
- Estructura jerárquica de elementos SVG
- Iconos apropiados para cada tipo de elemento
- Estado de expansión/colapso
- Selección visual de elementos

### `SVGViewer`
Componente principal de visualización:
- Renderizado del SVG
- Herramientas de navegación (zoom, pan)
- Selección interactiva de elementos
- Resaltado visual de elementos seleccionados

### `StylePanel`
Panel de gestión de estilos:
- Lista de clases CSS disponibles
- Aplicación/remoción de estilos
- Vista previa de propiedades CSS

### `CodeView`
Editor de código SVG:
- Sintaxis highlighting (básico)
- Numeración de líneas
- Edición en tiempo real
- Validación de SVG

## Tecnologías Utilizadas

- **React 18** - Framework principal
- **Vite** - Bundler y servidor de desarrollo
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes de interfaz
- **Lucide Icons** - Iconografía
- **JavaScript** - Lenguaje principal

## Uso Básico

1. **Cargar un SVG**: 
   - Usa el botón de carga en el panel superior
   - Arrastra y suelta un archivo SVG
   - Usa los ejemplos incluidos

2. **Navegar la jerarquía**:
   - Expande/colapsa grupos en el panel izquierdo
   - Haz clic en elementos para seleccionarlos

3. **Editar estilos**:
   - Selecciona un elemento
   - Usa el panel de estilos para aplicar/remover clases CSS

4. **Ver código**:
   - Usa el botón "Ver código SVG" en la barra de herramientas
   - Edita el código directamente

## Funcionalidades Futuras (TODO)

### Sistema de "Guardado con Puntuación"
- Implementar sistema de versionado para fine-tuning de modelos
- Guardar estados intermedios con puntuaciones
- Historial de cambios con métricas

### Herramientas de Edición Avanzadas
- Implementar funcionalidad completa de la herramienta "pluma"
- Edición de formas y paths
- Transformaciones (rotar, escalar, mover)

### Integración con Modelos de Lenguaje
- API para conectar con modelos generativos
- Generación automática de SVG desde texto
- Sugerencias inteligentes de mejoras

### Funcionalidades Adicionales
- Deshacer/rehacer completo
- Duplicación y eliminación de elementos
- Exportación en múltiples formatos
- Plantillas y bibliotecas de elementos

## Problemas Conocidos

- La funcionalidad de deshacer/rehacer está preparada pero no completamente implementada
- La herramienta de edición "pluma" necesita desarrollo adicional
- La duplicación y eliminación de elementos requiere implementación completa

## Contribución

Este proyecto está diseñado para ser extensible. Las áreas principales para contribución incluyen:

1. **Herramientas de edición**: Implementar funcionalidades de edición visual
2. **Integración IA**: Conectar con modelos de lenguaje
3. **Exportación**: Añadir más formatos de exportación
4. **Performance**: Optimizar para SVGs grandes y complejos
