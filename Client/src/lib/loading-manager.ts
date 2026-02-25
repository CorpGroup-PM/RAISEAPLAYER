// src/lib/loading-manager.ts

type LoadingHandler = (isLoading: boolean) => void;

class LoadingManager {
  private handler: LoadingHandler | null = null;

  // Called by GlobalLoader to register callback
  bind(fn: LoadingHandler) {
    this.handler = fn;
  }

  // Internal set method
  set(isLoading: boolean) {
    if (this.handler) {
      this.handler(isLoading);
    }
  }

  // Public API: START loading (adds +1)
  start() {
    this.set(true);
  }

  // Public API: STOP loading (subtract -1)
  stop() {
    this.set(false);
  }
}

export const loadingManager = new LoadingManager();
