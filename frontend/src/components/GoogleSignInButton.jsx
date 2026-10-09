import { useEffect, useRef } from 'react';
import { useThemeStore } from '../stores/themeStore';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

// Loads Google's sign-in script once and resolves when `window.google` is ready.
let gsiPromise;
function loadGsi() {
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve(window.google);
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => {
        gsiPromise = undefined; // allow a retry on the next mount
        reject(new Error('Failed to load Google sign-in'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
}

/**
 * Renders Google's official "Sign in with Google" button.
 * onCredential receives the signed Google ID token, which the backend verifies.
 * Renders nothing if VITE_GOOGLE_CLIENT_ID is not set.
 */
export default function GoogleSignInButton({ onCredential, lightTheme = "outline", darkTheme = "filled_black", align = "center" }) {
  const containerRef = useRef(null);
  const { theme } = useThemeStore();
  // Keep the latest callback without re-initialising Google on every render.
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return;
    let cancelled = false;

    loadGsi()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callbackRef.current?.(response.credential),
        });
        containerRef.current.innerHTML = '';
        google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: theme === 'dark' ? darkTheme : lightTheme,
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(containerRef.current.offsetWidth || 320, 400),
        });
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [theme, lightTheme, darkTheme]);

  if (!CLIENT_ID) return null;
  return (
    <div
      ref={containerRef}
      className={`w-full flex min-h-[44px] ${align === "start" ? "justify-start" : "justify-center"}`}
    />
  );
}
