import type { useRouter } from 'next/navigation';

export const OPEN_REQUEST_EVENT = 'servixos:open-request';

/**
 * Opens a service request's detail. On /requests the page is already mounted and only reads
 * its `?id=` link on mount, so it is told directly through a window event instead.
 */
export function openServiceRequest(router: ReturnType<typeof useRouter>, requestId: string) {
  if (window.location.pathname === '/requests') {
    window.dispatchEvent(new CustomEvent<string>(OPEN_REQUEST_EVENT, { detail: requestId }));
  } else {
    router.push(`/requests?id=${requestId}`);
  }
}
