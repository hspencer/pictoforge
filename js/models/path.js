import { EDITOR_CONSTANTS } from '../constants';
import { ScaleUtils } from '../utils/scale-utils';
import { Node } from './node';

export class Path {
    constructor(pathElement) {
        this.element = pathElement;
        this.nodes = [];
        this.bezierControls = [];
    }

    createNodes(draw, scaleFactor) {
        const pathArray = this.element.array();
        pathArray.forEach((command, index) => {
            this._createNodesForCommand(draw, command, index, scaleFactor);
        });
    }

    _createNodesForCommand(draw, command, index, scaleFactor) {
        const [type, ...coords] = command;

        if (type === 'M' || type === 'L') {
            this._createVertex(draw, coords[0], coords[1], scaleFactor, index);
        } else if (type === 'C') {
            this._createBezierSegment(draw, coords, scaleFactor, index);
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

        node.setDragHandler(() => {
            const pos = node.getPosition();
            this._updatePathNode(index, pos);
        });

        this.nodes.push(node);
    }

    _createBezierSegment(draw, coords, scaleFactor, index) {
        this._createVertex(draw, coords[4], coords[5], scaleFactor, index);

        [
            [coords[0], coords[1]],
            [coords[2], coords[3]]
        ].forEach((point, controlIndex) => {
            const control = new Node(
                draw,
                'bezier',
                point[0],
                point[1],
                EDITOR_CONSTANTS.BEZIER.SIZE,
                EDITOR_CONSTANTS.BEZIER.COLOR
            );

            control.element.css('z-index', 1000);
            control.element.attr('pointer-events', 'all');

            this.bezierControls.push(control);
        });
    }

    _updatePathNode(index, position) {
        const pathArray = this.element.array().valueOf();
        const command = pathArray[index];

        if (command[0] === 'M' || command[0] === 'L') {
            command[1] = position.x;
            command[2] = position.y;
        } else if (command[0] === 'C') {
            command[5] = position.x;
            command[6] = position.y;
        }

        this.element.plot(pathArray);
    }

    _updateBezierControl(pathIndex, controlIndex, position) {
        const pathArray = this.element.array().valueOf();
        const command = pathArray[pathIndex];

        if (command[0] === 'C') {
            const offset = controlIndex * 2 + 1;
            command[offset] = position.x;
            command[offset + 1] = position.y;
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
        this.bezierControls.forEach(control => control.remove());
        this.element.remove();
    }
}