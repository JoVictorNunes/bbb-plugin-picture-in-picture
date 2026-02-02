import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { useToast } from '../ui/toast';
import { CHAT_MESSAGE_STREAM, type ChatMessageStreamResponse, type Message } from './queries';

interface ChatNotifierProps {
  pluginApi: PluginApi;
}

interface ChatMessageToastProps {
  message: Message;
}

function ChatMessageToast({ message }: ChatMessageToastProps): React.ReactElement {
  const getRoleColor = (role: string | null): string => {
    const roleColors: Record<string, string> = {
      MODERATOR: '#3b82f6',
      VIEWER: '#8b5cf6',
    };
    return role ? (roleColors[role] || '#6b7280') : '#6b7280';
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '100%',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const avatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: message.senderRole === 'VIEWER' ? '50%' : '0.5rem',
    backgroundColor: getRoleColor(message.senderRole),
    textTransform: 'capitalize',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
  };

  const nameStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const messageStyles: React.CSSProperties = {
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'rgba(255, 255, 255, 0.95)',
    wordBreak: 'break-word',
    maxHeight: '60px',
    overflow: 'auto',
  };

  const footerStyles: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  };

  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name.substring(0, 2);
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={avatarStyles}>
          {getInitials(message.senderName)}
        </div>
        <div style={nameStyles}>
          {message.senderName || 'Unknown User'}
        </div>
        {message.createdAt && (
          <div style={footerStyles}>
            {formatTime(message.createdAt)}
          </div>
        )}
      </div>
      {/* eslint-disable-next-line react/no-danger */}
      <div style={messageStyles} dangerouslySetInnerHTML={{ __html: message.messageAsHtml }} />
    </div>
  );
}

function ChatNotifier({ pluginApi }: ChatNotifierProps): React.ReactNode {
  const cursor = React.useRef(new Date());
  const { showToast } = useToast();
  const {
    data: chatMessageStream,
  } = pluginApi.useCustomSubscription<ChatMessageStreamResponse>(
    CHAT_MESSAGE_STREAM,
    {
      variables: {
        createdAt: cursor.current.toISOString(),
      },
    },
  );

  React.useEffect(() => {
    if (!chatMessageStream?.chat_message_stream) return;
    chatMessageStream.chat_message_stream.forEach((msg) => {
      showToast(<ChatMessageToast message={msg} />, 'default', 10000);
    });
  }, [chatMessageStream, showToast]);

  return null;
}

export default ChatNotifier;
