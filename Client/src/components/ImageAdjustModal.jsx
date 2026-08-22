import { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, RotateCw, ZoomIn, Check } from 'lucide-react';

export const ImageAdjustModal = ({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  title = 'Adjust Profile Photo'
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const initialPinchDistRef = useRef(null);
  const initialPinchZoomRef = useRef(1);
  const imageRef = useRef(null);

  // Reset controls when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      initialPinchDistRef.current = null;
    }
  }, [isOpen, imageSrc]);

  // Calculate distance between 2 touch points for pinch zoom
  const getPinchDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle Drag / Pan with Mouse
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Drag & Pinch Zoom with Touch (Mobile)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = getPinchDistance(e.touches[0], e.touches[1]);
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const currentDist = getPinchDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDist / initialPinchDistRef.current;
      const newZoom = Math.min(3.0, Math.max(0.4, initialPinchZoomRef.current * scaleFactor));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistRef.current = null;
  };

  // Handle Wheel Zoom (Desktop)
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(3.0, Math.max(0.4, prev + delta)));
  };

  // Rotate 90 Degrees Clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Apply Precise Canvas Crop Match (1:1 with Circle Frame)
  const handleApplyCrop = useCallback(() => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const cropSize = 300; // Output cropped image resolution: 300x300px
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const img = imageRef.current;
    const previewContainerSize = 224; // 224px (w-56)
    const ratio = cropSize / previewContainerSize;

    // Draw circular clip path
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropSize, cropSize);

    // Apply Transformation Matrix
    ctx.save();
    ctx.translate(cropSize / 2 + pan.x * ratio, cropSize / 2 + pan.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw full uncropped image centered inside canvas
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW, drawH;
    if (imgAspect > 1) {
      drawW = cropSize;
      drawH = cropSize / imgAspect;
    } else {
      drawH = cropSize;
      drawW = cropSize * imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/png');

    // Convert Data URL to File object for FormData upload compatibility
    fetch(croppedDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'cropped_avatar.png', { type: 'image/png' });
        onApply(croppedDataUrl, file);
      });
  }, [zoom, pan, rotation, onApply]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-[28px] p-4 sm:p-5 shadow-2xl space-y-4 animate-scaleUp">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border-theme)]">
          <div className="flex items-center space-x-2">
            <Scissors className="w-5 h-5 text-[var(--color-primary-600)]" />
            <h3 className="font-poppins font-bold text-base sm:text-lg text-[var(--text-main)]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Circular Viewport Preview Area */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="w-56 h-56 rounded-full border-4 border-[var(--color-primary-500)] shadow-inner relative overflow-hidden bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop Target"
              crossOrigin="anonymous"
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: 'none',
                maxHeight: 'none',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
              className="w-full h-full object-contain select-none"
            />

            {/* Circular Grid Alignment Mask Guide */}
            <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-1/2 h-1/2 border border-dashed border-white/30 rounded-full" />
            </div>
          </div>
          <span className="text-[11px] font-lato text-[var(--text-muted)] mt-2 text-center">
            Drag to move • Pinch or scroll to zoom in/out
          </span>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="space-y-3 bg-[var(--bg-main)] p-3.5 rounded-2xl border border-[var(--border-theme)]">
          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-poppins font-semibold">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1">
                <ZoomIn className="w-4 h-4 text-[var(--color-primary-600)]" />
                <span>Zoom</span>
              </span>
              <span className="text-[var(--color-primary-600)] font-bold font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.4, prev - 0.1))}
                className="w-7 h-7 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[var(--color-primary-600)] cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3.0, prev + 0.1))}
                className="w-7 h-7 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Buttons Row */}
          <div className="flex justify-between items-center pt-2 border-t border-[var(--border-theme)]">
            <button
              type="button"
              onClick={handleRotate}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-400)] text-xs font-poppins font-semibold text-[var(--text-main)] flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5 text-[var(--color-primary-600)]" />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] text-xs font-poppins font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex space-x-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] hover:bg-[var(--border-theme)] text-[var(--text-secondary)] font-poppins font-bold text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImageAdjustModal;
