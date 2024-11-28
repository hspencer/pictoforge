import { SVG } from '@svgdotjs/svg.js';
import { ScaleUtils } from '../utils/scale-utils';
import { Path } from '../models/path';

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
        return this.draw.svg();
    }
}