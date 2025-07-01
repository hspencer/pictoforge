# PictoNet - Plataforma de Pictogramas AAC con IA

## Descripción del Proyecto
PictoNet es una plataforma avanzada de comunicación visual para crear y gestionar pictogramas AAC (Comunicación Aumentativa y Alternativa) culturalmente adaptativos con soporte multiidioma sofisticado y pipeline generativo de IA.

## Arquitectura Actual

### Frontend
- **React 18** con TypeScript
- **Material Design 3** como sistema de diseño central
- **Tailwind CSS** para estilos base
- **Wouter** para routing
- **React Query** para gestión de datos
- **Editor SVG React-nativo** con manipulación directa del Virtual DOM

### Backend
- **Express.js** con TypeScript
- **PostgreSQL** con Drizzle ORM
- **Esquemas Zod** para validación

### Funcionalidades Principales

#### 1. Pipeline Generativo de IA
- **6 pasos configurables** basados en investigación académica:
  1. Intent Classification (RoBERTa-base)
  2. NSM Mapping (Natural Semantic Metalanguage)
  3. Conceptual Blending (ConceptNet + TARS)
  4. Icon Selection/Creation (ARASAAC API)
  5. Visual Layout Planner (FLAN-T5 + BART)
  6. Styling + Metadata (CodeT5+ + SVG-VAE)
- **Parámetros modificables** por paso (sliders, selects, switches)
- **Interface expandible** para configuración detallada

#### 2. Editor SVG React-Nativo
- **Manipulación directa** del Virtual DOM de React como SVG
- **Herramientas integradas**: Select, Circle, Rectangle, Path, Text
- **Selección visual** con elementos destacados
- **Grilla de referencia** y coordenadas precisas
- **Material Design 3** styling integrado

#### 3. Interfaz de Chat Generativa
- **Input tipo ChatGPT** con botón generar integrado
- **Resumen de razonamiento** expandible
- **Historial de conversaciones** con pipeline visible
- **Ejemplo por defecto**: "Make the bed"

#### 4. Sistema Multi-Instancia
- **Navegación por ubicaciones** (ej: pictos.net/aotearoa)
- **Base de datos separada** por instancia
- **Instancias reales**:
  - Aotearoa: 24 pictogramas (cultura maorí)
  - TEA Chile: 18 pictogramas (autismo)
  - Lectogram: 32 pictogramas (lectoescritura)

#### 5. Internacionalización Completa
- **10 idiomas soportados**: Español (Chile), Inglés, Māori, Portugués, Alemán, Inglés Británico, Francés, Catalán, Mapudungún, Quechua
- **Selector de idiomas** en esquina superior derecha
- **Detección automática** del navegador
- **Fallback al inglés** automático

## Sistema de Diseño Material 3

### Configuración Central
- **Archivo principal**: `client/src/lib/design-system.ts`
- **Variables CSS**: Definidas en `client/src/index.css`
- **Tipografía**: Escala completa de Material Design 3
- **Colores**: Sistema de tokens con adaptaciones AAC
- **Espaciado**: Grid de 4px como base
- **Elevaciones**: 5 niveles con sombras precisas
- **Animaciones**: Timing y curvas de Material Design

### Tokens de Diseño
```typescript
DesignTokens = {
  typography: { baseFontSize: 16, fontFamily: {...}, scale: {...} },
  colors: { primary: {...}, secondary: {...}, pictonet: {...} },
  spacing: { unit: 4, scale: { xs: 4, sm: 8, md: 16, ... } },
  borderRadius: { xs: 4, sm: 8, md: 12, ... },
  elevation: { level0: {...}, level1: {...}, ... },
  animation: { duration: {...}, easing: {...} }
}
```

## Estructura de Archivos

### Componentes Principales
- `client/src/components/chat-interface.tsx` - Interfaz de chat principal
- `client/src/components/generative-pipeline.tsx` - Pipeline de 6 pasos
- `client/src/components/react-svg-editor.tsx` - Editor SVG React-nativo
- `client/src/lib/design-system.ts` - Sistema de diseño central

### Páginas
- `client/src/pages/svg-editor.tsx` - Editor principal
- `client/src/pages/home.tsx` - Página de inicio con instancias
- `client/src/pages/place.tsx` - Vista específica por instancia
- `client/src/pages/dictionary.tsx` - Diccionario de pictogramas

## Cambios Recientes (Diciembre 2024 - Enero 2025)

