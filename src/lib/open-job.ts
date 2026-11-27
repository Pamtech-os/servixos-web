import type { useRouter } from 'next/navigation';

export const OPEN_JOB_EVENT = 'servixos:open-job';

/**
 * Opens a job's detail. On /jobs the page is already mounted and only reads its `?id=` link
 * on mount, so it is told directly through a window event instead.
 */
export function openJob(router: ReturnType<typeof useRouter>, jobId: string) {
  if (window.location.pathname === '/jobs') {
    window.dispatchEvent(new CustomEvent<string>(OPEN_JOB_EVENT, { detail: jobId }));
  } else {
    router.push(`/jobs?id=${jobId}`);
  }
}
