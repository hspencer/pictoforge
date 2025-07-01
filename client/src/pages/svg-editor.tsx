import { useState, useEffect, useCallback } from 'react';
import { I18nProvider, useI18n } from '@/lib/i18n-simple';
import { DesignTokens, getColor, getTypography, getSpacing, getBorderRadius } from '@/lib/design-system';
import { SvgElement, SvgStructure } from '@shared/schema';
import TopBar from '@/components/top-bar';
import HierarchicalNav from '@/components/hierarchical-nav';
import ReactSvgEditor from '@/components/react-svg-editor';
import ChatInterface from '@/components/chat-interface';
import ElementProperties from '@/components/element-properties';

const initialSvgCode = `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .bed-group { fill: #8B4513; stroke: #654321; stroke-width: 2; }
      .person-group { fill: #FFB366; stroke: #E09142; stroke-width: 1.5; }
    </style>
  </defs>
  <g id="bed" class="bed-group">
    <rect id="bed-frame" x="50" y="200" width="200" height="80" rx="0" />
    <rect id="pillow" x="60" y="180" width="40" height="20" rx="0" />
    <rect id="mattress" x="55" y="205" width="190" height="15" rx="0" />
  </g>
  <g id="person" class="person-group">
    <circle id="head" cx="150" cy="120" r="25" />
    <rect id="body" x="135" y="145" width="30" height="45" rx="0" />
    <rect id="arm-left" x="120" y="150" width="15" height="35" rx="0" />
    <rect id="arm-right" x="165" y="150" width="15" height="35" rx="0" />
    <rect id="leg-left" x="140" y="190" width="8" height="30" rx="0" />
    <rect id="leg-right" x="152" y="190" width="8" height="30" rx="0" />
  </g>
</svg>`;

