'use client';

import { useCallback, useState, useRef } from 'react';
import { validateFile, getFileType, sanitizeFileName } from '@/utils/fileValidation';
import { UploadedFile } from '@/types';
import { generateId } from '@/utils/canvasUtils';
import { useToast } from './Toast';

interface FileUploaderProps {
  onFileSelect: (file: UploadedFile) => void;
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const processFile = useCallback(
    (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        showToast(validation.error || '文件验证失败', 'error');
        return;
      }

      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 100) { clearInterval(interval); return null; }
          return Math.min(prev + 25, 100);
        });
      }, 50);

      setTimeout(() => {
        const fileId = generateId();
        
        // 清除该文件的历史缓存
        try {
          localStorage.removeItem('annotation_data_' + fileId);
        } catch {}
        
        const uploadedFile: UploadedFile = {
          id: fileId,
          name: sanitizeFileName(file.name),
          type: getFileType(file),
          url: URL.createObjectURL(file),
          file,
        };
        setUploadProgress(null);
        showToast('文件已准备就绪', 'success');
        onFileSelect(uploadedFile);
      }, 400);
    },
    [onFileSelect, showToast]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-300 ease-out group
          bg-white/70 backdrop-blur-sm
          border-2 border-dashed
          ${isDragging 
            ? 'border-sky-400 bg-sky-50/80 shadow-xl shadow-sky-100 scale-[1.01]' 
            : 'border-gray-200 hover:border-sky-300 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className={`
            relative w-14 h-14 mx-auto rounded-2xl flex items-center justify-center
            transition-all duration-300
            ${isDragging 
              ? 'bg-sky-100' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-sky-50 group-hover:to-sky-100'
            }
          `}>
            {/* Animated ring on drag */}
            {isDragging && (
              <div className="absolute inset-0 rounded-2xl border-2 border-sky-400 animate-ping opacity-50" />
            )}
            <svg 
              className={`w-6 h-6 transition-all duration-300 ${isDragging ? 'text-sky-500 -translate-y-0.5' : 'text-gray-400 group-hover:text-sky-500 group-hover:-translate-y-0.5'}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>

          {/* Text */}
          <div>
            <p className="text-base text-gray-700 font-medium">
              {isDragging ? (
                <span className="text-sky-600">松开鼠标上传文件</span>
              ) : (
                <>
                  拖拽文件到这里，或
                  <span className="text-sky-500 hover:text-sky-600"> 点击选择</span>
                </>
              )}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              支持 PDF 和图片，最大 50MB
            </p>
          </div>
        </div>

        {/* Progress Overlay */}
        {uploadProgress !== null && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-fade-in">
            {/* Progress Ring */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="url(#progressGradient)" 
                  strokeWidth="4" 
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={176}
                  strokeDashoffset={176 - (176 * uploadProgress) / 100}
                  className="transition-all duration-100"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">{uploadProgress}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">正在处理...</p>
          </div>
        )}
      </div>
    </div>
  );
}
