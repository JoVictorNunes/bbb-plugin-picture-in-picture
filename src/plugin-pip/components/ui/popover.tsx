import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { usePipWindow } from '../contexts/pip-window';

type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
type PopoverTrigger = 'click' | 'hover';
type PopoverAlign = 'start' | 'center' | 'end';

interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactNode | ((props : {
    ref: React.MutableRefObject<HTMLButtonElement>,
    onClick: React.MouseEventHandler<HTMLButtonElement>,
    onMouseEnter: React.MouseEventHandler<HTMLButtonElement>,
    onMouseLeave: React.MouseEventHandler<HTMLButtonElement>,
    disabled: boolean;
  }) => React.ReactNode);
  position?: PopoverPosition;
  align?: PopoverAlign;
  trigger?: PopoverTrigger;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  showArrow?: boolean;
  offset?: number;
  hoverDelay?: number;
  hoverCloseDelay?: number;
  disabled?: boolean;
  portalContainer?: HTMLElement;
}

export default function Popover({
  content,
  children,
  position = 'bottom',
  align = 'center',
  trigger = 'click',
  open: controlledOpen,
  onOpenChange,
  closeOnClickOutside = true,
  closeOnEscape = true,
  showArrow = true,
  offset = 8,
  hoverDelay = 100,
  hoverCloseDelay = 150,
  disabled = false,
  portalContainer,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 });

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const pipWindow = usePipWindow();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (disabled && newOpen) return;

    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [disabled, isControlled, onOpenChange]);

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const arrowSize = showArrow ? 8 : 0;
    const totalOffset = offset + arrowSize;

    let top = 0;
    let left = 0;

    // Calculate position based on placement
    switch (position) {
      case 'top':
        top = triggerRect.top - popoverRect.height - totalOffset;
        break;
      case 'bottom':
        top = triggerRect.bottom + totalOffset;
        break;
      case 'left':
        left = triggerRect.left - popoverRect.width - totalOffset;
        break;
      case 'right':
        left = triggerRect.right + totalOffset;
        break;
      default:
        break;
    }

    // Calculate alignment
    if (position === 'top' || position === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          break;
        case 'end':
          left = triggerRect.right - popoverRect.width;
          break;
        default:
          break;
      }
    } else {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          break;
        case 'end':
          top = triggerRect.bottom - popoverRect.height;
          break;
        default:
          break;
      }
    }

    // Viewport boundary detection
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, viewportWidth - popoverRect.width - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - popoverRect.height - padding));

    setPopoverPosition({ top, left });
  }, [position, align, offset, showArrow]);

  // Update position when open or content changes
  React.useEffect(() => {
    if (isOpen) {
      // Delay calculation to allow popover to render
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isOpen, content, calculatePosition]);

  // Recalculate on scroll/resize
  React.useEffect(() => {
    if (!isOpen) return undefined;

    const handleUpdate = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, calculatePosition]);

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current
        && !triggerRef.current.contains(target)
        && popoverRef.current
        && !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    pipWindow.document.addEventListener('mousedown', handleClickOutside);
    return () => pipWindow.document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside, setOpen]);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen || !closeOnEscape) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    pipWindow.document.addEventListener('keydown', handleEscape);
    return () => pipWindow.document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, setOpen]);

  // Cleanup timeouts
  React.useEffect(() => () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }, []);

  const handleTriggerClick = () => {
    if (trigger === 'click') {
      setOpen(!isOpen);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (trigger === 'click' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger !== 'hover') return;

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, hoverDelay);
  };

  const handleMouseLeave = () => {
    if (trigger !== 'hover') return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, hoverCloseDelay);
  };

  const handlePopoverMouseEnter = () => {
    if (trigger !== 'hover') return;

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (trigger !== 'hover') return;

    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, hoverCloseDelay);
  };

  const getPopoverStyles = (): React.CSSProperties => ({
    position: 'fixed',
    top: popoverPosition.top,
    left: popoverPosition.left,
    backgroundColor: '#303030',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'opacity 0.15s ease-in-out, visibility 0.15s ease-in-out',
    minWidth: '120px',
    maxWidth: '320px',
  });

  const getArrowStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    const arrowSize = 8;

    const getAlignmentOffset = (): string => {
      switch (align) {
        case 'start':
          return '16px';
        case 'end':
          return 'calc(100% - 24px)';
        case 'center':
        default:
          return '50%';
      }
    };

    const arrowStyles: Record<PopoverPosition, React.CSSProperties> = {
      top: {
        top: '100%',
        left: getAlignmentOffset(),
        transform: 'translateX(-50%)',
        borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
        borderColor: '#303030 transparent transparent transparent',
        filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))',
      },
      bottom: {
        bottom: '100%',
        left: getAlignmentOffset(),
        transform: 'translateX(-50%)',
        borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
        borderColor: 'transparent transparent #303030 transparent',
        filter: 'drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.05))',
      },
      left: {
        left: '100%',
        top: getAlignmentOffset(),
        transform: 'translateY(-50%)',
        borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
        borderColor: 'transparent transparent transparent #303030',
        filter: 'drop-shadow(2px 0 2px rgba(0, 0, 0, 0.1))',
      },
      right: {
        right: '100%',
        top: getAlignmentOffset(),
        transform: 'translateY(-50%)',
        borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
        borderColor: 'transparent #303030 transparent transparent',
        filter: 'drop-shadow(-2px 0 2px rgba(0, 0, 0, 0.1))',
      },
    };

    return { ...baseStyles, ...arrowStyles[position] };
  };

  const triggerStyles: React.CSSProperties = {
    display: 'inline-block',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    color: 'inherit',
    textAlign: 'inherit',
  };

  const popoverContent = isOpen && (
    <div
      ref={popoverRef}
      style={getPopoverStyles()}
      onMouseEnter={handlePopoverMouseEnter}
      onMouseLeave={handlePopoverMouseLeave}
      role="dialog"
      aria-modal="false"
    >
      {content}
      {showArrow && <div style={getArrowStyles()} />}
    </div>
  );

  const portalTarget = portalContainer || pipWindow.document.body;

  return (
    <>
      {typeof children === 'function' ? children({
        disabled,
        onClick: handleTriggerClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        ref: triggerRef,
      }) : (
        <button
          type="button"
          ref={triggerRef}
          style={triggerStyles}
          onClick={handleTriggerClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          disabled={disabled}
        >
          {children}
        </button>
      )}
      {ReactDOM.createPortal(popoverContent, portalTarget)}
    </>
  );
}

