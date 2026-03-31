import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { CryptographicProof } from './types';

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

export interface ProofsContextType {
  proofs: CryptographicProof[];
  loading: boolean;
  error: string | null;
  fetchFullProof: (proofId: string) => Promise<CryptographicProof | null>;
}

export const ProofsContext = createContext<ProofsContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface ProofsProviderProps {
  children: React.ReactNode;
  /** Current session ID — WebSocket connects when this is set */
  sessionId?: string;
  /** Attestation service base URL (e.g. "https://dev.attester.zeroproofai.com") */
  attestationServiceUrl: string;
}

export const ProofsProvider: React.FC<ProofsProviderProps> = ({
  children,
  sessionId,
  attestationServiceUrl,
}) => {
  const [proofs, setProofs] = useState<CryptographicProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setSocket] = useState<WebSocket | null>(null);

  // Connect to proofs WebSocket when sessionId is available
  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = attestationServiceUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');

    const ws = new WebSocket(`${wsUrl}/ws/proofs?sessionId=${sessionId}`);

    ws.onopen = () => {
      setLoading(false);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle batch proof messages
        if (data.proofs && Array.isArray(data.proofs)) {
          setProofs((prev) => {
            const ids = new Set(prev.map((p) => p.proof_id));
            const fresh = (data.proofs as CryptographicProof[]).filter(
              (p) => !ids.has(p.proof_id),
            );
            return [...prev, ...fresh];
          });
        }

        // Handle single proof message
        if (data.proof && typeof data.proof === 'object') {
          setProofs((prev) => {
            const exists = prev.some((p) => p.proof_id === data.proof.proof_id);
            if (exists) {
              return prev.map((p) =>
                p.proof_id === data.proof.proof_id ? data.proof : p,
              );
            }
            return [...prev, data.proof];
          });
        }

        if (data.error) {
          setError(data.error);
        }
      } catch {
        // malformed message — ignore
      }
    };

    ws.onerror = () => {
      setError('Failed to connect to proofs service');
      setLoading(false);
    };

    ws.onclose = () => {
      setSocket(null);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [sessionId, attestationServiceUrl]);

  // Fetch full proof details (local cache → API fallback)
  const fetchFullProof = useCallback(
    async (proofId: string): Promise<CryptographicProof | null> => {
      // Check local cache first
      const local = proofs.find((p) => p.proof_id === proofId);
      if (local && 'request' in local && 'response' in local && 'proof' in local) {
        return local;
      }

      try {
        const res = await fetch(`${attestationServiceUrl}/proofs/${proofId}`);
        if (res.ok) {
          const data = await res.json();
          const proof = data.data?.proof ?? null;
          if (proof) {
            setProofs((prev) =>
              prev.map((p) => (p.proof_id === proofId ? proof : p)),
            );
            return proof;
          }
        }
      } catch {
        // network error — fall through
      }

      return null;
    },
    [proofs, attestationServiceUrl],
  );

  const value: ProofsContextType = { proofs, loading, error, fetchFullProof };

  return <ProofsContext.Provider value={value}>{children}</ProofsContext.Provider>;
};
