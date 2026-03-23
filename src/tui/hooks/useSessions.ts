import { useEffect, useState } from 'react';
import { ServiceContext } from '@main/services/infrastructure/ServiceContext';
import type { FileChangeEvent } from '@main/types/chunks';
import type { Session } from '@main/types/domain';

export function useSessions(
  context: ServiceContext,
  projectId: string | null
): { sessions: Session[]; loading: boolean } {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      if (!projectId) return;
      const result = await context.projectScanner.listSessions(projectId);
      if (!cancelled) {
        setSessions(result);
        setLoading(false);
      }
    }

    void load();

    function onFileChange(event: FileChangeEvent) {
      if (event.projectId === projectId) {
        void load();
      }
    }

    context.fileWatcher.on('file-change', onFileChange);
    return () => {
      cancelled = true;
      context.fileWatcher.off('file-change', onFileChange);
    };
  }, [context, projectId]);

  return { sessions, loading };
}