// Compound components for more flexible usage
interface PopoverHeaderProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function PopoverHeader({ children, style }: PopoverHeaderProps) {
  const headerStyles: React.CSSProperties = {
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '8px',
    color: '#1a1a1a',
    ...style,
  };

  return <div style={headerStyles}>{children}</div>;
}

interface PopoverBodyProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function PopoverBody({ children, style }: PopoverBodyProps) {
  const bodyStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#4a4a4a',
    lineHeight: 1.5,
    ...style,
  };

  return <div style={bodyStyles}>{children}</div>;
}

interface PopoverFooterProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function PopoverFooter({ children, style }: PopoverFooterProps) {
  const footerStyles: React.CSSProperties = {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    ...style,
  };

  return <div style={footerStyles}>{children}</div>;
}

interface PopoverCloseButtonProps {
  onClose: () => void;
  style?: React.CSSProperties;
}

export function PopoverCloseButton({ onClose, style }: PopoverCloseButtonProps) {
  const buttonStyles: React.CSSProperties = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'background-color 0.15s ease',
    ...style,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      type="button"
      style={{
        ...buttonStyles,
        backgroundColor: isHovered ? '#f0f0f0' : 'transparent',
      }}
      onClick={onClose}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Close popover"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

Popover.Header = PopoverHeader;
Popover.Body = PopoverBody;
Popover.Footer = PopoverFooter;
Popover.CloseButton = PopoverCloseButton;
