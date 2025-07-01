import { useState, useCallback, useEffect } from "react";
import { SvgElement, SvgStructure } from "@shared/schema";
import {
  createDefaultSvgElement,
  structureToSvgCode,
  parseSvgToStructure,
  findElementById,
  updateElementInStructure,
  removeElementFromStructure,
  addElementToStructure,
  generateId,
  formatSvgCode,
} from "@/lib/svg-utils";

export function useSvgEditor() {
  const [svgStructure, setSvgStructure] = useState<SvgStructure>(() => {
    const root = createDefaultSvgElement();
    return {
      root,
      selectedElementId: root.id,
    };
  });

  const [svgCode, setSvgCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("structure");
  const [customStyles, setCustomStyles] = useState<Record<string, Record<string, string>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update SVG code when structure or styles change
  useEffect(() => {
    const code = structureToSvgCode(svgStructure.root, customStyles);
    setSvgCode(formatSvgCode(code));
  }, [svgStructure, customStyles]);

  const selectedElement = svgStructure.selectedElementId
    ? findElementById(svgStructure.root, svgStructure.selectedElementId)
    : null;

  const selectElement = useCallback((element: SvgElement | null) => {
    setSvgStructure(prev => ({
      ...prev,
      selectedElementId: element?.id || null,
    }));
  }, []);

  const selectElementById = useCallback((elementId: string) => {
    const element = findElementById(svgStructure.root, elementId);
    if (element) {
      selectElement(element);
    }
  }, [svgStructure.root, selectElement]);

  const updateElement = useCallback((elementId: string, updates: Partial<SvgElement>) => {
    setSvgStructure(prev => ({
      ...prev,
      root: updateElementInStructure(prev.root, elementId, updates),
    }));
  }, []);

  const removeElement = useCallback((elementId: string) => {
    setSvgStructure(prev => {
      const newRoot = removeElementFromStructure(prev.root, elementId);
      return {
        root: newRoot,
        selectedElementId: prev.selectedElementId === elementId ? newRoot.id : prev.selectedElementId,
      };
    });
  }, []);

  const addElement = useCallback((type: SvgElement['type']) => {
    const parentId = svgStructure.selectedElementId || svgStructure.root.id;
    
    const newElement: SvgElement = {
      id: generateId(),
      type,
      attributes: getDefaultAttributes(type),
      children: [],
    };

    setSvgStructure(prev => ({
      ...prev,
      root: addElementToStructure(prev.root, parentId, newElement),
      selectedElementId: newElement.id,
    }));
  }, [svgStructure.selectedElementId, svgStructure.root.id]);

  const updateSvgCode = useCallback((code: string) => {
    setSvgCode(code);
    try {
      const newStructure = parseSvgToStructure(code);
      setSvgStructure(prev => ({
        ...prev,
        root: newStructure,
      }));
    } catch (error) {
      console.error("Error parsing SVG code:", error);
    }
  }, []);

  const exportSvg = useCallback(() => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pictogram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgCode]);

  const importSvg = useCallback((code: string) => {
    try {
      const newStructure = parseSvgToStructure(code);
      setSvgStructure({
        root: newStructure,
        selectedElementId: newStructure.id,
      });
      setSvgCode(formatSvgCode(code));
    } catch (error) {
      console.error("Error importing SVG:", error);
    }
  }, []);

  const generateFromPrompt = useCallback(async (prompt: string) => {
    // In a real implementation, this would call an AI API
    console.log("Generating SVG from prompt:", prompt);
    
    // For now, just create a simple example
    const generatedElement = createDefaultSvgElement();
    setSvgStructure({
      root: generatedElement,
      selectedElementId: generatedElement.id,
    });
  }, []);

  const updateStyleClass = useCallback((className: string, styles: Record<string, string>) => {
    setCustomStyles(prev => ({
      ...prev,
      [className]: styles
    }));
    setHasUnsavedChanges(true);
  }, []);

  const removeStyleClass = useCallback((className: string) => {
    setCustomStyles(prev => {
      const newStyles = { ...prev };
      delete newStyles[className];
      return newStyles;
    });
    setHasUnsavedChanges(true);
  }, []);

  const saveChanges = useCallback(async () => {
    // TODO: Implement database save when ready
    console.log("Saving changes:", { svgStructure, customStyles });
    setHasUnsavedChanges(false);
  }, [svgStructure, customStyles]);

  return {
    svgStructure,
    svgCode,
    selectedElement,
    customStyles,
    hasUnsavedChanges,
    selectElement,
    selectElementById,
    updateElement,
    removeElement,
    addElement,
    updateSvgCode,
    updateStyleClass,
    removeStyleClass,
    saveChanges,
    exportSvg,
    importSvg,
    generateFromPrompt,
  };
}

function getDefaultAttributes(type: SvgElement['type']): Record<string, string> {
  switch (type) {
    case 'circle':
      return { cx: '50', cy: '50', r: '20', class: 'k' };
    case 'rect':
      return { x: '10', y: '10', width: '50', height: '30', class: 'f' };
    case 'path':
      return { d: 'M10,10 L50,50', class: 'k' };
    case 'line':
      return { x1: '10', y1: '10', x2: '50', y2: '50', stroke: '#000', 'stroke-width': '2' };
    case 'text':
      return { x: '10', y: '25', 'font-family': 'Arial', 'font-size': '16', fill: '#000' };
    case 'g':
      return { id: getSemanticGroupName() };
    default:
      return {};
  }
}

function getSemanticGroupName(): string {
  const semanticNames = [
    'head', 'body', 'arm', 'leg', 'hand', 'foot',
    'furniture', 'bed', 'chair', 'table', 'door', 'window',
    'building', 'house', 'room', 'wall', 'floor', 'roof',
    'vehicle', 'car', 'bike', 'plane', 'boat',
    'nature', 'tree', 'flower', 'sun', 'cloud', 'mountain',
    'object', 'tool', 'device', 'container', 'decoration'
  ];
  
  const randomName = semanticNames[Math.floor(Math.random() * semanticNames.length)];
  return `${randomName}-${generateId().substring(0, 3)}`;
}
