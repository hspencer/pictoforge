console.log('app.js cargado');

import { EditorController } from './controllers/editor-controller';
import { EDITOR_CONSTANTS } from './constants';
import '@svgdotjs/svg.draggable.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.svg';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const editor = new EditorController('#svg-viewer');

  document.getElementById('load-svg').addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        editor.loadSVG(e.target.result);
      };
      reader.readAsText(file);
    }
  });

  const selectButton = document.getElementById('node-select');
  console.log('Select button:', selectButton);
  
  selectButton.addEventListener('click', () => {
    console.log('Select button clicked');
    editor.toggleNodes();
  });

  document.getElementById('save-svg').addEventListener('click', () => {
    const svgContent = editor.getSVGContent();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'edited.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  document.getElementById('stroke-width-slider').addEventListener('input', (e) => {
    const newWidth = parseFloat(e.target.value);
    editor.draw.find('path').forEach(path => {
      path.stroke({ width: newWidth });
    });
  });
});