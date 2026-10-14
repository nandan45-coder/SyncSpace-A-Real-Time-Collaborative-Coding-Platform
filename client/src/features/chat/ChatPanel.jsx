import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { chatService } from '../../services';
import { TbSend, TbArrowBackUp, TbTrash, TbMoodSmile, TbX, TbMessageCircle, TbWifiOff } from 'react-icons/tb';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export default function ChatPanel() {
  const { messages, setMessages, addMessage, removeMessage, typingUsers, reset } = useChatStore();
  const { currentRoom, members } = useRoomStore();
  const { emitChatMessage, emitChatSeen, emitTypingStart, emitTypingStop, isConnected } = useSocket();
  const { user } = useAuthStore();
  const { theme } = useUIStore();
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!currentRoom) return;

    // Chat history is now loaded via ROOM_JOINED socket event in SocketContext
    emitChatSeen(currentRoom._id);

    // Do not reset chat history on unmount, otherwise messages disappear when closing the sidebar.
    return () => {};
  }, [currentRoom?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    emitChatMessage(currentRoom._id, content, 'text', replyTo?._id);
    setContent('');
    setReplyTo(null);
    setEmojiOpen(false);
    emitTypingStop(currentRoom._id);
  };

  const handleInputChange = (e) => {
    setContent(e.target.value);
    emitTypingStart(currentRoom._id);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(currentRoom._id);
    }, 2000);
  };

  const handleDelete = async (msgId) => {
    try {
      await chatService.deleteMessage(msgId);
      removeMessage(msgId);
    } catch (err) {
      toast.error('Failed to delete message.');
    }
  };

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setEmojiOpen(false);
  };

  const isMine = (msg) => msg.sender?._id === user?._id || msg.sender?._id === user?.id;
  const memberCount = members?.length || 0;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="panel-header flex-shrink-0 justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <TbMessageCircle size={18} className="text-accent-text flex-shrink-0" />
          <span className="text-[14px] font-semibold text-fg">Chat</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 t-meta ${isConnected ? '' : '!text-warning-text'}`} role="status">
          <span className={`status-dot ${isConnected ? 'is-online' : 'is-warning'} !w-1.5 !h-1.5`} aria-hidden="true" />
          {isConnected ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : 'Reconnecting'}
        </span>
      </div>

      {!isConnected && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-[12px] bg-warning/10 text-warning-text border-b border-line">
          <TbWifiOff size={14} className="flex-shrink-0" />
          Connection lost. New messages will appear once you're back online.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="empty-icon mb-3"><TbMessageCircle size={24} /></div>
            <p className="text-[14px] font-semibold text-fg">No messages yet</p>
            <p className="t-meta mt-1">Say hello to everyone in this space.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSystem = msg.type === 'system';
            if (isSystem) {
              return (
                <div key={msg._id} className="flex items-center gap-3 my-3 px-1">
                  <span className="flex-1 border-t border-line" />
                  <span className="t-meta text-center">{msg.content}</span>
                  <span className="flex-1 border-t border-line" />
                </div>
              );
            }

            const prev = messages[idx - 1];
            const grouped = prev
              && prev.type !== 'system'
              && !msg.replyTo
              && prev.sender?._id === msg.sender?._id
              && new Date(msg.createdAt) - new Date(prev.createdAt) < GROUP_WINDOW_MS;
            const mine = isMine(msg);

            return (
              <div
                key={msg._id}
                className={`group relative flex gap-2.5 rounded-md px-2 ${grouped ? 'py-0.5' : 'pt-2.5 pb-0.5 mt-1'} hover:bg-hover/60 focus-within:bg-hover/60 transition-colors`}
              >
                {/* Avatar column */}
                <div className="w-8 flex-shrink-0">
                  {!grouped && <Avatar name={msg.sender.name} src={msg.sender.avatar} size="sm" />}
                </div>

                <div className="flex-1 min-w-0">
                  {!grouped && (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-[13px] font-semibold truncate ${mine ? 'text-accent-text' : 'text-fg'}`}>
                        {mine ? 'You' : msg.sender.name}
                      </span>
                      <span className="text-[11px] text-fg-muted flex-shrink-0">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Reply context */}
                  {msg.replyTo && (
                    <div className="mt-1 mb-1 pl-2.5 border-l-2 border-accent/60 text-[12px] text-fg-secondary flex items-center gap-1.5 min-w-0">
                      <TbArrowBackUp size={12} className="flex-shrink-0" />
                      <span className="font-semibold text-fg flex-shrink-0">{msg.replyTo.sender.name}</span>
                      <span className="truncate">{msg.replyTo.content}</span>
                    </div>
                  )}

                  <p className={`text-[13.5px] leading-[1.5] break-words whitespace-pre-wrap ${msg.isDeleted ? 'italic text-fg-muted' : 'text-fg'} ${mine && !msg.isDeleted ? 'pl-2 border-l-2 border-accent/40' : ''}`}>
                    {msg.content}
                  </p>
                </div>

                {/* Actions */}
                {!msg.isDeleted && (
                  <div className="absolute -top-2 right-2 hidden group-hover:flex group-focus-within:flex items-center gap-0.5 p-0.5 rounded-md bg-raised border border-line shadow-md">
                    <button
                      type="button"
                      onClick={() => setReplyTo(msg)}
                      className="btn-icon btn-icon-xs"
                      aria-label={`Reply to ${msg.sender.name}`}
                      data-tip="Reply"
                      data-tip-pos="left"
                    >
                      <TbArrowBackUp size={14} />
                    </button>
                    {(msg.sender._id === user?._id || msg.sender._id === user?.id) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(msg._id)}
                        className="btn-icon btn-icon-xs is-danger"
                        aria-label="Delete message"
                        data-tip="Delete"
                        data-tip-pos="left"
                      >
                        <TbTrash size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <div className="h-5 px-4 flex-shrink-0" aria-live="polite">
        {typingUsers.length > 0 && (
          <p className="text-[11.5px] text-fg-muted truncate flex items-center gap-1.5">
            <span className="inline-flex gap-0.5" aria-hidden="true">
              <span className="w-1 h-1 rounded-full bg-fg-muted animate-pulse" />
              <span className="w-1 h-1 rounded-full bg-fg-muted animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-1 rounded-full bg-fg-muted animate-pulse [animation-delay:300ms]" />
            </span>
            {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </p>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="flex-shrink-0 px-3 pb-3 pt-1 relative">
        <div className="rounded-lg border border-line-strong bg-panel focus-within:border-accent focus-within:shadow-focus transition-[border-color,box-shadow]">
          {replyTo && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-line text-[12px]">
              <div className="flex items-center gap-1.5 min-w-0 text-fg-secondary">
                <TbArrowBackUp size={14} className="text-accent-text flex-shrink-0" />
                <span className="truncate">Replying to <span className="font-semibold text-fg">{replyTo.sender.name}</span></span>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} className="btn-icon btn-icon-xs" aria-label="Cancel reply">
                <TbX size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 p-1.5">
            <button
              type="button"
              onClick={() => setEmojiOpen(!emojiOpen)}
              aria-label="Insert emoji"
              aria-expanded={emojiOpen}
              className={`btn-icon btn-icon-sm ${emojiOpen ? 'is-active' : ''}`}
            >
              <TbMoodSmile size={19} />
            </button>

            <label htmlFor="chat-input" className="sr-only">Message</label>
            <input
              id="chat-input"
              type="text"
              placeholder="Message the space…"
              value={content}
              onChange={handleInputChange}
              autoComplete="off"
              className="flex-1 min-w-0 h-8 bg-transparent border-0 outline-none text-[13.5px] text-fg placeholder:text-fg-muted focus:ring-0"
            />

            <button
              type="submit"
              disabled={!content.trim()}
              aria-label="Send message"
              className="w-8 h-8 rounded-md flex items-center justify-center bg-accent-solid text-accent-on transition-opacity disabled:opacity-35 disabled:cursor-not-allowed hover:bg-accent-hover"
            >
              <TbSend size={16} />
            </button>
          </div>
        </div>

        {emojiOpen && (
          <div className="absolute bottom-full left-3 mb-2 z-50 shadow-lg rounded-lg overflow-hidden">
            <EmojiPicker onEmojiClick={onEmojiClick} theme={theme === 'dark' ? 'dark' : 'light'} width={300} height={380} />
          </div>
        )}
      </form>
    </div>
  );
}
