import { EDITOR_CONSTANTS } from '../constants';

export class Node {
  constructor(draw, type, x, y, size, color) {
    this.draw = draw;
    this.type = type;
    this.defaultColor = color;

    this.element = draw.circle()
      .radius(size / 2)
      .fill(color)
      .center(x, y)
      .attr('vector-effect', 'non-scaling-stroke')
      .draggable()
      .on('mouseover', () => this.setColor(EDITOR_CONSTANTS.VERTEX.COLOR.HOVER))
      .on('mouseout', () => this.setColor(this.defaultColor))
      .on('dragstart', () => this.setColor(EDITOR_CONSTANTS.VERTEX.COLOR.ACTIVE))
      .on('dragend', () => this.setColor(this.defaultColor));
  }

  setDragHandler(callback) {
    this.element.on('dragmove', () => {
      this.setColor(EDITOR_CONSTANTS.VERTEX.COLOR.ACTIVE);
      callback();
    });
  }

  setClickHandler(callback) {
    this.element.on('click', callback);
  }

  setColor(color) {
    this.element.fill(color);
  }

  getPosition() {
    const bbox = this.element.bbox();
    return {
      x: bbox.cx,
      y: bbox.cy
    };
  }

  remove() {
    this.element.remove();
  }
}