import { useState, useRef } from 'react';
import { apiUploadImage } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ImageUploadDropzone = ({
  label = 'Upload Image',
  value = '',
  onChange,
  placeholder = 'https://example.com/image.png or drop an image file...',
  required = false,
  helpText = 'Drag & drop image file or paste direct image URL',
  aspectRatio = 'square' // 'square' | 'banner'
}) => {
  const { addToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, WebP, SVG, GIF)', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds 10MB limit', 'error');
      return;
    }

    setIsUploading(true);
    setImgError(false);

    try {
      // 1. Try uploading to backend / Cloudinary
      const res = await apiUploadImage(file);
      if (res && res.success && res.url) {
        onChange(res.url);
        addToast('Image uploaded successfully to Cloudinary! ☁️', 'success');
      } else {
        // Fallback to base64 Data URL if backend response doesn't contain url
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result);
          addToast('Image loaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('[ImageUploadDropzone]: Backend upload fallback', err.message);
      // Fallback to local Data URL reading if API request fails
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result);
        addToast('Image uploaded locally!', 'info');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-poppins font-bold text-[var(--text-main)] uppercase tracking-wider">
          {label} {required && <span className="text-rose-500 font-extrabold">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setImgError(false);
            }}
            className="text-[11px] font-poppins font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>✕ Remove</span>
          </button>
        )}
      </div>

      {/* DRAG & DROP ZONE & PREVIEW AREA */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[120px] ${
          isDragging
            ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] dark:bg-blue-950/40 scale-[1.01]'
            : value
            ? 'border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-[var(--color-primary-400)]'
            : 'border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-500)] hover:bg-[var(--bg-main)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <div className="w-8 h-8 border-3 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-poppins font-bold text-[var(--color-primary-600)]">
              Uploading to Cloudinary...
            </span>
          </div>
        ) : value ? (
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full">
            {/* Image Preview Thumbnail */}
            <div className={`relative shrink-0 overflow-hidden rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] shadow-sm flex items-center justify-center ${
              aspectRatio === 'banner' ? 'w-28 h-16 sm:w-36 sm:h-20' : 'w-16 h-16 sm:w-20 sm:h-20'
            }`}>
              {!imgError ? (
                <img
                  src={value}
                  alt="Preview"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center p-1 text-[10px] text-rose-500 font-bold">
                  ⚠️ Invalid URL
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-poppins font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 mb-1">
                ✓ Image Selected / Uploaded
              </span>
              <p className="text-xs font-mono text-[var(--text-muted)] truncate max-w-xs">
                {value}
              </p>
              <p className="text-[11px] font-poppins text-[var(--color-primary-600)] font-semibold mt-1 hover:underline">
                Click or drag new file to change image
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-2 space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-50)] dark:bg-blue-950/60 text-[var(--color-primary-600)] flex items-center justify-center text-xl shadow-inner">
              ☁️
            </div>
            <div>
              <span className="text-xs font-poppins font-bold text-[var(--color-primary-600)] hover:underline">
                Click to browse
              </span>{' '}
              <span className="text-xs font-poppins text-[var(--text-muted)]">
                or drag & drop file here
              </span>
            </div>
            <p className="text-[10px] font-lato text-[var(--text-muted)]">
              Supports PNG, JPG, WebP, SVG, GIF (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* DIRECT IMAGE URL INPUT FALLBACK */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setImgError(false);
          }}
          placeholder={placeholder}
          className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-all"
        />
        {value && (
          <span className="absolute right-3 top-2.5 text-[10px] text-[var(--text-muted)] font-mono">
            URL Mode
          </span>
        )}
      </div>

      {helpText && (
        <p className="text-[11px] font-lato text-[var(--text-muted)] italic">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default ImageUploadDropzone;
