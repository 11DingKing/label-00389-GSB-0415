export type ToolType = 'select' | 'pan' | 'pen' | 'highlighter' | 'text' | 'rectangle' | 'circle' | 'arrow' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: Exclude<ToolType, 'select' | 'pan' | 'eraser'>;
  points: Point[];
  color: string;
  lineWidth: number;
  text?: string;
  page: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
  file: File;
}

export interface CanvasState {
  tool: ToolType;
  color: string;
  lineWidth: number;
  annotations: Annotation[];
}
