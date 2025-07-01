import { SvgElement } from "@shared/schema";

export function formatSvgCode(code: string): string {
  try {
    // Basic XML formatting - in a real implementation, use a proper XML formatter
    let formatted = code
      .replace(/></g, '>\n<')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Add proper indentation
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentSize = 2;
    
    return lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('</')) {
        indentLevel--;
      }
      
      const indented = ' '.repeat(indentLevel * indentSize) + trimmed;
      
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
        indentLevel++;
      }
      
      return indented;
    }).join('\n');
  } catch (error) {
    console.error('Error formatting SVG:', error);
    return code;
  }
}

export function validateSvgCode(code: string): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    return !parserError;
  } catch (error) {
    return false;
  }
}

export function parseSvgToStructure(svgCode: string): SvgElement {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgCode, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }
    
    return elementToSvgElement(svgElement);
  } catch (error) {
    console.error('Error parsing SVG:', error);
    return createDefaultSvgElement();
  }
}

function elementToSvgElement(element: Element): SvgElement {
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  
  const children: SvgElement[] = [];
  for (let i = 0; i < element.children.length; i++) {
    children.push(elementToSvgElement(element.children[i]));
  }
  
  return {
    id: attributes.id || generateId(),
    type: element.tagName.toLowerCase() as SvgElement['type'],
    attributes,
    children,
    content: element.textContent || undefined,
  };
}

export function structureToSvgCode(element: SvgElement, customStyles?: Record<string, Record<string, string>>): string {
  // Generate CSS styles from custom styles if provided
  let styleContent = '';
  if (customStyles && Object.keys(customStyles).length > 0) {
    styleContent = Object.entries(customStyles)
      .map(([className, styles]) => {
        const cssProps = Object.entries(styles)
          .map(([prop, value]) => `  ${prop}: ${value};`)
          .join('\n');
        return `.${className} {\n${cssProps}\n}`;
      })
      .join('\n\n');
  }

  return generateSvgElement(element, customStyles, styleContent);
}

