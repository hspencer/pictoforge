export class ScaleUtils {
    static getScaleFactor(draw) {
      const bbox = draw.node.getBoundingClientRect();
      const viewBox = draw.viewbox();
      return Math.min(bbox.width / viewBox.width, bbox.height / viewBox.height);
    }
  
    static scalePoint(point, factor) {
      return {
        x: point.x * factor,
        y: point.y * factor
      };
    }
  }