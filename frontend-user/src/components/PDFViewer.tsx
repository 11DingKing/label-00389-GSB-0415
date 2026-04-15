'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useToast } from './Toast';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  url: string;
  currentPage: number;
  scale: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  onDimensionsChange: (width: number, height: number) => void;
  onScaleChange: (scale: number) => void;
  onBaseSize: (width: number, height: number) => void;
}

export default function PDFViewer({ 
  url, currentPage, scale, onPageChange, onTotalPagesChange, 
  onDimensionsChange, onScaleChange, onBaseSize 
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const baseSizeRef = useRef<{ width: number; height: number } | null>(null);
  const initializedRef = useRef(false);
  const callbacksRef = useRef({ onPageChange, onTotalPagesChange, onDimensionsChange, onScaleChange, onBaseSize });
  const { showToast } = useToast();

  // 更新回调引用
  callbacksRef.current = { onPageChange, onTotalPagesChange, onDimensionsChange, onScaleChange, onBaseSize };

  // 加载 PDF 文档
  useEffect(() => {
    let cancelled = false;
    
    const loadPdf = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);
        setError(null);
        initializedRef.current = false;
        
        const loadingTask = pdfjsLib.getDocument({
          url,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
          cMapPacked: true,
          disableAutoFetch: false,
          disableStream: false,
        });
        
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setLoadingProgress(percent);
          }
        };
        
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        
        setPdfDoc(pdf);
        callbacksRef.current.onTotalPagesChange(pdf.numPages);
        setLoading(false);
        showToast(`共 ${pdf.numPages} 页`, 'success');
      } catch (err) {
        if (cancelled) return;
        console.error('PDF load error:', err);
        setError('无法加载 PDF');
        setLoading(false);
        showToast('加载失败', 'error');
      }
    };
    
    loadPdf();
    return () => { cancelled = true; };
  }, [url, showToast]);

  // 渲染当前页面
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    
    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }
        
        setPageLoading(true);
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;
        
        // 获取基础尺寸
        const baseViewport = page.getViewport({ scale: 1 });
        if (!baseSizeRef.current || 
            baseSizeRef.current.width !== baseViewport.width || 
            baseSizeRef.current.height !== baseViewport.height) {
          baseSizeRef.current = { width: baseViewport.width, height: baseViewport.height };
          callbacksRef.current.onBaseSize(baseViewport.width, baseViewport.height);
        }
        
        // 首次加载时计算自适应缩放
        if (!initializedRef.current) {
          const maxW = window.innerWidth * 0.8, maxH = window.innerHeight * 0.6;
          const fitScale = Math.min(maxW / baseViewport.width, maxH / baseViewport.height, 1.5);
          callbacksRef.current.onScaleChange(fitScale);
          initializedRef.current = true;
        }
        
        // 使用外部传入的 scale
        const renderScale = scale;
        
        // 限制最大渲染尺寸
        const maxDimension = 2500;
        let actualRenderScale = renderScale;
        const scaledWidth = baseViewport.width * renderScale;
        const scaledHeight = baseViewport.height * renderScale;
        
        if (scaledWidth > maxDimension || scaledHeight > maxDimension) {
          const ratio = Math.min(maxDimension / scaledWidth, maxDimension / scaledHeight);
          actualRenderScale = renderScale * ratio;
        }
        
        const viewport = page.getViewport({ scale: actualRenderScale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        callbacksRef.current.onDimensionsChange(viewport.width, viewport.height);
        
        renderTaskRef.current = page.render({
          canvasContext: ctx,
          viewport,
        });
        
        await renderTaskRef.current.promise;
        setPageLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
          return;
        }
        console.error('Page render error:', err);
        setPageLoading(false);
      }
    };
    
    renderPage();
    return () => { 
      cancelled = true; 
      renderTaskRef.current?.cancel(); 
    };
  }, [pdfDoc, currentPage, scale]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 animate-fade-in">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
          <circle 
            cx="32" cy="32" r="28" 
            stroke="url(#pdfProgressGradient)" 
            strokeWidth="4" 
            fill="none"
            strokeLinecap="round"
            strokeDasharray={176}
            strokeDashoffset={176 - (176 * loadingProgress) / 100}
            className="transition-all duration-200"
          />
          <defs>
            <linearGradient id="pdfProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/>
          </svg>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        {loadingProgress > 0 ? `加载中 ${loadingProgress}%` : '正在加载 PDF...'}
      </p>
      <p className="text-xs text-gray-400 mt-1">大文件可能需要较长时间</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-80 text-gray-400 animate-fade-in">
      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="text-sm">{error}</p>
    </div>
  );

  return (
    <div className="relative animate-fade-in">
      <canvas ref={canvasRef} className="shadow-lg rounded-lg block" />
      
      {pageLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md">
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">渲染中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
