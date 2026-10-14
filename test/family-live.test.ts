import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLIENT_ID, subscribeFamilyEvents, setToken } from '@/lib/api';

// a fetch response whose body streams the given chunks
function streamOf(chunks: string[]) {
  const body = new ReadableStream<Uint8Array>({
    start(ctrl) {
      const enc = new TextEncoder();
      chunks.forEach((c) => ctrl.enqueue(enc.encode(c)));
      ctrl.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
});

describe('subscribeFamilyEvents', () => {
  it('passes on topics from the stream, split across chunks, skipping pings and its own changes', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      streamOf([
        'data: {"topic":"ping"}\n\n',
        'data: {"topic":"menu","origin":"other-tab"}\n\ndata: {"topic":"tas',
        'ks","origin":null}\n\n',
        `data: {"topic":"finance","origin":"${CLIENT_ID}"}\n\n`,
      ]),
    ).mockReturnValue(new Promise(() => {})); // the reconnect just hangs
    vi.stubGlobal('fetch', fetchMock);
    setToken('tok');

    const topics: string[] = [];
    const ctrl = new AbortController();
    subscribeFamilyEvents((t) => topics.push(t), { signal: ctrl.signal });

    await vi.waitFor(() => expect(topics).toEqual(['menu', 'tasks']));
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/family\/events$/);
    expect(init.headers.Authorization).toBe('Bearer tok');
    ctrl.abort();
  });

  it('reconnects after the stream drops and says so, so missed changes get reloaded', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(streamOf([]))
      .mockResolvedValueOnce(streamOf(['data: {"topic":"menu"}\n\n']))
      .mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);

    const onReconnect = vi.fn();
    const topics: string[] = [];
    const ctrl = new AbortController();
    subscribeFamilyEvents((t) => topics.push(t), { signal: ctrl.signal, onReconnect });

    await vi.waitFor(() => expect(topics).toEqual(['menu']), { timeout: 3000 });
    expect(onReconnect).toHaveBeenCalledTimes(1);
    ctrl.abort();
  });
});
