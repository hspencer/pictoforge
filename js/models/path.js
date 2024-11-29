import {
    EDITOR_CONSTANTS
} from '../constants';
import {
    Node
} from './node';

export class Path {
    constructor(pathElement) {
        this.element = pathElement;
        this.nodes = [];
        this.bezierControls = [];
    }

    createNodes(draw, scaleFactor) {
        const pathArray = this.element.array();
        let lastVertex = null;

        pathArray.forEach((command, index) => {
            const [type, ...coords] = command;

            switch (type) {
                case 'M':
                case 'L':
                    lastVertex = this._createVertex(draw, coords[0], coords[1], scaleFactor, index);
                    break;

                case 'C':
                    this._createBezierSegment(draw, coords, scaleFactor, index, lastVertex);
                    lastVertex = this._createVertex(draw, coords[4], coords[5], scaleFactor, index);
                    break;
            }
        });
    }

    onClick() {
        const elementsPanel = document.getElementById('elements');
        elementsPanel.innerHTML = `
          <div class="element-info">
            <label>ID:</label>
            <input type="text" id="elementId" value="${this.element.id()}"/>
            <label>Style:</label>
            <textarea id="elementStyle">${this.element.attr('class')||''}</textarea>
            <label>Stroke Width:</label>
            <input type="range" id="elementStrokeWidth" 
                   min="0.25" max="12" step="0.25" 
                   value="${this.element.attr('stroke-width')||3}"/>
          </div>
        `;

        document.getElementById('elementId').addEventListener('change', e => {
            this.element.id(e.target.value);
        });

        document.getElementById('elementStrokeWidth').addEventListener('input', e => {
            this.element.attr('stroke-width', e.target.value);
        });
    }

    _createNodesForCommand(draw, command, index, scaleFactor) {
        const [type, ...coords] = command;
        const pathArray = this.element.array().valueOf();

        switch (type) {
            case 'M':
                this._createVertex(draw, coords[0], coords[1], scaleFactor, index);
                break;

            case 'L':
                this._createVertex(draw, coords[0], coords[1], scaleFactor, index);
                break;

            case 'C':
                this._createBezierSegment(draw, coords, scaleFactor, index);
                if (index === pathArray.length - 1) {
                    this._createVertex(draw, coords[4], coords[5], scaleFactor, index);
                }
                break;
        }
    }

    _createVertex(draw, x, y, scaleFactor, index) {
        const node = new Node(
            draw,
            'vertex',
            x,
            y,
            EDITOR_CONSTANTS.VERTEX.SIZE,
            EDITOR_CONSTANTS.VERTEX.COLOR.UNSELECTED
        );

        node.setDragHandler(() => this._updatePathNode(index, node.getPosition()));
        this.nodes.push(node);
        return node; // Añadir return
    }

    _createBezierSegment(draw, coords, scaleFactor, index) {
        // Obtener punto inicial del comando anterior
        const pathArray = this.element.array().valueOf();
        const prevCommand = pathArray[index - 1];
        const startX = prevCommand[1];
        const startY = prevCommand[2];

        // Crear nodo final (vértice)
        const endX = coords[4],
            endY = coords[5];
        const endPoint = this._createVertex(draw, endX, endY, scaleFactor, index);

        // Crear puntos de control
        [{
                control: [coords[0], coords[1]],
                anchor: [startX, startY]
            }, // Primer control -> punto inicial
            {
                control: [coords[2], coords[3]],
                anchor: [endX, endY]
            } // Segundo control -> punto final
        ].forEach(({
            control,
            anchor
        }, controlIndex) => {
            const [cx, cy] = control;
            const [ax, ay] = anchor;

            const controlNode = new Node(
                draw,
                'bezier',
                cx, cy,
                EDITOR_CONSTANTS.BEZIER.SIZE,
                EDITOR_CONSTANTS.BEZIER.COLOR
            );

            const line = draw.line(cx, cy, ax, ay)
                .stroke({
                    color: EDITOR_CONSTANTS.BEZIER.COLOR,
                    width: 1
                })
                .attr('vector-effect', 'non-scaling-stroke');

            controlNode.setDragHandler(() => {
                const pos = controlNode.getPosition();
                const currentAnchor = controlIndex === 0 ? [startX, startY] : endPoint.getPosition();
                this._updateBezierControl(index, controlIndex, pos);
                line.plot(pos.x, pos.y, currentAnchor.x, currentAnchor.y);
            });

            // Actualizar línea cuando se mueve el vértice final
            if (controlIndex === 1) {
                endPoint.setDragHandler(() => {
                    const pos = endPoint.getPosition();
                    const controlPos = controlNode.getPosition();
                    this._updatePathNode(index, pos);
                    line.plot(controlPos.x, controlPos.y, pos.x, pos.y);
                });
            }

            this.bezierControls.push(controlNode);
        });
    }

    _updatePathNode(index, position) {
        const pathArray = this.element.array().valueOf();
        const command = pathArray[index];

        if (command[0] === 'M' || command[0] === 'L') {
            command[1] = position.x;
            command[2] = position.y;
        } else if (command[0] === 'C' && index === pathArray.length - 1) {
            command[5] = position.x;
            command[6] = position.y;
        }

        this.element.plot(pathArray);
    }

    _updateBezierControl(pathIndex, controlIndex, position) {
        const pathArray = this.element.array().valueOf();
        const command = pathArray[pathIndex];

        if (command[0] === 'C') {
            const offset = controlIndex * 2;
            command[1 + offset] = position.x;
            command[2 + offset] = position.y;
        }

        this.element.plot(pathArray);
    }

    setSelected(selected) {
        const color = selected ?
            EDITOR_CONSTANTS.VERTEX.COLOR.SELECTED :
            EDITOR_CONSTANTS.VERTEX.COLOR.UNSELECTED;
        this.nodes.forEach(node => node.setColor(color));
    }

    remove() {
        this.nodes.forEach(node => node.remove());
        this.bezierControls.forEach(control => {
            control.line?.remove(); // Eliminar líneas de control
            control.remove();
        });
        this.element.remove();
    }
}