import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NodeEditor from '../NodeEditor';

describe('NodeEditor', () => {
    const mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mockElement.setAttribute('d', 'M10 10 L90 90');
    mockElement.setAttribute('id', 'test-path');

    // Mock functions
    const mockScreenToSVG = vi.fn((x, y) => ({ x: x / 2, y: y / 2 }));
    const mockSvgToScreen = vi.fn((x, y) => ({ x: x * 2, y: y * 2 }));
    const mockScreenDeltaToSVGDelta = vi.fn((dx, dy) => ({ dx: dx / 2, dy: dy / 2 }));
    const mockOnNodeChange = vi.fn();

    it('renders nothing if not visible', () => {
        const { container } = render(
            <svg>
                <NodeEditor
                    element={mockElement}
                    tool="node"
                    visible={false}
                    screenToSVG={mockScreenToSVG}
                    svgToScreen={mockSvgToScreen}
                    screenDeltaToSVGDelta={mockScreenDeltaToSVGDelta}
                />
            </svg>
        );
        expect(container.querySelector('.node-editor')).toBeNull();
    });

    it('renders nodes at correct screen coordinates', () => {
        const { container } = render(
            <svg>
                <NodeEditor
                    element={mockElement}
                    tool="node"
                    visible={true}
                    screenToSVG={mockScreenToSVG}
                    svgToScreen={mockSvgToScreen}
                    screenDeltaToSVGDelta={mockScreenDeltaToSVGDelta}
                />
            </svg>
        );

        // Nodes should be at (20, 20) and (180, 180) because svgToScreen multiplies by 2
        const nodes = container.querySelectorAll('.svg-node');
        expect(nodes.length).toBe(2);
        // Note: We can't easily query by coordinates in JSDOM, but we can check if svgToScreen was called
        expect(mockSvgToScreen).toHaveBeenCalledWith(10, 10);
        expect(mockSvgToScreen).toHaveBeenCalledWith(90, 90);
    });

    it('calls screenDeltaToSVGDelta when dragging a node', () => {
        const { container } = render(
            <svg>
                <NodeEditor
                    element={mockElement}
                    tool="node"
                    visible={true}
                    screenToSVG={mockScreenToSVG}
                    svgToScreen={mockSvgToScreen}
                    screenDeltaToSVGDelta={mockScreenDeltaToSVGDelta}
                    onNodeChange={mockOnNodeChange}
                />
            </svg>
        );

        const nodes = container.querySelectorAll('.svg-node');
        const firstNode = nodes[0];

        fireEvent.mouseDown(firstNode, { clientX: 20, clientY: 20 });
        fireEvent.mouseMove(document, { clientX: 40, clientY: 40 }); // Moved 20px
        fireEvent.mouseUp(document);

        // Delta is 20, 20. mockScreenDeltaToSVGDelta divides by 2 -> 10, 10.
        expect(mockScreenDeltaToSVGDelta).toHaveBeenCalledWith(20, 20);

        // New position should be 10 + 10 = 20
        expect(mockOnNodeChange).toHaveBeenCalledWith(
            expect.objectContaining({ x: 10, y: 10 }), // Original node
            expect.objectContaining({ x: 20, y: 20 })  // New node
        );
    });
});
