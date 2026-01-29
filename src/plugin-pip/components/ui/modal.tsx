import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { usePipWindow } from '../contexts/pip-window';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  renderInPortal?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  renderInPortal = true,
}: ModalProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const pipWindow = usePipWindow();

  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus trap
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      document.body.style.overflow = '';

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!closeOnEscape) return undefined;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    const sizes = {
      sm: { maxWidth: '400px' },
      md: { maxWidth: '600px' },
      lg: { maxWidth: '800px' },
      xl: { maxWidth: '1200px' },
    };
    return sizes[size];
  };

  if (!isOpen && !isAnimating) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    opacity: isOpen ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#303030',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
    opacity: isOpen ? 1 : 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    ...getSizeStyles(),
  };

  const headerStyle: React.CSSProperties = {
    padding: '1rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.025em',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    fontSize: '24px',
    lineHeight: '1',
    width: '36px',
    height: '36px',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    color: '#fff',
    fontSize: '16px',
    lineHeight: '1.6',
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 24px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0,
  };

  const modalContent = (
    <div
      style={overlayStyle}
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleOverlayClick(e as unknown as React.MouseEvent);
        }
      }}
      role="presentation"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div ref={modalRef} style={modalStyle} role="dialog" aria-modal="true">
        {(title || showCloseButton) && (
        <div style={headerStyle}>
          {title && (
          <h2 id="modal-title" style={titleStyle}>
            {title}
          </h2>
          )}
          {showCloseButton && (
          <button
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
          )}
        </div>
        )}
        <div style={bodyStyle} className="modal-body">
          {children}
        </div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );

  return renderInPortal ? ReactDOM.createPortal(
    modalContent,
    pipWindow.document.getElementById('modals-root') as HTMLElement,
  ) : modalContent;
}

// Button components for use in modal footer
interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function ModalButton({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const variants = {
    primary: {
      backgroundColor: isHovered && !disabled ? '#2563eb' : '#3b82f6',
      color: '#ffffff',
      boxShadow: isHovered && !disabled ? '0 4px 12px rgba(59, 130, 246, 0.4)' : '0 2px 8px rgba(59, 130, 246, 0.2)',
    },
    secondary: {
      backgroundColor: isHovered && !disabled ? '#f3f4f6' : '#ffffff',
      color: '#374151',
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
    },
    danger: {
      backgroundColor: isHovered && !disabled ? '#dc2626' : '#ef4444',
      color: '#ffffff',
      boxShadow: isHovered && !disabled ? '0 4px 12px rgba(239, 68, 68, 0.4)' : '0 2px 8px rgba(239, 68, 68, 0.2)',
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variants[variant] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}
