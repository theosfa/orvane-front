'use client';

import { useEffect, useRef } from 'react';
import type { FamilyTopic } from './api';

// Someone in the family changed shared data: FamilyProvider hears it from the API's event
// stream and announces it here; pages showing that data reload it.
type DataTopic = Exclude<FamilyTopic, 'family'>;
const listeners = new Set<(topic: DataTopic) => void>();

export function announceFamilyChange(topic: DataTopic) {
  listeners.forEach((l) => l(topic));
}

// onChange runs when the family's `topic` data changed elsewhere; the latest callback is used
export function useFamilyLive(topic: DataTopic, onChange: () => void) {
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(() => {
    const listener = (t: DataTopic) => t === topic && latest.current();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [topic]);
}
