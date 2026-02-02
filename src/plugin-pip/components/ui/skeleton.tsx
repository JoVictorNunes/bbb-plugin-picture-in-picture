import * as React from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  borderRadius?: number | string;
}

function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  aspectRatio,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    aspectRatio,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
    overflow: 'hidden',
  };

  return (
    <div className="shimmer" style={style} />
  );
}

export default Skeleton;
