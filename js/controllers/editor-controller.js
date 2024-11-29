import {
    SVG
} from '@svgdotjs/svg.js';
import {
    ScaleUtils
} from '../utils/scale-utils';
import {
    Path
} from '../models/path';

export class EditorController {
    constructor(containerId) {
        this.mainSvg = SVG().addTo(containerId)
            .size('100%', '100%')
            .viewbox('0 0 90 90');

        // El grupo de contenido hereda el viewBox del SVG principal
        this.contentGroup = this.mainSvg.group()
            .attr('transform-origin', 'center');

        // El grupo de nodos necesita el mismo sistema de coordenadas
        this.nodesGroup = this.mainSvg.group()
            .attr('transform-origin', 'center')
            .front(); // Asegura que los nodos estén siempre visibles

        this.paths = new Map();
        this.selectedPath = null;
        this.scaleFactor = 1;
        this.nodesVisible = false;
    }

    loadSVG(svgContent) {
        this.clearNodes();
        this.contentGroup.clear();

        this.contentGroup.svg(svgContent);

        const svgElement = this.contentGroup.findOne('svg');
        const viewBox = svgElement.attr('viewBox') || '0 0 90 90';

        // Asegurar que el mainSvg use el mismo viewBox
        this.mainSvg.viewbox(viewBox);
        this.scaleFactor = 1; // Ya no necesitamos escalar manualmente
    }

    _initializePaths() {
        // Limpiar grupo de nodos antes de crear nuevos
        this.nodesGroup.clear();

        this.contentGroup.find('path').forEach(pathElement => {
            const path = new Path(pathElement);
            // Pasar el grupo de nodos para que los nodos se creen allí
            path.createNodes(this.nodesGroup, this.scaleFactor);
            this.paths.set(pathElement.id(), path);
        });
    }

    clearAll() {
        this.paths.forEach(path => path.remove());
        this.paths.clear();
        this.selectedPath = null;
        this.draw.clear();
    }

    toggleNodes() {
        const paths = this.contentGroup.find('path');
        console.log('Paths encontrados:', paths.length);

        if (!paths.length) return;

        this.nodesVisible = !this.nodesVisible;

        if (this.nodesVisible) {
            this._initializePaths();
        } else {
            this.clearNodes();
        }
    }

    clearNodes() {
        this.paths.forEach(path => {
            path.nodes.forEach(node => node.remove());
            path.bezierControls.forEach(control => control.remove());
        });
        this.paths.clear();
        this.nodesGroup.clear();
        this.selectedPath = null;
    }

    selectPath(id) {
        if (this.selectedPath) {
            this.selectedPath.setSelected(false);
        }

        const path = this.paths.get(id);
        if (path) {
            path.setSelected(true);
            this.selectedPath = path;
        }
    }

    getSVGContent() {
        // Ocultar temporalmente los nodos de edición
        this.nodesGroup.hide();
        const content = this.mainSvg.svg();
        this.nodesGroup.show();
        return content;
    }

    selectPath(id) {
        if (this.selectedPath) {
            this.selectedPath.setSelected(false);
        }

        const path = this.paths.get(id);
        if (path) {
            path.setSelected(true);
            this.selectedPath = path;
            this.updateElementsPanel(path);
        }
    }

    updateElementsPanel(path) {
        const elementsDiv = document.getElementById('elements');
        elementsDiv.innerHTML = '';

        // Crear campo para editar ID
        const idLabel = document.createElement('label');
        idLabel.textContent = 'Element ID:';
        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.value = path.element.id();
        idInput.addEventListener('change', () => {
            path.element.id(idInput.value);
        });

        // Crear área para editar CSS
        const cssLabel = document.createElement('label');
        cssLabel.textContent = 'CSS Style:';
        const cssTextarea = document.createElement('textarea');
        cssTextarea.value = this._getPathStyles(path.element);
        cssTextarea.addEventListener('change', () => {
            this._applyStyles(path.element, cssTextarea.value);
        });

        // Crear slider para el stroke-width
        const strokeLabel = document.createElement('label');
        strokeLabel.textContent = 'Stroke Width:';
        const strokeSlider = document.createElement('input');
        strokeSlider.type = 'range';
        strokeSlider.min = '0.25';
        strokeSlider.max = '12';
        strokeSlider.step = '0.25';
        strokeSlider.value = path.element.attr('stroke-width') || '3';
        strokeSlider.addEventListener('input', (e) => {
            const width = e.target.value;
            path.element.stroke({
                width
            });
            this._updateCSSTextarea(cssTextarea, path.element);
        });

        // Agregar elementos al panel
        elementsDiv.appendChild(idLabel);
        elementsDiv.appendChild(idInput);
        elementsDiv.appendChild(document.createElement('br'));
        elementsDiv.appendChild(cssLabel);
        elementsDiv.appendChild(cssTextarea);
        elementsDiv.appendChild(document.createElement('br'));
        elementsDiv.appendChild(strokeLabel);
        elementsDiv.appendChild(strokeSlider);
    }

    _getPathStyles(pathElement) {
        const styles = [
            `stroke: ${pathElement.attr('stroke') || '#000'};`,
            `stroke-width: ${pathElement.attr('stroke-width') || '3'};`,
            `stroke-linecap: ${pathElement.attr('stroke-linecap') || 'round'};`,
            `stroke-linejoin: ${pathElement.attr('stroke-linejoin') || 'round'};`,
            `fill: ${pathElement.attr('fill') || 'none'};`
        ];
        return styles.join('\n');
    }

    _updateCSSTextarea(textarea, pathElement) {
        textarea.value = this._getPathStyles(pathElement);
    }

    _applyStyles(pathElement, cssText) {
        const styleLines = cssText.split(';').filter(line => line.trim());
        styleLines.forEach(line => {
            const [property, value] = line.split(':').map(part => part.trim());
            if (property && value) {
                pathElement.attr(property, value);
            }
        });
    }
}