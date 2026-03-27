import * as React from 'react';
import { defineMessages, IntlShape } from 'react-intl';
import Tooltip from '../../../ui/tooltip';
import { useLayoutContext } from '../../../contexts/layout';

export const intlMessages = defineMessages({
  focusScreenshare: {
    id: 'plugin.layout.button.focusScreenshare',
    defaultMessage: 'Focus screenshare',
  },
  unfocusScreenshare: {
    id: 'plugin.layout.button.unfocusScreenshare',
    defaultMessage: 'Unfocus screenshare',
  },
});

interface LayoutButtonComponentProps {
  intl: IntlShape;
}

function LayoutButtonComponent({ intl }: LayoutButtonComponentProps) {
  const { toggleScreenshareFocus, canFocusScreenshare, screenshareFocused } = useLayoutContext();

  if (!canFocusScreenshare) return null;

  const className = ['media-btn'];
  const label = intl.formatMessage(
    screenshareFocused ? intlMessages.unfocusScreenshare : intlMessages.focusScreenshare,
  );

  return (
    <Tooltip content={label}>
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className={className.join(' ')}
          type="button"
          onClick={toggleScreenshareFocus}
          style={styles}
        >
          <span className="sr-only">
            {label}
          </span>
          <i className="icon-bbb-refresh" />
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default LayoutButtonComponent;
