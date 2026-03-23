import { useEffect, useState } from 'react';
import { ServiceContext } from '@main/services/infrastructure/ServiceContext';
import type { Project } from '@main/types/domain';
import type { FileChangeEvent } from '@main/types/chunks';

export function useProjects(context: ServiceContext): { projects: Project[]; loading: boolean } {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await context.projectScanner.scan();
      if (!cancelled) {
        setProjects(result);
        setLoading(false);
      }
    }

    void load();

    function onFileChange(_event: FileChangeEvent) {
      void load();
    }

    context.fileWatcher.on('file-change', onFileChange);
    return () => {
      cancelled = true;
      context.fileWatcher.off('file-change', onFileChange);
    };
  }, [context]);

  return { projects, loading };
}
