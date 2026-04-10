"use client";

import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const SCRIPT_ID = "google-identity-services";

type GoogleAuthButtonProps = {
  onCredential: (idToken: string) => Promise<void>;
  label?: string;
};

export default function GoogleAuthButton({ onCredential, label = "Continue with Google" }: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;

    const initialize = () => {
      if (!window.google || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) return;
          try {
            setError(null);
            await onCredentialRef.current(response.credential);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Google sign-in failed");
          }
        },
      });

      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });

      setIsReady(true);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.google) {
        initialize();
      } else {
        existing.addEventListener("load", initialize, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initialize;
    script.onerror = () => setError("Unable to load Google Sign-In script");
    document.head.appendChild(script);
  }, [clientId]);

  if (!clientId) {
    return <p className="text-center text-xs text-rose-600">Google Client ID is missing in NEXT_PUBLIC_GOOGLE_CLIENT_ID</p>;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex w-full justify-center" />
      {!isReady && !error && (
        <p className="text-center text-xs text-slate-500">{label}</p>
      )}
      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}
