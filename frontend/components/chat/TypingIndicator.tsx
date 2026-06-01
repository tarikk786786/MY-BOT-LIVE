'use client';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  contactName?: string;
}

export default function TypingIndicator({ contactName }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex justify-start mb-2"
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-2"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottomLeftRadius: 4,
        }}
      >
        {contactName && (
          <span className="text-xs mr-1" style={{ color: '#64748b' }}>
            {contactName}
          </span>
        )}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`typing-dot w-2 h-2 rounded-full`}
              style={{
                background: '#00d084',
                animationDelay: `${i * 0.2}s`,
                display: 'inline-block',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
