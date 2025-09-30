import React, { useState, useEffect } from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSVGParser } from './hooks/useSVGParser';
import TextInput from './components/TextInput';
import SVGHierarchy from './components/SVGHierarchy';
import SVGViewer from './components/SVGViewer';
import StylePanel from './components/StylePanel';
import AdvancedTools from './components/AdvancedTools';
import CodeView from './components/CodeView';
import FileLoadDemo from './components/FileLoadDemo';
import './App.css';

// Importar el SVG de ejemplo
import pictogramSVG from './assets/pictogram.svg?url';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentText, setCurrentText] = useState('make the bed');
  const [expandedElements, setExpandedElements] = useState(new Set(['pictogram', 'bed', 'person']));
  const [showCodeView, setShowCodeView] = useState(false);
  
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
  }, [loadSVG]);

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
  const handleElementSelect = (element) => {
    setSelectedElement(element);
    
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
   * Maneja el guardado del SVG
   */
  const handleSave = () => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pictogram_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className={`h-screen flex flex-col bg-background text-foreground ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            PICTO • FORGE
          </h1>
          <div className="text-sm text-muted-foreground">
            Editor SVG Semántico
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            title="Cambiar tema"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Idioma"
          >
            <Globe size={16} />
          </Button>
        </div>
      </header>

      {/* Input de texto superior */}
      <TextInput
        currentText={currentText}
        onTextChange={handleTextChange}
        onFileLoad={handleFileLoad}
        placeholder="Describe lo que quieres crear o carga un archivo SVG..."
      />

      {/* Demostración de carga de archivos */}
      {!svgData && (
        <div className="p-4 border-b bg-muted/10">
          <FileLoadDemo onLoadExample={handleFileLoad} />
        </div>
      )}

      {/* Herramientas avanzadas */}
      <AdvancedTools
        svgData={svgData}
        selectedElement={selectedElement}
        onSave={handleSave}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleCodeView={handleToggleCodeView}
        showCodeView={showCodeView}
      />

      {/* Layout principal de tres paneles */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Jerarquía de elementos */}
        <div className="w-80 border-r bg-muted/10 flex flex-col">
          <SVGHierarchy
            svgData={svgData}
            selectedElement={selectedElement}
            onElementSelect={handleElementSelect}
            expandedElements={expandedElements}
            onToggleExpand={handleToggleExpand}
          />
          
          {/* Panel de estilos en la parte inferior del panel izquierdo */}
          <div className="border-t">
            <StylePanel
              svgData={svgData}
              selectedElement={selectedElement}
              onStyleChange={handleStyleChange}
            />
          </div>
        </div>

        {/* Panel central - Visor SVG o Vista de Código */}
        <div className="flex-1 flex flex-col">
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
            />
          )}
        </div>
      </div>

      {/* Footer con información */}
      <footer className="p-2 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              {svgData ? `${Object.keys(svgData.styles || {}).length} estilos` : 'Sin SVG'}
            </span>
            {selectedElement && (
              <span>
                Seleccionado: {selectedElement.id} ({selectedElement.tagName})
              </span>
            )}
          </div>
          <div>
            PictoForge v1.0 - Editor SVG Semántico
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