function generateSvgElement(element: SvgElement, customStyles?: Record<string, Record<string, string>>, rootStyleContent?: string): string {
  const attrs = Object.entries(element.attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  const openTag = `<${element.type}${attrs ? ' ' + attrs : ''}>`;
  
  if (element.children.length === 0 && !element.content) {
    return `<${element.type}${attrs ? ' ' + attrs : ''}/>`;
  }
  
  let content = '';
  if (element.content) {
    content = element.content;
  }

  // Add style element to root SVG if we have custom styles
  if (element.type === 'svg' && rootStyleContent) {
    const styleElement = `<style type="text/css"><![CDATA[${rootStyleContent}]]></style>`;
    content = styleElement + content;
  }
  
  const childrenCode = element.children
    .map(child => generateSvgElement(child, customStyles))
    .join('\n');
  
  return `${openTag}${content}${childrenCode}</${element.type}>`;
}

export function createDefaultSvgElement(): SvgElement {
  return {
    id: 'pictogram',
    type: 'svg',
    attributes: {
      id: 'pictogram',
      xmlns: 'http://www.w3.org/2000/svg',
      version: '1.1',
      viewBox: '0 0 100 100',
      width: '100',
      height: '100',
    },
    children: [
      {
        id: 'defs-root',
        type: 'defs',
        attributes: {},
        children: [
          {
            id: 'styles',
            type: 'style',
            attributes: {},
            children: [],
            content: `
    .white-outline-black {
        fill: #fff;
        stroke: #000;
        stroke-linejoin: square;
    }
    .black-outline-white {
        fill: #000;
        stroke: #FFF;
        stroke-linejoin: square;
    }
    .selected {
        fill: #87CEEB;
        stroke: #4682B4;
        stroke-width: 2;
    }
            `,
          },
        ],
      },
      {
        id: 'bed',
        type: 'g',
        attributes: {
          id: 'bed',
          class: 'white-outline-black',
        },
        children: [
          {
            id: 'bed_frame',
            type: 'path',
            attributes: {
              id: 'bed_frame',
              d: 'M86.6,66.1l6.7,10.9v7.1h-5.1v5.1c0,.9-.7,1.6-1.6,1.6h-2.3c-.9,0-1.6-.7-1.6-1.6v-5.1h-38.2v5.1c0,.9-.7,1.6-1.6,1.6h-2.3c-.9,0-1.6-.7-1.6-1.6v-5.1h-5.1v-7.1l6.7-10.9v-18.5c0-1.3,1.1-2.4,2.4-2.4h41.3c1.3,0,2.4,1.1,2.4,2.4v18.5h-.1Z',
            },
            children: [],
          },
          {
            id: 'mattress',
            type: 'path',
            attributes: {
              id: 'mattress',
              d: 'M85.9,78.6h-44.4c-3,0-5.4-2.4-5.4-5.4v-1.9c0-1.5.7-3,1.8-4l7.7-6.8c1-.9,2.3-1.4,3.6-1.4h29c1.3,0,2.6.5,3.6,1.4l7.7,6.8c1.2,1,1.8,2.5,1.8,4v1.9c0,3-2.4,5.4-5.4,5.4Z',
            },
            children: [],
          },
          {
            id: 'pillow',
            type: 'path',
            attributes: {
              id: 'pillow',
              d: 'M52.2,53.5h22.4c2.3,0,4.1,1.8,4.1,4h0c0,2.2-1.8,4-4.1,4h-22.4c-2.3,0-4.1-1.8-4.1-4h0c0-2.2,1.8-4,4.1-4Z',
            },
            children: [],
          },
          {
            id: 'sheet',
            type: 'path',
            attributes: {
              id: 'sheet',
              d: 'M50.6,39.6c2.1,1.3,15.3,5.5,15.3,5.5,0,0-1.3,9.6-3.9,12.5-6.3,7.1-17.2,8.3-20.7,10.2s-3.4,9.7.8,10.8c-7.6.3-6.9-8.9-4.2-11.3s7.9-6.7,10.7-11.7c4.1-7.4,2.3-13.8,2-16Z',
            },
            children: [],
          },
        ],
      },
      {
        id: 'person',
        type: 'g',
        attributes: {
          id: 'person',
          class: 'black-outline-white',
        },
        children: [
          {
            id: 'arm',
            type: 'path',
            attributes: {
              id: 'arm',
              d: 'M29.9,37.5l4.2,7.8,6.7,3.7c1.1.6,1.5,2.1.7,3.2h0c-.6.8-1.7,1.1-2.6.7l-9.1-3.9-4.1-6.4',
            },
            children: [],
          },
          {
            id: 'body',
            type: 'path',
            attributes: {
              id: 'body',
              d: 'M29,90.5l-4.9.2-5-35.6-3,18.9-4.2,17.1h-5l4.3-19.7.6-19.4c.2-2.1.2-3.2.6-5,0,0,.8-3.7,2-6.9s3.5-7.2,5.2-9.3l2.3-2.7c2.4-2.8,6.7-3.1,9.5-.7l2.1,1.8,7.6,9.2c.8.9,1.8,1.6,3,2l10,3c1.4.4,2.2,2,1.6,3.4h0c-.5,1.1-1.7,1.8-2.9,1.5l-13.7-3.3-9.1-7.5-4.9,7.5,4,45.5h0Z',
            },
            children: [],
          },
          {
            id: 'head',
            type: 'circle',
            attributes: {
              id: 'head',
              cx: '38.9',
              cy: '19.9',
              r: '5.5',
            },
            children: [],
          },
        ],
      },
    ],
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function findElementById(root: SvgElement, id: string): SvgElement | null {
  if (root.id === id) {
    return root;
  }
  
  for (const child of root.children) {
    const found = findElementById(child, id);
    if (found) {
      return found;
    }
  }
  
  return null;
}

export function updateElementInStructure(
  root: SvgElement,
  elementId: string,
  updates: Partial<SvgElement>
): SvgElement {
  if (root.id === elementId) {
    return { ...root, ...updates };
  }
  
  return {
    ...root,
    children: root.children.map(child =>
      updateElementInStructure(child, elementId, updates)
    ),
  };
}

export function removeElementFromStructure(root: SvgElement, elementId: string): SvgElement {
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== elementId)
      .map(child => removeElementFromStructure(child, elementId)),
  };
}

export function addElementToStructure(
  root: SvgElement,
  parentId: string,
  newElement: SvgElement
): SvgElement {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...root.children, newElement],
    };
  }
  
  return {
    ...root,
    children: root.children.map(child =>
      addElementToStructure(child, parentId, newElement)
    ),
  };
}
