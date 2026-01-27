import * as React from 'react';
import { usePipWindow } from './pip-window';

interface Rect {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface LayoutContext {
  cameras: Rect;
  screenshare: Rect;
  actions: Rect;
  swapped: boolean;
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
  hasScreenshare: boolean;
  hasCameras: boolean;
  presenter: boolean;
  moderator: boolean;
}

export function LayoutProvider({
  children, hasScreenshare, hasCameras, presenter, moderator,
}: LayoutProviderProps) {
  const pipWindow = usePipWindow();
  const [swapped, setSwapped] = React.useState(
    (presenter || moderator) && hasScreenshare && hasCameras,
  );
  const [layout, setLayout] = React.useState<Omit<LayoutContext, 'swapped'> | null>(null);

  React.useEffect(() => {
    setSwapped((presenter || moderator) && hasScreenshare && hasCameras);
  }, [presenter, moderator, hasScreenshare, hasCameras]);

  React.useEffect(() => {
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

      let screenshareRect: Rect = {
        x: 0, y: 0, width: 0, height: 0,
      };
      let camerasRect: Rect = {
        x: 0, y: 0, width: 0, height: 0,
      };

      if (hasScreenshare && hasCameras) {
        screenshareRect = {
          x: 0,
          y: 0,
          width: width * 0.7,
          height: availableHeight,
        };
        camerasRect = {
          x: width * 0.7,
          y: 0,
          width: width * 0.3,
          height: availableHeight,
        };
      } else if (hasScreenshare) {
        screenshareRect = {
          x: 0,
          y: 0,
          width,
          height: availableHeight,
        };
      } else if (hasCameras) {
        camerasRect = {
          x: 0,
          y: 0,
          width,
          height: availableHeight,
        };
      }

      if (swapped) {
        // Swap screenshare and cameras for presenter view
        const temp = screenshareRect;
        screenshareRect = camerasRect;
        camerasRect = temp;
      }

      setLayout({
        actions: actionsRect,
        screenshare: screenshareRect,
        cameras: camerasRect,
      });
    };

    handleResize();

    pipWindow.addEventListener('resize', handleResize);
    return () => {
      pipWindow.removeEventListener('resize', handleResize);
    };
  }, [pipWindow, hasScreenshare, hasCameras, swapped]);

  const value = React.useMemo(() => (layout ? { ...layout, swapped } : null), [layout, swapped]);

  if (!layout?.actions || !layout?.screenshare || !layout?.cameras) {
    return null;
  }

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}
