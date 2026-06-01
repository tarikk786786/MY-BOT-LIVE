'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useWAStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const setStatus = useWAStore((s) => s.setStatus);

  // Auth guard
  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && !stored) {
      router.push('/login');
    }
  }, [token, router]);

  // Socket connection
  useEffect(() => {
    const socket = connectSocket();

    socket.on('wa:ready', (data: any) =>
      setStatus({ connected: true, phone: data?.phone || null, qr: null })
    );
    socket.on('wa:disconnected', () =>
      setStatus({ connected: false, qr: null, phone: null })
    );
    socket.on('wa:qr', (data: any) =>
      setStatus({ connected: false, qr: data?.qr || null, phone: null })
    );
    socket.on('wa:loading_screen', () =>
      setStatus({ connected: false, qr: null })
    );

    return () => {
      socket.off('wa:ready');
      socket.off('wa:disconnected');
      socket.off('wa:qr');
      socket.off('wa:loading_screen');
      disconnectSocket();
    };
  }, [setStatus]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main
          className="flex-1 overflow-auto"
          style={{ background: 'var(--bg-primary)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
