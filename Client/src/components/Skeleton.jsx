/**
 * Flexible Skeleton loader component with smooth shimmer effect
 * Supports types: 'text', 'heading', 'card', 'circle', 'rect'
 */
export const Skeleton = ({
  type = 'rect',
  className = '',
  width,
  height,
  borderRadius,
  style = {}
}) => {
  let defaultClasses = 'skeleton-shimmer rounded-lg ';

  switch (type) {
    case 'circle':
      defaultClasses += 'rounded-full ';
      break;
    case 'heading':
      defaultClasses += 'h-8 w-3/4 rounded-md ';
      break;
    case 'text':
      defaultClasses += 'h-4 w-full rounded ';
      break;
    case 'card':
      defaultClasses += 'h-48 w-full rounded-2xl ';
      break;
    case 'rect':
    default:
      defaultClasses += 'w-full h-full ';
      break;
  }

  const inlineStyles = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(borderRadius ? { borderRadius } : {}),
    ...style
  };

  return (
    <div
      className={`${defaultClasses} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
    />
  );
};

export const PageSkeletonLoader = () => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn py-6">
      {/* Top Banner Skeleton */}
      <div className="w-full rounded-3xl p-8 sm:p-10 border border-[var(--border-theme)] bg-[var(--bg-card)] skeleton-shimmer min-h-[200px] flex flex-col justify-between shadow-xs">
        <div className="space-y-3 max-w-xl">
          <Skeleton type="rect" className="h-6 w-32 rounded-full" />
          <Skeleton type="heading" className="h-8 sm:h-10 w-4/5 rounded-xl" />
          <Skeleton type="text" className="h-4 w-full rounded" />
          <Skeleton type="text" className="h-4 w-2/3 rounded" />
        </div>
        <div className="flex gap-3 mt-6">
          <Skeleton type="rect" className="h-10 w-32 rounded-xl" />
          <Skeleton type="rect" className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton type="rect" className="h-7 w-48 rounded-xl" />
          <Skeleton type="rect" className="h-5 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-6 h-56 flex flex-col justify-between skeleton-shimmer shadow-xs space-y-3"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Skeleton type="rect" className="h-4 w-16 rounded-full" />
                  <Skeleton type="rect" className="h-4 w-12 rounded" />
                </div>
                <Skeleton type="heading" className="h-5 w-5/6 mb-2 rounded" />
                <Skeleton type="text" className="h-3.5 w-full mb-1 rounded" />
                <Skeleton type="text" className="h-3.5 w-3/4 rounded" />
              </div>
              <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
                <Skeleton type="rect" className="h-4 w-20 rounded" />
                <Skeleton type="rect" className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;

