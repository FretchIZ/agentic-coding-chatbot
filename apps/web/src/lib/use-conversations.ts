'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'sai-conversations';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pickTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New Chat';
  const t = first.content.replace(/[*#`]/g, '').trim().slice(0, 60);
  return t || 'New Chat';
}

function loadLocal(): Conversation[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function saveLocal(list: Conversation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

let dbMode = false;

async function tryDb(): Promise<boolean> {
  if (dbMode) return true;
  try {
    const res = await fetch('/api/conversations', { cache: 'no-store' });
    if (res.ok) { dbMode = true; return true; }
  } catch {}
  return false;
}

export function useConversations() {
  const [list, setList] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const useDb = await tryDb();
      if (useDb) {
        const res = await fetch('/api/conversations', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setList(data);
          if (data.length > 0) setActiveId(data[data.length - 1].id);
        }
      } else {
        const loaded = loadLocal();
        setList(loaded);
        const last = loaded[loaded.length - 1];
        if (last) setActiveId(last.id);
      }
      setReady(true);
    })();
  }, []);

  const active = list.find((c) => c.id === activeId) || null;

  const ensureLoaded = useCallback(async (id: string) => {
    if (!dbMode) return;
    const existing = list.find((c) => c.id === id);
    if (existing && existing.messages.length > 0) return;
    try {
      const res = await fetch(`/api/conversations/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setList((prev) => prev.map((c) => c.id === id ? { ...c, messages: data.messages || [] } : c));
      }
    } catch {}
  }, [list]);

  const create = useCallback(async () => {
    const id = generateId();
    const now = new Date().toISOString();
    const conv: Conversation = { id, title: 'New Chat', messages: [], createdAt: now, updatedAt: now };

    if (dbMode) {
      try {
        const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) });
        if (res.ok) { const data = await res.json(); conv.id = data.id; }
      } catch {}
    }

    setList((prev) => { const next = [...prev, conv]; if (!dbMode) saveLocal(next); return next; });
    setActiveId(conv.id);
    return conv.id;
  }, []);

  const select = useCallback((id: string) => {
    setActiveId(id);
    ensureLoaded(id);
  }, [ensureLoaded]);

  const addMessage = useCallback(async (msg: Message) => {
    let currentId = '';
    setList((prev) => {
      const idx = prev.findIndex((c) => c.id === activeId);
      if (idx === -1) return prev;
      currentId = prev[idx].id;
      const updated = [...prev];
      const conv = { ...updated[idx], messages: [...updated[idx].messages, msg], updatedAt: new Date().toISOString() };
      if (conv.title === 'New Chat') conv.title = pickTitle(conv.messages);
      updated[idx] = conv;
      if (!dbMode) saveLocal(updated);
      return updated;
    });
    if (dbMode && currentId) {
      try {
        await fetch(`/api/conversations/${currentId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: msg.role, content: msg.content }) });
        if (pickTitle([msg]) !== 'New Chat') {
          await fetch(`/api/conversations/${currentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: pickTitle([msg]) }) });
        }
      } catch {}
    }
  }, [activeId]);

  const remove = useCallback(async (id: string) => {
    if (dbMode) { try { await fetch(`/api/conversations/${id}`, { method: 'DELETE' }); } catch {} }
    setList((prev) => { const next = prev.filter((c) => c.id !== id); if (!dbMode) saveLocal(next); return next; });
    if (activeId === id) setActiveId(list.find((c) => c.id !== id)?.id || null);
  }, [activeId, list]);

  return { list, activeId, active, ready, create, select, addMessage, remove };
}
