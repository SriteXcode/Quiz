import React from 'react';

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

export default Skeleton;
