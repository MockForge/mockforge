function getOriginalFetchRequest() {
  let originalFetch = window.fetch;

  return (url: string, opts: Request | RequestInit) => {
    if (opts instanceof Request) {
      return originalFetch(opts);
    }
    return originalFetch(url, opts);
  };
}

export const originalFetchRequest = getOriginalFetchRequest();
