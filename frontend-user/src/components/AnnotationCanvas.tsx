"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Annotation, Point, ToolType } from "@/types";
import { useToast } from "./Toast";

interface AnnotationCanvasProps {
  width: number;
  height: number;
  scale: number;
  annotations: Annotation[];
  currentTool: ToolType;
  currentColor: string;
  currentLineWidth: number;
  isDrawing: boolean;
  isDragging: boolean;
  selectedId: string | null;
  getCurrentAnnotation: () => Annotation | null;
  onStartDrawing: (point: Point, isDoubleClick?: boolean) => void;
  onContinueDrawing: (
    point: Point,
    bounds?: { width: number; height: number },
  ) => void;
  onEndDrawing: () => void;
  onAddText: (point: Point, text: string) => void;
  onDeleteSelected: () => void;
  findAnnotationAtPoint: (
    point: Point,
    annotations: Annotation[],
  ) => string | null;
  onRequestTextInput?: (point: Point) => void;
}

// 将屏幕坐标转换为基础坐标（用于存储）
function screenToBase(point: Point, scale: number): Point {
  return { x: point.x / scale, y: point.y / scale };
}

// 将基础坐标转换为屏幕坐标（用于渲染）
function baseToScreen(point: Point, scale: number): Point {
  return { x: point.x * scale, y: point.y * scale };
}

