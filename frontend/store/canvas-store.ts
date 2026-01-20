import { create } from 'zustand';
import * as fabric from 'fabric';

export type Tool = 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'drawing' | 'image';

interface CanvasState {
  canvas: fabric.Canvas | null;
  currentTool: Tool;
  selectedObject: fabric.Object | null;
  isDrawing: boolean;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  
  // Actions
  setCanvas: (canvas: fabric.Canvas) => void;
  setCurrentTool: (tool: Tool) => void;
  setSelectedObject: (object: fabric.Object | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  
  // Canvas actions
  addText: (text?: string) => void;
  addRectangle: () => void;
  addCircle: () => void;
  addLine: () => void;
  deleteSelected: () => void;
  clearCanvas: () => void;
  exportCanvas: (format: 'png' | 'jpg' | 'svg') => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvas: null,
  currentTool: 'select',
  selectedObject: null,
  isDrawing: false,
  fillColor: '#000000',
  strokeColor: '#000000',
  strokeWidth: 2,
  fontSize: 20,
  fontFamily: 'Arial',

  setCanvas: (canvas) => set({ canvas }),
  
  setCurrentTool: (tool) => {
    const { canvas } = get();
    if (canvas) {
      canvas.isDrawingMode = tool === 'drawing';
      canvas.selection = tool === 'select';
      
      // Ensure all objects are movable/selectable in select mode
      canvas.forEachObject((obj: any) => {
        obj.selectable = tool !== 'drawing';
        obj.evented = tool !== 'drawing';
      });
      
      canvas.renderAll();
    }
    set({ currentTool: tool });
  },
  
  setSelectedObject: (object) => set({ selectedObject: object }),
  
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  
  setFillColor: (color) => {
    const { canvas, selectedObject } = get();
    if (selectedObject) {
      selectedObject.set('fill', color);
      canvas?.renderAll();
    }
    set({ fillColor: color });
  },
  
  setStrokeColor: (color) => {
    const { canvas, selectedObject } = get();
    if (selectedObject) {
      selectedObject.set('stroke', color);
      canvas?.renderAll();
    }
    set({ strokeColor: color });
  },
  
  setStrokeWidth: (width) => {
    const { canvas, selectedObject } = get();
    if (selectedObject) {
      selectedObject.set('strokeWidth', width);
      canvas?.renderAll();
    }
    set({ strokeWidth: width });
  },
  
  setFontSize: (size) => {
    const { canvas, selectedObject } = get();
    if (selectedObject && selectedObject instanceof fabric.Text) {
      selectedObject.set('fontSize', size);
      canvas?.renderAll();
    }
    set({ fontSize: size });
  },
  
  setFontFamily: (family) => {
    const { canvas, selectedObject } = get();
    if (selectedObject && selectedObject instanceof fabric.Text) {
      selectedObject.set('fontFamily', family);
      canvas?.renderAll();
    }
    set({ fontFamily: family });
  },

  addText: (text = 'Edit this text') => {
    const { canvas, fillColor, fontSize, fontFamily } = get();
    if (!canvas) return;

    const textObject = new fabric.Text(text, {
      left: 100,
      top: 100,
      fill: fillColor,
      fontSize: fontSize,
      fontFamily: fontFamily,
    });
    
    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    canvas.renderAll();
  },

  addRectangle: () => {
    const { canvas, fillColor, strokeColor, strokeWidth } = get();
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  },

  addCircle: () => {
    const { canvas, fillColor, strokeColor, strokeWidth } = get();
    if (!canvas) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    });
    
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  },

  addLine: () => {
    const { canvas, strokeColor, strokeWidth } = get();
    if (!canvas) return;

    const line = new fabric.Line([50, 100, 200, 100], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    });
    
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  },

  deleteSelected: () => {
    const { canvas, selectedObject } = get();
    if (canvas && selectedObject) {
      canvas.remove(selectedObject);
      canvas.renderAll();
      set({ selectedObject: null });
    }
  },

  clearCanvas: () => {
    const { canvas } = get();
    if (canvas) {
      canvas.clear();
      canvas.renderAll();
      set({ selectedObject: null });
    }
  },

  exportCanvas: (format) => {
    const { canvas } = get();
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : format,
      quality: 1,
    } as any);

    const link = document.createElement('a');
    link.download = `canvas-design.${format}`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}));
