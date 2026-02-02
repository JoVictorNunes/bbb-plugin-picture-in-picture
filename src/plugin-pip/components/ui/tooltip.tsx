import * as React from 'react';

interface TooltipRenderProps {
  onFocus: () => void;
  onBlur: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  styles: React.CSSProperties;
  children: React.ReactNode;
}

type RenderChildren = React.ReactNode | ((props: TooltipRenderProps) => React.ReactNode)

interface TooltipProps {
  content: React.ReactNode;
  children: RenderChildren;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
}: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  const handleFocus = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(true);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  const getTooltipStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: '#333',
      color: '#fff',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '14px',
      whiteSpace: 'nowrap',
      zIndex: 1000,
      pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      transition: 'opacity 0.2s ease-in-out',
    };

    const positionStyles: Record<string, React.CSSProperties> = {
      top: {
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
      },
      bottom: {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
      },
      left: {
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        marginRight: '8px',
      },
      right: {
        left: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        marginLeft: '8px',
      },
    };

    return { ...baseStyles, ...positionStyles[position] };
  };

  const getArrowStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    const arrowStyles: Record<string, React.CSSProperties> = {
      top: {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '6px 6px 0 6px',
        borderColor: '#333 transparent transparent transparent',
      },
      bottom: {
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '0 6px 6px 6px',
        borderColor: 'transparent transparent #333 transparent',
      },
      left: {
        left: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '6px 0 6px 6px',
        borderColor: 'transparent transparent transparent #333',
      },
      right: {
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '6px 6px 6px 0',
        borderColor: 'transparent #333 transparent transparent',
      },
    };

    return { ...baseStyles, ...arrowStyles[position] };
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
  };

  const contentElement = (
    <div style={getTooltipStyles()}>
      {content}
      <div style={getArrowStyles()} />
    </div>
  );

  if (typeof children === 'function') {
    const element = children({
      children: contentElement,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      styles: containerStyles,
    });
    return element;
  }

  return (
    <div
      style={containerStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {contentElement}
    </div>
  );
}

Tooltip.defaultProps = {
  position: 'top',
  delay: 200,
};