### ✅ Arquitectura de Base de Datos con Espacios de Usuario (Enero 2025)
- **Esquema completo de usuarios**: Tabla `users` con autenticación OAuth y perfiles
- **Sistema de espacios**: Workspaces/proyectos independientes por usuario con tabla `spaces`
- **Bibliotecas de pictogramas**: Sistema jerárquico `pictogramLibraries` dentro de espacios
- **Pictogramas vinculados**: Tabla `pictograms` asociada a bibliotecas específicas
- **Colaboradores**: Sistema `spaceCollaborators` con roles (owner, editor, viewer)
- **Relaciones Drizzle**: Definidas todas las relaciones entre tablas para consultas eficientes
- **API REST completa**: Endpoints protegidos para CRUD de espacios, bibliotecas y pictogramas
- **Autenticación OAuth**: Implementación completa con Replit Auth y sesiones persistentes
- **Compatibilidad legacy**: Mantenimiento de tablas `instances` para retrocompatibilidad

### ✅ README Completo y Documentación Técnica (Enero 2025)
- **Instrucciones detalladas macOS**: Secuencia completa con Homebrew para Node.js y PostgreSQL
- **Configuración de entorno**: Variables de entorno, base de datos y OAuth detalladas
- **Estructura de directorios**: Explicación completa de todos los componentes y archivos
- **Guía de personalización**: Sistema de diseño Material Design 3, colores, tipografía AAC
- **Comandos de desarrollo**: Scripts npm, migraciones de BD y herramientas de desarrollo
- **Arquitectura documentada**: Descripción detallada del pipeline IA y funcionalidades principales

### ✅ Limpieza de Archivos y Estructura Unificada (Enero 2025)
- **Archivos obsoletos eliminados**: Removidos versiones antiguas del editor y páginas experimentales
- **Archivo final consolidado**: `svg-editor.tsx` - Versión definitiva con todas las funcionalidades
- **Routing actualizado**: App.tsx refleja solo los archivos válidos en uso
- **README sincronizado**: Documentación actualizada con estructura correcta

### ✅ Editor SVG Final con Funcionalidades Avanzadas (Enero 2025)
- **Toolbar unificado**: Altura consistente (56px) entre panel izquierdo y editor
- **Sin bordes redondeados**: Eliminación completa de `borderRadius` en toda la interfaz del editor
- **Manipulación DOM virtual**: Sistema completo de parsing SVG a estructura virtual y viceversa
- **Vértices draggeables**: Círculos rojos para edición visual directa con cursores específicos por tipo
- **Selección bidireccional**: Sincronización entre árbol DOM y canvas SVG
- **Estilos de grupo**: Visualización automática de estilos CSS para grupos "bed" y "person"
- **Internacionalización**: Soporte completo i18n con I18nProvider integrado
- **Granularidad fina**: Edición precisa de elementos individuales con propiedades contextuales
- **Herramientas floating**: Botones de agregar elementos (rect, circle, text) en esquina inferior
- **Panel de propiedades**: Auto-apertura al seleccionar elementos con edición en tiempo real

### ✅ TopBar Unificado con Breadcrumbs y Dropdown de Usuario (Enero 2025)
- **TopBar completamente rediseñado**: Componente único `top-bar.tsx` aplicado consistentemente
- **Sistema de breadcrumbs inteligente**: 
  - Home: "PictoNet" (con tagline)
  - Espacios: "PictoNet > Aotearoa" (con etiquetas de idiomas)
  - Editor: "Aotearoa > PictoForge" (creator, editor and trainer)
- **Dropdown de usuario**: Ícono de usuario con chevron que incluye sign in/sign up y user settings
- **Posicionamiento derecho**: Controles de usuario, modo día/noche y selector de idiomas a la derecha
- **Comportamiento especial home**: TopBar aparece solo al hacer scroll cuando desaparece el jumbotron
- **Modal de autenticación integrado**: OAuth providers (Google, GitHub, Microsoft, Discord) en dropdown
- **Aplicación consistente**: Actualizado en todas las páginas (home, svg-editor, place, dictionary)
- **Navegación contextual**: Enlaces funcionales en breadcrumbs para navegación rápida
- **Eliminación de código obsoleto**: Removidos TopBars antiguos y controles de autenticación duplicados

### ✅ Tipografía Lexend Global y Sistema AAC (Enero 2025)
- **Lexend como fuente global**: Implementación completa en toda la interfaz
- **Variables CSS centralizadas**: `--font-family-interface`, `--text-transform-uppercase`, `--font-weight-*`
- **Funciones AAC específicas**: `getAACTypography()` para textos de interfaz con mayúsculas
- **Clases CSS AAC**: `.aac-text`, `.aac-title`, `.aac-button`, `.aac-label` para elementos comunes
- **Material Design 3 actualizado**: Todos los botones y componentes usan Lexend
- **Sistema centralizado**: Eliminación de estilos hardcodeados dispersos
- **Optimización CAA**: `text-transform: uppercase` por defecto en elementos de interfaz

