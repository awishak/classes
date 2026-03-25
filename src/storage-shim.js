if (!window.storage) {
  window.storage = {
    async get(key, shared) {
      try {
        const val = localStorage.getItem(key);
        if (val === null) return null;
        return { key, value: val, shared: !!shared };
      } catch {
        return null;
      }
    },
    async set(key, value, shared) {
      try {
        localStorage.setItem(key, value);
        return { key, value, shared: !!shared };
      } catch {
        return null;
      }
    },
    async delete(key, shared) {
      try {
        localStorage.removeItem(key);
        return { key, deleted: true, shared: !!shared };
      } catch {
        return null;
      }
    },
    async list(prefix, shared) {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!prefix || k.startsWith(prefix)) keys.push(k);
        }
        return { keys, prefix, shared: !!shared };
      } catch {
        return { keys: [], prefix, shared: !!shared };
      }
    }
  };
}
