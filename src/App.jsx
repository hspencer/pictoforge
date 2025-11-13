import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSVGParser } from './hooks/useSVGParser';
import { I18nProvider, useI18n } from './hooks/useI18n.jsx';
import { createSVGOptimizer } from './services/SVGOptimizer';
import Container from './components/Container';
import TextInput from './components/TextInput';
import SVGHierarchy from './components/SVGHierarchy';
import SVGViewer from './components/SVGViewer';
import CodeView from './components/CodeView';
import FileLoadDemo from './components/FileLoadDemo';
import LanguageSelector from './components/LanguageSelector';
import './App.css';

// Importar el SVG de ejemplo
import pictogramSVG from './assets/pictogram.svg?url';

// Componente principal de la aplicación con internacionalización
function AppContent() {
  const { t } = useI18n();
  const [darkMode, setDarkMode] = useState(false);
  const [currentText, setCurrentText] = useState(t('textInputPlaceholder'));
  const [expandedElements, setExpandedElements] = useState(new Set(['pictogram', 'bed', 'person']));
  const [showCodeView, setShowCodeView] = useState(false);
  const [currentTool, setCurrentTool] = useState('select');
  
  const {
    svgData,
    selectedElement,
    svgContent,
    loadSVG,
    setSelectedElement,
    findElementById
  } = useSVGParser();

  /**
   * Carga el SVG de ejemplo al iniciar la aplicación
   */
  useEffect(() => {
    const loadExampleSVG = async () => {
      try {
        const response = await fetch(pictogramSVG);
        const svgContent = await response.text();
        loadSVG(svgContent);
      } catch (error) {
        console.error('Error cargando SVG de ejemplo:', error);
      }
    };

    loadExampleSVG();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Maneja el cambio de tema
   */
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  /**
   * Maneja el cambio de texto en el input superior
   */
  const handleTextChange = (text) => {
    setCurrentText(text);
  };

  /**
   * Maneja la carga de archivos SVG
   */
  const handleFileLoad = (svgContent, fileName) => {
    loadSVG(svgContent);
    setCurrentText(`Archivo cargado: ${fileName}`);
  };

  /**
   * Maneja la selección de elementos desde la jerarquía o el visor
   */
  const handleElementSelect = (element, fromHierarchy = false) => {
    setSelectedElement(element);

    // Si la selección viene de la jerarquía, cambiar a herramienta node
    if (fromHierarchy && element) {
      setCurrentTool('node');
    }

    // Auto-expandir la ruta hacia el elemento seleccionado
    if (element && svgData) {
      const path = getElementPath(element.id);
      const newExpanded = new Set(expandedElements);

      path.forEach(pathElement => {
        newExpanded.add(pathElement.id);
      });

      setExpandedElements(newExpanded);
    }
  };

  /**
   * Obtiene la ruta completa hacia un elemento (para auto-expansión)
   */
  const getElementPath = (elementId) => {
    if (!svgData) return [];
    
    const findPath = (element, targetId, currentPath = []) => {
      const newPath = [...currentPath, element];
      
      if (element.id === targetId) {
        return newPath;
      }
      
      for (const child of element.children) {
        const result = findPath(child, targetId, newPath);
        if (result) return result;
      }
      
      return null;
    };
    
    return findPath(svgData.root, elementId) || [];
  };

  /**
   * Maneja la expansión/colapso de elementos en la jerarquía
   */
  const handleToggleExpand = (elementId) => {
    const newExpanded = new Set(expandedElements);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setExpandedElements(newExpanded);
  };

  /**
   * Maneja los cambios de estilo en los elementos
   */
  const handleStyleChange = (elementId, newClassName) => {
    if (!svgData || !svgContent) return;

    // Actualizar el SVG en el DOM
    const svgElement = document.querySelector('#root svg');
    if (svgElement) {
      const targetElement = svgElement.querySelector(`#${elementId}`);
      if (targetElement) {
        targetElement.setAttribute('class', newClassName);
        
        // Actualizar el contenido SVG para mantener sincronización
        const updatedSVG = svgElement.outerHTML;
        
        // Re-parsear el SVG actualizado
        loadSVG(updatedSVG);
        
        console.log(`Estilo actualizado para ${elementId}: ${newClassName}`);
      }
    }
  };

  /**
   * Maneja el guardado del SVG con optimización
   */
  const handleSave = async () => {
    if (!svgContent) return;

    try {
      // Crear instancia del optimizador
      const optimizer = createSVGOptimizer();

      // Obtener metadatos del SVG (si existen)
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = doc.documentElement;

      const metadata = {
        title: svgElement.querySelector('title')?.textContent || '',
        desc: svgElement.querySelector('desc')?.textContent || '',
        lang: svgElement.getAttribute('lang') || 'en',
      };

      // Optimizar SVG con metadatos de accesibilidad
      const result = await optimizer.processForExport(svgContent, metadata, {
        floatPrecision: 4,
      });

      console.log('✅ SVG optimizado para exportación:', result.info);

      // Descargar SVG optimizado
      const blob = new Blob([result.data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pictogram_${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error al guardar SVG:', error);
      // Fallback: guardar sin optimizar
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pictogram_${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  /**
   * Alterna la vista de código
   */
  const handleToggleCodeView = () => {
    setShowCodeView(!showCodeView);
  };

  /**
   * Actualiza el SVG desde la vista de código
   */
  const handleSVGUpdate = (newSVGContent) => {
    loadSVG(newSVGContent);
  };

  /**
   * Duplica un elemento
   */
  const handleDuplicate = (element) => {
    console.log('Duplicar elemento:', element);
    // Implementación futura
  };

  /**
   * Elimina un elemento
   */
  const handleDelete = (elementId) => {
    console.log('Eliminar elemento:', elementId);
    // Implementación futura
  };

  return (
    <Container className={`bg-background text-foreground ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            {t('appTitle')}
          </h1>
          <div className="text-sm text-muted-foreground">
            {t('appSubtitle')}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            title={t('changeTheme')}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <LanguageSelector />
        </div>
      </header>

      {/* Input de texto superior */}
      <TextInput
        currentText={currentText}
        onTextChange={handleTextChange}
        onFileLoad={handleFileLoad}
        placeholder={t('textInputPlaceholder')}
      />

      {/* Demostración de carga de archivos */}
      {!svgData && (
        <div className="p-4 border-b bg-muted/10">
          <FileLoadDemo onLoadExample={handleFileLoad} />
        </div>
      )}



      {/* Layout principal de dos paneles */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Jerarquía de elementos */}
        <div className="w-1/2 border-r bg-muted/10 flex flex-col">
          <SVGHierarchy
            svgData={svgData}
            selectedElement={selectedElement}
            onElementSelect={handleElementSelect}
            expandedElements={expandedElements}
            onToggleExpand={handleToggleExpand}
            onStyleChange={handleStyleChange}
            onSVGUpdate={handleSVGUpdate}
            svgContent={svgContent}
          />
        </div>

        {/* Panel derecho - Visor SVG o Vista de Código */}
        <div className="w-1/2 flex flex-col">
          {showCodeView ? (
            <CodeView
              svgContent={svgContent}
              selectedElement={selectedElement}
              onSVGUpdate={handleSVGUpdate}
            />
          ) : (
            <SVGViewer
              svgContent={svgContent}
              selectedElement={selectedElement}
              onElementSelect={handleElementSelect}
              svgData={svgData}
              initialTool={currentTool}
              onToolChange={setCurrentTool}
            />
          )}
        </div>
      </div>

      {/* Footer con información */}
      <footer className="p-2 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span>
              {svgData ? `${Object.keys(svgData.styles || {}).length} ${t('stylesCount')}` : t('noSVGLoaded')}
            </span>
            {selectedElement && (
              <span>
                {t('selectedElement')}: {selectedElement.id} ({selectedElement.tagName})
              </span>
            )}
          </div>
          <div>
            {t('version')}
          </div>
        </div>
      </footer>
    </Container>
  );
}

// Wrapper principal con proveedor de internacionalización
function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
