# Spine Edit

## Minimal SVG editor for RLHF

### Estructura
```
/spine-edit
|-- /dist          # Archivos generados por Webpack
|-- /css           # Carpeta con los estilos generados
|   |-- style.css  # Archivo CSS compilado
|-- /scss          # Carpeta con los estilos fuente en Sass
|   |-- style.scss # Archivo principal Sass
/js
|-- /constants
|   `-- index.js        # Contiene EDITOR_CONSTANTS
|-- /utils
|   `-- scale-utils.js  # Contiene clase ScaleUtils
|-- /models
|   |-- node.js         # Contiene clase Node
|   `-- path.js         # Contiene clase Path  
|-- /controllers
|   `-- editor-controller.js  # Contiene clase EditorController
`-- app.js             # Punto de entrada, importa y usa los módulos
|-- /public        # Archivos estáticos
|   |-- index.html # Archivo principal HTML
|-- package.json   # Configuración del proyecto
|-- webpack.config.js # Configuración de Webpack
```


### Comandos

Run server and wtch scss:

```
npm run start
```