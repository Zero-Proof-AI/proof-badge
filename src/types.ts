/**
 * Shared types for ZK-TLS cryptographic proofs.
 */

/** A single cryptographic proof summary (from attestation service or WebSocket) */
export interface CryptographicProof {
  tool_name: string;
  timestamp: number;
  proof_id?: string;
  verified: boolean;
  onchain_compatible: boolean;
  sequence?: number;
  related_proof_id?: string;
  workflow_stage?: string;
  submitted_by?: string;
  /** Full proof data (when fetched via API) */
  request?: unknown;
  response?: unknown;
  proof?: unknown;
  session_id?: string;
}

/** Full proof data returned by the attestation service verify endpoint */
export interface FullProofData {
  proof_id: string;
  session_id: string;
  tool_name: string;
  timestamp: number;
  request: unknown;
  response: unknown;
  proof: {
    onchainProof?: {
      claimInfo?: {
        provider: string;
        parameters: string;
        context: string;
      };
      signedClaim?: {
        claim: {
          identifier: string;
          owner: string;
          timestampS: number;
          epoch: number;
        };
        signatures: string[];
      };
    };
    [key: string]: unknown;
  };
  verified: boolean;
  onchain_compatible: boolean;
  submitted_by?: string;
  sequence?: number;
  related_proof_id?: string;
  workflow_stage?: string;
  verification_info?: {
    protocol: string;
    issuer: string;
    timestamp_verified: boolean;
    signature_algorithm: string;
    can_verify_onchain: boolean;
    reclaim_documentation: string;
  };
}
