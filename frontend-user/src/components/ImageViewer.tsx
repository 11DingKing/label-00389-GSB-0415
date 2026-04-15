'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from './Toast';

interface ImageViewerProps {
  url: string;
  scale: number;
  onDimensionsChange: (width: number, height: number) => void;
  onScaleChange: (scale: number) => void;
  onBaseSize: (width: number, height: number) => void;
}

export default function ImageViewer({ url, scale, onDimensionsChange, onScaleChange, onBaseSize }: ImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { showToast } = useToast();
  
  const callbacksRef = useRef({ onDimensionsChange, onScaleChange, onBaseSize });
  callbacksRef.current = { onDimensionsChange, onScaleChange, onBaseSize };

  // 加载图片
  useEffect(() => {
    setLoading(true);
    setError(null);
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      imageRef.current = img;
      callbacksRef.current.onBaseSize(img.width, img.height);
      
      // 首次加载时计算自适应缩放
      const maxW = window.innerWidth * 0.8;
      const maxH = window.innerHeight * 0.6;
      const fitScale = Math.min(maxW / img.width, maxH / img.height, 1);
      callbacksRef.current.onScaleChange(fitScale);
      
      setLoading(false);
      setImageLoaded(true);
      showToast('图片已加载', 'success');
    };
    
    img.onerror = () => {
      setError('无法加载图片');
      setLoading(false);
      showToast('加载失败', 'error');
    };
    
    img.src = url;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url, showToast]);

  // 当图片加载完成或 scale 变化时重新绘制
  useEffect(() => {
    if (!imageLoaded) return;
    
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    callbacksRef.current.onDimensionsChange(w, h);
  }, [scale, imageLoaded]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 animate-fade-in">
      <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-sm text-gray-500">加载中...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-80 text-gray-400 animate-fade-in">
      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      <p className="text-sm">{error}</p>
    </div>
  );

  return (
    <div className="relative animate-fade-in">
      <canvas ref={canvasRef} className="shadow-lg rounded-lg block" />
    </div>
  );
}
