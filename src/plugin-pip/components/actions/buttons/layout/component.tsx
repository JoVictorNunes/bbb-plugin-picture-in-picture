import * as React from 'react';
import Tooltip from '../../../ui/tooltip';
import { useLayoutContext } from '../../../contexts/layout';

function LayoutButtonComponent() {
  const { swap, canSwap } = useLayoutContext();

  if (!canSwap) return null;

  const className = ['media-btn'];

  return (
    <Tooltip content="Swap layout">
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className={className.join(' ')}
          type="button"
          onClick={swap}
          style={styles}
        >
          <span className="sr-only">
            Swap layout
          </span>
          <i className="icon-bbb-refresh" />
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default LayoutButtonComponent;
