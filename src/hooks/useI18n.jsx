import { useState, useEffect, createContext, useContext } from 'react';

// Traducciones
const translations = {
  en: {
    // Header
    appTitle: 'PictoForge',
    appSubtitle: 'Semantic SVG Editor',
    
    // Text Input
    textInputPlaceholder: 'Make the bed',
    loadSVGFile: 'Load SVG file',
    exportText: 'Export text',
    dragDropText: 'Supports .svg files | Drag & drop enabled',
    charactersCount: 'characters',
    
    // SVG Elements Panel
    svgElements: 'SVG ELEMENTS',
    styles: 'STYLES',
    selectedElement: 'Selected Element',
    selectElementToApplyStyles: 'Select an element to apply styles',
    noStylesDefined: 'No styles defined',
    createNewStyle: 'Create new style',
    clickToApplyDoubleClickToEdit: 'Click to apply/remove, double click to edit',

    // Style Editor Modal
    editStyle: 'Edit Style',
    editStyleDescription: 'Modify the CSS style properties',
    styleName: 'Style name',
    styleNamePlaceholder: 'style-name',
    cssProperties: 'CSS Properties',
    propertyPlaceholder: 'property',
    valuePlaceholder: 'value',
    addProperty: 'Add property',
    deleteProperty: 'Delete property',
    deleteStyle: 'Delete style',
    cancel: 'Cancel',
    saveChanges: 'Save changes',
    
    // Element types
    svg: 'svg',
    group: 'group',
    path: 'path',
    circle: 'circle',
    rect: 'rectangle',
    line: 'line',
    polygon: 'polygon',
    polyline: 'polyline',
    text: 'text',
    image: 'image',
    defs: 'definitions',
    style: 'style',
    
    // CSS Properties
    fill: 'fill',
    stroke: 'stroke',
    strokeWidth: 'stroke-width',
    strokeLinejoin: 'stroke-linejoin',
    strokeLinecap: 'stroke-linecap',
    opacity: 'opacity',
    
    // Tools
    selectTool: 'Select and move entities (Black arrow)',
    nodeTool: 'Move nodes (White arrow)',
    penTool: 'Pen tool - Edit nodes',
    undoAction: 'Undo',
    redoAction: 'Redo',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    resetView: 'Reset view',
    downloadSVG: 'Download SVG',
    saveProject: 'Save project',
    
    // Code View
    viewCode: 'View SVG code',
    copyCode: 'Copy code',
    downloadCode: 'Download SVG',
    lines: 'lines',
    
    // Theme and Language
    changeTheme: 'Change theme',
    changeLanguage: 'Change language',
    
    // Status
    stylesCount: 'styles',
    elementsCount: 'elements',
    
    // Footer
    version: 'PictoForge v1.0 - Semantic SVG Editor',
    
    // Messages
    noSVGLoaded: 'No SVG loaded',
    loadSVGToStart: 'Load an SVG file to start',
    
    // Languages
    english: 'English',
    spanish: 'Spanish',
    maori: 'Māori'
  },
  
  es: {
    // Header
    appTitle: 'PictoForge',
    appSubtitle: 'Editor SVG Semántico',
    
    // Text Input
    textInputPlaceholder: 'Has la cama',
    loadSVGFile: 'Cargar archivo SVG',
    exportText: 'Exportar texto',
    dragDropText: 'Soporta archivos .svg | Drag & drop habilitado',
    charactersCount: 'caracteres',
    
    // SVG Elements Panel
    svgElements: 'ELEMENTOS SVG',
    styles: 'ESTILOS',
    selectedElement: 'Elemento Seleccionado',
    selectElementToApplyStyles: 'Selecciona un elemento para aplicar estilos',
    noStylesDefined: 'No hay estilos definidos',
    createNewStyle: 'Crear nuevo estilo',
    clickToApplyDoubleClickToEdit: 'Click para aplicar/remover, doble click para editar',

    // Style Editor Modal
    editStyle: 'Editar Estilo',
    editStyleDescription: 'Modifica las propiedades del estilo CSS',
    styleName: 'Nombre del estilo',
    styleNamePlaceholder: 'nombre-estilo',
    cssProperties: 'Propiedades CSS',
    propertyPlaceholder: 'propiedad',
    valuePlaceholder: 'valor',
    addProperty: 'Agregar propiedad',
    deleteProperty: 'Eliminar propiedad',
    deleteStyle: 'Eliminar estilo',
    cancel: 'Cancelar',
    saveChanges: 'Guardar cambios',
    
    // Element types
    svg: 'svg',
    group: 'grupo',
    path: 'trazado',
    circle: 'círculo',
    rect: 'rectángulo',
    line: 'línea',
    polygon: 'polígono',
    polyline: 'polilínea',
    text: 'texto',
    image: 'imagen',
    defs: 'definiciones',
    style: 'estilo',
    
    // CSS Properties
    fill: 'relleno',
    stroke: 'trazo',
    strokeWidth: 'grosor-trazo',
    strokeLinejoin: 'unión-trazo',
    strokeLinecap: 'extremo-trazo',
    opacity: 'opacidad',
    
    // Tools
    selectTool: 'Seleccionar y mover entidades (Flecha negra)',
    nodeTool: 'Mover nodos (Flecha blanca)',
    penTool: 'Herramienta pluma - Editar nodos',
    undoAction: 'Deshacer',
    redoAction: 'Rehacer',
    zoomOut: 'Alejar',
    zoomIn: 'Acercar',
    resetView: 'Resetear vista',
    downloadSVG: 'Descargar SVG',
    saveProject: 'Guardar proyecto',
    
    // Code View
    viewCode: 'Ver código SVG',
    copyCode: 'Copiar código',
    downloadCode: 'Descargar SVG',
    lines: 'líneas',
    
    // Theme and Language
    changeTheme: 'Cambiar tema',
    changeLanguage: 'Cambiar idioma',
    
    // Status
    stylesCount: 'estilos',
    elementsCount: 'elementos',
    
    // Footer
    version: 'PictoForge v1.0 - Editor SVG Semántico',
    
    // Messages
    noSVGLoaded: 'No hay SVG cargado',
    loadSVGToStart: 'Carga un archivo SVG para comenzar',
    
    // Languages
    english: 'Inglés',
    spanish: 'Castellano',
    maori: 'Māori'
  },
  
  mi: {
    // Header
    appTitle: 'PictoForge',
    appSubtitle: 'Ētita SVG Tikanga',
    
    // Text Input
    textInputPlaceholder: 'Hangaia te moenga',
    loadSVGFile: 'Uta kōnae SVG',
    exportText: 'Kaweake kupu',
    dragDropText: 'Ka tautoko i ngā kōnae .svg | Tō & taka whakahohea',
    charactersCount: 'ngā tohu',
    
    // SVG Elements Panel
    svgElements: 'NGĀ HUĀNGA SVG',
    styles: 'NGĀ KĀHUA',
    selectedElement: 'Huānga Kōwhiria',
    selectElementToApplyStyles: 'Kōwhiria he huānga hei whakamahi kāhua',
    noStylesDefined: 'Kāore ngā kāhua',
    createNewStyle: 'Waihanga kāhua hou',
    clickToApplyDoubleClickToEdit: 'Pāwhiri hei whakamahi/tango, pāwhiri-rua hei whakatika',

    // Style Editor Modal
    editStyle: 'Whakatika Kāhua',
    editStyleDescription: 'Whakarerekē ngā āhuatanga CSS kāhua',
    styleName: 'Ingoa kāhua',
    styleNamePlaceholder: 'ingoa-kāhua',
    cssProperties: 'Ngā Āhuatanga CSS',
    propertyPlaceholder: 'āhuatanga',
    valuePlaceholder: 'uara',
    addProperty: 'Tāpiri āhuatanga',
    deleteProperty: 'Mukua āhuatanga',
    deleteStyle: 'Mukua kāhua',
    cancel: 'Whakakore',
    saveChanges: 'Tiaki huringa',
    
    // Element types
    svg: 'svg',
    group: 'rōpū',
    path: 'ara',
    circle: 'porohita',
    rect: 'tapawhā',
    line: 'raina',
    polygon: 'tapawhā-maha',
    polyline: 'raina-maha',
    text: 'kupu',
    image: 'whakaahua',
    defs: 'ngā whakamārama',
    style: 'kāhua',
    
    // CSS Properties
    fill: 'whakakī',
    stroke: 'raina',
    strokeWidth: 'roa-raina',
    strokeLinejoin: 'hononga-raina',
    strokeLinecap: 'mata-raina',
    opacity: 'atahua',
    
    // Tools
    selectTool: 'Kōwhiri, neke hoki ngā rawa (Kōpere mangu)',
    nodeTool: 'Neke ngā pona (Kōpere mā)',
    penTool: 'Taputapu pene - Whakatika pona',
    undoAction: 'Whakakore',
    redoAction: 'Mahi anō',
    zoomOut: 'Whakaiti',
    zoomIn: 'Whakanui',
    resetView: 'Tīmata anō te mata',
    downloadSVG: 'Tikiake SVG',
    saveProject: 'Tiaki kaupapa',
    
    // Code View
    viewCode: 'Kitea te waehere SVG',
    copyCode: 'Kape waehere',
    downloadCode: 'Tikiake SVG',
    lines: 'ngā raina',
    
    // Theme and Language
    changeTheme: 'Huringa kaupapa',
    changeLanguage: 'Huringa reo',
    
    // Status
    stylesCount: 'ngā kāhua',
    elementsCount: 'ngā huānga',
    
    // Footer
    version: 'PictoForge v1.0 - Ētita SVG Tikanga',
    
    // Messages
    noSVGLoaded: 'Kāore he SVG i utaina',
    loadSVGToStart: 'Utaina he kōnae SVG hei tīmata',
    
    // Languages
    english: 'Ingarihi',
    spanish: 'Paniora',
    maori: 'Māori'
  }
};

// Detectar idioma del navegador
const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.languages[0];
  
  // Mapear códigos de idioma del navegador a nuestros códigos
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('mi')) return 'mi';
  return 'en'; // Fallback a inglés
};

// Contexto de internacionalización
const I18nContext = createContext();

// Hook para usar internacionalización
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Proveedor de internacionalización
export const I18nProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Intentar obtener idioma guardado, sino detectar del navegador
    const savedLang = localStorage.getItem('pictoforge-language');
    return savedLang || detectBrowserLanguage();
  });

  // Guardar idioma en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('pictoforge-language', currentLanguage);
  }, [currentLanguage]);

  // Función para obtener traducción
  const t = (key, fallback = key) => {
    const translation = translations[currentLanguage]?.[key];
    return translation || translations.en[key] || fallback;
  };

  // Función para cambiar idioma
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
    }
  };

  // Obtener idiomas disponibles
  const availableLanguages = [
    { code: 'en', name: t('english'), nativeName: 'English' },
    { code: 'es', name: t('spanish'), nativeName: 'Castellano' },
    { code: 'mi', name: t('maori'), nativeName: 'Māori' }
  ];

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export default useI18n;
