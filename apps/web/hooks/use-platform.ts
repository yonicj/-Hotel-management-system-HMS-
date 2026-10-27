export function usePlatform() {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);

  return {
    isTauri,
    isWeb: !isTauri,
    isMobile,
    isDesktop: isTauri && !isMobile,
  };
}
