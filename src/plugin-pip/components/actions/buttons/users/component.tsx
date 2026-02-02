import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { USER_AGGREGATE_COUNT_SUBSCRIPTION, UsersCountSubscriptionResponse } from './queries';
import Tooltip from '../../../ui/tooltip';

interface UsersBadgeComponentProps {
  pluginApi: PluginApi;
}

function UsersBadgeComponent({ pluginApi }: UsersBadgeComponentProps): React.ReactNode {
  const { data } = pluginApi.useCustomSubscription!<UsersCountSubscriptionResponse>(
    USER_AGGREGATE_COUNT_SUBSCRIPTION,
  );
  const numOfUsers = data?.user_aggregate?.aggregate?.count ?? 0;

  return (
    <Tooltip content={`${numOfUsers} user${numOfUsers !== 1 ? 's' : ''} in the meeting`}>
      {({ styles, children, ...props }) => (
        <button
          {...props}
          type="button"
          style={{
            ...styles,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.35rem 0.6rem',
            borderRadius: '1rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            userSelect: 'none',
            border: 'none',
          }}
        >
          <i className="icon-bbb-user" />
          <span>{numOfUsers}</span>
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default UsersBadgeComponent;
