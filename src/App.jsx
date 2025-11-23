import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSVGParser } from './hooks/useSVGParser';
import { useSVGStorage } from './hooks/useSVGStorage';
import { I18nProvider, useI18n } from './hooks/useI18n.jsx';
import { createSVGOptimizer } from './services/SVGOptimizer';
import Container from './components/Container';
import TextInput from './components/TextInput';
import SVGHierarchy from './components/SVGHierarchy';
import SVGViewer from './components/SVGViewer';
import CodeView from './components/CodeView';
import FileLoadDemo from './components/FileLoadDemo';
import SettingsView from './components/SettingsView';
import EntityEditDialog from './semantic/components/EntityEditDialog';
import './App.css';

// Importar el SVG de ejemplo
import pictogramSVG from './assets/pictogram.svg?url';

// Componente principal de la aplicación con internacionalización
function AppContent() {
  const { t, changeLanguage, currentLanguage } = useI18n();
  const [darkMode, setDarkMode] = useState(false);
  const [currentText, setCurrentText] = useState(t('textInputPlaceholder'));
  const [expandedElements, setExpandedElements] = useState(new Set(['pictogram', 'bed', 'person']));
  const [showCodeView, setShowCodeView] = useState(false);
  const [currentTool, setCurrentTool] = useState('select');
  const [showSettings, setShowSettings] = useState(false);

  // Semantic Layer state
  const [nluSchema, setNluSchema] = useState(null);
  const [schemaStatus, setSchemaStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'editing'
  const [schemaError, setSchemaError] = useState(null);
  const [entityEditDialog, setEntityEditDialog] = useState({ isOpen: false, entity: null });

  // Callback para guardar en historial (lo recibimos de SVGViewer)
  const svgHistoryCallback = React.useRef(null);

  const {
    svgData,
    selectedElement,
    svgContent,
    loadSVG,
    setSelectedElement,
    findElementById
  } = useSVGParser();

  const { userConfig, updateConfig } = useSVGStorage();

  /**
   * Sincroniza el idioma guardado con el contexto i18n al iniciar
   */
  useEffect(() => {
    if (userConfig?.language && userConfig.language !== currentLanguage) {
      changeLanguage(userConfig.language);
      console.log('✓ Idioma sincronizado desde configuración:', userConfig.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userConfig?.language]);

  /**
   * Carga el SVG de ejemplo al iniciar la aplicación
   */
  useEffect(() => {
    const loadExampleSVG = async () => {
      try {
        console.log('🔄 Cargando SVG de ejemplo...');
        const response = await fetch(pictogramSVG);
        const svgContent = await response.text();
        const result = await loadSVG(svgContent);

        if (result && result.success) {
          console.log('✓ SVG de ejemplo cargado al iniciar la app');
          setCurrentText('SVG de ejemplo cargado');

          // DEMO: Cargar un schema de ejemplo después de 1 segundo
          setTimeout(() => {
            const exampleSchema = {
              utterance: "make the bed",
              lang: "en",
              metadata: {
                speech_act: "directive",
                intent: "request"
              },
              frames: [
                {
                  id: "f1",
                  frame_name: "Directed_action",
                  lexical_unit: "make",
                  roles: {
                    Agent: { type: "Addressee", ref: "you", surface: "you" },
                    Theme: { type: "Object", lemma: "bed", surface: "the bed" }
                  }
                }
              ],
              logical_form: {
                event: "make(you, bed)",
                modality: "want(I, event)"
              },
              visual_guidelines: {
                focus_actor: "you",
                context: "bedroom",
                temporal: "immediate"
              }
            };

            console.log('📋 Cargando NLU Schema de ejemplo...');
            setNluSchema(exampleSchema);
            setSchemaStatus('ready');
            setCurrentText('✓ Pictogram with NLU Schema loaded');
          }, 1000);
        } else {
          console.error('✗ Error al cargar SVG de ejemplo:', result?.error);
        }
      } catch (error) {
        console.error('✗ Error cargando SVG de ejemplo:', error);
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
  const handleFileLoad = async (svgContent, fileName) => {
    try {
      const result = await loadSVG(svgContent);

      // Verificar si el parseo fue exitoso
      if (!result || !result.success) {
        const errorMsg = result?.error || 'Error desconocido al cargar el archivo';
        setCurrentText(`Error al cargar ${fileName}: ${errorMsg}`);
        console.error('Error cargando SVG:', errorMsg);
        return false;
      }

      setCurrentText(`✓ Archivo cargado: ${fileName}`);
      return true;
    } catch (error) {
      setCurrentText(`Error al cargar ${fileName}: ${error.message}`);
      console.error('Error en handleFileLoad:', error);
      return false;
    }
  };

  /**
   * Maneja cambios en el NLU Schema (cuando el usuario edita)
   */
  const handleSchemaChange = (schemaText) => {
    setSchemaStatus('editing');
    setSchemaError(null);
  };

  /**
   * Maneja la generación de pictograma desde NLU Schema editado
   */
  const handleSchemaGenerate = (schema) => {
    try {
      console.log('🔄 Generando pictograma desde schema modificado:', schema);
      // TODO: Implementar generación con PictoNet API (Fase 2.4)
      setNluSchema(schema);
      setSchemaStatus('ready');
      setSchemaError(null);
    } catch (error) {
      console.error('✗ Error generando pictograma:', error);
      setSchemaError(`Error: ${error.message}`);
    }
  };

  /**
   * Abre el dialog de edición para una entidad específica
   */
  const handleEntityDoubleClick = (entity) => {
    console.log('🔍 Abriendo editor de entidad:', entity);

    // Buscar el elemento DOM real del SVG
    const svgElement = document.querySelector('#pictoforge-main-svg');
    if (svgElement && entity.id) {
      const domElement = svgElement.querySelector(`#${CSS.escape(entity.id)}`);
      if (domElement) {
        // Agregar referencia al elemento DOM
        const enrichedEntity = {
          ...entity,
          element: domElement
        };
        console.log('✓ Elemento DOM encontrado para preview:', entity.id);
        setEntityEditDialog({ isOpen: true, entity: enrichedEntity });
      } else {
        console.warn('⚠️ No se encontró elemento DOM para:', entity.id);
        setEntityEditDialog({ isOpen: true, entity });
      }
    } else {
      console.warn('⚠️ SVG no encontrado o entity sin ID');
      setEntityEditDialog({ isOpen: true, entity });
    }
  };

  /**
   * Actualiza la entidad (cambio de nombre/ID)
   */
  const handleUpdateEntity = (updatedEntity) => {
    console.log('✏️ Actualizando entidad:', updatedEntity);

    if (!updatedEntity || !updatedEntity.id) {
      console.error('❌ No se puede actualizar: entity sin ID');
      return;
    }

    try {
      // Buscar el elemento DOM en el SVG principal
      const svgElement = document.querySelector('#pictoforge-main-svg');
      if (!svgElement) {
        console.error('❌ SVG principal no encontrado');
        return;
      }

      // Buscar el elemento por su ID original (antes del cambio)
      const oldId = entityEditDialog.entity?.id;
      const domElement = svgElement.querySelector(`#${CSS.escape(oldId)}`);

      if (!domElement) {
        console.error('❌ Elemento no encontrado en DOM:', oldId);
        return;
      }

      // Detectar qué cambió: ID, clase CSS, o ambos
      const idChanged = updatedEntity.id !== oldId;
      const classChanged = updatedEntity.className !== undefined;

      // Aplicar cambios
      if (idChanged) {
        const newId = updatedEntity.id;
        domElement.setAttribute('id', newId);
        console.log('✅ ID actualizado:', { oldId, newId });
      }

      if (classChanged) {
        if (updatedEntity.className === null || updatedEntity.className === 'inherit') {
          domElement.removeAttribute('class');
          console.log('✅ Clase CSS removida');
        } else {
          domElement.setAttribute('class', updatedEntity.className);
          console.log('✅ Clase CSS actualizada:', updatedEntity.className);
        }
      }

      // Obtener el SVG actualizado
      const svgContainer = document.querySelector('#pictogram-content');
      if (svgContainer) {
        // Reconstruir el SVG completo con el cambio
        const fullSVG = svgElement.outerHTML;

        // Guardar en historial si el callback está disponible
        if (svgHistoryCallback.current) {
          svgHistoryCallback.current(fullSVG);
          console.log('💾 Cambio guardado en historial');
        }

        // Re-parsear el SVG para actualizar el estado
        loadSVG(fullSVG);

        // Buscar y seleccionar el elemento con el nuevo ID (si cambió)
        if (idChanged) {
          setTimeout(() => {
            const element = findElementById(updatedEntity.id);
            if (element) {
              setSelectedElement(element);
              console.log('✅ Elemento re-seleccionado con nuevo ID:', updatedEntity.id);
            }
          }, 100);
        }
      }

      // Cerrar el dialog
      setEntityEditDialog({ isOpen: false, entity: null });
    } catch (error) {
      console.error('❌ Error actualizando entidad:', error);
    }
  };

  /**
   * Regenera una entidad específica usando PictoNet API
   */
  const handleRegenerateEntity = async ({ entity, prompt }) => {
    console.log('🔄 Regenerando entidad:', entity, 'con prompt:', prompt);
    // TODO: Implementar regeneración con PictoNet API (Fase 2.4)
    // Placeholder: simular delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✓ Entidad regenerada (simulado)');
    return true;
  };

  /**
   * Maneja la selección de elementos desde la jerarquía o el visor
   */
  const handleElementSelect = (element, fromHierarchy = false) => {
    setSelectedElement(element);

    // SIMPLIFICACIÓN: Ya no cambiamos automáticamente de herramienta
    // El usuario puede mantener su herramienta preferida
    // y la selección se mantiene consistente

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

  /**
   * Maneja el guardado de configuración
   */
  const handleSaveSettings = (newConfig) => {
    // Si el idioma cambió, actualizar el idioma global
    if (newConfig.language && newConfig.language !== currentLanguage) {
      changeLanguage(newConfig.language);
      console.log('✓ Idioma cambiado a:', newConfig.language);
    }

    updateConfig(newConfig);
    setShowSettings(false);
    console.log('✓ Configuración guardada:', newConfig);
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('⚙️ Click en Settings. showSettings antes:', showSettings);
              setShowSettings(true);
            }}
            title="Opciones"
          >
            <Settings size={16} />
          </Button>
        </div>
      </header>

      {/* Input de texto superior */}
      <TextInput
        currentText={currentText}
        onTextChange={handleTextChange}
        onFileLoad={handleFileLoad}
        placeholder={t('textInputPlaceholder')}
        // Semantic Layer props
        schemaStatus={schemaStatus}
        nluSchema={nluSchema}
        onSchemaChange={handleSchemaChange}
        onSchemaGenerate={handleSchemaGenerate}
        schemaError={schemaError}
      />

      {/* Demostración de carga de archivos */}
      {!svgData && (
        <div className="p-4 border-b bg-muted/10">
          <FileLoadDemo onLoadExample={handleFileLoad} />
        </div>
      )}



      {/* Layout principal de dos paneles */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Condicionalmente Jerarquía o Visor */}
        <div className="w-1/2 border-r bg-muted/10 flex flex-col">
          {userConfig.swapPanels ? (
            // Si swap activado: Visor a la izquierda
            showCodeView ? (
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
                onSaveHistory={(saveCallback) => {
                  svgHistoryCallback.current = saveCallback;
                }}
              />
            )
          ) : (
            // Si swap desactivado (default): Jerarquía a la izquierda
            <SVGHierarchy
              svgData={svgData}
              selectedElement={selectedElement}
              onElementSelect={handleElementSelect}
              onEntityDoubleClick={handleEntityDoubleClick}
              expandedElements={expandedElements}
              onToggleExpand={handleToggleExpand}
              onStyleChange={handleStyleChange}
              onSVGUpdate={handleSVGUpdate}
              svgContent={svgContent}
            />
          )}
        </div>

        {/* Panel derecho - Condicionalmente Visor o Jerarquía */}
        <div className="w-1/2 flex flex-col">
          {userConfig.swapPanels ? (
            // Si swap activado: Jerarquía a la derecha
            <SVGHierarchy
              svgData={svgData}
              selectedElement={selectedElement}
              onElementSelect={handleElementSelect}
              onEntityDoubleClick={handleEntityDoubleClick}
              expandedElements={expandedElements}
              onToggleExpand={handleToggleExpand}
              onStyleChange={handleStyleChange}
              onSVGUpdate={handleSVGUpdate}
              svgContent={svgContent}
            />
          ) : (
            // Si swap desactivado (default): Visor a la derecha
            showCodeView ? (
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
                onSaveHistory={(saveCallback) => {
                  svgHistoryCallback.current = saveCallback;
                }}
              />
            )
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

      {/* Settings View */}
      <SettingsView
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={userConfig}
        onSave={handleSaveSettings}
      />

      {/* Entity Edit Dialog */}
      <EntityEditDialog
        isOpen={entityEditDialog.isOpen}
        onClose={() => setEntityEditDialog({ isOpen: false, entity: null })}
        entity={entityEditDialog.entity}
        onUpdateEntity={handleUpdateEntity}
        onRegenerateEntity={handleRegenerateEntity}
      />
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
