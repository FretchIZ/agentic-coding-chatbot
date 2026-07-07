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

const STORAGE_KEY = 'kudos-conversations';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadAll(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAll(list: Conversation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

function pickTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New Chat';
  const t = first.content.replace(/[*#`]/g, '').trim().slice(0, 60);
  return t || 'New Chat';
}

export function useConversations() {
  const [list, setList] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadAll();
    setList(loaded);
    const last = loaded[loaded.length - 1];
    if (last && !activeId) setActiveId(last.id);
  }, []);

  const active = list.find((c) => c.id === activeId) || null;

  const create = useCallback(() => {
    const id = generateId();
    const now = new Date().toISOString();
    const conv: Conversation = { id, title: 'New Chat', messages: [], createdAt: now, updatedAt: now };
    setList((prev) => {
      const next = [...prev, conv];
      saveAll(next);
      return next;
    });
    setActiveId(id);
    return id;
  }, []);

  const select = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setList((prev) => {
      const idx = prev.findIndex((c) => c.id === activeId);
      if (idx === -1) return prev;
      const updated = [...prev];
      const conv = { ...updated[idx], messages: [...updated[idx].messages, msg], updatedAt: new Date().toISOString() };
      if (conv.title === 'New Chat') conv.title = pickTitle(conv.messages);
      updated[idx] = conv;
      saveAll(updated);
      return updated;
    });
  }, [activeId]);

  const updateMessages = useCallback((messages: Message[]) => {
    setList((prev) => {
      const idx = prev.findIndex((c) => c.id === activeId);
      if (idx === -1) return prev;
      const updated = [...prev];
      const conv = { ...updated[idx], messages, updatedAt: new Date().toISOString() };
      if (conv.title === 'New Chat') conv.title = pickTitle(conv.messages);
      updated[idx] = conv;
      saveAll(updated);
      return updated;
    });
  }, [activeId]);

  const remove = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveAll(next);
      return next;
    });
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  return { list, activeId, active, create, select, addMessage, updateMessages, remove };
}
