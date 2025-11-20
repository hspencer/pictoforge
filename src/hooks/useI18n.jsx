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
    version: 'PictoForge v0.1 - Semantic SVG Editor',
    
    // Messages
    noSVGLoaded: 'No SVG loaded',
    loadSVGToStart: 'Load an SVG file to start',
    
    // Languages
    english: 'English',
    spanish: 'Spanish',
    maori: 'Māori',

    // Settings
    settings: 'Settings',
    localSettings: 'Local PictoForge Settings',
    settingsDescription: 'Configure your instance and custom styles',
    instanceInfo: 'Instance Information',
    instanceName: 'Instance name',
    instanceNamePlaceholder: 'Ex: PUCV Design Lab',
    author: 'Author',
    authorLabel: 'Author (for credits)',
    authorPlaceholder: 'Your name',
    location: 'Location',
    locationLabel: 'Place',
    locationPlaceholder: 'Address or location',
    locationHelper: 'You can enter a full address',
    mapIntegrationHelper: 'Map integration available in future versions',
    layout: 'Layout',
    swapPanels: 'Swap panels (Visual editor ↔ Hierarchy)',
    swapPanelsHelper: 'Changes the position of the visual editor and element hierarchy between left and right panels.',
    language: 'Language',
    selectLanguage: 'Select Language',
    selectLanguagePlaceholder: 'Select language',
    localization: 'Localization',
    graphicStylePrompt: 'General Graphic Style Prompt',
    styleDescription: 'Style description',
    styleDescriptionPlaceholder: 'Describe the general graphic style for this instance...',
    stylePromptLabel: 'Style prompt',
    stylePromptPlaceholder: 'Describe the visual style you want to apply to your pictograms (e.g., \'Minimalist style with clean lines and pastel colors\')',
    stylePromptHelper: 'This text will be used as a guide to generate consistent styles',
    customStyles: 'Custom Styles',
    locationStyles: 'Location Styles',
    newStyle: 'New Style',
    noCustomStyles: 'No custom styles',
    createOneToStart: 'Create one to get started',
    createNewToStart: 'Create a new one to get started',
    styleWithoutName: 'Style without name',
    fillLabel: 'Fill',
    strokeLabel: 'Stroke',
    strokeWidthLabel: 'Stroke Width',
    widthLabel: 'Width',
    deleteLabel: 'Delete',
    deleteStyleLabel: 'Delete style',
    deleteStyleConfirm: 'Delete this style?',
    exportImportConfig: 'Export/Import Configuration',
    exportConfig: 'Export Configuration',
    importConfig: 'Import Configuration',
    exportConfigHelper: 'Save your configuration to a JSON file for backup or to share with others.',
    importWarning: 'When importing, the current configuration will be replaced. Make sure to export your current configuration before importing another one.',
    invalidFileFormat: 'Invalid file format',
    configImportedSuccess: 'Configuration imported successfully. Don\'t forget to save changes.',
    errorImportingConfig: 'Error importing configuration. Verify that the file is valid.',
    errorReadingFileShort: 'Error reading file',
    errorExportingConfig: 'Error exporting configuration',
    saveConfiguration: 'Save Configuration',

    // SchemaStatusBar
    schemaStatusBar: 'Communicative Intent Analysis',
    nluSchema: 'NLU Schema',
    nluSchemaModified: 'NLU Schema (modified)',
    generate: 'Generate',
    schemaModifiedWarning: 'Schema has been modified. Click "Generate" to update the pictogram.',
    lang: 'Lang',
    frames: 'Frames',
    focus: 'Focus',
    nluSchemaPlaceholder: 'NLU Schema JSON...',
    generatingPictogram: 'Generating pictogram...',
    dragDropSupport: 'Supports .svg files | Drag & drop enabled',

    // Entity Edit Dialog
    entityPreview: 'Entity Preview',
    errorGeneratingPreview: 'Error generating preview',
    noElementAvailable: 'No DOM element available',
    elementIdName: 'Element ID / Name',
    enterNewName: 'Enter new name...',
    changeIdHelper: 'Change the ID of this element in the SVG.',
    regenerateWithAI: 'Regenerate with AI (Prompt)',
    regeneratePromptPlaceholder: 'Describe how you want to regenerate this element...\n\nExample: \'Make this figure more dynamic, with arms raised\'',
    regenerateHelper: 'This will send the prompt to PictoNet API to regenerate only this element.',
    generating: 'Generating...',
    regenerate: 'Regenerate',
    regenerateNote: 'Regeneration with AI requires PictoNet API integration (Phase 2.4). Currently, this is a placeholder interface.',
    note: 'Note:',

    // TextInput
    invalidSVGFile: 'Please select a valid SVG file (.svg)',
    fileTooLarge: 'File is too large ({size}MB). Maximum: 5MB',
    fileDoesNotContainSVG: 'File does not contain a valid SVG',
    errorParsingSVG: 'Error parsing SVG file. Verify that the file is valid.',
    errorProcessingFile: 'Error processing file: {error}',
    errorReadingFile: 'Error reading file. Please try again.',
    fileReadCancelled: 'File read cancelled',
    dropSVGHere: 'Drop SVG file here',
    loadingFile: 'Loading file...',

    // AdvancedTools
    deleteElementConfirm: 'Are you sure you want to delete "{id}"?',
    saveSVG: 'Save SVG',
    copyElement: 'Copy element',
    duplicateElement: 'Duplicate element',
    deleteElement: 'Delete element',

    // PathDebugger
    pathDebugger: 'Path Debugger',
    selectPathElement: 'Select a &lt;path&gt; element to view detailed information',
    viewCommands: 'View commands',
    normalizeToAbsolute: 'Normalize to absolute',
    reverseDirection: 'Reverse direction',
    noId: 'no id',
    commands: 'Commands:',
    segments: 'Segments:',
    normalized: 'Normalized:',
    yes: 'Yes',
    no: 'No',
    points: 'Points',
    anchor: 'Anchor',
    control: 'Control',
    svgCommands: 'SVG Commands',
    segmentsWithControlPoints: 'Segments with control points',
    anchorPoints: 'Anchor points:',
    controlPoints: 'Control points:',
    pathString: 'Path String',

    // SVGMetadataEditor
    accessibilityMetadata: 'Accessibility Metadata',
    metadataHelper: 'Metadata improves SVG accessibility for screen readers and assistive tools following WAI-ARIA standards.',
    save: 'Save',
    titleLabel: 'Title (title)',
    titlePlaceholder: 'Ex: User icon',
    titleHelper: 'Short descriptive title of the SVG',
    descriptionLabel: 'Description (desc)',
    descriptionPlaceholder: 'Ex: Illustration of a person making the bed with blue sheets',
    descriptionHelper: 'Detailed description of visual content',
    langLabel: 'Language (lang)',
    langPlaceholder: 'en, es, fr...',
    langHelper: 'ISO 639-1 language code (e.g., en, es, fr)',
    roleLabel: 'ARIA Role (role)',
    roleImg: 'img (image)',
    rolePresentation: 'presentation (decorative)',
    roleGraphicsDocument: 'graphics-document',
    roleGraphicsSymbol: 'graphics-symbol',
    roleHelper: 'Defines how screen readers interpret the SVG',
    waiAriaCompliance: 'WAI-ARIA Compliance',
    titleDefined: 'Title defined (aria-labelledby)',
    noTitle: 'No title (recommended)',
    descriptionDefined: 'Description defined (aria-describedby)',
    noDescription: 'No description (optional)',
    languageLabel: 'Language: {lang}',
    noLanguage: 'No language defined',
    roleValue: 'Role: {role}',
    noRole: 'No role defined',
    generatedCode: 'Generated Code'
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
    version: 'PictoForge v0.1 - Editor SVG Semántico',
    
    // Messages
    noSVGLoaded: 'No hay SVG cargado',
    loadSVGToStart: 'Carga un archivo SVG para comenzar',
    
    // Languages
    english: 'Inglés',
    spanish: 'Castellano',
    maori: 'Māori',

    // Settings
    settings: 'Configuración',
    localSettings: 'Opciones Locales de PictoForge',
    settingsDescription: 'Configura tu instancia y estilos personalizados',
    instanceInfo: 'Información de Instancia',
    instanceName: 'Nombre de la instancia',
    instanceNamePlaceholder: 'Ej: PUCV Design Lab',
    author: 'Autor',
    authorLabel: 'Autor (para créditos)',
    authorPlaceholder: 'Tu nombre',
    location: 'Ubicación',
    locationLabel: 'Lugar',
    locationPlaceholder: 'Dirección o ubicación',
    locationHelper: 'Puedes ingresar una dirección completa',
    mapIntegrationHelper: 'Integración con mapa disponible en futuras versiones',
    layout: 'Layout',
    swapPanels: 'Intercambiar paneles (Editor visual ↔ Jerarquía)',
    swapPanelsHelper: 'Cambia la posición del editor visual y la jerarquía de elementos entre el panel izquierdo y derecho.',
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma',
    selectLanguagePlaceholder: 'Seleccionar idioma',
    localization: 'Localización',
    graphicStylePrompt: 'Prompt General del Estilo Gráfico',
    styleDescription: 'Descripción del Estilo',
    styleDescriptionPlaceholder: 'Describe el estilo gráfico general para esta instancia...',
    stylePromptLabel: 'Prompt de estilo',
    stylePromptPlaceholder: 'Describe el estilo visual que deseas aplicar a tus pictogramas (ej: \'Estilo minimalista con líneas limpias y colores pastel\')',
    stylePromptHelper: 'Este texto se usará como guía para generar estilos consistentes',
    customStyles: 'Estilos Personalizados',
    locationStyles: 'Estilos de la Localización',
    newStyle: 'Nuevo Estilo',
    noCustomStyles: 'No hay estilos personalizados',
    createOneToStart: 'Crea uno para comenzar',
    createNewToStart: 'Crea uno nuevo para comenzar',
    styleWithoutName: 'Estilo sin nombre',
    fillLabel: 'Relleno',
    strokeLabel: 'Trazo',
    strokeWidthLabel: 'Grosor de Trazo',
    widthLabel: 'Grosor',
    deleteLabel: 'Eliminar',
    deleteStyleLabel: 'Eliminar estilo',
    deleteStyleConfirm: '¿Eliminar este estilo?',
    exportImportConfig: 'Exportar/Importar Configuración',
    exportConfig: 'Exportar Configuración',
    importConfig: 'Importar Configuración',
    exportConfigHelper: 'Guarda tu configuración en un archivo JSON para respaldo o para compartirla con otros.',
    importWarning: 'Al importar, la configuración actual será reemplazada. Asegúrate de exportar tu configuración actual antes de importar otra.',
    invalidFileFormat: 'Formato de archivo inválido',
    configImportedSuccess: 'Configuración importada exitosamente. No olvides guardar los cambios.',
    errorImportingConfig: 'Error al importar la configuración. Verifica que el archivo sea válido.',
    errorReadingFileShort: 'Error al leer el archivo',
    errorExportingConfig: 'Error al exportar la configuración',
    saveConfiguration: 'Guardar Configuración',

    // SchemaStatusBar
    schemaStatusBar: 'Análisis de la intención comunicativa',
    nluSchema: 'Esquema NLU',
    nluSchemaModified: 'Esquema NLU (modificado)',
    generate: 'Generar',
    schemaModifiedWarning: 'El esquema ha sido modificado. Haz clic en "Generar" para actualizar el pictograma.',
    lang: 'Idioma',
    frames: 'Frames',
    focus: 'Foco',
    nluSchemaPlaceholder: 'JSON del Esquema NLU...',
    generatingPictogram: 'Generando pictograma...',
    dragDropSupport: 'Soporta archivos .svg | Drag & drop habilitado',

    // Entity Edit Dialog
    entityPreview: 'Vista previa de Entidad',
    errorGeneratingPreview: 'Error al generar preview',
    noElementAvailable: 'No hay elemento DOM disponible',
    elementIdName: 'ID / Nombre del Elemento',
    enterNewName: 'Ingresa nuevo nombre...',
    changeIdHelper: 'Cambia el ID de este elemento en el SVG.',
    regenerateWithAI: 'Regenerar con IA (Prompt)',
    regeneratePromptPlaceholder: 'Describe cómo quieres regenerar este elemento...\n\nEjemplo: \'Hacer esta figura más dinámica, con brazos levantados\'',
    regenerateHelper: 'Esto enviará el prompt a la API de PictoNet para regenerar solo este elemento.',
    generating: 'Generando...',
    regenerate: 'Regenerar',
    regenerateNote: 'La regeneración con IA requiere integración con la API de PictoNet (Fase 2.4). Actualmente, esta es una interfaz de marcador de posición.',
    note: 'Nota:',

    // TextInput
    invalidSVGFile: 'Por favor selecciona un archivo SVG válido (.svg)',
    fileTooLarge: 'El archivo es demasiado grande ({size}MB). Máximo: 5MB',
    fileDoesNotContainSVG: 'El archivo no contiene un SVG válido',
    errorParsingSVG: 'Error al parsear el archivo SVG. Verifica que el archivo sea válido.',
    errorProcessingFile: 'Error al procesar el archivo: {error}',
    errorReadingFile: 'Error al leer el archivo. Por favor intenta nuevamente.',
    fileReadCancelled: 'Lectura del archivo cancelada',
    dropSVGHere: 'Suelta el archivo SVG aquí',
    loadingFile: 'Cargando archivo...',

    // AdvancedTools
    deleteElementConfirm: '¿Estás seguro de que quieres eliminar "{id}"?',
    saveSVG: 'Guardar SVG',
    copyElement: 'Copiar elemento',
    duplicateElement: 'Duplicar elemento',
    deleteElement: 'Eliminar elemento',

    // PathDebugger
    pathDebugger: 'Depurador de Trazados',
    selectPathElement: 'Selecciona un elemento &lt;path&gt; para ver información detallada',
    viewCommands: 'Ver comandos',
    normalizeToAbsolute: 'Normalizar a absolutos',
    reverseDirection: 'Invertir dirección',
    noId: 'sin id',
    commands: 'Comandos:',
    segments: 'Segmentos:',
    normalized: 'Normalizado:',
    yes: 'Sí',
    no: 'No',
    points: 'Puntos',
    anchor: 'Anclaje',
    control: 'Control',
    svgCommands: 'Comandos SVG',
    segmentsWithControlPoints: 'Segmentos con puntos de control',
    anchorPoints: 'Puntos de anclaje:',
    controlPoints: 'Puntos de control:',
    pathString: 'Cadena del Trazado',

    // SVGMetadataEditor
    accessibilityMetadata: 'Metadatos de Accesibilidad',
    metadataHelper: 'Los metadatos mejoran la accesibilidad del SVG para lectores de pantalla y herramientas de asistencia siguiendo estándares WAI-ARIA.',
    save: 'Guardar',
    titleLabel: 'Título (title)',
    titlePlaceholder: 'Ej: Icono de usuario',
    titleHelper: 'Título descriptivo corto del SVG',
    descriptionLabel: 'Descripción (desc)',
    descriptionPlaceholder: 'Ej: Ilustración de una persona haciendo la cama con sábanas azules',
    descriptionHelper: 'Descripción detallada del contenido visual',
    langLabel: 'Idioma (lang)',
    langPlaceholder: 'en, es, fr...',
    langHelper: 'Código de idioma ISO 639-1 (ej: en, es, fr)',
    roleLabel: 'Rol ARIA (role)',
    roleImg: 'img (imagen)',
    rolePresentation: 'presentation (decorativo)',
    roleGraphicsDocument: 'graphics-document',
    roleGraphicsSymbol: 'graphics-symbol',
    roleHelper: 'Define cómo los lectores de pantalla interpretan el SVG',
    waiAriaCompliance: 'Cumplimiento WAI-ARIA',
    titleDefined: 'Título definido (aria-labelledby)',
    noTitle: 'Sin título (recomendado)',
    descriptionDefined: 'Descripción definida (aria-describedby)',
    noDescription: 'Sin descripción (opcional)',
    languageLabel: 'Idioma: {lang}',
    noLanguage: 'Sin idioma definido',
    roleValue: 'Rol: {role}',
    noRole: 'Sin rol definido',
    generatedCode: 'Código generado'
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
    version: 'PictoForge v0.1 - Ētita SVG Tikanga',
    
    // Messages
    noSVGLoaded: 'Kāore he SVG i utaina',
    loadSVGToStart: 'Utaina he kōnae SVG hei tīmata',
    
    // Languages
    english: 'Ingarihi',
    spanish: 'Paniora',
    maori: 'Māori',

    // Settings (Māori translations - basic placeholders, should be reviewed by native speaker)
    settings: 'Whiringa',
    localSettings: 'Whiringa ā-Rohe o PictoForge',
    settingsDescription: 'Whirihora i tō tūemi me ngā kāhua ā-roto',
    instanceInfo: 'Pārongo Tūemi',
    instanceName: 'Ingoa tūemi',
    instanceNamePlaceholder: 'Tauira: PUCV Design Lab',
    author: 'Kaituhi',
    authorLabel: 'Kaituhi (mō ngā whakamoemiti)',
    authorPlaceholder: 'Tō ingoa',
    location: 'Wāhi',
    locationLabel: 'Wāhi',
    locationPlaceholder: 'Wāhitau, wāhi rānei',
    locationHelper: 'Ka taea e koe te whakаuru i te wāhitau katoa',
    mapIntegrationHelper: 'Ka wātea te hononga mahere i ngā putanga o muri',
    layout: 'Hoahoa',
    swapPanels: 'Whakawhitia ngā papa (Ētita tirohanga ↔ Tūāpapa)',
    swapPanelsHelper: 'Ka huri i te tūnga o te ētita tirohanga me te tūāpapa huānga i waenga i ngā papa mauī me te matau.',
    language: 'Reo',
    selectLanguage: 'Kōwhiria Reo',
    selectLanguagePlaceholder: 'Kōwhiria reo',
    localization: 'Whakawāhitau',
    graphicStylePrompt: 'Prompt Auaha Whānui',
    styleDescription: 'Whakamāramatanga kāhua',
    styleDescriptionPlaceholder: 'Whakamāramahia te kāhua auaha whānui mō tēnei tūemi...',
    stylePromptLabel: 'Prompt kāhua',
    stylePromptPlaceholder: 'Whakamāramahia te kāhua tirohanga e hiahia ana koe ki te tāpae ki ō pictogram',
    stylePromptHelper: 'Ka whakamahia tēnei kupu hei ārahi hei whakaputa i ngā kāhua ōrite',
    customStyles: 'Ngā Kāhua ā-Roto',
    locationStyles: 'Ngā Kāhua o te Wāhi',
    newStyle: 'Kāhua Hou',
    noCustomStyles: 'Kāore he kāhua ā-roto',
    createOneToStart: 'Waihangahia tētahi hei tīmata',
    createNewToStart: 'Waihangahia he mea hou hei tīmata',
    styleWithoutName: 'Kāhua kaore he ingoa',
    fillLabel: 'Whakakī',
    strokeLabel: 'Raina',
    strokeWidthLabel: 'Roa Raina',
    widthLabel: 'Roa',
    deleteLabel: 'Mukua',
    deleteStyleLabel: 'Mukua kāhua',
    deleteStyleConfirm: 'Mukua tēnei kāhua?',
    exportImportConfig: 'Kaweake/Kawea Mai Whiringa',
    exportConfig: 'Kaweake Whiringa',
    importConfig: 'Kawea Mai Whiringa',
    exportConfigHelper: 'Tiaki i tō whirihora ki te kōnae JSON hei taapiri rānei hei tuari ki ētahi atu.',
    importWarning: 'Inā ka kawe mai, ka whakakapi te whirihora o nāianei. Kia mōhio ki te kaweake i tō whirihora o nāianei i mua i te kawe mai i tētahi atu.',
    invalidFileFormat: 'Hōputu kōnae muhu',
    configImportedSuccess: 'Kua kawea mai te whirihora. Kaua e wareware ki te tiaki i ngā huringa.',
    errorImportingConfig: 'Hapa i te kawe mai i te whirihora. Tirohia he whaimana te kōnae.',
    errorReadingFileShort: 'Hapa i te pānui kōnae',
    errorExportingConfig: 'Hapa i te kaweake whirihora',
    saveConfiguration: 'Tiaki Whirihora',

    // SchemaStatusBar
    schemaStatusBar: 'Tātaritanga Pūtake Kōrero',
    nluSchema: 'Kōwae NLU',
    nluSchemaModified: 'Kōwae NLU (kua whakarereketia)',
    generate: 'Whakaputa',
    schemaModifiedWarning: 'Kua whakarereketia te kōwae. Pāwhiri ki "Whakaputa" hei whakahou i te pictogram.',
    lang: 'Reo',
    frames: 'Ngā Anga',
    focus: 'Arotahi',
    nluSchemaPlaceholder: 'Kōwae NLU JSON...',
    generatingPictogram: 'E whakaputa ana i te pictogram...',
    dragDropSupport: 'Ka tautoko i ngā kōnae .svg | Tō & taka whakahohea',

    // Entity Edit Dialog
    entityPreview: 'Arokite Rawa',
    errorGeneratingPreview: 'Hapa i te whakaputa arokite',
    noElementAvailable: 'Kāore he huānga DOM e wātea ana',
    elementIdName: 'ID / Ingoa Huānga',
    enterNewName: 'Whakauru ingoa hou...',
    changeIdHelper: 'Hurihia te ID o tēnei huānga i roto i te SVG.',
    regenerateWithAI: 'Whakaputa anō me te AI (Prompt)',
    regeneratePromptPlaceholder: 'Whakamāramahia me pēhea tō whakaputa anō i tēnei huānga...\n\nTauira: \'Whakatūngia tēnei ahua, me ngā ringa e hapainga ana\'',
    regenerateHelper: 'Ka tukuna tēnei prompt ki te API o PictoNet hei whakaputa anō i tēnei huānga anake.',
    generating: 'E whakaputa ana...',
    regenerate: 'Whakaputa anō',
    regenerateNote: 'Ko te whakaputa anō me te AI e hiahia ana ki te hononga API o PictoNet (Wāhanga 2.4). I tēnei wā, he tūāpapa tauira tēnei.',
    note: 'Tuhipoka:',

    // TextInput
    invalidSVGFile: 'Tēnā kōwhiria he kōnae SVG whaimana (.svg)',
    fileTooLarge: 'He nui rawa te kōnae ({size}MB). Mōrahi: 5MB',
    fileDoesNotContainSVG: 'Kāore he SVG whaimana i roto i te kōnae',
    errorParsingSVG: 'Hapa i te tātari i te kōnae SVG. Tirohia he whaimana te kōnae.',
    errorProcessingFile: 'Hapa i te tukatuka kōnae: {error}',
    errorReadingFile: 'Hapa i te pānui kōnae. Tēnā whakamātau anō.',
    fileReadCancelled: 'Kua whakakorehia te pānui kōnae',
    dropSVGHere: 'Taka mai i te kōnae SVG ki konei',
    loadingFile: 'E uta ana i te kōnae...',

    // AdvancedTools
    deleteElementConfirm: 'E tino pono ana koe ki te muku i "{id}"?',
    saveSVG: 'Tiaki SVG',
    copyElement: 'Kape huānga',
    duplicateElement: 'Tārua huānga',
    deleteElement: 'Mukua huānga',

    // PathDebugger
    pathDebugger: 'Kaiwhakatika Ara',
    selectPathElement: 'Kōwhiria he huānga &lt;path&gt; hei tiro pārongo taipitopito',
    viewCommands: 'Tirohia ngā tohutohu',
    normalizeToAbsolute: 'Whakawhānuitia ki te pūroa',
    reverseDirection: 'Hurihia te ahunga',
    noId: 'kāore he id',
    commands: 'Ngā tohutohu:',
    segments: 'Ngā wāhanga:',
    normalized: 'Kua whakawhānuitia:',
    yes: 'Āe',
    no: 'Kāo',
    points: 'Ngā tohu',
    anchor: 'Punga',
    control: 'Mana',
    svgCommands: 'Ngā Tohutohu SVG',
    segmentsWithControlPoints: 'Ngā wāhanga me ngā tohu mana',
    anchorPoints: 'Ngā tohu punga:',
    controlPoints: 'Ngā tohu mana:',
    pathString: 'Tāhū Ara',

    // SVGMetadataEditor
    accessibilityMetadata: 'Raraunga Wāteatanga',
    metadataHelper: 'Ko ngā raraunga ka whakapai ake i te wāteatanga SVG mō ngā kaipānui mata me ngā taputapu āwhina e whai ana i ngā paerewa WAI-ARIA.',
    save: 'Tiaki',
    titleLabel: 'Taitara (title)',
    titlePlaceholder: 'Tauira: Ata kaiwhakamahi',
    titleHelper: 'Taitara whakamārama poto o te SVG',
    descriptionLabel: 'Whakamārama (desc)',
    descriptionPlaceholder: 'Tauira: Whakaahua o tētahi tangata e hanga ana i te moenga me ngā rīhi kikorangi',
    descriptionHelper: 'Whakamārama taipitopito o te ihirangi tirohanga',
    langLabel: 'Reo (lang)',
    langPlaceholder: 'en, es, fr...',
    langHelper: 'Waehere reo ISO 639-1 (hei tauira: en, es, fr)',
    roleLabel: 'Tūnga ARIA (role)',
    roleImg: 'img (whakaahua)',
    rolePresentation: 'presentation (whakapaipai)',
    roleGraphicsDocument: 'graphics-document',
    roleGraphicsSymbol: 'graphics-symbol',
    roleHelper: 'Ka tautuhi i te āhua o ngā kaipānui mata ki te whakamāori i te SVG',
    waiAriaCompliance: 'Whakaūtanga WAI-ARIA',
    titleDefined: 'Taitara kua tautuhia (aria-labelledby)',
    noTitle: 'Kāore he taitara (e tūtohu ana)',
    descriptionDefined: 'Whakamārama kua tautuhia (aria-describedby)',
    noDescription: 'Kāore he whakamārama (me kore pea)',
    languageLabel: 'Reo: {lang}',
    noLanguage: 'Kāore he reo kua tautuhia',
    roleValue: 'Tūnga: {role}',
    noRole: 'Kāore he tūnga kua tautuhia',
    generatedCode: 'Waehere kua whakaputaina'
  },

  arn: {
    // Header
    appTitle: 'PictoForge',
    appSubtitle: 'SVG Wirilkatufe Semantiko',

    // Text Input
    textInputPlaceholder: 'Llangümün kawellu',
    loadSVGFile: 'Üykün SVG kichuñ',
    exportText: 'Wewün dungu',
    dragDropText: 'Küpa .svg kichuñmew | Drag & drop küpan',
    charactersCount: 'dunguñ',

    // SVG Elements Panel
    svgElements: 'SVG DUAM',
    styles: 'AZKINTUN',
    selectedElement: 'Wirilkatun Duam',
    selectElementToApplyStyles: 'Wirilkatun duam kiñeke azkintun ñi küpan',
    noStylesDefined: 'Chem azkintun nielay',
    createNewStyle: 'Werkülen waria azkintun',
    clickToApplyDoubleClickToEdit: 'Pün kiñeke küpan/wiñon, epu pün kiñeke azkinlean',

    // Style Editor Modal
    editStyle: 'Azkinlean Azkintun',
    editStyleDescription: 'Azkünoal CSS azkintun nentun',
    styleName: 'Azkintun küzaw',
    styleNamePlaceholder: 'azkintun-küzaw',
    cssProperties: 'CSS Nentun',
    propertyPlaceholder: 'nentun',
    valuePlaceholder: 'kimün',
    addProperty: 'Werkülen nentun',
    deleteProperty: 'Lafümün nentun',
    deleteStyle: 'Lafümün azkintun',
    cancel: 'Ñewenolafün',
    saveChanges: 'Eluwün azkünoam',

    // Element types
    svg: 'svg',
    group: 'koyagtun',
    path: 'rüpü',
    circle: 'kuwü',
    rect: 'meli kona',
    line: 'witran',
    polygon: 'meli duam',
    polyline: 'feyentun witran',
    text: 'dungu',
    image: 'adentun',
    defs: 'zuamkülen',
    style: 'azkintun',

    // CSS Properties
    fill: 'tukuam',
    stroke: 'witran',
    strokeWidth: 'witran fütra',
    strokeLinejoin: 'witran trarintukun',
    strokeLinecap: 'witran longko',
    opacity: 'peñilkan',

    // Tools
    selectTool: 'Wirilkatun ka wazkonkün duam (Kurü witran)',
    nodeTool: 'Wazkonkün duam longko (Lig witran)',
    penTool: 'Küdaw pluma - Azkinlean duam longko',
    undoAction: 'Weftun',
    redoAction: 'Azkinoal werken',
    zoomOut: 'Püchichen',
    zoomIn: 'Fütachentun',
    resetView: 'Weftual inaltuam',
    downloadSVG: 'Üykün SVG',
    saveProject: 'Eluwün küdaw',

    // Code View
    viewCode: 'Inaltuam SVG dungu',
    copyCode: 'Zungun dungu',
    downloadCode: 'Üykün SVG',
    lines: 'witran',

    // Theme and Language
    changeTheme: 'Azkünoal azkintun',
    changeLanguage: 'Azkünoal zugun',

    // Status
    stylesCount: 'azkintun',
    elementsCount: 'duam',

    // Footer
    version: 'PictoForge v0.1 - SVG Wirilkatufe Semantiko',

    // Messages
    noSVGLoaded: 'SVG nielay üykün',
    loadSVGToStart: 'Üykün SVG kichuñ kiñeke kallfülean',

    // Languages
    english: 'Inglés zugun',
    spanish: 'Wigka zugun',
    maori: 'Maorí zugun',
    mapudungun: 'Mapuzugun',

    // Settings
    settings: 'Azkünoam',
    localSettings: 'PictoForge Küdawtuam Lokal',
    settingsDescription: 'Azkünoal tami küdaw ka azkintun',
    instanceInfo: 'Küdaw Kimün',
    instanceName: 'Küdaw küzaw',
    instanceNamePlaceholder: 'Ka: PUCV Design Lab',
    author: 'Werküfe',
    authorLabel: 'Werküfe (kümelkaweam)',
    authorPlaceholder: 'Tami küzaw',
    location: 'Mapu',
    locationLabel: 'Mapu',
    locationPlaceholder: 'Waria mapu',
    locationHelper: 'Pepi waria rüpü kiñeluwün',
    mapIntegrationHelper: 'Mapu tayüliñ küpantun wüla küme',
    layout: 'Azkintuam',
    swapPanels: 'Wefkonün püral (Wirilkatufe ↔ Ayüwiñ)',
    swapPanelsHelper: 'Azkünoal wirilkatufe ka duam ayüwiñ wente küla ka wüne püral.',
    language: 'Zugun',
    selectLanguage: 'Wirilkatun Zugun',
    selectLanguagePlaceholder: 'Wirilkatun zugun',
    localization: 'Küdaw mapu',
    graphicStylePrompt: 'Azkintun Adkintun Konlayiñ',
    styleDescription: 'Azkintun zuamtun',
    styleDescriptionPlaceholder: 'Zuamtual konla azkintun adkintun tüfachi küdaw mew...',
    stylePromptLabel: 'Azkintun adkintun',
    stylePromptPlaceholder: 'Zuamtual adkintun azkintun nien tami pictogram mew',
    stylePromptHelper: 'Tüfachi dungu küpakülerpuy azkintukunun kimün azkintun',
    customStyles: 'Azkintun Küme',
    locationStyles: 'Mapu Azkintun',
    newStyle: 'Waria Azkintun',
    noCustomStyles: 'Azkintun küme nielay',
    createOneToStart: 'Werkülen kiñeke kallfülean mew',
    createNewToStart: 'Werkülen waria kiñeke kallfülean',
    styleWithoutName: 'Azkintun küzaw nielay',
    fillLabel: 'Tukuam',
    strokeLabel: 'Witran',
    strokeWidthLabel: 'Witran Fütra',
    widthLabel: 'Fütra',
    deleteLabel: 'Lafümün',
    deleteStyleLabel: 'Lafümün azkintun',
    deleteStyleConfirm: '¿Lafümün tüfachi azkintun?',
    exportImportConfig: 'Wewün/Ülkantun Azkünoam',
    exportConfig: 'Wewün Azkünoam',
    importConfig: 'Ülkantun Azkünoam',
    exportConfigHelper: 'Eluwün tami azkünoam JSON kichuñ mew elukan mapu.',
    importWarning: 'Ülkantun mew, küme azkünoam wefkunulerpuy. Elual tami azkünoam wewün kümemew.',
    invalidFileFormat: 'Kichuñ azkintun weza',
    configImportedSuccess: 'Azkünoam ülkantun küme. Kümelmün eluwün azkünoam.',
    errorImportingConfig: 'Weza ülkantun azkünoam. Kimeltuwal kichuñ küme.',
    errorReadingFileShort: 'Weza rakizuamün kichuñ',
    errorExportingConfig: 'Weza wewün azkünoam',
    saveConfiguration: 'Eluwün Azkünoam',

    // SchemaStatusBar
    schemaStatusBar: 'Zugun Nentun Rakizuamtun',
    nluSchema: 'NLU Kona',
    nluSchemaModified: 'NLU Kona (azkünoam)',
    generate: 'Werkülen',
    schemaModifiedWarning: 'Kona azkünoalay. Pün "Werkülen" wiñoal pictogram.',
    lang: 'Zugun',
    frames: 'Kona',
    focus: 'Inallun',
    nluSchemaPlaceholder: 'NLU Kona JSON...',
    generatingPictogram: 'Werkülelün pictogram...',
    dragDropSupport: 'Küpa .svg kichuñmew | Drag & drop küpan',

    // Entity Edit Dialog
    entityPreview: 'Duam Inaltuam',
    errorGeneratingPreview: 'Weza werkülelün inaltuam',
    noElementAvailable: 'DOM duam nielay küpan',
    elementIdName: 'Duam ID / Küzaw',
    enterNewName: 'Waria küzaw...',
    changeIdHelper: 'Azkünoal ID tüfachi duam SVG mew.',
    regenerateWithAI: 'Wefwerkülen AI mew (Adkintun)',
    regeneratePromptPlaceholder: 'Zuamtual chumül nien wefwerkülen tüfachi duam...\n\nKa: \'Küme zugu tüfachi adentun, namun lonko mew\'',
    regenerateHelper: 'Tüfachi adkintun elülerpuy PictoNet API mew wefwerkülen tüfa duam.',
    generating: 'Werkülelün...',
    regenerate: 'Wefwerkülen',
    regenerateNote: 'Wefwerkülen AI mew PictoNet API küpatuy (Fase 2.4). Tüfamew, tüfa kiñe azkintun duamkefel.',
    note: 'Kimün:',

    // TextInput
    invalidSVGFile: 'Wirilkatual kiñe SVG kichuñ küme (.svg)',
    fileTooLarge: 'Kichuñ fütra kellu ({size}MB). Fütra kümekechi: 5MB',
    fileDoesNotContainSVG: 'Kichuñ SVG küme nielay',
    errorParsingSVG: 'Weza rakizuamün SVG kichuñ. Kimeltuwal kichuñ küme.',
    errorProcessingFile: 'Weza küdawün kichuñ: {error}',
    errorReadingFile: 'Weza rakizuamün kichuñ. Wiñomün werkenol.',
    fileReadCancelled: 'Rakizuamün kichuñ ñewenolafün',
    dropSVGHere: 'Lafümün SVG kichuñ tüfamew',
    loadingFile: 'Üykülün kichuñ...',

    // AdvancedTools
    deleteElementConfirm: '¿Küme lafümün "{id}"?',
    saveSVG: 'Eluwün SVG',
    copyElement: 'Zungun duam',
    duplicateElement: 'Epu kiñelen duam',
    deleteElement: 'Lafümün duam',

    // PathDebugger
    pathDebugger: 'Rüpü Azkintufe',
    selectPathElement: 'Wirilkatun kiñe &lt;path&gt; duam inaltuam kimün',
    viewCommands: 'Inaltuam azkintuam',
    normalizeToAbsolute: 'Azkünoal konün duam',
    reverseDirection: 'Wefkonün amuam',
    noId: 'id nielay',
    commands: 'Azkintuam:',
    segments: 'Duam:',
    normalized: 'Azkünoam:',
    yes: 'Mari',
    no: 'Ke',
    points: 'Longko',
    anchor: 'Pukem',
    control: 'Zuam',
    svgCommands: 'SVG Azkintuam',
    segmentsWithControlPoints: 'Duam zuam longko mew',
    anchorPoints: 'Pukem longko:',
    controlPoints: 'Zuam longko:',
    pathString: 'Rüpü Dungu',

    // SVGMetadataEditor
    accessibilityMetadata: 'Küpam Kimün',
    metadataHelper: 'Kimün kümelkawpekenulu SVG küpam ñi rakizuam dugu ka küdaw küpam WAI-ARIA azkintuam mew.',
    save: 'Eluwün',
    titleLabel: 'Küzaw (title)',
    titlePlaceholder: 'Ka: Che adentun',
    titleHelper: 'Pichi SVG küzaw zuamtun',
    descriptionLabel: 'Zuamtun (desc)',
    descriptionPlaceholder: 'Ka: Che adentun llangümüm kawellu kalül witral mew',
    descriptionHelper: 'Konla inal kimün zuamtun',
    langLabel: 'Zugun (lang)',
    langPlaceholder: 'en, es, arn...',
    langHelper: 'Zugun ISO 639-1 kona (ka: en, es, arn)',
    roleLabel: 'ARIA Küdaw (role)',
    roleImg: 'img (adentun)',
    rolePresentation: 'presentation (azkintun)',
    roleGraphicsDocument: 'graphics-document',
    roleGraphicsSymbol: 'graphics-symbol',
    roleHelper: 'Azkintukeyal rakizuam dugu SVG zuamtun',
    waiAriaCompliance: 'WAI-ARIA Azkintuam',
    titleDefined: 'Küzaw zugu (aria-labelledby)',
    noTitle: 'Küzaw nielay (kimeltual)',
    descriptionDefined: 'Zuamtun zugu (aria-describedby)',
    noDescription: 'Zuamtun nielay (küpañ)',
    languageLabel: 'Zugun: {lang}',
    noLanguage: 'Zugun nielay',
    roleValue: 'Küdaw: {role}',
    noRole: 'Küdaw nielay',
    generatedCode: 'Dungu werkülen'
  }
};

// Detectar idioma del navegador
const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.languages[0];

  // Mapear códigos de idioma del navegador a nuestros códigos
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('mi')) return 'mi';
  if (browserLang.startsWith('arn')) return 'arn';
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
    { code: 'mi', name: t('maori'), nativeName: 'Māori' },
    { code: 'arn', name: t('mapudungun'), nativeName: 'Mapuzugun' }
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
