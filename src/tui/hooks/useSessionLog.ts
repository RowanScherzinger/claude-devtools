import { useEffect, useRef, useState } from 'react';
import { ServiceContext } from '@main/services/infrastructure/ServiceContext';
import type { EnhancedChunk, FileChangeEvent } from '@main/types/chunks';

export function useSessionLog(
  context: ServiceContext,
  projectId: string | null,
  sessionId: string | null
): { chunks: EnhancedChunk[]; loading: boolean; isLive: boolean } {
  const [chunks, setChunks] = useState<EnhancedChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const lastModifiedRef = useRef<number>(0);

  useEffect(() => {
    if (!projectId || !sessionId) {
      setChunks([]);
      setIsLive(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      if (!projectId || !sessionId) return;
      try {
        const parsed = await context.sessionParser.parseSession(projectId, sessionId);
        const result = context.chunkBuilder.buildChunks(parsed.messages);
        if (!cancelled) {
          setChunks(result);
        }
      } catch {
        // ignore parse errors during live updates
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    function onFileChange(event: FileChangeEvent) {
      if (event.projectId === projectId && event.sessionId === sessionId) {
        lastModifiedRef.current = Date.now();
        setIsLive(true);
        void load();
      }
    }

    context.fileWatcher.on('file-change', onFileChange);

    const liveTimer = setInterval(() => {
      setIsLive(Date.now() - lastModifiedRef.current < 30_000);
    }, 5_000);

    return () => {
      cancelled = true;
      context.fileWatcher.off('file-change', onFileChange);
      clearInterval(liveTimer);
    };
  }, [context, projectId, sessionId]);

  return { chunks, loading, isLive };
}
