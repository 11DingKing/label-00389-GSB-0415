'use client';

import { useState } from 'react';
import { UploadedFile } from '@/types';
import FileUploader from '@/components/FileUploader';
import AnnotationEditor from '@/components/AnnotationEditor';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  if (selectedFile) {
    return <AnnotationEditor file={selectedFile} onClose={() => { URL.revokeObjectURL(selectedFile.url); setSelectedFile(null); }} />;
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-teal-50" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right blob */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-200/40 to-cyan-200/40 rounded-full blur-3xl" />
        </div>
        {/* Bottom left blob */}
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl" />
        </div>
        {/* Center accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-100/20 via-transparent to-teal-100/20 rounded-full blur-3xl" />
        </div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl">
          
          {/* Logo & Badge */}
          <div className="text-center mb-8 animate-slide-in-up">
            {/* Logo Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg shadow-sky-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              文件标注工具
            </h1>
            <p className="text-lg text-gray-500">
              上传 PDF 或图片，轻松添加专业标注
            </p>
          </div>

          {/* File Uploader */}
          <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <FileUploader onFileSelect={setSelectedFile} />
          </div>

          {/* Features */}
          <div className="mt-10 sm:mt-16 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="grid grid-cols-3 gap-3 sm:gap-8">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  ),
                  title: '多格式',
                  desc: 'PDF / 图片',
                },
                {
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                    </svg>
                  ),
                  title: '丰富工具',
                  desc: '画笔 / 形状 / 文字',
                },
                {
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                  title: '安全私密',
                  desc: '本地处理',
                },
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white shadow-sm border border-gray-100 text-gray-600 mb-2 sm:mb-3 group-hover:shadow-md group-hover:border-gray-200 group-hover:text-sky-600 transition-all duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-0.5">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Supported formats */}
          <div className="mt-14 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-xs text-gray-400 mb-3">支持的文件格式</p>
            <div className="flex items-center justify-center gap-2">
              {['PDF', 'JPG', 'PNG', 'GIF', 'WebP'].map((format) => (
                <span key={format} className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-white/80 rounded-md border border-gray-100 shadow-sm">
                  {format}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 text-center">
        <p className="text-xs text-gray-400">
          无需登录 · 数据不上传 · 完全免费
        </p>
      </footer>
    </main>
  );
}
