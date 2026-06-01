'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  LogOut,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { whatsappApi } from '@/lib/api';
import { useWAStore } from '@/lib/store';

export default function WhatsAppPage() {
  const { status } = useWAStore();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<'restart' | 'logout' | null>(null);

  const { data: apiStatus, isLoading } = useQuery({
    queryKey: ['wa-status'],
    queryFn: () => whatsappApi.getStatus().then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: qrData } = useQuery({
    queryKey: ['wa-qr'],
    queryFn: () => whatsappApi.getQR().then((r) => r.data),
    enabled: !status.connected,
    refetchInterval: 30000,
  });

  const restartMutation = useMutation({
    mutationFn: whatsappApi.restart,
    onSuccess: () => {
      toast.success('WhatsApp client restarting...');
      queryClient.invalidateQueries({ queryKey: ['wa-status'] });
      setConfirming(null);
    },
    onError: () => toast.error('Failed to restart'),
  });

  const logoutMutation = useMutation({
    mutationFn: whatsappApi.logout,
    onSuccess: () => {
      toast.success('WhatsApp session cleared');
      queryClient.invalidateQueries({ queryKey: ['wa-status'] });
      setConfirming(null);
    },
    onError: () => toast.error('Failed to logout'),
  });

  const qrCode = status.qr || qrData?.qr;
  const isConnected = status.connected || apiStatus?.connected;
  const phone = status.phone || apiStatus?.phone;

  return (
    <div className="p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Status Hero Card */}
        <div
          className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{
            background: isConnected
              ? 'linear-gradient(135deg, rgba(0,208,132,0.1), rgba(0,184,148,0.06))'
              : qrCode
              ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))',
            border: `1px solid ${
              isConnected
                ? 'rgba(0,208,132,0.25)'
                : qrCode
                ? 'rgba(245,158,11,0.25)'
                : 'rgba(239,68,68,0.25)'
            }`,
          }}
        >
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Icon */}
          <motion.div
            animate={isConnected ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative inline-flex w-24 h-24 rounded-3xl items-center justify-center mb-6"
            style={{
              background: isConnected
                ? 'rgba(0,208,132,0.15)'
                : qrCode
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(239,68,68,0.15)',
              border: `2px solid ${
                isConnected
                  ? 'rgba(0,208,132,0.4)'
                  : qrCode
                  ? 'rgba(245,158,11,0.4)'
                  : 'rgba(239,68,68,0.4)'
              }`,
            }}
          >
            {isConnected ? (
              <Wifi size={40} style={{ color: '#00d084' }} />
            ) : qrCode ? (
              <QrCode size={40} style={{ color: '#f59e0b' }} />
            ) : (
              <WifiOff size={40} style={{ color: '#ef4444' }} />
            )}

            {isConnected && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full pulse-glow"
                style={{ background: '#00d084', color: '#00d084', border: '2px solid rgba(10,10,20,0.8)' }}
              />
            )}
          </motion.div>

          <h2
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: 'Sora, sans-serif',
              color: isConnected
                ? '#00d084'
                : qrCode
                ? '#f59e0b'
                : '#ef4444',
            }}
          >
            {isConnected
              ? 'Connected'
              : qrCode
              ? 'Waiting for QR Scan'
              : 'Disconnected'}
          </h2>

          {phone && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone size={16} style={{ color: '#94a3b8' }} />
              <p className="text-lg font-medium" style={{ color: '#94a3b8' }}>
                {phone}
              </p>
            </div>
          )}

          <p className="text-sm" style={{ color: '#475569' }}>
            {isConnected
              ? 'WhatsApp is active and processing messages'
              : qrCode
              ? 'Open WhatsApp on your phone → More Options → Linked Devices → Link a Device'
              : 'WhatsApp is not connected. Click restart to reconnect.'}
          </p>
        </div>

        {/* QR Code */}
        <AnimatePresence>
          {!isConnected && qrCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-2xl p-6 flex flex-col items-center gap-4"
              style={{
                background: 'rgba(15,15,26,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3
                className="text-lg font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: '#e2e8f0' }}
              >
                Scan QR Code
              </h3>

              <div
                className="p-4 rounded-2xl"
                style={{ background: 'white' }}
              >
                <QRCodeSVG
                  value={qrCode}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0a0a0f"
                  level="M"
                />
              </div>

              <p className="text-sm text-center" style={{ color: '#64748b' }}>
                QR code expires in ~60 seconds. Refreshes automatically.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        {!isConnected && (
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(15,15,26,0.8)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Info size={16} style={{ color: '#f59e0b' }} />
              <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
                How to Connect
              </h3>
            </div>
            <ol className="space-y-2">
              {[
                'Open WhatsApp on your phone',
                'Tap More Options (⋮) → Linked Devices',
                'Tap "Link a Device"',
                'Scan the QR code shown above',
                'Keep your phone connected to the internet',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(0,208,132,0.15)', color: '#00d084' }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: '#94a3b8' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          {/* Restart */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              confirming === 'restart'
                ? restartMutation.mutate()
                : setConfirming('restart')
            }
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: 'rgba(0,208,132,0.1)',
              border: '1px solid rgba(0,208,132,0.25)',
              color: '#00d084',
            }}
          >
            {restartMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {confirming === 'restart' ? 'Confirm Restart?' : 'Restart Client'}
          </motion.button>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              confirming === 'logout'
                ? logoutMutation.mutate()
                : setConfirming('logout')
            }
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
            }}
          >
            {logoutMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            {confirming === 'logout' ? 'Confirm Logout?' : 'Logout Session'}
          </motion.button>
        </div>

        {confirming && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs"
            style={{ color: '#f59e0b' }}
          >
            Click the button again to confirm, or click elsewhere to cancel.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
