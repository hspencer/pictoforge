# Sistema de Almacenamiento Local - PictoForge

## 📦 Resumen

PictoForge implementa un sistema de almacenamiento local robusto usando **localStorage** para persistir datos del usuario entre sesiones.

---

## 🎯 Características

### ✅ Almacenamiento Implementado

1. **Último SVG trabajado** - Se guarda automáticamente
2. **Historial reciente** - Últimos 5 SVGs modificados
3. **Configuraciones de usuario** - Tema, idioma, preferencias
4. **Auto-guardado** - Guardado automático al modificar SVG
5. **Exportar/Importar** - Backup completo en JSON

---

## 📊 Límites de localStorage

| Navegador | Límite típico |
|-----------|---------------|
| Chrome    | 10 MB         |
| Firefox   | 10 MB         |
| Safari    | 5 MB          |
| Edge      | 10 MB         |

### Estrategia de Gestión de Espacio

- **Historial limitado**: Solo últimos 5 SVGs
- **Auto-limpieza**: Si se llena, elimina automáticamente el más antiguo
- **Compresión**: Los datos se almacenan como JSON optimizado
- **Alertas**: Avisa al usuario si el espacio está lleno

---

## 🔧 Hooks Disponibles

### 1. `useLocalStorage(key, initialValue)`

Hook básico para cualquier dato en localStorage.

```javascript
import { useLocalStorage } from '@/hooks/useLocalStorage';

function MyComponent() {
  const [darkMode, setDarkMode] = useLocalStorage('dark_mode', false);

  return (
    <button onClick={() => setDarkMode(!darkMode)}>
      Cambiar a {darkMode ? 'claro' : 'oscuro'}
    </button>
  );
}
```

**Características:**
- ✅ Sincronización entre tabs
- ✅ Manejo automático de JSON
- ✅ Manejo de errores (cuota excedida)
- ✅ Función de eliminación incluida

---

### 2. `useSVGStorage()`

Hook especializado para gestionar SVGs y configuraciones.

```javascript
import { useSVGStorage } from '@/hooks/useSVGStorage';

function App() {
  const {
    lastSVG,
    recentSVGs,
    userConfig,
    saveSVG,
    loadLastSVG,
    updateConfig,
    getStorageStats
  } = useSVGStorage();

  // Guardar SVG al modificarlo
  const handleSVGChange = (svgData) => {
    saveSVG(svgData, {
      name: 'mi-svg.svg',
      author: 'Usuario'
    });
  };

  // Cargar último SVG al iniciar
  useEffect(() => {
    const last = loadLastSVG();
    if (last) {
      loadSVGToEditor(last.content);
    }
  }, []);

  return (
    <div>
      {/* Tu app */}
    </div>
  );
}
```

**Métodos disponibles:**

| Método | Descripción |
|--------|-------------|
| `saveSVG(svgData, metadata)` | Guarda SVG en localStorage |
| `loadLastSVG()` | Carga el último SVG guardado |
| `getRecentSVGs()` | Obtiene historial reciente |
| `deleteSVG(id)` | Elimina un SVG del historial |
| `clearHistory()` | Limpia todo el historial |
| `updateConfig(newConfig)` | Actualiza configuración |
| `getStorageStats()` | Obtiene estadísticas de uso |
| `exportHistory()` | Descarga backup en JSON |
| `importHistory(jsonData)` | Importa backup |

---

## 🎨 Componente SVGHistory

Componente UI para mostrar y gestionar el historial.

```javascript
import { SVGHistory } from '@/components/SVGHistory';

function Sidebar() {
  const handleLoadSVG = (svgContent, name) => {
    // Cargar SVG en el editor
    console.log('Cargando:', name);
  };

  return (
    <SVGHistory onLoadSVG={handleLoadSVG} />
  );
}
```

**Características del componente:**
- 📋 Lista de SVGs recientes
- 🗑️ Eliminar SVGs individuales
- 📤 Exportar historial completo
- 📥 Importar backup
- 💾 Estadísticas de almacenamiento
- ⏱️ Timestamps relativos ("Hace 2h")

---

## 🚀 Implementación Rápida

### Paso 1: Integrar en App.jsx

```javascript
import { useSVGStorage } from '@/hooks/useSVGStorage';
import { SVGHistory } from '@/components/SVGHistory';

function App() {
  const { saveSVG, loadLastSVG, userConfig, updateConfig } = useSVGStorage();

  // Auto-guardar al cambiar SVG
  useEffect(() => {
    if (svgData) {
      saveSVG(svgData, { name: currentFileName });
    }
  }, [svgData]);

  // Cargar último SVG al iniciar
  useEffect(() => {
    const last = loadLastSVG();
    if (last) {
      loadSVG(last.content);
    }
  }, []);

  // Aplicar configuración guardada
  useEffect(() => {
    if (userConfig.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [userConfig]);

  return (
    <div>
      {/* Tu interfaz */}
      <Sidebar>
        <SVGHistory onLoadSVG={handleFileLoad} />
      </Sidebar>
    </div>
  );
}
```

### Paso 2: Auto-guardado inteligente

```javascript
// Guardar solo si hay cambios significativos
const [hasChanges, setHasChanges] = useState(false);

useEffect(() => {
  if (hasChanges && svgData) {
    // Debounce de 2 segundos
    const timer = setTimeout(() => {
      saveSVG(svgData, {
        name: currentFileName,
        autoSaved: true
      });
      setHasChanges(false);
      console.log('✓ Auto-guardado');
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [svgData, hasChanges]);
```

---

## 🛡️ Manejo de Errores

El sistema maneja automáticamente:

1. **Cuota excedida**: Limpia historial antiguo y reintenta
2. **JSON inválido**: Retorna valor por defecto
3. **localStorage no disponible**: Funciona en memoria (sin persistencia)
4. **Sincronización entre tabs**: Actualiza automáticamente

---

## 📈 Monitoreo de Uso

```javascript
const stats = getStorageStats();

console.log('Estadísticas:');
console.log('- Tamaño total:', stats.totalSizeKB, 'KB');
console.log('- SVGs en historial:', stats.recentCount);
console.log('- Último SVG:', stats.lastSVGSize, 'bytes');
```

---

## 💡 Mejores Prácticas

### ✅ DO

- Guardar solo datos necesarios
- Usar auto-guardado con debounce
- Limpiar historial periódicamente
- Ofrecer exportación de datos
- Validar datos antes de guardar

### ❌ DON'T

- Guardar archivos muy grandes (>1MB)
- Guardar datos sensibles
- Sincronizar en cada keystroke
- Almacenar sin compresión
- Olvidar manejo de errores

---

## 🔮 Futuras Mejoras

- [ ] Implementar IndexedDB para SVGs grandes
- [ ] Compresión de datos con LZ-string
- [ ] Sincronización con cloud (opcional)
- [ ] Versionado de SVGs
- [ ] Historial ilimitado con IndexedDB
- [ ] Búsqueda en historial
- [ ] Tags y categorías

---

## 📚 Referencias

- [localStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [IndexedDB MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage Limits](https://web.dev/storage-for-the-web/)
