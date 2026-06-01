'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Bot } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { chatApi } from '@/lib/api';
import { useChatStore } from '@/lib/store';
import { connectSocket } from '@/lib/socket';
import ChatList from '@/components/chat/ChatList';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';

const avatarColors = ['#00d084','#7c3aed','#f59e0b','#3b82f6','#ef4444','#8b5cf6'];
function getAvatarColor(name: string) {
  let h = 0;
  for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function ChatsPage() {
  const searchParams = useSearchParams();
  const initialContact = searchParams.get('contact');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    selectedContact,
    messages,
    typingContacts,
    setSelectedContact,
    addMessage,
    setMessages,
    setTyping,
  } = useChatStore();

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => chatApi.getContacts().then((r) => r.data),
  });

  // Auto-select from URL param
  useEffect(() => {
    if (initialContact && contacts.length) {
      const found = contacts.find((c: any) => c.id === initialContact);
      if (found) setSelectedContact(found);
    }
  }, [initialContact, contacts, setSelectedContact]);

  // Fetch messages when contact selected
  useEffect(() => {
    if (!selectedContact) return;
    chatApi.getMessages(selectedContact.id).then((r) => {
      setMessages(selectedContact.id, r.data.messages || r.data);
    });
  }, [selectedContact?.id]);

  // Socket for real-time messages
  useEffect(() => {
    const socket = connectSocket();
    socket.on('message:new', (data: any) => {
      addMessage(data.contactId, data.message);
      if (data.contactId === selectedContact?.id) {
        setTimeout(() => scrollToBottom(), 100);
      }
    });
    socket.on('ai:typing', (data: any) => {
      setTyping(data.contactId, true);
      setTimeout(() => setTyping(data.contactId, false), 5000);
    });
    socket.on('ai:reply', (data: any) => {
      setTyping(data.contactId, false);
      addMessage(data.contactId, data.message);
    });
    return () => {
      socket.off('message:new');
      socket.off('ai:typing');
      socket.off('ai:reply');
    };
  }, [selectedContact?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[selectedContact?.id ?? '']?.length, typingContacts.size]);

  const handleSend = async () => {
    if (!input.trim() || !selectedContact || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);
    try {
      await chatApi.sendMessage(selectedContact.id, body);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const currentMessages = messages[selectedContact?.id ?? ''] ?? [];
  const isTyping = selectedContact && typingContacts.has(selectedContact.id);

  return (
    <div className="flex h-full">
      {/* Contact List Panel */}
      <div
        className="w-80 flex-shrink-0 flex flex-col"
        style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,20,0.6)',
        }}
      >
        <div
          className="px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
          >
            Conversations
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
            {contacts.length} contacts
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatList
            contacts={contacts}
            selectedId={selectedContact?.id}
            onSelect={setSelectedContact}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div
              className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(10,10,20,0.4)',
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: getAvatarColor(selectedContact.name) }}
              >
                {getInitials(selectedContact.name)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                  {selectedContact.name}
                </p>
                <p className="text-xs flex items-center gap-1" style={{ color: '#475569' }}>
                  {isTyping ? (
                    <span style={{ color: '#00d084' }}>AI is typing...</span>
                  ) : (
                    selectedContact.phone
                  )}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  <Bot size={12} style={{ color: '#a855f7' }} />
                  <span className="text-xs font-medium" style={{ color: '#a855f7' }}>
                    AI Active
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ background: 'rgba(8,8,16,0.4)' }}
            >
              {currentMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: '#334155' }}>
                    No messages yet
                  </p>
                </div>
              ) : (
                <>
                  {currentMessages.map((msg: any) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <AnimatePresence>
                    {isTyping && (
                      <TypingIndicator contactName="AI" />
                    )}
                  </AnimatePresence>
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="px-4 py-3 flex-shrink-0 flex items-center gap-3"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(10,10,20,0.6)',
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: input.trim()
                    ? 'linear-gradient(135deg, #00d084, #00b894)'
                    : 'rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={16} className="text-white" />
              </motion.button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.15)' }}
            >
              <MessageCircle size={36} style={{ color: '#00d084' }} />
            </motion.div>
            <div className="text-center">
              <p
                className="text-lg font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
              >
                Select a Conversation
              </p>
              <p className="text-sm mt-1" style={{ color: '#475569' }}>
                Choose a contact from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
