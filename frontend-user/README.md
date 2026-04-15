# 文件标注工具 - 用户端

一个基于 Next.js 和 Tailwind CSS 开发的现代化文件标注应用，支持 PDF 和图片的在线标注。

## ✨ 功能特性

### 核心功能
- 📁 **文件上传** - 支持拖拽和点击上传，实时进度显示
- 📄 **PDF 预览** - 分页浏览，缩放控制，性能优化
- 🖼️ **图片预览** - 支持 JPG、PNG、GIF、WebP 格式
- 🎨 **丰富的标注工具**
  - ✏️ 画笔 - 自由绘制
  - 🖍️ 荧光笔 - 半透明高亮
  - 📝 文字 - 添加文字注释
  - ⬜ 矩形 - 绘制矩形框
  - ⭕ 圆形 - 绘制圆形/椭圆
  - ➡️ 箭头 - 指向标注
  - 🎯 选择 - 选中和移动标注
  - 🧹 橡皮擦 - 删除标注

### 高级功能
- ↩️ **撤销/重做** - 完整的历史记录管理
- 🎨 **颜色选择** - 8 种预设颜色
- 📏 **线宽调节** - 1-20px 可调
- 💾 **导出 JSON** - 保存所有标注数据
- 🔄 **分享功能** - 开发中
- 📱 **移动端优化** - 响应式设计，触摸友好

## 🛠️ 技术栈

- **框架**: Next.js 14.2.21
- **UI**: React 18.3.1 + Tailwind CSS 3.4.17
- **PDF 处理**: pdfjs-dist 4.9.155
- **语言**: TypeScript 5.7.2
- **构建工具**: Node.js 20

## 📋 系统要求

- Node.js >= 20.x
- npm >= 10.x 或 yarn >= 1.22.x

## 🚀 快速开始

### 本地开发

```bash
# 进入项目目录
cd frontend-user

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker 部署

```bash
# 从项目根目录运行
docker-compose up --build -d

# 访问应用
# 打开浏览器访问 http://localhost:8081
```

## 📁 项目结构

```
frontend-user/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── AnnotationCanvas.tsx    # 标注画布
│   │   ├── AnnotationEditor.tsx    # 标注编辑器
│   │   ├── FileUploader.tsx        # 文件上传
│   │   ├── ImageViewer.tsx         # 图片查看器
│   │   ├── PDFViewer.tsx           # PDF 查看器
│   │   ├── Toast.tsx               # 提示组件
│   │   └── Toolbar.tsx             # 工具栏
│   ├── hooks/                 # 自定义 Hooks
│   │   └── useAnnotation.ts   # 标注状态管理
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   └── utils/                 # 工具函数
│       ├── canvasUtils.ts     # Canvas 工具
│       └── fileValidation.ts  # 文件验证
├── public/                    # 静态资源
├── Dockerfile                 # Docker 配置
├── next.config.js            # Next.js 配置
├── tailwind.config.ts        # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 项目依赖
```

## 🎯 使用指南

### 上传文件
1. 拖拽文件到上传区域，或点击选择文件
2. 支持的格式：PDF、JPG、PNG、GIF、WebP
3. 文件大小限制：50MB

### 标注操作
1. **选择工具** - 从工具栏选择需要的标注工具
2. **绘制标注** - 在预览区域绘制标注
3. **调整样式** - 选择颜色和线宽
4. **移动标注** - 使用选择工具拖动标注
5. **删除标注** - 使用橡皮擦或选中后按 Delete 键

### 快捷键
- `Delete` / `Backspace` - 删除选中的标注
- `Enter` - 确认文字输入
- `Shift + Enter` - 文字换行
- `Esc` - 取消文字输入

### 导出数据
点击右上角"导出"按钮，下载包含所有标注信息的 JSON 文件。

## 🔒 安全特性

- ✅ 文件类型验证（MIME + 扩展名双重检查）
- ✅ 文件大小限制（50MB）
- ✅ 文件名清理（防止路径遍历）
- ✅ XSS 防护（React 自动转义）
- ✅ 本地处理（数据不上传服务器）
- ✅ 无 CVE 漏洞（使用安全版本依赖）

## ⚡ 性能优化

### PDF 优化
- 分页加载（按需渲染当前页）
- 最大尺寸限制（2000px，防止卡死）
- 渲染任务取消机制
- 加载进度显示
- Worker 线程处理

### Canvas 优化
- requestAnimationFrame 动画
- Pointer Events（更好的触摸支持）
- 坐标系分离（基础坐标 + 屏幕坐标）
- 边界限制（防止超出范围）

### 移动端优化
- 响应式工具栏（横向滚动）
- 折叠菜单（节省空间）
- 触摸友好的按钮尺寸
- 自适应布局

## 🐛 故障排除

### PDF 加载失败
- 检查文件是否损坏
- 确认文件大小未超过 50MB
- 尝试使用其他 PDF 文件

### 标注无法绘制
- 确认已选择正确的工具
- 检查是否在预览区域内操作
- 刷新页面重试

### 性能问题
- 减小 PDF 缩放比例
- 关闭其他浏览器标签页
- 使用较小的文件

## 📝 开发说明

### 添加新工具
1. 在 `src/types/index.ts` 中添加工具类型
2. 在 `src/components/Toolbar.tsx` 中添加工具按钮
3. 在 `src/hooks/useAnnotation.ts` 中实现工具逻辑
4. 在 `src/components/AnnotationCanvas.tsx` 中添加绘制逻辑

### 自定义样式
编辑 `src/app/globals.css` 和 `tailwind.config.ts`

### 环境变量
创建 `.env.local` 文件（如需要）：
```env
# 示例
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue。

---

**注意**: 本应用在浏览器本地处理所有文件，不会上传到服务器，确保数据隐私和安全。
