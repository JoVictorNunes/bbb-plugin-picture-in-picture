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
  contentFocused: boolean;
  toggleContentFocus: () => void;
  canFocusContent: boolean;
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
  hasPresentation?: boolean;
  presenter?: boolean;
  moderator?: boolean;
}

export function LayoutProvider({
  children, hasScreenshare, hasCameras, hasPresentation, presenter, moderator,
}: LayoutProviderProps) {
  const pipWindow = usePipWindow();
  const [contentFocused, setContentFocused] = React.useState<boolean | null>(null);
  const [layout, setLayout] = React.useState<Pick<LayoutContext, 'content' | 'actions'> | null>(null);

  const loading = [
    hasCameras, hasScreenshare, hasPresentation, presenter, moderator,
  ].some((v) => v == null);
  const initialFocused = (presenter || moderator)
    && (hasScreenshare || hasPresentation)
    && hasCameras;

  React.useEffect(() => {
    if (!loading && contentFocused === null && typeof initialFocused === 'boolean') {
      setContentFocused(initialFocused);
    }
  }, [loading, contentFocused, initialFocused]);

  React.useEffect(() => {
    if (typeof hasScreenshare === 'boolean'
      && typeof hasPresentation === 'boolean'
      && !hasScreenshare
      && !hasPresentation) {
      setContentFocused(false);
    }
  }, [hasScreenshare, hasPresentation]);

  React.useEffect(() => {
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

  const value = React.useMemo<LayoutContext | null>(
    () => (layout ? {
      ...layout,
      contentFocused: Boolean(contentFocused),
      canFocusContent: Boolean(hasCameras && (hasScreenshare || hasPresentation)),
      toggleContentFocus: () => setContentFocused((v) => !v),
    } : null),
    [layout, contentFocused, hasCameras, hasScreenshare, hasPresentation],
  );

  return value ? (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  ) : null;
}
