'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { UploadedFile } from '@/types';
import { useAnnotation } from '@/hooks/useAnnotation';
import { useToast } from './Toast';
import Toolbar from './Toolbar';
import PDFViewer from './PDFViewer';
import ImageViewer from './ImageViewer';
import AnnotationCanvas from './AnnotationCanvas';

interface AnnotationEditorProps {
  file: UploadedFile;
  onClose: () => void;
}

export default function AnnotationEditor({ file, onClose }: AnnotationEditorProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [baseSize, setBaseSize] = useState({ width: 800, height: 600 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState('');
  
  // 完全使用 ref 控制平移，避免 React 重渲染导致卡顿
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false); // 仅用于 UI 显示（光标样式）
  const [hasOffset, setHasOffset] = useState(false); // 用于显示重置按钮
  
  const lastTouchDistRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const {
    state, isDrawing, isDragging, selectedId, canUndo, canRedo, setTool, setColor, setLineWidth,
    startDrawing, continueDrawing, endDrawing, addTextAnnotation, deleteSelected,
    undo, redo, clearAnnotations, getCurrentAnnotation, getPageAnnotations, findAnnotationAtPoint,
  } = useAnnotation(currentPage);

  const handleExport = useCallback(() => {
    const data = { fileId: file.id, fileName: file.name, baseSize, annotations: state.annotations, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${file.name}-annotations.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('已导出标注', 'success');
  }, [file, state.annotations, baseSize, showToast]);

  const handleBaseSize = useCallback((w: number, h: number) => setBaseSize({ width: w, height: h }), []);
  const handleDimensionsChange = useCallback((w: number, h: number) => setDimensions({ width: w, height: h }), []);
  const handleScaleChange = useCallback((s: number) => setScale(s), []);

  // 直接更新 DOM transform，不触发 React 重渲染
  const updateTransform = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${panOffsetRef.current.x}px, ${panOffsetRef.current.y}px)`;
    }
  }, []);

  // 处理移动工具的拖动 - 使用 PointerEvent 统一处理鼠标和触摸
  const handlePanStart = useCallback((e: React.PointerEvent) => {
    if (state.tool !== 'pan') return;
    e.preventDefault();
    e.stopPropagation();
    
    // 捕获指针，确保移动时事件不会丢失
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    isPanningRef.current = true;
    setIsPanning(true);
    
    panStartRef.current = { 
      x: e.clientX - panOffsetRef.current.x, 
      y: e.clientY - panOffsetRef.current.y 
    };
  }, [state.tool]);

  const handlePanMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current || state.tool !== 'pan') return;
    e.preventDefault();
    e.stopPropagation();
    
    // 直接更新 ref 和 DOM，不触发 React 重渲染
    panOffsetRef.current = {
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    };
    updateTransform();
  }, [state.tool, updateTransform]);

  const handlePanEnd = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setIsPanning(false);
      // 只在拖动结束时更新 hasOffset 状态
      setHasOffset(panOffsetRef.current.x !== 0 || panOffsetRef.current.y !== 0);
    }
  }, []);

  // 双指缩放
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = (dist - lastTouchDistRef.current) * 0.005;
        lastTouchDistRef.current = dist;
        setScale(prev => Math.max(0.25, Math.min(3, prev + delta)));
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistRef.current = null;
    };

    main.addEventListener('touchstart', handleTouchStart, { passive: false });
    main.addEventListener('touchmove', handleTouchMove, { passive: false });
    main.addEventListener('touchend', handleTouchEnd);

    return () => {
      main.removeEventListener('touchstart', handleTouchStart);
      main.removeEventListener('touchmove', handleTouchMove);
      main.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const resetView = useCallback(() => {
    panOffsetRef.current = { x: 0, y: 0 };
    updateTransform();
    setHasOffset(false);
    showToast('已重置视图', 'info');
  }, [showToast, updateTransform]);

  // 移动端文字输入处理
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const textInputOpenTimeRef = useRef<number>(0);

  const handleOpenTextInput = useCallback((position: { x: number; y: number }) => {
    setTextPosition(position);
    setShowTextInput(true);
    setTextValue('');
    textInputOpenTimeRef.current = Date.now();
  }, []);

  const handleTextSubmit = useCallback(() => {
    if (textValue.trim() && textPosition) {
      addTextAnnotation(textPosition, textValue.trim());
      showToast('已添加文字', 'success');
    }
    setShowTextInput(false);
    setTextValue('');
    setTextPosition(null);
  }, [textValue, textPosition, addTextAnnotation, showToast]);

  const handleTextCancel = useCallback(() => {
    // 防止刚打开就被关闭（100ms 内不响应关闭）
    if (Date.now() - textInputOpenTimeRef.current < 100) return;
    setShowTextInput(false);
    setTextValue('');
    setTextPosition(null);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f8fafc]">
      {/* 头部 - 移动端更紧凑 */}
      <header className="bg-white border-b border-gray-100 px-2 sm:px-5 py-1.5 sm:py-3 flex items-center justify-between relative z-40 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1">
          <button onClick={onClose} className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors flex-shrink-0">
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${file.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
              {file.type === 'pdf' ? (
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
              ) : (
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[100px] sm:max-w-xs">{file.name}</h1>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400">
                {file.type === 'pdf' && <span>{currentPage}/{totalPages}</span>}
                <span>{Math.round(scale * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {state.annotations.length > 0 && <span className="hidden sm:inline text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{state.annotations.length} 个标注</span>}
          
          {/* 移动端：只显示图标 */}
          <button 
            onClick={() => showToast('分享功能正在开发中...', 'info')} 
            className="flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-white text-gray-600 rounded-lg border border-gray-200 active:bg-gray-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">分享</span>
          </button>

          <button 
            onClick={handleExport} 
            className="flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-lg active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">导出</span>
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main 
        ref={mainRef}
        className="flex-1 overflow-auto p-2 sm:p-6 pb-16 sm:pb-6"
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
        onPointerLeave={handlePanEnd}
        onPointerCancel={handlePanEnd}
        style={{ 
          cursor: state.tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: state.tool === 'pan' ? 'none' : 'auto'
        }}
      >
        <div className="flex items-center justify-center min-h-full">
          <div
            ref={contentRef}
            className="relative flex-shrink-0"
          >
            {file.type === 'pdf' ? (
              <PDFViewer url={file.url} currentPage={currentPage} scale={scale} onPageChange={setCurrentPage} onTotalPagesChange={setTotalPages} onDimensionsChange={handleDimensionsChange} onScaleChange={handleScaleChange} onBaseSize={handleBaseSize} />
            ) : (
              <ImageViewer url={file.url} scale={scale} onDimensionsChange={handleDimensionsChange} onScaleChange={handleScaleChange} onBaseSize={handleBaseSize} />
            )}
            <div className="absolute inset-0" style={{ pointerEvents: state.tool === 'pan' ? 'none' : 'auto' }}>
              <AnnotationCanvas width={dimensions.width} height={dimensions.height} scale={scale} annotations={getPageAnnotations(currentPage)} currentTool={state.tool} currentColor={state.color} currentLineWidth={state.lineWidth} isDrawing={isDrawing} isDragging={isDragging} selectedId={selectedId} getCurrentAnnotation={getCurrentAnnotation} onStartDrawing={startDrawing} onContinueDrawing={continueDrawing} onEndDrawing={endDrawing} onAddText={addTextAnnotation} onDeleteSelected={deleteSelected} findAnnotationAtPoint={(point) => findAnnotationAtPoint(point, state.annotations)} onRequestTextInput={handleOpenTextInput} />
            </div>
          </div>
        </div>
      </main>

      {/* 移动端浮动控制按钮 - 左侧缩放 */}
      <div className="sm:hidden fixed left-3 bottom-[72px] z-20 flex flex-col gap-1.5">
        <button
          onClick={() => { setScale(prev => Math.min(3, prev + 0.25)); showToast(`${Math.round(Math.min(3, scale + 0.25) * 100)}%`, 'info'); }}
          className="w-9 h-9 bg-white/95 backdrop-blur rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        <button
          onClick={() => { setScale(prev => Math.max(0.25, prev - 0.25)); showToast(`${Math.round(Math.max(0.25, scale - 0.25) * 100)}%`, 'info'); }}
          className="w-9 h-9 bg-white/95 backdrop-blur rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
        </button>
        {hasOffset && (
          <button
            onClick={resetView}
            className="w-9 h-9 bg-white/95 backdrop-blur rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
          </button>
        )}
      </div>

      {/* PDF 页面导航 - 右上角浮动 */}
      {file.type === 'pdf' && totalPages > 1 && (
        <div className="fixed right-3 top-14 sm:top-20 z-20 flex items-center gap-1 p-1 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200">
          <button
            onClick={() => { if (currentPage > 1) { setCurrentPage(currentPage - 1); showToast(`第 ${currentPage - 1} 页`, 'info'); } }}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="px-2 text-sm text-gray-600 font-medium">{currentPage}/{totalPages}</span>
          <button
            onClick={() => { if (currentPage < totalPages) { setCurrentPage(currentPage + 1); showToast(`第 ${currentPage + 1} 页`, 'info'); } }}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* 选中提示 - 固定在顶部 */}
      {state.tool === 'select' && selectedId && !isDragging && (
        <div className="fixed top-16 sm:top-24 left-1/2 -translate-x-1/2 z-20 animate-fade-in pointer-events-none">
          <div className="px-3 py-1.5 bg-sky-500 text-white text-xs rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap">
            <span>已选中 · 拖动移动</span>
            <span className="opacity-60">|</span>
            <span>Delete 删除</span>
          </div>
        </div>
      )}

      {/* 工具栏 - 移动端固定底部 */}
      <div className="sm:contents">
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 safe-area-bottom">
          <Toolbar currentTool={state.tool} currentColor={state.color} currentLineWidth={state.lineWidth} canUndo={canUndo} canRedo={canRedo} onToolChange={setTool} onColorChange={setColor} onLineWidthChange={setLineWidth} onUndo={undo} onRedo={redo} onClear={clearAnnotations} />
        </div>
        <div className="hidden sm:block">
          <Toolbar currentTool={state.tool} currentColor={state.color} currentLineWidth={state.lineWidth} canUndo={canUndo} canRedo={canRedo} onToolChange={setTool} onColorChange={setColor} onLineWidthChange={setLineWidth} onUndo={undo} onRedo={redo} onClear={clearAnnotations} />
        </div>
      </div>

      {/* 移动端文字输入弹窗 */}
      {showTextInput && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 animate-fade-in" 
          onPointerUp={(e) => { e.stopPropagation(); handleTextCancel(); }}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up safe-area-bottom"
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">添加文字</span>
              <button onClick={handleTextCancel} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
                style={{ color: state.color }}
              />
            </div>
            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-gray-200" style={{ backgroundColor: state.color }} />
                <span className="text-sm text-gray-500">当前颜色</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleTextCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">取消</button>
                <button onClick={handleTextSubmit} disabled={!textValue.trim()} className="px-5 py-2 text-sm text-white bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors font-medium">确定</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