### ✅ Material Design 3 Refactoring Completo (Enero 2025)
- Sistema de diseño aplicado en toda la interfaz
- Eliminación de sistema de pestañas complejo
- Panel izquierdo simplificado con vista de árbol principal
- Panel de propiedades colapsable que se expande automáticamente
- Controles de zoom implementados (zoom in, zoom out, zoom extends)
- Nomenclatura mejorada en árbol (nombres descriptivos vs tipos genéricos)
- Chat interface reposicionado entre header y editor

### ✅ Autenticación OAuth y Modo Día/Noche (Enero 2025)
- Página de inicio completamente refactorizada con Material Design 3
- Botones de Sign Up / Log In con múltiples proveedores OAuth (Google, GitHub, Microsoft, Discord, Apple)
- Modal de autenticación elegante con Material 3 styling
- Modo día/noche funcional con toggle junto al selector de idiomas
- Transiciones suaves entre temas con persistencia local
- Espaciado mejorado entre tarjetas de "places" (2xl gap)
- Página "place" actualizada con mismas mejoras de autenticación y theming
- Filtros avanzados con búsqueda, categorías y vista grid/list
- Interfaz completamente homogeneizada con Material Design 3

### ✅ Pipeline Generativo Avanzado y Colapsable (Enero 2025)
- Pipeline generativo colapsable ubicado después del input de texto
- Resumen dinámico: "intención-elementos icónicos (blendings)" como embeddings visuales
- Permanece colapsado por defecto para mantener interfaz limpia
- **4 secciones internas ajustables**:
  - **Intent Classification**: Dropdown con 8 categorías (Objeto, Acción, Emoción, Concepto, Lugar, Persona, Tiempo, Cantidad)
  - **NSM Mappings**: Textarea para explicaciones semánticas en lenguaje natural universal
  - **Visual Embeddings**: Sistema de tags/pills con embeddings visuales, incluyendo 22 embeddings comunes predefinidos y capacidad de agregar personalizados
  - **Layout Typology**: Selector de 8 tipologías estructurales predefinidas (Objeto Simple, Escena Horizontal/Vertical, Cuadrícula 2x2, Radial, Secuencial, Jerárquico, Comparativo)
- Vista previa visual del layout seleccionado
- Interfaz intuitiva con iconos diferenciados por color para cada sección

### ✅ Editor SVG Mejorado
- Manipulación directa del Virtual DOM como SVG
- Herramientas de dibujo integradas con Material 3
- Selección bidireccional entre árbol y canvas
- Sistema de zoom con "zoom extends" funcional
- Grilla de referencia y coordenadas precisas

### ✅ Pipeline Generativo Avanzado
- 6 pasos configurables basados en research
- Parámetros modificables por paso
- Interface expandible con configuración detallada
- Simulación completa del flujo de generación

### ✅ UX/UI Simplificado
- Eliminación de pestañas complejas
- Vista de árbol como navegación principal
- Propiedades colapsables auto-expandibles
- Interfaz más limpia y enfocada
- Selección automática en árbol al seleccionar en canvas

## Próximos Pasos Sugeridos

### Corto Plazo
1. **Arreglar advertencias React** en editor SVG (key props)
2. **Integrar API real** para modelos de IA
3. **Persistencia de configuraciones** del pipeline
4. **Export/Import** de configuraciones SVG

### Mediano Plazo
1. **Autenticación de usuarios** y perfiles
2. **Versionado de pictogramas** con historial
3. **Colaboración en tiempo real** entre usuarios
4. **API pública** para integración externa

### Largo Plazo
1. **Modelos de IA propios** entrenados en datos AAC
2. **Métricas y analytics** de uso
3. **App móvil** para consumo de pictogramas
4. **Marketplace** de pictogramas comunitarios

## Configuración de Desarrollo

### Workflows
- **"Start application"**: `npm run dev` (Express + Vite)
- **Puerto**: 5000 (unificado frontend + backend)
- **Base de datos**: PostgreSQL con variables de entorno

### Variables de Entorno Disponibles
- `DATABASE_URL`, `PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGUSER`

### Comandos Útiles
- `npm run db:push` - Aplicar cambios de esquema
- `npm run dev` - Iniciar desarrollo
- `npm run build` - Build para producción

## Notas Técnicas

### Decisiones Arquitecturales
1. **Virtual DOM = SVG DOM**: Usar React directamente para manipular SVG
2. **Material Design 3**: Sistema de diseño unificado y accesible
3. **Pipeline configurable**: Cada paso modificable por el usuario
4. **Multi-instancia**: Separación de datos por contexto cultural

### Consideraciones AAC
- **Alto contraste** en colores para accesibilidad
- **Líneas gruesas** para mejor visibilidad
- **Tipografía clara** con tamaños apropiados
- **Navegación simple** y consistente

### Performance
- **React Query** para caching eficiente
- **Virtual DOM** para renders optimizados de SVG
- **CSS Variables** para cambios temáticos rápidos
- **Code splitting** por páginas principales