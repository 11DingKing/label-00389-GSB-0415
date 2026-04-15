"use client";

import { useState, useRef } from "react";
import { ToolType } from "@/types";
import { useToast } from "./Toast";

interface ToolbarProps {
  currentTool: ToolType;
  currentColor: string;
  currentLineWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onLineWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const tools: { type: ToolType; label: string; icon: JSX.Element }[] = [
  {
    type: "select",
    label: "选择",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
        />
      </svg>
    ),
  },
  {
    type: "pan",
    label: "移动",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
        />
      </svg>
    ),
  },
  {
    type: "pen",
    label: "画笔",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
        />
      </svg>
    ),
  },
  {
    type: "highlighter",
    label: "荧光笔",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
  },
  {
    type: "text",
    label: "文字",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    ),
  },
  {
    type: "rectangle",
    label: "矩形",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
      </svg>
    ),
  },
  {
    type: "circle",
    label: "圆形",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    type: "arrow",
    label: "箭头",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
        />
      </svg>
    ),
  },
  {
    type: "polygon",
    label: "多边形",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2l8 6v12H4l-8-6 8-6z"
        />
      </svg>
    ),
  },
  {
    type: "eraser",
    label: "橡皮擦",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.505 14.505l4.99 4.99M6 6l12 12M4.5 8.5L15.5 19.5M8.5 4.5L19.5 15.5M3 12l9 9M12 3l9 9"
        />
      </svg>
    ),
  },
];

const colors = [
  { value: "#ef4444", name: "红" },
  { value: "#f97316", name: "橙" },
  { value: "#eab308", name: "黄" },
  { value: "#22c55e", name: "绿" },
  { value: "#0ea5e9", name: "蓝" },
  { value: "#06b6d4", name: "青" },
  { value: "#1e293b", name: "黑" },
  { value: "#94a3b8", name: "灰" },
];

export default function Toolbar({
  currentTool,
  currentColor,
  currentLineWidth,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onLineWidthChange,
  onUndo,
  onRedo,
  onClear,
}: ToolbarProps) {
  const { showToast } = useToast();
  const [showColors, setShowColors] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const colorBtnRef = useRef<HTMLButtonElement>(null);

  const handleToolChange = (tool: ToolType, label: string) => {
    onToolChange(tool);
    showToast(label, "info");
    setShowMore(false);
  };

  return (
    <div className="bg-white border-t sm:border-t-0 sm:border-b border-gray-100 px-2 sm:px-4 py-1.5 sm:py-2.5 relative z-30">
      {/* 颜色选择弹窗 - 放在最外层避免被裁剪 */}
      {showColors && colorBtnRef.current && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowColors(false)}
          />
          <div
            className="fixed p-3 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-scale-in"
            style={{
              left:
                colorBtnRef.current.getBoundingClientRect().left +
                colorBtnRef.current.offsetWidth / 2,
              bottom:
                window.innerHeight -
                colorBtnRef.current.getBoundingClientRect().top +
                8,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-xs text-gray-400 mb-2 text-center">选择颜色</p>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    onColorChange(c.value);
                    setShowColors(false);
                    showToast(`${c.name}色`, "info");
                  }}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <span
                    className={`block w-8 h-8 rounded-lg transition-all ${currentColor === c.value ? "ring-2 ring-sky-500 ring-offset-2" : "active:scale-90"}`}
                    style={{ backgroundColor: c.value }}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-1 sm:gap-2">
        {/* 移动端：工具栏横向滚动 */}
        <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <div className="flex items-center gap-1 sm:gap-0.5 sm:bg-gray-50 sm:rounded-xl sm:p-1 w-max">
            {tools.map((tool) => (
              <button
                key={tool.type}
                onClick={() => handleToolChange(tool.type, tool.label)}
                className={`
                  w-11 h-11 sm:w-9 sm:h-9 rounded-xl sm:rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 transition-all flex-shrink-0
                  ${
                    currentTool === tool.type
                      ? "bg-sky-50 sm:bg-white text-sky-600 sm:shadow-sm"
                      : "text-gray-500 active:bg-gray-100"
                  }
                `}
              >
                {tool.icon}
                <span className="text-[9px] sm:hidden leading-none">
                  {tool.label.slice(0, 2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

        {/* 颜色按钮 */}
        <button
          ref={colorBtnRef}
          onClick={() => {
            setShowColors(!showColors);
            setShowMore(false);
          }}
          className="w-11 h-11 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 active:bg-gray-100 flex-shrink-0"
        >
          <div
            className="w-6 h-6 sm:w-5 sm:h-5 rounded-md shadow-sm border border-gray-200"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-[9px] sm:hidden text-gray-500">颜色</span>
          <svg
            className="hidden sm:block w-3.5 h-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 更多按钮 */}
        <button
          onClick={() => {
            setShowMore(!showMore);
            setShowColors(false);
          }}
          className="w-11 h-11 sm:hidden rounded-xl flex flex-col items-center justify-center gap-0.5 active:bg-gray-100 flex-shrink-0"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <span className="text-[9px] text-gray-500">更多</span>
        </button>

        {/* 桌面端：粗细 */}
        <div className="hidden sm:flex items-center gap-2 px-2">
          <span className="text-xs text-gray-400">粗细</span>
          <input
            type="range"
            min="1"
            max="20"
            value={currentLineWidth}
            onChange={(e) => onLineWidthChange(Number(e.target.value))}
            className="w-20 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 
              [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-xs text-gray-500 w-4">{currentLineWidth}</span>
        </div>

        <div className="hidden sm:block w-px h-7 bg-gray-200" />

        {/* 桌面端：操作按钮 */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={() => {
              if (canUndo) {
                onUndo();
                showToast("撤销", "info");
              }
            }}
            disabled={!canUndo}
            title="撤销"
            className={`p-2 rounded-lg transition-colors ${canUndo ? "text-gray-500 hover:text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              if (canRedo) {
                onRedo();
                showToast("重做", "info");
              }
            }}
            disabled={!canRedo}
            title="重做"
            className={`p-2 rounded-lg transition-colors ${canRedo ? "text-gray-500 hover:text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              onClear();
              showToast("已清除", "warning");
            }}
            title="清除"
            className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* 更多选项弹窗 - 移动端 */}
        {showMore && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMore(false)}
            />
            <div className="absolute bottom-full right-2 mb-2 p-3 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-scale-in min-w-[220px]">
              {/* 粗细 */}
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">线条粗细</span>
                  <span className="text-xs font-medium text-gray-600">
                    {currentLineWidth}px
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={currentLineWidth}
                  onChange={(e) => onLineWidthChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    if (canUndo) {
                      onUndo();
                      showToast("撤销", "info");
                      setShowMore(false);
                    }
                  }}
                  disabled={!canUndo}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl ${canUndo ? "text-gray-600 active:bg-gray-100" : "text-gray-300"}`}
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
                      d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                    />
                  </svg>
                  <span className="text-[10px]">撤销</span>
                </button>
                <button
                  onClick={() => {
                    if (canRedo) {
                      onRedo();
                      showToast("重做", "info");
                      setShowMore(false);
                    }
                  }}
                  disabled={!canRedo}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl ${canRedo ? "text-gray-600 active:bg-gray-100" : "text-gray-300"}`}
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
                      d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
                    />
                  </svg>
                  <span className="text-[10px]">重做</span>
                </button>
                <button
                  onClick={() => {
                    onClear();
                    showToast("已清除", "warning");
                    setShowMore(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-red-500 active:bg-red-50"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="text-[10px]">清除</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