// 获取画布上的点（屏幕坐标）
function getCanvasPoint(
  e: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

// 绘制标注（使用屏幕坐标）
function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  scale: number,
): void {
  const scaledPoints = annotation.points.map((p) => baseToScreen(p, scale));
  const scaledLineWidth = annotation.lineWidth * scale;

  ctx.strokeStyle = annotation.color;
  ctx.fillStyle = annotation.color;
  ctx.lineWidth = scaledLineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (annotation.type) {
    case "pen":
      drawPath(ctx, scaledPoints);
      break;
    case "highlighter":
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = scaledLineWidth * 3;
      drawPath(ctx, scaledPoints);
      ctx.globalAlpha = 1;
      break;
    case "rectangle":
      if (scaledPoints.length >= 2) {
        const [start, end] = [
          scaledPoints[0],
          scaledPoints[scaledPoints.length - 1],
        ];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      }
      break;
    case "circle":
      if (scaledPoints.length >= 2) {
        const [start, end] = [
          scaledPoints[0],
          scaledPoints[scaledPoints.length - 1],
        ];
        const radiusX = Math.abs(end.x - start.x) / 2;
        const radiusY = Math.abs(end.y - start.y) / 2;
        const centerX = start.x + (end.x - start.x) / 2;
        const centerY = start.y + (end.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case "arrow":
      if (scaledPoints.length >= 2) {
        const [start, end] = [
          scaledPoints[0],
          scaledPoints[scaledPoints.length - 1],
        ];
        drawArrow(ctx, start, end, scaledLineWidth);
      }
      break;
    case "text":
      if (annotation.text && scaledPoints.length > 0) {
        const fontSize = scaledLineWidth * 4;
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        // 文字以点击位置为中心
        ctx.fillText(annotation.text, scaledPoints[0].x, scaledPoints[0].y);
        ctx.textAlign = "left"; // 恢复默认
      }
      break;
    case "polygon":
      if (scaledPoints.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
        for (let i = 1; i < scaledPoints.length; i++) {
          ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
        }
        ctx.stroke();
        // 如果是闭合的（points长度>=3），填充半透明背景
        if (scaledPoints.length >= 3) {
          ctx.closePath();
          ctx.globalAlpha = 0.1;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
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

function drawArrow(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  lineWidth: number,
): void {
  const headLength = Math.max(15, lineWidth * 5);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
}

export default function AnnotationCanvas({
  width,
  height,
  scale,
  annotations,
  currentTool,
  currentColor,
  currentLineWidth,
  isDrawing,
  isDragging,
  selectedId,
  getCurrentAnnotation,
  onStartDrawing,
  onContinueDrawing,
  onEndDrawing,
  onAddText,
  onDeleteSelected,
  findAnnotationAtPoint,
  onRequestTextInput,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [eraserPos, setEraserPos] = useState<Point | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(
    null,
  );
  const animationFrameRef = useRef<number>();
  const { showToast } = useToast();

  // 切换工具时关闭文字输入框
  useEffect(() => {
    if (currentTool !== "text" && textInput) {
      if (textValue.trim()) {
        onAddText({ x: textInput.x, y: textInput.y }, textValue);
        showToast("已添加文字", "success");
      }
      setTextInput(null);
      setTextValue("");
    }
  }, [currentTool, textInput, textValue, onAddText, showToast]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId &&
        !textInput
      ) {
        e.preventDefault();
        onDeleteSelected();
        showToast("已删除", "info");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, textInput, onDeleteSelected, showToast]);

  // 获取标注边界框（屏幕坐标）
  const getAnnotationBounds = useCallback(
    (ann: Annotation) => {
      if (ann.points.length === 0) return null;
      const scaledPoints = ann.points.map((p) => baseToScreen(p, scale));

      if (ann.type === "text" && ann.text) {
        const p = scaledPoints[0]; // 中心点
        const fontSize = ann.lineWidth * scale * 4;

        // 使用 canvas 测量实际文字宽度
        const canvas = canvasRef.current;
        let textWidth = ann.text.length * fontSize * 0.6; // 默认估算
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            textWidth = ctx.measureText(ann.text).width;
          }
        }

        const textHeight = fontSize;
        const padding = 4;
        // 边界框以文字中心点为基准
        return {
          x: p.x - textWidth / 2 - padding,
          y: p.y - textHeight / 2 - padding,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2,
        };
      }

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of scaledPoints) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }

      const padding = ann.lineWidth * scale + 4;
      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      };
    },
    [scale],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((a) => {
      const isHoveredForErase =
        currentTool === "eraser" && hoveredAnnotation === a.id;

      if (isHoveredForErase) {
        // 橡皮擦悬停效果：半透明 + 红色边框
        ctx.save();
        ctx.globalAlpha = 0.35;
        drawAnnotation(ctx, a, scale);
        ctx.restore();

        // 绘制红色删除边框
        const bounds = getAnnotationBounds(a);
        if (bounds) {
          ctx.save();
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

          // 红色背景遮罩
          ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
          ctx.setLineDash([]);
          ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
          ctx.restore();
        }
      } else {
        drawAnnotation(ctx, a, scale);
      }

      // 选中框
      if (selectedId === a.id && !isHoveredForErase) {
        const bounds = getAnnotationBounds(a);
        if (bounds) {
          ctx.save();
          ctx.strokeStyle = "#0ea5e9";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
          ctx.fillStyle = "#0ea5e9";
          ctx.setLineDash([]);
          // 角点大小根据边界框大小调整
          const cornerSize = Math.min(
            3,
            Math.min(bounds.width, bounds.height) / 8,
          );
          const corners = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          ];
          corners.forEach((c) => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, cornerSize, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }
      }
    });

    // 当前绘制的标注
    const current = getCurrentAnnotation();
    if (current && isDrawing) {
      drawAnnotation(ctx, current, scale);
    }

    // 橡皮擦光标
    if (currentTool === "eraser" && eraserPos) {
      ctx.save();
      const hasTarget = !!hoveredAnnotation;

      // 简单的圆形光标
      ctx.strokeStyle = hasTarget ? "#ef4444" : "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.setLineDash(hasTarget ? [] : [3, 3]);
      ctx.beginPath();
      ctx.arc(eraserPos.x, eraserPos.y, 12, 0, Math.PI * 2);
      ctx.stroke();

      if (hasTarget) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
        ctx.fill();
      }

      ctx.restore();
    }
  }, [
    annotations,
    getCurrentAnnotation,
    isDrawing,
    currentTool,
    eraserPos,
    hoveredAnnotation,
    selectedId,
    getAnnotationBounds,
    scale,
  ]);

  useEffect(() => {
    const animate = () => {
      redraw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [redraw]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      const screenPoint = getCanvasPoint(e, canvas);
      const basePoint = screenToBase(screenPoint, scale);

      if (currentTool === "text") {
        // 移动端：通知父组件打开底部弹窗
        if (onRequestTextInput && window.innerWidth < 768) {
          onRequestTextInput(basePoint);
          return;
        }
        // 桌面端：使用内置弹窗
        if (textInput && textValue.trim()) {
          onAddText({ x: textInput.x, y: textInput.y }, textValue);
          showToast("已添加文字", "success");
        }
        const rect = canvas.getBoundingClientRect();
        setTextInput({
          x: basePoint.x,
          y: basePoint.y,
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
        });
        setTextValue("");
      } else {
        // 双击事件处理（多边形闭合）
        const isDoubleClick = e.detail === 2;
        onStartDrawing(basePoint, isDoubleClick);
      }
    },
    [
      currentTool,
      scale,
      onStartDrawing,
      textInput,
      textValue,
      onAddText,
      showToast,
      onRequestTextInput,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const screenPoint = getCanvasPoint(e, canvas);
      const basePoint = screenToBase(screenPoint, scale);

      if (currentTool === "eraser") {
        setEraserPos(screenPoint);
        const found = findAnnotationAtPoint(basePoint, annotations);
        setHoveredAnnotation(found);
      } else if (currentTool === "select" && !isDragging) {
        const found = findAnnotationAtPoint(basePoint, annotations);
        setHoveredAnnotation(found);
      } else if (currentTool === "text" && !isDrawing) {
        // 文字工具也可以悬停检测已有文字标注
        const found = findAnnotationAtPoint(basePoint, annotations);
        setHoveredAnnotation(found);
      } else {
        setEraserPos(null);
        setHoveredAnnotation(null);
      }

      if (isDrawing || isDragging) {
        // 传递基础坐标系的边界
        const baseBounds = { width: width / scale, height: height / scale };
        onContinueDrawing(basePoint, baseBounds);
      }
    },
    [
      isDrawing,
      isDragging,
      scale,
      width,
      height,
      onContinueDrawing,
      currentTool,
      findAnnotationAtPoint,
      annotations,
    ],
  );

  const handlePointerLeave = useCallback(() => {
    onEndDrawing();
    setEraserPos(null);
    setHoveredAnnotation(null);
  }, [onEndDrawing]);

  const handleTextSubmit = useCallback(() => {
    if (textInput && textValue.trim()) {
      onAddText({ x: textInput.x, y: textInput.y }, textValue);
      showToast("已添加文字", "success");
    }
    setTextInput(null);
    setTextValue("");
  }, [textInput, textValue, onAddText, showToast]);

  const handleTextCancel = useCallback(() => {
    setTextInput(null);
    setTextValue("");
  }, []);

  const getCursor = () => {
    if (currentTool === "pan") return "grab";
    if (currentTool === "text") return "text";
    if (currentTool === "eraser") return "none";
    if (currentTool === "select") {
      if (isDragging) return "grabbing";
      if (hoveredAnnotation) return "grab";
      return "default";
    }
    return "crosshair";
  };

  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={onEndDrawing}
        onPointerLeave={handlePointerLeave}
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursor() }}
      />

      {/* 移动端：底部抽屉 */}
      {textInput && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 animate-fade-in"
          onClick={handleTextCancel}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                添加文字
              </span>
              <button
                onClick={handleTextCancel}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                autoFocus
                placeholder="输入文字内容..."
                rows={3}
                className="w-full px-4 py-3 text-base outline-none resize-none bg-gray-50 rounded-xl border border-gray-200 focus:border-sky-400 focus:bg-white transition-colors"
                style={{ color: currentColor }}
              />
            </div>
            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-sm text-gray-500">当前颜色</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTextCancel}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textValue.trim()}
                  className="px-5 py-2 text-sm text-white bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 桌面端：跟随位置的小弹窗 */}
      {textInput && (
        <div
          className="hidden md:block absolute z-20 animate-scale-in"
          style={{ left: textInput.screenX, top: textInput.screenY }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-3">
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  } else if (e.key === "Escape") handleTextCancel();
                }}
                autoFocus
                placeholder="输入文字内容..."
                rows={2}
                className="w-56 px-3 py-2 text-sm outline-none resize-none bg-gray-50 rounded-lg border border-gray-100 focus:border-sky-300 focus:bg-white transition-colors"
                style={{
                  color: currentColor,
                  fontSize: Math.max(currentLineWidth * 2, 14),
                }}
              />
            </div>
            <div className="px-3 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-xs text-gray-400">当前颜色</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleTextCancel}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textValue.trim()}
                  className="px-3 py-1.5 text-xs text-white bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Enter 确认 · Shift+Enter 换行 · Esc 取消
              </p>
            </div>
          </div>
        </div>
      )}

      {currentTool === "eraser" && !hoveredAnnotation && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 animate-fade-in pointer-events-none">
          <div className="px-3 py-1.5 bg-gray-800/80 text-white text-xs rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap">
            移动到标注上方删除
          </div>
        </div>
      )}
    </div>
  );
}
