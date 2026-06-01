'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWAStore } from '@/lib/store';
import { Wifi, WifiOff, QrCode, RefreshCw, Phone } from 'lucide-react';
import Link from 'next/link';

export default function WAStatusBadge() {
  const { status } = useWAStore();

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'rgba(15,15,26,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: '#94a3b8' }}
      >
        WhatsApp Status
      </h3>

      <div className="flex flex-col items-center justify-center py-4 gap-4">
        {/* Status Icon */}
        <motion.div
          animate={
            status.connected
              ? { scale: [1, 1.05, 1] }
              : { opacity: [1, 0.6, 1] }
          }
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: status.connected
              ? 'rgba(0,208,132,0.12)'
              : status.qr
              ? 'rgba(245,158,11,0.12)'
              : 'rgba(239,68,68,0.12)',
            border: `2px solid ${
              status.connected
                ? 'rgba(0,208,132,0.4)'
                : status.qr
                ? 'rgba(245,158,11,0.4)'
                : 'rgba(239,68,68,0.4)'
            }`,
          }}
        >
          {status.connected ? (
            <Wifi size={28} style={{ color: '#00d084' }} />
          ) : status.qr ? (
            <QrCode size={28} style={{ color: '#f59e0b' }} />
          ) : (
            <WifiOff size={28} style={{ color: '#ef4444' }} />
          )}
        </motion.div>

        {/* Status Text */}
        <div className="text-center">
          <p
            className="text-base font-bold"
            style={{
              color: status.connected
                ? '#00d084'
                : status.qr
                ? '#f59e0b'
                : '#ef4444',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            {status.connected
              ? 'Connected'
              : status.qr
              ? 'Scan QR Code'
              : 'Disconnected'}
          </p>

          {status.phone && (
            <div className="flex items-center gap-1 justify-center mt-1">
              <Phone size={12} style={{ color: '#475569' }} />
              <p className="text-xs" style={{ color: '#475569' }}>
                {status.phone}
              </p>
            </div>
          )}

          {!status.connected && !status.qr && (
            <p className="text-xs mt-1" style={{ color: '#475569' }}>
              Not connected to WhatsApp
            </p>
          )}
        </div>

        {/* Action Button */}
        {!status.connected && (
          <Link href="/whatsapp">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: status.qr
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(0,208,132,0.12)',
                border: `1px solid ${
                  status.qr
                    ? 'rgba(245,158,11,0.3)'
                    : 'rgba(0,208,132,0.3)'
                }`,
                color: status.qr ? '#f59e0b' : '#00d084',
              }}
            >
              {status.qr ? (
                <>
                  <QrCode size={14} />
                  Scan QR Code
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Connect Now
                </>
              )}
            </motion.button>
          </Link>
        )}

        {status.connected && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(0,208,132,0.08)',
              border: '1px solid rgba(0,208,132,0.2)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full pulse-glow"
              style={{ background: '#00d084', color: '#00d084' }}
            />
            <span className="text-xs font-medium" style={{ color: '#00d084' }}>
              Live
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
