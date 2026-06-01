'use client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Bot, Check, CheckCheck, Image, Mic } from 'lucide-react';

interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type?: string;
  hasMedia?: boolean;
  isAI?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.fromMe;
  const time = format(new Date(message.timestamp * 1000), 'HH:mm');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex mb-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] lg:max-w-[60%] relative group`}
        style={{ minWidth: 80 }}
      >
        {/* AI badge */}
        {isOutgoing && message.isAI !== false && (
          <div
            className="flex items-center gap-1 mb-1 justify-end"
          >
            <Bot size={10} style={{ color: '#7c3aed' }} />
            <span className="text-xs" style={{ color: '#7c3aed', fontSize: '10px' }}>
              AI Reply
            </span>
          </div>
        )}

        {/* Bubble */}
        <div
          className="rounded-2xl px-4 py-2.5 relative"
          style={
            isOutgoing
              ? {
                  background: 'linear-gradient(135deg, #00d084, #00b894)',
                  borderBottomRightRadius: 4,
                  boxShadow: '0 2px 12px rgba(0,208,132,0.25)',
                }
              : {
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderBottomLeftRadius: 4,
                }
          }
        >
          {/* Media indicator */}
          {message.hasMedia && (
            <div className="flex items-center gap-2 mb-1">
              {message.type === 'audio' ? (
                <Mic size={14} style={{ color: isOutgoing ? 'rgba(255,255,255,0.8)' : '#94a3b8' }} />
              ) : (
                <Image size={14} style={{ color: isOutgoing ? 'rgba(255,255,255,0.8)' : '#94a3b8' }} />
              )}
              <span
                className="text-xs italic"
                style={{ color: isOutgoing ? 'rgba(255,255,255,0.7)' : '#64748b' }}
              >
                {message.type === 'audio' ? 'Voice message' : 'Media'}
              </span>
            </div>
          )}

          {/* Message body */}
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{
              color: isOutgoing ? 'white' : '#e2e8f0',
            }}
          >
            {message.body}
          </p>

          {/* Timestamp + status */}
          <div
            className={`flex items-center gap-1 mt-1 ${
              isOutgoing ? 'justify-end' : 'justify-start'
            }`}
          >
            <span
              className="text-xs"
              style={{
                color: isOutgoing ? 'rgba(255,255,255,0.65)' : '#475569',
                fontSize: '10px',
              }}
            >
              {time}
            </span>
            {isOutgoing && (
              <CheckCheck
                size={12}
                style={{ color: 'rgba(255,255,255,0.65)' }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
