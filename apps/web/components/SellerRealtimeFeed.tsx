'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Card } from '@agencyfic/ui';

type FeedItem = {
  id: string;
  label: string;
  at: string;
};

export function SellerRealtimeFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', []);
  const demoUserId = useMemo(() => process.env.NEXT_PUBLIC_DEMO_USER_ID ?? 'demo-user', []);

  useEffect(() => {
    const socket = io(apiUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join-user-room', demoUserId);
    });

    const push = (label: string) => {
      setItems((prev) => [{ id: crypto.randomUUID(), label, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
    };

    socket.on('order.update', (payload: { kind?: string; queuedAccounts?: number }) => {
      push(`Order event: ${payload.kind ?? 'update'} (${payload.queuedAccounts ?? 0} accounts)`);
    });
    socket.on('ai.completion', (payload: { kind?: string; jobType?: string }) => {
      push(`AI event: ${payload.jobType ?? 'job'} ${payload.kind ?? 'update'}`);
    });
    socket.on('session.warning', (payload: { platform?: string; message?: string }) => {
      push(`Session warning: ${payload.platform ?? 'platform'} - ${payload.message ?? 'attention required'}`);
    });
    socket.on('notification.new', (payload: { title?: string; message?: string }) => {
      push(`Notification: ${payload.title ?? 'new'} - ${payload.message ?? ''}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, demoUserId]);

  return (
    <Card className="mt-5 p-4">
      <h3 className="mb-3 text-sm font-bold">Realtime Activity Feed</h3>
      <div className="space-y-2 text-sm">
        {items.length === 0 ? <p className="text-slate-500">No realtime events yet.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-500">{item.at}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