function SvgEditorContent() {
  const { t } = useI18n();
  const [svgCode, setSvgCode] = useState(initialSvgCode);
  const [svgStructure, setSvgStructure] = useState<SvgStructure>({
    root: { id: 'root', type: 'svg', attributes: {}, children: [] },
    selectedElementId: null
  });
  const [selectedElement, setSelectedElement] = useState<SvgElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [navigationPath, setNavigationPath] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState<'select' | 'edit' | 'erase'>('select');
  const [customStyles, setCustomStyles] = useState<Record<string, Record<string, string>>>({});

  // Parse SVG code into virtual DOM structure
  const parseInitialSvg = useCallback(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, 'image/svg+xml');
      const svgElement = doc.documentElement;
      
      const domNodeToSvgNode = (element: Element): SvgElement => {
        const attributes: Record<string, string> = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributes[attr.name] = attr.value;
        }

        const children: SvgElement[] = [];
        for (let i = 0; i < element.children.length; i++) {
          children.push(domNodeToSvgNode(element.children[i]));
        }

        return {
          id: attributes.id || `${element.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`,
          type: element.tagName.toLowerCase() as SvgElement['type'],
          attributes,
          children,
          content: element.textContent || undefined
        };
      };

      const rootElement = domNodeToSvgNode(svgElement);
      setSvgStructure({
        root: rootElement,
        selectedElementId: null
      });
    } catch (error) {
      console.error('Error parsing SVG:', error);
    }
  }, [svgCode]);

  useEffect(() => {
    parseInitialSvg();
  }, [parseInitialSvg]);

  // Virtual DOM manipulation utilities
  const findElementById = useCallback((element: SvgElement, id: string): SvgElement | null => {
    if (element.id === id) return element;
    for (const child of element.children) {
      const found = findElementById(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  const updateElementInStructure = useCallback((
    structure: SvgElement,
    elementId: string,
    updates: Partial<SvgElement>
  ): SvgElement => {
    if (structure.id === elementId) {
      return { ...structure, ...updates };
    }
    return {
      ...structure,
      children: structure.children.map(child => 
        updateElementInStructure(child, elementId, updates)
      )
    };
  }, []);

  // Extract styles from groups (bed and person)
  const getElementStyle = useCallback((element: SvgElement): Record<string, string> => {
    const styles: Record<string, string> = {};
    
    // Extract styles from class attribute
    if (element.attributes.class) {
      const className = element.attributes.class;
      if (className === 'bed-group') {
        styles.fill = '#8B4513';
        styles.stroke = '#654321';
        styles['stroke-width'] = '2';
      } else if (className === 'person-group') {
        styles.fill = '#FFB366';
        styles.stroke = '#E09142';
        styles['stroke-width'] = '1.5';
      }
    }
    
    // Extract individual style attributes
    ['fill', 'stroke', 'stroke-width', 'opacity', 'transform'].forEach(prop => {
      if (element.attributes[prop]) {
        styles[prop] = element.attributes[prop];
      }
    });

    return styles;
  }, []);

  // Element selection with visual feedback
  const handleElementSelect = useCallback((element: SvgElement) => {
    setSelectedElement(element);
    setSelectedElementId(element.id);
    setSvgStructure(prev => ({
      ...prev,
      selectedElementId: element.id
    }));

    // Auto-expand groups in navigation
    if (element.type === 'g' && element.children.length > 0) {
      setExpandedGroups(prev => new Set(Array.from(prev).concat([element.id])));
    }

    // Auto-open properties panel when element selected
    setPropertiesPanelOpen(true);
  }, []);

  // Real-time element updates with virtual DOM manipulation
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SvgElement>) => {
    setSvgStructure(prev => ({
      ...prev,
      root: updateElementInStructure(prev.root, elementId, updates)
    }));

    if (selectedElement?.id === elementId) {
      setSelectedElement(prev => prev ? { ...prev, ...updates } : null);
    }

    // Mark as having unsaved changes
    console.log(`Updated element ${elementId}:`, updates);
  }, [selectedElement?.id, updateElementInStructure]);

  // Add new elements to virtual DOM
  const handleAddElement = useCallback((type: SvgElement['type'], parentId?: string) => {
    const newElement: SvgElement = {
      id: `${type}-${Date.now()}`,
      type,
      attributes: {
        ...(type === 'rect' && { x: '10', y: '10', width: '50', height: '30', fill: '#3b82f6' }),
        ...(type === 'circle' && { cx: '25', cy: '25', r: '20', fill: '#ef4444' }),
        ...(type === 'text' && { x: '10', y: '25', fill: '#1f2937' })
      },
      children: [],
      content: type === 'text' ? 'New Text' : undefined
    };

    setSvgStructure(prev => {
      const addToParent = (element: SvgElement): SvgElement => {
        if (element.id === (parentId || prev.root.id)) {
          return {
            ...element,
            children: [...element.children, newElement]
          };
        }
        return {
          ...element,
          children: element.children.map(addToParent)
        };
      };

      return {
        ...prev,
        root: addToParent(prev.root),
        selectedElementId: newElement.id
      };
    });

    setSelectedElement(newElement);
    setSelectedElementId(newElement.id);
  }, []);

  // Remove elements from virtual DOM
  const handleRemoveElement = useCallback((elementId: string) => {
    setSvgStructure(prev => {
      const removeFromParent = (element: SvgElement): SvgElement => {
        return {
          ...element,
          children: element.children
            .filter(child => child.id !== elementId)
            .map(removeFromParent)
        };
      };

      return {
        ...prev,
        root: removeFromParent(prev.root),
        selectedElementId: prev.selectedElementId === elementId ? null : prev.selectedElementId
      };
    });

    if (selectedElementId === elementId) {
      setSelectedElement(null);
      setSelectedElementId(null);
      setPropertiesPanelOpen(false);
    }
  }, [selectedElementId]);

  // Chat interface integration
  const handleSvgGenerated = useCallback((svgCodeGenerated: string, prompt: string) => {
    setSvgCode(svgCodeGenerated);
    console.log(`Generated SVG from prompt: "${prompt}"`);
  }, []);

  // Unified toolbar height for consistent UI
  const toolbarHeight = 56;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Top Bar with i18n support */}
      <TopBar 
        breadcrumbs={[
          { label: "Aotearoa", href: "/place/aotearoa" },
          { label: "PictoForge" }
        ]}
        subtitle="creator, editor and trainer"
        isDarkMode={false}
      />
      
      {/* Chat Interface for AI generation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ChatInterface onSvgGenerated={handleSvgGenerated} />
      </div>

      {/* Main Content Area - Split Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Hierarchical DOM Navigation */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
          {/* Left Panel Header - Unified height with editor toolbar */}
          <div 
            className="flex items-center px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
            style={{ height: `${toolbarHeight}px` }}
          >
            <h3 
              className="aac-text font-semibold text-gray-900 dark:text-gray-100"
              style={{ 
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}
            >
              {t('pictogramDOM') || 'DOM PICTOGRAMA'}
            </h3>
          </div>
          
          {/* Navigation Content with Virtual DOM Tree */}
          <div className="flex-1 overflow-auto">
            <HierarchicalNav
              structure={svgStructure}
              selectedElementId={selectedElementId}
              onSelectElement={handleElementSelect}
              onRemoveElement={handleRemoveElement}
              navigationPath={navigationPath}
              onNavigate={setNavigationPath}
            />
          </div>
        </div>

        {/* Right Panel - SVG Editor with Direct DOM Manipulation */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          <ReactSvgEditor
            width={800}
            height={600}
            onNodeSelect={(node) => {
              if (node) {
                const element = findElementById(svgStructure.root, node.id);
                if (element) {
                  handleElementSelect(element);
                }
              } else {
                setSelectedElement(null);
                setSelectedElementId(null);
                setPropertiesPanelOpen(false);
              }
            }}
            onNodeUpdate={handleElementUpdate}
            initialSvg={svgCode}
            editMode={editMode === 'edit'}
            selectedElementId={selectedElementId}
            toolbarHeight={toolbarHeight}
            showVertexHandles={true}
          />
        </div>
      </div>

      {/* Properties Panel - Context-sensitive element editing */}
      {selectedElement && propertiesPanelOpen && (
        <ElementProperties
          element={selectedElement}
          onUpdateElement={handleElementUpdate}
          onClose={() => setPropertiesPanelOpen(false)}
        />
      )}

      {/* Floating Toolbar for adding elements */}
      <div className="fixed bottom-6 right-6 flex space-x-2 z-20">
        <button
          onClick={() => handleAddElement('rect')}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 shadow-lg transition-colors"
          style={{ borderRadius: 0 }}
          title={t('addRectangle') || 'Add Rectangle'}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="3" y="6" width="14" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        
        <button
          onClick={() => handleAddElement('circle')}
          className="bg-green-500 hover:bg-green-600 text-white p-3 shadow-lg transition-colors"
          style={{ borderRadius: 0 }}
          title={t('addCircle') || 'Add Circle'}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        
        <button
          onClick={() => handleAddElement('text')}
          className="bg-purple-500 hover:bg-purple-600 text-white p-3 shadow-lg transition-colors"
          style={{ borderRadius: 0 }}
          title={t('addText') || 'Add Text'}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <text x="10" y="14" textAnchor="middle" fontSize="12" fill="currentColor">T</text>
          </svg>
        </button>
      </div>

      {/* Group Style Display for bed and person groups */}
      {selectedElement && (selectedElement.id === 'bed' || selectedElement.id === 'person') && (
        <div className="fixed top-32 right-4 w-72 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="aac-text font-semibold text-gray-900 dark:text-gray-100">
              {t('groupStyles') || 'Estilos del Grupo'}: {selectedElement.id.toUpperCase()}
            </h4>
          </div>
          
          <div className="p-4 space-y-2">
            {Object.entries(getElementStyle(selectedElement)).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium">{key}:</span>
                <span className="font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with I18n Provider
export default function SvgEditor() {
  return (
    <I18nProvider>
      <SvgEditorContent />
    </I18nProvider>
  );
}