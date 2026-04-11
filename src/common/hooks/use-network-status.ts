'use client';

import { useEffect, useState } from 'react';

type ConnectionInfo = {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
};

type NetworkStatus = {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
};

function getConnectionInfo(): ConnectionInfo {
  if (typeof navigator === 'undefined') {
    return {};
  }

  const connection = (
    navigator as Navigator & {
      connection?: ConnectionInfo;
      mozConnection?: ConnectionInfo;
      webkitConnection?: ConnectionInfo;
    }
  ).connection;

  return connection ?? {};
}

function computeIsSlowConnection(connection: ConnectionInfo): boolean {
  if (!connection) {
    return false;
  }

  if (connection.saveData) {
    return true;
  }

  if (connection.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
    return true;
  }

  if (typeof connection.downlink === 'number' && connection.downlink > 0 && connection.downlink < 1) {
    return true;
  }

  return false;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    const connection = getConnectionInfo();
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

    return {
      isOnline,
      isSlowConnection: computeIsSlowConnection(connection),
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      saveData: connection.saveData,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const update = () => {
      const connection = getConnectionInfo();
      setStatus({
        isOnline: navigator.onLine,
        isSlowConnection: computeIsSlowConnection(connection),
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        saveData: connection.saveData,
      });
    };

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    const connection = getConnectionInfo() as EventTarget & {
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };

    connection?.addEventListener?.('change', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      connection?.removeEventListener?.('change', update);
    };
  }, []);

  return status;
}
