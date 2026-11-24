const PREVIEW_DELAY_MS = 1200;

export function delayForDevLoadingPreview(
  signal?: AbortSignal
): Promise<void> {
  if (!import.meta.env.DEV || signal?.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timer = 0;

    const finish = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };

    timer = window.setTimeout(finish, PREVIEW_DELAY_MS);
    signal?.addEventListener("abort", finish, { once: true });
  });
}
