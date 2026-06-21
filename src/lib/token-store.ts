type SessionExpiredListener = () => void;

const _expiredListeners: SessionExpiredListener[] = [];

export const tokenStore = {
  notifyExpired(): void {
    _expiredListeners.forEach((fn) => fn());
  },

  onSessionExpired(fn: SessionExpiredListener): () => void {
    _expiredListeners.push(fn);
    return () => {
      const i = _expiredListeners.indexOf(fn);
      if (i !== -1) _expiredListeners.splice(i, 1);
    };
  },
};
