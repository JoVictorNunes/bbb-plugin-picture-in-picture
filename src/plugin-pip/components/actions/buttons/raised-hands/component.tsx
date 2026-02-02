import * as React from 'react';
import { CurrentUserData, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import Tooltip from '../../../ui/tooltip';
import { RAISED_HAND_USERS, RaisedHandUsersSubscriptionResponse, RaisedHandUser } from './queries';
import Popover from '../../../ui/popover';
import { SET_RAISE_HAND } from '../../../raised-hands/mutations';
import { Modal, ModalButton } from '../../../ui/modal';

interface RaisedHandsButtonComponentProps {
  pluginApi: PluginApi;
}

interface UserAvatarProps {
  name: string;
  color: string;
  isModerator: boolean;
  position: number;
}

function UserAvatar({
  name, color, isModerator, position,
}: UserAvatarProps) {
  const initials = name.slice(0, 2);

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    flexShrink: 0,
  };

  const avatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: isModerator ? '6px' : '50%',
    backgroundColor: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '16px',
    height: '16px',
    lineHeight: '16px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  };

  return (
    <div style={containerStyles}>
      <div style={avatarStyles}>{initials}</div>
      <div style={badgeStyles}>{position}</div>
    </div>
  );
}

interface RaisedHandUserItemProps {
  user: RaisedHandUser;
  position: number;
  onLowerHand: (userId: string) => void;
  canLower: boolean;
  current: boolean;
}

function RaisedHandUserItem({
  user, position, onLowerHand, canLower, current,
}: RaisedHandUserItemProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const itemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  };

  const nameStyles: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const lowerHandButtonStyles: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  };

  const handleConfirmLowerHand = () => {
    onLowerHand(user.userId);
    setIsModalOpen(false);
  };

  return (
    <>
      <div style={itemStyles}>
        <UserAvatar
          name={user.name}
          color={user.color}
          isModerator={user.isModerator}
          position={position}
        />
        <span style={nameStyles}>{`${user.name} ${current ? '(you)' : ''}`}</span>
        {canLower && (
          <button
            style={lowerHandButtonStyles}
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            Lower
          </button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lower Hand"
        size="sm"
        renderInPortal={false}
        footer={(
          <>
            <ModalButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </ModalButton>
            <ModalButton variant="danger" onClick={handleConfirmLowerHand}>
              Confirm
            </ModalButton>
          </>
        )}
      >
        {current ? (
          <p style={{ margin: 0 }}>
            Are you sure you want to lower your hand
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Are you sure you want to lower
            {' '}
            {user.name}
            &apos;s hand?
          </p>
        )}
      </Modal>
    </>
  );
}

interface RaisedHandsListProps {
  users: RaisedHandUser[];
  onLowerHand: (userId: string) => void;
  currentUser: CurrentUserData;
}

function RaisedHandsList({ users, onLowerHand, currentUser }: RaisedHandsListProps) {
  const containerStyles: React.CSSProperties = {
    minWidth: '200px',
    maxHeight: '70vh',
    overflowY: 'auto',
    padding: '0.5rem 1rem',
    color: '#fff',
  };

  const headerStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const listStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        Raised Hands (
        {users.length}
        )
      </div>
      <div style={listStyles}>
        {users.map((user, index) => (
          <RaisedHandUserItem
            key={user.userId}
            user={user}
            position={index + 1}
            onLowerHand={onLowerHand}
            canLower={currentUser?.presenter || currentUser?.role === 'MODERATOR' || user.userId === currentUser?.userId}
            current={user.userId === currentUser?.userId}
          />
        ))}
      </div>
    </div>
  );
}

function RaisedHandsButtonComponent(
  { pluginApi }: RaisedHandsButtonComponentProps,
): React.ReactNode {
  const {
    data: raisedHandUsers,
  } = pluginApi.useCustomSubscription!<RaisedHandUsersSubscriptionResponse>(RAISED_HAND_USERS);
  const { data: currentUser } = pluginApi.useCurrentUser();
  const raisedHandCount = raisedHandUsers?.user?.length ?? 0;
  const noRaisedHand = raisedHandCount === 0;
  const users = raisedHandUsers?.user ?? [];

  const [setRaiseHand] = pluginApi.useCustomMutation<{
    userId: string;
    raiseHand: boolean;
  }>(SET_RAISE_HAND);

  const lowerUserHand = (userId: string) => {
    setRaiseHand({
      variables: {
        userId,
        raiseHand: false,
      },
    });
  };

  const popoverContent = (
    <RaisedHandsList users={users} onLowerHand={lowerUserHand} currentUser={currentUser} />
  );

  if (noRaisedHand) {
    return (
      <Tooltip content="No raised hand">
        <button
          className="media-btn"
          type="button"
          disabled={noRaisedHand}
          aria-label="No raised hand"
        >
          <i className="icon-bbb-hand" />
        </button>
      </Tooltip>
    );
  }

  return (
    <Popover
      content={popoverContent}
      position="top"
      align="center"
    >
      {({
        disabled, onClick, ref,
      }) => (
        <Tooltip content={`${raisedHandCount} raised hands`}>
          {({
            children, styles, onBlur, onFocus, onMouseEnter, onMouseLeave,
          }) => (
            <button
              className="media-btn"
              type="button"
              ref={ref}
              style={styles}
              {...{
                disabled,
                onClick,
                onMouseEnter,
                onMouseLeave,
                onBlur,
                onFocus,
              }}
            >
              <i className="icon-bbb-hand" />
              <div className="badge">
                <span>
                  {raisedHandCount}
                </span>
              </div>
              {children}
            </button>
          )}
        </Tooltip>
      )}
    </Popover>
  );
}

export default RaisedHandsButtonComponent;
