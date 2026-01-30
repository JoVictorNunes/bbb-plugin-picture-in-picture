import * as React from 'react';
import Tooltip from '../../../ui/tooltip';
import { useLayoutContext } from '../../../contexts/layout';

function LayoutButtonComponent() {
  const { swap, canSwap } = useLayoutContext();

  if (!canSwap) return null;

  const className = ['media-btn'];

  return (
    <Tooltip content="Swap layout">
      <button
        className={className.join(' ')}
        type="button"
        onClick={swap}
      >
        <span className="sr-only">
          Swap layout
        </span>
        <i className="icon-bbb-refresh" />
      </button>
    </Tooltip>
  );
}

export default LayoutButtonComponent;
