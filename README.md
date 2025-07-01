# PictoNet - Plataforma de Pictogramas AAC con IA

PictoNet es una plataforma avanzada de comunicación visual para crear y gestionar pictogramas AAC (Comunicación Aumentativa y Alternativa) culturalmente adaptativos con soporte multiidioma sofisticado y pipeline generativo de IA.

## 🚀 Instalación en macOS con Homebrew

### Prerrequisitos

1. **Instalar Homebrew** (si no está instalado):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. **Instalar Node.js 20**:
```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

3. **Instalar PostgreSQL**:
```bash
brew install postgresql@14
brew services start postgresql@14
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

4. **Crear base de datos**:
```bash
createdb pictonet_dev
```

### Configuración del Proyecto

1. **Clonar el repositorio**:
```bash
git clone <repository-url>
cd pictonet
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Base de datos
DATABASE_URL="postgresql://localhost/pictonet_dev"
PGHOST="localhost"
PGPORT="5432"
PGDATABASE="pictonet_dev"
PGUSER="tu_usuario"
PGPASSWORD="tu_password"

# Autenticación OAuth
REPLIT_DOMAINS="localhost:5000"
REPL_ID="tu_repl_id"
SESSION_SECRET="tu_session_secret_muy_seguro"
ISSUER_URL="https://replit.com/oidc"
```

4. **Configurar esquema de base de datos**:
```bash
npm run db:push
```

5. **Iniciar el servidor de desarrollo**:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5000`

## 📦 Dependencias

### Frontend
- **React 18** - Framework de interfaz de usuario
- **TypeScript** - Tipado estático
- **Material Design 3** - Sistema de diseño
- **Tailwind CSS** - Framework de estilos
- **Wouter** - Router ligero para React
- **React Query** - Gestión de estado y cache
- **Framer Motion** - Animaciones
- **Lucide React** - Iconografía

### Backend
- **Express.js** - Framework web para Node.js
- **Drizzle ORM** - ORM TypeScript-first
- **PostgreSQL** - Base de datos relacional
- **Passport.js** - Autenticación OAuth
- **OpenID Connect** - Protocolo de autenticación

### Herramientas de Desarrollo
- **Vite** - Build tool y servidor de desarrollo
- **ESBuild** - Transpilador rápido
- **Drizzle Kit** - Migraciones y utilidades de BD
- **TSX** - Runtime TypeScript para Node.js

## 🗂️ Estructura de Directorios

```
pictonet/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── chat-interface.tsx          # Interfaz de chat principal
│   │   │   ├── generative-pipeline.tsx     # Pipeline de 6 pasos IA
│   │   │   ├── react-svg-editor.tsx        # Editor SVG React-nativo
│   │   │   ├── top-bar.tsx                 # Barra superior unificada
│   │   │   ├── hierarchical-nav.tsx        # Navegación árbol DOM
│   │   │   └── language-selector.tsx       # Selector de idiomas
│   │   ├── hooks/              # Hooks personalizados
│   │   │   └── useAuth.ts                  # Hook de autenticación
│   │   ├── lib/                # Utilidades y configuración
│   │   │   ├── design-system.ts            # Tokens Material Design 3
│   │   │   ├── queryClient.ts              # Configuración React Query
│   │   │   ├── i18n.ts                     # Internacionalización
│   │   │   └── utils.ts                    # Utilidades generales
│   │   ├── pages/              # Páginas de la aplicación
│   │   │   ├── home-simple.tsx             # Página de inicio
│   │   │   ├── svg-editor.tsx              # Editor principal (FINAL)
│   │   │   ├── place-md3.tsx               # Vista por instancia
│   │   │   ├── dictionary.tsx              # Diccionario pictogramas
│   │   │   └── not-found.tsx               # Página 404
│   │   ├── App.tsx             # Componente raíz
│   │   ├── main.tsx            # Punto de entrada
│   │   └── index.css           # Estilos globales y variables CSS
│   └── index.html              # Template HTML
├── server/                     # Backend Express
│   ├── index.ts                # Servidor principal
│   ├── routes.ts               # Rutas API REST
│   ├── storage.ts              # Capa de datos (DatabaseStorage)
│   ├── db.ts                   # Configuración Drizzle ORM
│   ├── replitAuth.ts           # Autenticación OAuth
│   └── vite.ts                 # Configuración Vite SSR
├── shared/                     # Código compartido
│   └── schema.ts               # Esquemas Drizzle y tipos
├── attached_assets/            # Assets de ejemplo
├── package.json                # Dependencias y scripts
├── vite.config.ts             # Configuración Vite
├── tailwind.config.ts         # Configuración Tailwind
├── drizzle.config.ts          # Configuración ORM
├── tsconfig.json              # Configuración TypeScript
└── replit.md                  # Documentación arquitectural
```

### Descripción de Componentes Principales

#### `client/src/components/`
- **`chat-interface.tsx`**: Interfaz tipo ChatGPT para generación de pictogramas
- **`generative-pipeline.tsx`**: Pipeline de 6 pasos configurables con IA
- **`react-svg-editor.tsx`**: Editor SVG que manipula directamente el Virtual DOM
- **`top-bar.tsx`**: Barra superior unificada con navegación y controles
- **`hierarchical-nav.tsx`**: Navegación en árbol del DOM SVG

#### `server/`
- **`routes.ts`**: API REST con autenticación OAuth y CRUD completo
- **`storage.ts`**: Implementación DatabaseStorage con Drizzle ORM
- **`replitAuth.ts`**: Sistema de autenticación con OpenID Connect

#### `shared/schema.ts`
- Esquemas de base de datos con Drizzle ORM
- Tipos TypeScript para frontend y backend
- Relaciones entre tablas (usuarios, espacios, bibliotecas, pictogramas)

## 🎨 Personalización de Interfaz

### Sistema de Diseño Material Design 3

La interfaz utiliza un sistema de diseño centralizado basado en Material Design 3:

#### Configuración Central (`client/src/lib/design-system.ts`):
```typescript
export const DesignTokens = {
  typography: {
    baseFontSize: 16,
    fontFamily: {
      primary: '"Lexend", sans-serif',  // AAC optimizado
      mono: '"JetBrains Mono", monospace'
    },
    scale: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, ... }
  },
  colors: {
    primary: { 50: '#f0f9ff', 500: '#3b82f6', 900: '#1e3a8a' },
    secondary: { 50: '#f7fee7', 500: '#65a30d', 900: '#365314' },
    pictonet: { 50: '#fef3c7', 500: '#f59e0b', 900: '#78350f' }
  },
  spacing: {
    unit: 4,
    scale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, ... }
  },
  borderRadius: { xs: 4, sm: 8, md: 12, lg: 16 },
  elevation: {
    level0: { boxShadow: 'none' },
    level1: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    ...
  }
}
```

#### Variables CSS Personalizadas (`client/src/index.css`):
```css
:root {
  --font-family-interface: 'Lexend', sans-serif;
  --text-transform-uppercase: uppercase;
  --color-primary: 59 130 246;
  --color-secondary: 101 163 13;
  --spacing-unit: 4px;
  --border-radius-none: 0px;  /* Sin esquinas redondeadas */
}

