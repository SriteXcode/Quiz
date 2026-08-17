import { useState, useRef, useEffect, useCallback } from 'react';

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
  const imageRef = useRef(null);

  // Reset controls when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [isOpen, imageSrc]);

  // Handle Drag / Pan with Mouse or Touch
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

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyCrop = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    const outputSize = 400; // Output square avatar resolution
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, outputSize, outputSize);

    // Save and transform canvas context to center
    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Apply pan offset proportional to viewport size
    // Viewport preview circle is 220px wide
    const previewScale = outputSize / 220;
    const drawX = pan.x * previewScale;
    const drawY = pan.y * previewScale;

    // Calculate dimensions to maintain aspect ratio covering the circle
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let targetW, targetH;
    if (imgAspect >= 1) {
      targetH = outputSize;
      targetW = outputSize * imgAspect;
    } else {
      targetW = outputSize;
      targetH = outputSize / imgAspect;
    }

    ctx.drawImage(
      img,
      drawX - targetW / 2,
      drawY - targetH / 2,
      targetW,
      targetH
    );

    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    canvas.toBlob((blob) => {
      if (blob && onApply) {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onApply(dataUrl, file);
      }
    }, 'image/jpeg', 0.92);
  }, [zoom, pan, rotation, onApply]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm sm:max-w-md bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✂️</span>
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
            className="w-56 h-56 rounded-full border-4 border-[var(--color-primary-500)] shadow-inner relative overflow-hidden bg-slate-900 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                userSelect: 'none',
                pointerEvents: 'none'
              }}
              className="w-full h-full object-cover select-none"
            />

            {/* Circular Grid Alignment Mask Guide */}
            <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-1/2 h-1/2 border border-dashed border-white/30 rounded-full" />
            </div>
          </div>
          <span className="text-[11px] font-lato text-[var(--text-muted)] mt-2">
            ✋ Drag to reposition image within circle
          </span>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="space-y-3 bg-[var(--bg-main)] p-3.5 rounded-2xl border border-[var(--border-theme)]">
          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-poppins font-semibold">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1">
                <span>🔍</span>
                <span>Zoom</span>
              </span>
              <span className="text-[var(--color-primary-600)] font-bold font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
                className="w-7 h-7 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <input
                type="range"
                min="0.6"
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
              className="px-3 py-1.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-400)] text-xs font-poppins font-semibold text-[var(--text-main)] flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <span>🔄 Rotate 90°</span>
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
            className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1"
          >
            <span>✓ Save & Apply</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImageAdjustModal;
