'use client';

import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '@/store/canvas-store';

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    setCanvas, 
    setSelectedObject, 
    currentTool,
    setIsDrawing,
    addText
  } = useCanvasStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    setCanvas(canvas);

    // Enable object moving for all tools except drawing mode
    canvas.on('object:modified', () => {
      canvas.renderAll();
    });

    // Handle keyboard events for deletion
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedObject, deleteSelected } = useCanvasStore.getState();
        if (selectedObject) {
          deleteSelected();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Handle double-click for inline text editing
    canvas.on('mouse:dblclick', (e: any) => {
      const target = e.target;
      if (target && target.type === 'text') {
        // Create an editable input at the text position
        const textObj = target as fabric.Text;
        const canvasElement = canvas.getElement();
        const rect = canvasElement.getBoundingClientRect();
        
        // Create input element
        const input = document.createElement('textarea');
        input.value = textObj.text || '';
        input.style.position = 'absolute';
        input.style.left = `${rect.left + (textObj.left || 0)}px`;
        input.style.top = `${rect.top + (textObj.top || 0)}px`;
        input.style.padding = '4px';
        input.style.border = '2px solid #3b82f6';
        input.style.borderRadius = '4px';
        input.style.fontSize = `${textObj.fontSize}px`;
        input.style.fontFamily = textObj.fontFamily || 'Arial';
        input.style.backgroundColor = 'white';
        input.style.outline = 'none';
        input.style.minWidth = '100px';
        input.style.minHeight = '30px';
        input.style.zIndex = '1000';
        input.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';

        document.body.appendChild(input);
        input.focus();
        input.select();

        const finishEditing = () => {
          const newText = input.value.trim();
          if (newText && newText !== textObj.text) {
            textObj.set('text', newText);
            canvas.renderAll();
          }
          document.body.removeChild(input);
        };

        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            document.body.removeChild(input);
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishEditing();
          }
        });
      }
    });
    // Handle mouse over to show editable cursor for text
    canvas.on('mouse:over', (e: any) => {
      const target = e.target;
      if (target && target.type === 'text') {
        canvas.hoverCursor = 'text';
        canvas.renderAll();
      }
    });

    canvas.on('mouse:out', (e: any) => {
      const target = e.target;
      if (target && target.type === 'text') {
        canvas.hoverCursor = 'default';
        canvas.renderAll();
      }
    });

    // Handle selection
    canvas.on('selection:created', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Handle drawing mode
    canvas.on('path:created', () => {
      setIsDrawing(false);
    });

    // Handle mouse events for shape drawing
    let isDrawingShape = false;
    let startPoint: { x: number; y: number } | null = null;
    let shape: fabric.Object | null = null;

    // Track if text tool is actively creating
    let isCreatingText = false;

    canvas.on('mouse:down', (e: any) => {
      const target = e.target;
      
      // If clicking on empty canvas with text tool, create text only if not already creating
      if (currentTool === 'text' && !target && !isCreatingText) {
        const pointer = canvas.getScenePoint(e.e);
        const { addText } = useCanvasStore.getState();
        addText();
        // Position: text at click location
        setTimeout(() => {
          const textObj = canvas.getObjects().pop();
          if (textObj && textObj.type === 'text') {
            textObj.set({
              left: pointer.x,
              top: pointer.y
            });
            canvas.renderAll();
          }
          isCreatingText = false; // Reset flag after text is created
        }, 50);
        isCreatingText = true; // Set flag to prevent multiple text creation
        return;
      }
      
      // Reset flag when clicking with other tools or on existing objects
      if (currentTool !== 'text' || target) {
        isCreatingText = false;
      }
      
      // Handle shape drawing for other tools
      if (currentTool === 'select' || currentTool === 'drawing') return;
       
      const pointer = canvas.getScenePoint(e.e);
      isDrawingShape = true;
      startPoint = { x: pointer.x, y: pointer.y };

      if (currentTool === 'rectangle') {
        shape = new fabric.Rect({
          left: startPoint.x,
          top: startPoint.y,
          width: 0,
          height: 0,
          fill: '#000000',
          stroke: '#000000',
          strokeWidth: 2,
        });
      } else if (currentTool === 'circle') {
        shape = new fabric.Circle({
          left: startPoint.x,
          top: startPoint.y,
          radius: 0,
          fill: '#000000',
          stroke: '#000000',
          strokeWidth: 2,
        });
      } else if (currentTool === 'line') {
        shape = new fabric.Line([startPoint.x, startPoint.y, startPoint.x, startPoint.y], {
          stroke: '#000000',
          strokeWidth: 2,
        });
      }

      if (shape) {
        canvas.add(shape);
        canvas.setActiveObject(shape);
      }
    });

    canvas.on('mouse:move', (e: any) => {
      if (!isDrawingShape || !startPoint || !shape) return;

      const pointer = canvas.getScenePoint(e.e);

      if (currentTool === 'rectangle' && shape instanceof fabric.Rect) {
        const width = Math.abs(pointer.x - startPoint.x);
        const height = Math.abs(pointer.y - startPoint.y);
        const left = Math.min(pointer.x, startPoint.x);
        const top = Math.min(pointer.y, startPoint.y);
        
        shape.set({ left, top, width, height });
      } else if (currentTool === 'circle' && shape instanceof fabric.Circle) {
        const radius = Math.sqrt(
          Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)
        ) / 2;
        const left = startPoint.x - radius;
        const top = startPoint.y - radius;
        
        shape.set({ left, top, radius });
      } else if (currentTool === 'line' && shape instanceof fabric.Line) {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }

      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      isDrawingShape = false;
      startPoint = null;
      shape = null;
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [setCanvas, setSelectedObject, currentTool, setIsDrawing, addText]);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
}
