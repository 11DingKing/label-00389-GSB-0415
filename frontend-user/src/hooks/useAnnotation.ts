"use client";

import { useState, useCallback, useRef } from "react";
import { ToolType, Annotation, Point, CanvasState } from "@/types";
import { generateId } from "@/utils/canvasUtils";

const initialState: CanvasState = {
  tool: "select",
  color: "#ef4444",
  lineWidth: 2,
  annotations: [],
};

export function useAnnotation(currentPage: number) {
  const [state, setState] = useState<CanvasState>(initialState);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(
    null,
  );

  const dragStartRef = useRef<Point | null>(null);
  const currentAnnotation = useRef<Annotation | null>(null);
  const erasedInStroke = useRef<Set<string>>(new Set());

  // 简单的历史记录：直接存储标注数组的快照
  const historyRef = useRef<Annotation[][]>([[]]);
  const historyIndexRef = useRef(0);

  // 保存到历史记录
  const pushHistory = useCallback((annotations: Annotation[]) => {
    // 深拷贝
    const snapshot = JSON.parse(JSON.stringify(annotations));
    // 截断当前位置之后的历史
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );
    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);

    console.log(
      "pushHistory: index=",
      historyIndexRef.current,
      "length=",
      historyRef.current.length,
      "annotations=",
      annotations.length,
    );
  }, []);

  const setTool = useCallback((tool: ToolType) => {
    setState((prev) => ({ ...prev, tool }));
    if (tool !== "select") setSelectedId(null);
  }, []);

  const setColor = useCallback((color: string) => {
    setState((prev) => ({ ...prev, color }));
  }, []);

  const setLineWidth = useCallback((lineWidth: number) => {
    setState((prev) => ({ ...prev, lineWidth }));
  }, []);

  const findVertexAtPoint = useCallback(
    (point: Point, annotation: Annotation): number | null => {
      if (annotation.type !== "polygon" || annotation.points.length < 3)
        return null;
      const threshold = 15;
      for (let i = 0; i < annotation.points.length; i++) {
        const p = annotation.points[i];
        const dist = Math.sqrt(
          Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2),
        );
        if (dist < threshold) return i;
      }
      return null;
    },
    [],
  );

  const findAnnotationAtPoint = useCallback(
    (point: Point, annotations: Annotation[]): string | null => {
      const threshold = 25;

      for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        if (ann.page !== currentPage) continue;

        if (ann.type === "pen" || ann.type === "highlighter") {
          for (const p of ann.points) {
            const dist = Math.sqrt(
              Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2),
            );
            if (dist < threshold) return ann.id;
          }
        }

        if (
          (ann.type === "rectangle" || ann.type === "circle") &&
          ann.points.length >= 2
        ) {
          const [start, end] = [
            ann.points[0],
            ann.points[ann.points.length - 1],
          ];
          const minX = Math.min(start.x, end.x),
            maxX = Math.max(start.x, end.x);
          const minY = Math.min(start.y, end.y),
            maxY = Math.max(start.y, end.y);

          if (
            point.x >= minX - threshold &&
            point.x <= maxX + threshold &&
            point.y >= minY - threshold &&
            point.y <= maxY + threshold
          ) {
            const nearLeft = Math.abs(point.x - minX) < threshold;
            const nearRight = Math.abs(point.x - maxX) < threshold;
            const nearTop = Math.abs(point.y - minY) < threshold;
            const nearBottom = Math.abs(point.y - maxY) < threshold;
            const inXRange =
              point.x >= minX - threshold && point.x <= maxX + threshold;
            const inYRange =
              point.y >= minY - threshold && point.y <= maxY + threshold;

            if (
              (nearLeft && inYRange) ||
              (nearRight && inYRange) ||
              (nearTop && inXRange) ||
              (nearBottom && inXRange)
            ) {
              return ann.id;
            }
          }
        }

        if (ann.type === "arrow" && ann.points.length >= 2) {
          const [start, end] = [
            ann.points[0],
            ann.points[ann.points.length - 1],
          ];
          const distStart = Math.sqrt(
            Math.pow(start.x - point.x, 2) + Math.pow(start.y - point.y, 2),
          );
          const distEnd = Math.sqrt(
            Math.pow(end.x - point.x, 2) + Math.pow(end.y - point.y, 2),
          );
          if (distStart < threshold || distEnd < threshold) return ann.id;

          const lineLen = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
          );
          if (lineLen > 0) {
            const t = Math.max(
              0,
              Math.min(
                1,
                ((point.x - start.x) * (end.x - start.x) +
                  (point.y - start.y) * (end.y - start.y)) /
                  (lineLen * lineLen),
              ),
            );
            const projX = start.x + t * (end.x - start.x);
            const projY = start.y + t * (end.y - start.y);
            const distToLine = Math.sqrt(
              Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2),
            );
            if (distToLine < threshold) return ann.id;
          }
        }

        if (ann.type === "text" && ann.text && ann.points.length > 0) {
          const p = ann.points[0];
          const fontSize = ann.lineWidth * 4;
          const textWidth = ann.text.length * fontSize * 0.6;
          const textHeight = fontSize * 1.2;
          const padding = 10;
          if (
            point.x >= p.x - textWidth / 2 - padding &&
            point.x <= p.x + textWidth / 2 + padding &&
            point.y >= p.y - textHeight / 2 - padding &&
            point.y <= p.y + textHeight / 2 + padding
          ) {
            return ann.id;
          }
        }

        if (ann.type === "polygon" && ann.points.length >= 3) {
          // 首先检测是否点击在顶点上
          for (const p of ann.points) {
            const dist = Math.sqrt(
              Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2),
            );
            if (dist < threshold) return ann.id;
          }

          // 检测是否点击在多边形边缘上
          for (let i = 0; i < ann.points.length; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[(i + 1) % ann.points.length];
            const lineLen = Math.sqrt(
              Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2),
            );
            if (lineLen > 0) {
              const t = Math.max(
                0,
                Math.min(
                  1,
                  ((point.x - p1.x) * (p2.x - p1.x) +
                    (point.y - p1.y) * (p2.y - p1.y)) /
                    (lineLen * lineLen),
                ),
              );
              const projX = p1.x + t * (p2.x - p1.x);
              const projY = p1.y + t * (p2.y - p1.y);
              const distToLine = Math.sqrt(
                Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2),
              );
              if (distToLine < threshold) return ann.id;
            }
          }

          // 射线法检测点是否在多边形内部
          let inside = false;
          for (
            let i = 0, j = ann.points.length - 1;
            i < ann.points.length;
            j = i++
          ) {
            const xi = ann.points[i].x,
              yi = ann.points[i].y;
            const xj = ann.points[j].x,
              yj = ann.points[j].y;

            const intersect =
              yi > point.y !== yj > point.y &&
              point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
          }
          if (inside) return ann.id;
        }
      }
      return null;
    },
    [currentPage],
  );

  // 橡皮擦：记录擦除前的状态，结束时保存历史
  const beforeEraseRef = useRef<Annotation[] | null>(null);

  const eraseAtPoint = useCallback(
    (point: Point, annotations: Annotation[]): Annotation[] | null => {
      const annotationId = findAnnotationAtPoint(point, annotations);
      if (!annotationId || erasedInStroke.current.has(annotationId))
        return null;

      erasedInStroke.current.add(annotationId);
      return annotations.filter((a) => a.id !== annotationId);
    },
    [findAnnotationAtPoint],
  );

  const moveAnnotation = useCallback(
    (
      id: string,
      dx: number,
      dy: number,
      bounds?: { width: number; height: number },
    ) => {
      setState((prev) => {
        const ann = prev.annotations.find((a) => a.id === id);
        if (!ann || ann.points.length === 0) return prev;

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const p of ann.points) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }

        let adjustedDx = dx,
          adjustedDy = dy;

        if (bounds) {
          const padding = 2;
          if (minX + dx < padding) adjustedDx = padding - minX;
          else if (maxX + dx > bounds.width - padding)
            adjustedDx = bounds.width - padding - maxX;
          if (minY + dy < padding) adjustedDy = padding - minY;
          else if (maxY + dy > bounds.height - padding)
            adjustedDy = bounds.height - padding - maxY;
        }

        if (adjustedDx === 0 && adjustedDy === 0) return prev;

        const newAnnotations = prev.annotations.map((a) => {
          if (a.id !== id) return a;
          return {
            ...a,
            points: a.points.map((p) => ({
              x: p.x + adjustedDx,
              y: p.y + adjustedDy,
            })),
          };
        });
        return { ...prev, annotations: newAnnotations };
      });
    },
    [],
  );

  const moveVertex = useCallback(
    (
      id: string,
      vertexIndex: number,
      dx: number,
      dy: number,
      bounds?: { width: number; height: number },
    ) => {
      setState((prev) => {
        const ann = prev.annotations.find((a) => a.id === id);
        if (!ann || ann.points.length <= vertexIndex) return prev;

        const vertex = ann.points[vertexIndex];
        let newX = vertex.x + dx;
        let newY = vertex.y + dy;

        if (bounds) {
          const padding = 2;
          newX = Math.max(padding, Math.min(newX, bounds.width - padding));
          newY = Math.max(padding, Math.min(newY, bounds.height - padding));
        }

        if (newX === vertex.x && newY === vertex.y) return prev;

        const newAnnotations = prev.annotations.map((a) => {
          if (a.id !== id) return a;
          return {
            ...a,
            points: a.points.map((p, i) =>
              i === vertexIndex ? { x: newX, y: newY } : p,
            ),
          };
        });
        return { ...prev, annotations: newAnnotations };
      });
    },
    [],
  );

  const finishMove = useCallback(() => {
    pushHistory(state.annotations);
  }, [pushHistory, state.annotations]);

  const startDrawing = useCallback(
    (point: Point) => {
      if (state.tool === "pan") return;

      if (state.tool === "select") {
        const found = findAnnotationAtPoint(point, state.annotations);
        setSelectedId(found);
        if (found) {
          const ann = state.annotations.find((a) => a.id === found);
          if (ann) {
            const vertexIndex = findVertexAtPoint(point, ann);
            if (vertexIndex !== null) {
              setDraggingVertexIndex(vertexIndex);
            }
          }
          setIsDragging(true);
          dragStartRef.current = point;
        }
        return;
      }

      if (state.tool === "eraser") {
        erasedInStroke.current.clear();
        beforeEraseRef.current = [...state.annotations]; // 记录擦除前状态
        setIsDrawing(true);
        // 尝试擦除
        const result = eraseAtPoint(point, state.annotations);
        if (result) {
          setState((prev) => ({ ...prev, annotations: result }));
        }
        return;
      }

      if (state.tool === "polygon") {
        // 多边形：点击添加顶点
        if (currentAnnotation.current) {
          // 已有正在绘制的多边形，添加新顶点
          currentAnnotation.current.points.push(point);
        } else {
          // 开始新的多边形
          setIsDrawing(true);
          currentAnnotation.current = {
            id: generateId(),
            type: "polygon",
            points: [point],
            color: state.color,
            lineWidth: state.lineWidth,
            page: currentPage,
          };
        }
        return;
      }

      setIsDrawing(true);
      currentAnnotation.current = {
        id: generateId(),
        type: state.tool as Exclude<
          ToolType,
          "select" | "pan" | "eraser" | "polygon"
        >,
        points: [point],
        color: state.color,
        lineWidth: state.lineWidth,
        page: currentPage,
      };
    },
    [
      state.tool,
      state.color,
      state.lineWidth,
      state.annotations,
      currentPage,
      eraseAtPoint,
      findAnnotationAtPoint,
    ],
  );

  const continueDrawing = useCallback(
    (point: Point, bounds?: { width: number; height: number }) => {
      if (
        state.tool === "select" &&
        isDragging &&
        selectedId &&
        dragStartRef.current
      ) {
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;
        if (draggingVertexIndex !== null) {
          moveVertex(selectedId, draggingVertexIndex, dx, dy, bounds);
        } else {
          moveAnnotation(selectedId, dx, dy, bounds);
        }
        dragStartRef.current = point;
        return;
      }

      if (!isDrawing) return;

      if (state.tool === "eraser") {
        const result = eraseAtPoint(point, state.annotations);
        if (result) {
          setState((prev) => ({ ...prev, annotations: result }));
        }
        return;
      }

      // 多边形不使用 continueDrawing 添加点，只在点击时添加
      if (state.tool === "polygon") return;

      if (currentAnnotation.current) {
        currentAnnotation.current.points.push(point);
      }
    },
    [
      isDrawing,
      isDragging,
      selectedId,
      state.tool,
      eraseAtPoint,
      moveAnnotation,
      draggingVertexIndex,
      moveVertex,
    ],
  );

  const endDrawing = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDraggingVertexIndex(null);
      dragStartRef.current = null;
      finishMove();
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (state.tool === "eraser") {
      // 如果有擦除操作，保存历史
      if (beforeEraseRef.current && erasedInStroke.current.size > 0) {
        pushHistory(state.annotations);
      }
      beforeEraseRef.current = null;
      erasedInStroke.current.clear();
      return;
    }

    if (!currentAnnotation.current) return;

    const annotation = currentAnnotation.current;

    // 多边形需要至少 3 个顶点
    if (annotation.type === "polygon") {
      if (annotation.points.length < 3) {
        // 顶点不足，继续绘制
        return;
      }
      currentAnnotation.current = null;
    } else {
      currentAnnotation.current = null;
      if (annotation.points.length < 2 && annotation.type !== "text") return;
    }

    // 添加新标注并保存历史
    const newAnnotations = [...state.annotations, annotation];
    setState((prev) => ({ ...prev, annotations: newAnnotations }));
    pushHistory(newAnnotations);
  }, [
    isDrawing,
    isDragging,
    state.tool,
    state.annotations,
    finishMove,
    pushHistory,
  ]);

  const addTextAnnotation = useCallback(
    (point: Point, text: string) => {
      if (!text.trim()) return;

      const annotation: Annotation = {
        id: generateId(),
        type: "text",
        points: [point],
        color: state.color,
        lineWidth: state.lineWidth,
        text: text.trim(),
        page: currentPage,
      };

      const newAnnotations = [...state.annotations, annotation];
      setState((prev) => ({ ...prev, annotations: newAnnotations }));
      pushHistory(newAnnotations);
    },
    [state.color, state.lineWidth, state.annotations, currentPage, pushHistory],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const newAnnotations = state.annotations.filter((a) => a.id !== selectedId);
    setState((prev) => ({ ...prev, annotations: newAnnotations }));
    pushHistory(newAnnotations);
    setSelectedId(null);
  }, [selectedId, state.annotations, pushHistory]);

  const undo = useCallback(() => {
    console.log(
      "undo: index=",
      historyIndexRef.current,
      "length=",
      historyRef.current.length,
    );
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const snapshot = JSON.parse(
        JSON.stringify(historyRef.current[historyIndexRef.current]),
      );
      console.log("undo: restoring to", snapshot.length, "annotations");
      setState((prev) => ({ ...prev, annotations: snapshot }));
      setSelectedId(null);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
      return true;
    }
    return false;
  }, []);

  const redo = useCallback(() => {
    console.log(
      "redo: index=",
      historyIndexRef.current,
      "length=",
      historyRef.current.length,
    );
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const snapshot = JSON.parse(
        JSON.stringify(historyRef.current[historyIndexRef.current]),
      );
      console.log("redo: restoring to", snapshot.length, "annotations");
      setState((prev) => ({ ...prev, annotations: snapshot }));
      setSelectedId(null);
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      return true;
    }
    return false;
  }, []);

  const clearAnnotations = useCallback(() => {
    if (state.annotations.length === 0) return;
    setState((prev) => ({ ...prev, annotations: [] }));
    pushHistory([]);
    setSelectedId(null);
  }, [state.annotations.length, pushHistory]);

  const getCurrentAnnotation = useCallback(() => currentAnnotation.current, []);

  const getPageAnnotations = useCallback(
    (page: number) => state.annotations.filter((a) => a.page === page),
    [state.annotations],
  );

  return {
    state,
    isDrawing,
    isDragging,
    selectedId,
    canUndo,
    canRedo,
    draggingVertexIndex,
    setSelectedId,
    setTool,
    setColor,
    setLineWidth,
    startDrawing,
    continueDrawing,
    endDrawing,
    addTextAnnotation,
    deleteSelected,
    undo,
    redo,
    clearAnnotations,
    getCurrentAnnotation,
    getPageAnnotations,
    findAnnotationAtPoint,
    findVertexAtPoint,
  };
}
