export class Node {
    constructor(draw, type, x, y, size, color) {
      this.element = draw.circle()
        .radius(size / 2) // radius es la mitad del size para mantener el tamaño deseado
        .fill(color)
        .center(x, y)
        .attr('vector-effect', 'non-scaling-stroke') // Previene el escalado
        .draggable();
      this.type = type;
    }
  
    setDragHandler(callback) {
      this.element.on('dragmove', callback);
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