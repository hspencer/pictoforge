# Instalación Rápida de PictoForge

## 🚀 Inicio Rápido (5 minutos)

### 1. Extraer el proyecto
```bash
# Extraer el archivo
tar -xzf pictoforge-complete.tar.gz
cd pictoforge
```

### 2. Instalar dependencias
```bash
# Con npm
npm install

# O con pnpm (recomendado)
pnpm install
```

### 3. Ejecutar en desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
# o
pnpm run dev
```

### 4. Abrir en navegador
- Ir a: `http://localhost:5173`
- ¡Listo! La aplicación debería estar funcionando

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
npm run lint         # Verificar código

# Con pnpm
pnpm run dev
pnpm run build
pnpm run preview
pnpm run lint
```

## 📁 Estructura Importante

```
pictoforge/
├── src/
│   ├── components/     # Todos los componentes React
│   ├── hooks/         # Hook personalizado useSVGParser
│   ├── assets/        # SVGs de ejemplo
│   └── App.jsx        # Componente principal
├── README.md          # Documentación completa
├── package.json       # Dependencias y scripts
└── dist/             # Archivos de producción (después de build)
```

## 🎯 Probar la Aplicación

1. **Cargar SVG de ejemplo**: Usa los botones de ejemplo en la interfaz
2. **Explorar jerarquía**: Haz clic en elementos del panel izquierdo
3. **Cambiar estilos**: Selecciona elementos y usa el panel de estilos
4. **Ver código**: Usa el botón "Ver código SVG"
5. **Cambiar tema**: Botón de luna/sol en la esquina superior

## ⚠️ Solución de Problemas

### Error de dependencias
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Puerto ocupado
```bash
# Usar puerto diferente
npm run dev -- --port 3000
```

### Problemas de permisos
```bash
# En sistemas Unix/Linux
sudo chown -R $USER:$USER pictoforge/
```

## 🌐 Despliegue

### Netlify/Vercel
1. `npm run build`
2. Subir carpeta `dist/`

### Servidor propio
1. `npm run build`
2. Servir carpeta `dist/` con cualquier servidor web

---

**¿Problemas?** Revisa el README.md para documentación completa.
