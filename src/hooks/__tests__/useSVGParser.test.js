import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSVGParser } from '../useSVGParser';

describe('useSVGParser', () => {
  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useSVGParser());

    expect(result.current.svgData).toBeNull();
    expect(result.current.selectedElement).toBeNull();
    expect(result.current.svgContent).toBe('');
  });

  it('debe parsear SVG válido correctamente', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = '<svg id="root"><circle id="c1" cx="50" cy="50" r="40"/></svg>';

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    expect(result.current.svgData).not.toBeNull();
    expect(result.current.svgData.root.tagName).toBe('svg');
    expect(result.current.svgData.root.children).toHaveLength(1);
    expect(result.current.svgData.root.children[0].id).toBe('c1');
  });

  it('debe extraer estilos CSS del SVG', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = `
      <svg>
        <style>.red { fill: red; } .blue { fill: blue; }</style>
        <circle class="red" cx="50" cy="50" r="40"/>
      </svg>
    `;

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    expect(result.current.svgData.styles).toHaveProperty('red');
    expect(result.current.svgData.styles).toHaveProperty('blue');
  });

  it('debe extraer viewBox y dimensiones', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = '<svg viewBox="0 0 200 200" width="200" height="200"><rect/></svg>';

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    expect(result.current.svgData.viewBox).toBe('0 0 200 200');
    expect(result.current.svgData.width).toBe('200');
    expect(result.current.svgData.height).toBe('200');
  });

  it('debe parsear jerarquía anidada correctamente', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = `
      <svg>
        <g id="group1">
          <g id="group2">
            <circle id="circle1" cx="50" cy="50" r="40"/>
          </g>
        </g>
      </svg>
    `;

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    expect(result.current.svgData.root.children).toHaveLength(1);
    expect(result.current.svgData.root.children[0].id).toBe('group1');
    expect(result.current.svgData.root.children[0].children).toHaveLength(1);
    expect(result.current.svgData.root.children[0].children[0].id).toBe('group2');
  });

  it('debe extraer atributos de elementos', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = '<svg><circle id="c1" cx="50" cy="50" r="40" fill="red"/></svg>';

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    const circle = result.current.svgData.root.children[0];
    expect(circle.attributes.cx).toBe('50');
    expect(circle.attributes.cy).toBe('50');
    expect(circle.attributes.r).toBe('40');
    expect(circle.attributes.fill).toBe('red');
  });

  it('debe permitir seleccionar elemento', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = '<svg><circle id="c1" cx="50" cy="50" r="40"/></svg>';

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    const element = result.current.svgData.root.children[0];

    act(() => {
      result.current.setSelectedElement(element);
    });

    expect(result.current.selectedElement).toBe(element);
  });

  it('debe encontrar elemento por ID', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = `
      <svg>
        <g id="group1">
          <circle id="circle1" cx="50" cy="50" r="40"/>
        </g>
      </svg>
    `;

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    const found = result.current.findElementById('circle1');
    expect(found).not.toBeNull();
    expect(found.id).toBe('circle1');
    expect(found.tagName).toBe('circle');
  });

  it('debe obtener elementos por tipo', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = `
      <svg>
        <circle id="c1" cx="50" cy="50" r="40"/>
        <rect id="r1" x="0" y="0" width="100" height="100"/>
        <circle id="c2" cx="100" cy="100" r="20"/>
      </svg>
    `;

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    const circles = result.current.getElementsByType('circle');
    expect(circles).toHaveLength(2);
    expect(circles[0].id).toBe('c1');
    expect(circles[1].id).toBe('c2');
  });

  it('debe obtener ruta completa del elemento', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = `
      <svg id="root">
        <g id="group1">
          <g id="group2">
            <circle id="circle1" cx="50" cy="50" r="40"/>
          </g>
        </g>
      </svg>
    `;

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    const path = result.current.getElementPath('circle1');
    expect(path).toHaveLength(4);
    expect(path[0].id).toBe('root');
    expect(path[1].id).toBe('group1');
    expect(path[2].id).toBe('group2');
    expect(path[3].id).toBe('circle1');
  });

  it('debe manejar SVG inválido sin crash', async () => {
    const { result } = renderHook(() => useSVGParser());

    const invalidSvg = '<invalid>not svg</invalid>';

    await act(async () => {
      const parsed = await result.current.loadSVG(invalidSvg);
      expect(parsed).toBeNull();
    });
  });

  it('debe actualizar svgContent al cargar SVG', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = '<svg><circle cx="50" cy="50" r="40"/></svg>';

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    expect(result.current.svgContent).toBe(svgString);
  });
});
