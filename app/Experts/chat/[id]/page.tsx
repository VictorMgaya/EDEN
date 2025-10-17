"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { useSession } from 'next-auth/react';
import { Conversation, Message } from '@/app/types/conversation';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { status } = useSession();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    async function fetchConv() {
      const res = await fetch(`/api/experts/conversation?id=${id}`);
      const data = await res.json();
      if (data?.success) setConversation(data.conversation);
      else setError(data?.error || 'Failed to load conversation');
    }
    fetchConv();
  }, [id, status, router]);

  if (error) return <div className="p-6">{error}</div>;
  if (!conversation) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Expert Conversation</h2>
      <div className="space-y-4">
        {conversation.messages.map((m: Message, i: number) => (
          <div key={i} className={`p-4 rounded-lg ${m.sender === 'user' ? 'bg-emerald-50' : 'bg-white dark:bg-slate-800'}`}>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.content) }} />
            <div className="text-xs text-muted-foreground mt-2">{new Date(m.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
