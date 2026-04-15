import { Point, Annotation } from '@/types';

export function getCanvasPoint(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ('touches' in e) {
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation
): void {
  ctx.strokeStyle = annotation.color;
  ctx.fillStyle = annotation.color;
  ctx.lineWidth = annotation.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const { points, type } = annotation;

  switch (type) {
    case 'pen':
      drawPath(ctx, points);
      break;
    case 'highlighter':
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = annotation.lineWidth * 3;
      drawPath(ctx, points);
      ctx.globalAlpha = 1;
      break;
    case 'rectangle':
      if (points.length >= 2) {
        const [start, end] = [points[0], points[points.length - 1]];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      }
      break;
    case 'circle':
      if (points.length >= 2) {
        const [start, end] = [points[0], points[points.length - 1]];
        const radiusX = Math.abs(end.x - start.x) / 2;
        const radiusY = Math.abs(end.y - start.y) / 2;
        const centerX = start.x + (end.x - start.x) / 2;
        const centerY = start.y + (end.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 'arrow':
      if (points.length >= 2) {
        const [start, end] = [points[0], points[points.length - 1]];
        drawArrow(ctx, start, end);
      }
      break;
    case 'text':
      if (annotation.text && points.length > 0) {
        ctx.font = `${annotation.lineWidth * 4}px sans-serif`;
        ctx.fillText(annotation.text, points[0].x, points[0].y);
      }
      break;
  }
}

function drawPath(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point): void {
  const headLength = 15;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