.dark {
  --color-background: 15 23 42;
  --color-text: 241 245 249;
}
```

### Tipografía AAC Optimizada

La tipografía está optimizada para comunicación aumentativa:

```css
.aac-text {
  font-family: var(--font-family-interface);
  text-transform: var(--text-transform-uppercase);
  font-weight: 600;
  letter-spacing: 0.025em;
}

.aac-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.aac-button {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
}
```

### Personalización de Colores

Para personalizar los colores del sistema:

1. **Modificar tokens en `design-system.ts`**:
```typescript
colors: {
  primary: {
    50: '#tu-color-claro',
    500: '#tu-color-medio',
    900: '#tu-color-oscuro'
  }
}
```

2. **Actualizar variables CSS en `index.css`**:
```css
:root {
  --color-primary: tu-r tu-g tu-b;
}
```

### Modo Día/Noche

El sistema soporta modo oscuro automático:

```typescript
// Activar/desactivar en componentes
const { isDarkMode, toggleTheme } = useTheme();

// CSS automático
className="bg-white dark:bg-gray-900 text-black dark:text-white"
```

### Internacionalización

Soporta 10 idiomas con detección automática:

```typescript
// Configurar idiomas en i18n.ts
const messages = {
  'es-CL': { 'welcome': 'Bienvenido a PictoNet' },
  'en': { 'welcome': 'Welcome to PictoNet' },
  'mi': { 'welcome': 'Nau mai ki PictoNet' }
};

// Usar en componentes
const t = useTranslation();
<h1>{t('welcome')}</h1>
```

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build para producción

# Base de datos
npm run db:push          # Aplicar cambios de esquema
npm run db:studio        # Abrir Drizzle Studio

# Linting y formato
npm run lint             # Verificar código
npm run format           # Formatear código
```

## 🌍 Funcionalidades Principales

### Pipeline Generativo de IA (6 Pasos)
1. **Intent Classification** - Clasificación de intención con RoBERTa
2. **NSM Mapping** - Mapeo semántico natural
3. **Conceptual Blending** - Mezcla conceptual con ConceptNet
4. **Icon Selection** - Selección de iconos con ARASAAC API
5. **Visual Layout** - Planificación de layout con FLAN-T5
6. **Styling + Metadata** - Estilizado con CodeT5+ y SVG-VAE

### Sistema Multi-Usuario
- **Espacios de trabajo** privados por usuario
- **Bibliotecas de pictogramas** organizadas jerárquicamente
- **Colaboración** con roles (owner, editor, viewer)
- **Autenticación OAuth** segura con Replit Auth

### Editor SVG React-Nativo
- **Manipulación directa** del Virtual DOM
- **Herramientas integradas** (select, formas, texto, path)
- **Navegación jerárquica** del árbol DOM
- **Zoom y grilla** de referencia

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte y preguntas:
- 📧 Email: soporte@pictonet.com
- 📖 Documentación: `/docs`
- 🐛 Issues: GitHub Issues

---

**PictoNet** - Democratizando la comunicación visual con IA 🎨✨