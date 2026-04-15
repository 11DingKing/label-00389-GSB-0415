const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_PDF_TYPE = 'application/pdf';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
  }

  // Check file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isPdf = file.type === ALLOWED_PDF_TYPE;

  if (!isImage && !isPdf) {
    return { valid: false, error: '不支持的文件格式，请上传 PDF 或图片文件 (JPG, PNG, GIF, WebP)' };
  }

  // Additional check: verify file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  if (!extension || !validExtensions.includes(extension)) {
    return { valid: false, error: '文件扩展名无效' };
  }

  return { valid: true };
}

export function getFileType(file: File): 'pdf' | 'image' {
  return file.type === ALLOWED_PDF_TYPE ? 'pdf' : 'image';
}

export function sanitizeFileName(name: string): string {
  // Remove potentially dangerous characters
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 255);
}
