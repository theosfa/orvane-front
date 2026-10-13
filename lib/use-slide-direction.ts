import { useRef } from 'react';

export type SlideDirection = 'next' | 'prev';

// Which way the shown week moved since the last render ('YYYY-MM-DD' keys compare as text).
// undefined on the first render, so the page doesn't slide in on load.
export function useSlideDirection(key: string | undefined): SlideDirection | undefined {
  const prevKey = useRef(key);
  const direction = useRef<SlideDirection>();
  if (key !== prevKey.current) {
    direction.current = key && prevKey.current ? (key > prevKey.current ? 'next' : 'prev') : undefined;
    prevKey.current = key;
  }
  return direction.current;
}
