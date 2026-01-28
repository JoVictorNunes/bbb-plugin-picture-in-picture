import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { RAISED_HAND_USERS, RaisedHandUserSubscriptionResponse } from './queries';
import { SET_RAISE_HAND } from './mutations';
import { useToast } from '../ui/toast';
import { Modal, ModalButton } from '../ui/modal';

interface RaisedHandNotifierProps {
  pluginApi: PluginApi;
}

interface UserAvatarProps {
  name: string;
  color: string;
  isModerator: boolean;
}

function UserAvatar({ name, color, isModerator }: UserAvatarProps) {
  const initials = name.slice(0, 2);

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
    flexShrink: 0,
    textTransform: 'capitalize',
  };

  return <div style={avatarStyles}>{initials}</div>;
}

interface RaisedHandContentProps {
  user: {
    name: string;
    color: string;
    isModerator: boolean;
    raiseHandTime: string;
    userId: string;
  };
  lowerUserHands: (userId: string) => void;
}

function RaisedHandContent({ user, lowerUserHands }: RaisedHandContentProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  };

  const textContainerStyles: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
  };

  const nameStyles: React.CSSProperties = {
    fontWeight: 600,
  };

  const lowerHandButtonStyles: React.CSSProperties = {
    marginTop: '12px',
    padding: '6px 14px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
    width: '100%',
  };

  const handleConfirmLowerHand = () => {
    lowerUserHands(user.userId);
    setIsModalOpen(false);
  };

  return (
    <>
      <div>
        <div style={headerStyles}>
          <UserAvatar name={user.name} color={user.color} isModerator={user.isModerator} />
          <div style={textContainerStyles}>
            <span style={nameStyles}>{user.name}</span>
            &nbsp;
            <span>raised hand</span>
          </div>
        </div>
        <button
          style={lowerHandButtonStyles}
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          Lower User&apos;s Hand
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lower Hand"
        size="sm"
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
        <p style={{ margin: 0 }}>
          Are you sure you want to lower
          {' '}
          {user.name}
          &apos;s hand?
        </p>
      </Modal>
    </>
  );
}

function RaisedHandNotifier({ pluginApi }: RaisedHandNotifierProps): React.ReactNode {
  const cursor = React.useRef(new Date().toISOString());
  const {
    data: raisedHandUsersData,
  } = pluginApi.useCustomSubscription!<RaisedHandUserSubscriptionResponse>(RAISED_HAND_USERS, {
    variables: {
      cursor: cursor.current,
    },
  });
  const raisedHands = raisedHandUsersData?.user ?? [];
  const { showToast, hideToast, toasts } = useToast();
  const previousRaisedHandsRef = React.useRef<Set<string>>(new Set());

  const [setRaiseHand] = pluginApi.useCustomMutation<{
    userId: string;
    raiseHand: boolean;
  }>(SET_RAISE_HAND);

  const lowerUserHands = (userId: string) => {
    setRaiseHand({
      variables: {
        userId,
        raiseHand: false,
      },
    });
    const toastToRemove = toasts.find((toast) => toast.id.includes(userId));
    if (toastToRemove) {
      hideToast(toastToRemove.id);
    }
  };

  React.useEffect(() => {
    const currentRaisedHandIds = new Set(raisedHands.map((user) => user.userId));
    const previousRaisedHandIds = previousRaisedHandsRef.current;

    // Find new raised hands
    const newRaisedHands = raisedHands.filter(
      (user) => !previousRaisedHandIds.has(user.userId),
    );

    // Find removed raised hands
    const removedUserIds = Array.from(previousRaisedHandIds).filter(
      (userId) => !currentRaisedHandIds.has(userId),
    );

    // Show toasts for new raised hands
    newRaisedHands.forEach((user) => {
      showToast(
        <RaisedHandContent user={user} lowerUserHands={lowerUserHands} />,
        'default',
        10000, // 10 seconds duration
        true, // Dismissible by user
        user.userId,
      );
    });

    // Hide toasts for users who lowered their hands
    removedUserIds.forEach((userId) => {
      // Find and remove the corresponding toast
      const toastToRemove = toasts.find((toast) => toast.id.includes(userId));
      if (toastToRemove) {
        hideToast(toastToRemove.id);
      }
    });

    // Update the ref
    previousRaisedHandsRef.current = currentRaisedHandIds;
  }, [raisedHands, showToast, hideToast, toasts]);

  return null;
}

export default RaisedHandNotifier;
