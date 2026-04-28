import * as React from 'react';
import { usePipWindow } from './pip-window';

interface Rect {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface LayoutContext {
  content: Rect;
  actions: Rect;
  screenshareFocused: boolean;
  toggleScreenshareFocus: () => void;
  canFocusScreenshare: boolean;
}

const LayoutContext = React.createContext<LayoutContext>(null);

export function useLayoutContext(): LayoutContext {
  const layout = React.useContext(LayoutContext);
  if (!layout) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return layout;
}

interface LayoutProviderProps {
  children: React.ReactNode;
  hasScreenshare?: boolean;
  hasCameras?: boolean;
  presenter?: boolean;
  moderator?: boolean;
}

export function LayoutProvider({
  children, hasScreenshare, hasCameras, presenter, moderator,
}: LayoutProviderProps) {
  const pipWindow = usePipWindow();
  const [screenshareFocused, setScreenshareFocused] = React.useState<boolean | null>(null);
  const [layout, setLayout] = React.useState<Pick<LayoutContext, 'content' | 'actions'> | null>(null);

  const loading = [hasCameras, hasScreenshare, presenter, moderator].some((v) => v == null);
  const initialFocused = (presenter || moderator) && hasScreenshare && hasCameras;

  React.useEffect(() => {
    if (!loading && screenshareFocused === null && typeof initialFocused === 'boolean') {
      setScreenshareFocused(initialFocused);
    }
  }, [initialFocused]);

  React.useEffect(() => {
    if (typeof hasScreenshare === 'boolean' && !hasScreenshare) {
      setScreenshareFocused(false);
    }
  }, [hasScreenshare]);

  React.useEffect(() => {
    // Take undefined states into account in order to block UI rendering
    // until we know there are webcams/screenshare or not.
    if (hasCameras == null || hasScreenshare == null) return undefined;

    const handleResize = () => {
      const width = pipWindow.innerWidth;
      const height = pipWindow.innerHeight;

      const actionsHeight = 56;
      const actionsRect: Rect = {
        x: 0,
        y: height - actionsHeight,
        width,
        height: actionsHeight,
      };

      const availableHeight = height - actionsHeight;

      const contentRect: Rect = {
        x: 0,
        y: 0,
        width,
        height: availableHeight,
      };

      setLayout((prev) => ({
        ...prev,
        actions: actionsRect,
        content: contentRect,
      }));
    };

    handleResize();

    pipWindow.addEventListener('resize', handleResize);
    return () => {
      pipWindow.removeEventListener('resize', handleResize);
    };
  }, [pipWindow, hasScreenshare, hasCameras]);

  const value = React.useMemo(
    () => (layout ? {
      ...layout,
      screenshareFocused,
      canFocusScreenshare: hasCameras && hasScreenshare,
      toggleScreenshareFocus: () => setScreenshareFocused((v) => !v),
    } : null),
    [layout, screenshareFocused, hasCameras, hasScreenshare],
  );

  return value ? (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  ) : null;
}
