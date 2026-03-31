import React from 'react';
import type { FullProofData } from './types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProofModalProps {
  open: boolean;
  selectedProof: FullProofData | null;
  onClose: () => void;
  /**
   * Optional callback for on-chain verification.
   * When provided a "Verify" button is shown inside the proof section.
   * The callback receives the proof and should return a promise that resolves
   * to `true` (verified) or `false`.
   */
  onVerify?: (proof: FullProofData) => Promise<boolean>;
  /** External verification state flags (optional — managed by the consumer) */
  verification?: {
    isVerifying: boolean;
    isVerified: boolean;
    error: string | null;
    clearError: () => void;
  };
  /** Etherscan (or other explorer) base URL for the Reclaim contract */
  explorerContractUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove private circuit inputs before displaying proof data in the UI. */
function sanitizeProofForDisplay(proof: unknown): unknown {
  if (proof === null || typeof proof !== 'object') return proof;
  const PRIVATE_KEYS = ['field_values', 'field_salts', 'private_inputs'];
  const sanitized = { ...(proof as Record<string, unknown>) };
  for (const key of PRIVATE_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProofModal: React.FC<ProofModalProps> = React.memo(
  ({ open, selectedProof, onClose, onVerify, verification, explorerContractUrl }) => {
    if (!open || !selectedProof) return null;

    const isVerifying = verification?.isVerifying ?? false;
    const isVerified = verification?.isVerified ?? false;
    const verificationError = verification?.error ?? null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '0.5rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem' }}>
                🔐 Full Proof Verification
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', color: '#718096', fontSize: '0.9rem' }}>
                Complete on-chain verifiable proof data
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#718096',
              }}
            >
              ✕
            </button>
          </div>

          {/* Core Information */}
          <Section title="Core Information">
            <Grid>
              <Field label="Proof ID" mono breakAll>
                {selectedProof.proof_id}
              </Field>
              <Field label="Session ID" mono breakAll>
                {selectedProof.session_id}
              </Field>
              <Field label="Tool">{selectedProof.tool_name}</Field>
              <Field label="Timestamp">
                {new Date(selectedProof.timestamp * 1000).toLocaleString()}
              </Field>
            </Grid>
          </Section>

          {/* Verification Status */}
          <Section title="Verification Status">
            <Grid>
              <StatusCard ok={selectedProof.verified} okText="✓ Verified" failText="✗ Unverified">
                {selectedProof.verified
                  ? selectedProof.verification_info
                    ? `Verified — ${selectedProof.verification_info.protocol} (${selectedProof.verification_info.signature_algorithm})`
                    : 'Cryptographically verified'
                  : 'Verification pending'}
              </StatusCard>
              <StatusCard
                ok={selectedProof.onchain_compatible}
                okText="✓ On-Chain Ready"
                failText="✗ Processing"
              >
                {selectedProof.onchain_compatible
                  ? 'Ready to submit to blockchain'
                  : 'Not yet on-chain compatible'}
              </StatusCard>
            </Grid>
          </Section>

          {/* Request / Response */}
          <Section title="Request & Response">
            <Grid>
              <div>
                <strong style={{ color: '#4a5568', fontSize: '0.85rem' }}>Request:</strong>
                <Pre>{JSON.stringify(selectedProof.request, null, 2)}</Pre>
              </div>
              <div>
                <strong style={{ color: '#4a5568', fontSize: '0.85rem' }}>Response:</strong>
                <Pre>
                  {JSON.stringify(
                    selectedProof.display_response ?? selectedProof.response,
                    null,
                    2,
                  )}
                </Pre>
              </div>
            </Grid>
          </Section>

          {/* Cryptographic Proof data */}
          <Section
            title={
              <>
                {selectedProof.verification_info?.protocol === 'SP1-Groth16'
                  ? (() => {
                      const stage = selectedProof.workflow_stage;
                      const label = stage
                        ? stage.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                        : 'User Intent';
                      return `SP1 ZK Proof — ${label}`;
                    })()
                  : selectedProof.verification_info?.protocol === 'Reclaim'
                  ? 'ZK-TLS Proof (Reclaim)'
                  : 'Proof Data'}{' '}
                {explorerContractUrl && (
                  <button
                    onClick={() => window.open(explorerContractUrl, '_blank')}
                    style={{
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8em',
                      cursor: 'pointer',
                      fontWeight: '500',
                      marginLeft: '0.5rem',
                    }}
                  >
                    See contract
                  </button>
                )}
              </>
            }
          >
            <details style={{ cursor: 'pointer' }}>
              <summary
                style={{
                  padding: '0.5rem',
                  background: '#f7fafc',
                  borderRadius: '0.25rem',
                  userSelect: 'none',
                }}
              >
                <strong>Click to expand proof data</strong> (for on-chain verification)
              </summary>

              {/* Verify button (only when onVerify callback provided) */}
              {onVerify && (
                <>
                  <button
                    onClick={() => {
                      verification?.clearError?.();
                      onVerify(selectedProof);
                    }}
                    style={{
                      marginTop: '0.5rem',
                      background: isVerified
                        ? '#10b981'
                        : verificationError
                          ? '#ef4444'
                          : isVerifying
                            ? '#6b7280'
                            : '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9em',
                      fontWeight: '500',
                      cursor:
                        (isVerified || isVerifying) && !verificationError
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: (isVerified || isVerifying) && !verificationError ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    disabled={isVerifying || (isVerified && !verificationError)}
                  >
                    {isVerified && !verificationError
                      ? '✅ Verified'
                      : verificationError
                        ? '❌ Failed - Try Again'
                        : isVerifying
                          ? '🔄 Verifying…'
                          : 'Verify'}
                  </button>

                  {!isVerified && !verificationError && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '0.25rem',
                        color: '#92400e',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span>⏱️</span>
                      <span>
                        <strong>Note:</strong> Verification may take up to 3 minutes to confirm
                        on-chain.
                      </span>
                    </div>
                  )}

                  {verificationError && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.25rem',
                        color: '#991b1b',
                        fontSize: '0.85rem',
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                        ❌ Verification Failed
                      </strong>
                      <p style={{ margin: 0 }}>{verificationError}</p>
                    </div>
                  )}
                </>
              )}

              <Pre style={{ marginTop: '0.5rem', maxHeight: '300px' }}>
                {JSON.stringify(
                  sanitizeProofForDisplay(selectedProof.proof?.onchainProof || selectedProof.proof),
                  null,
                  2,
                )}
              </Pre>
            </details>
          </Section>

          {/* Verification Info */}
          {selectedProof.verification_info && (
            <Section title="Verification Information">
              <div
                style={{
                  background: '#f0f9ff',
                  padding: '1rem',
                  borderRadius: '0.35rem',
                  borderLeft: '3px solid #0284c7',
                }}
              >
                <InfoRow label="Protocol">{selectedProof.verification_info.protocol}</InfoRow>
                <InfoRow label="Issuer">{selectedProof.verification_info.issuer}</InfoRow>
                <InfoRow label="Algorithm">
                  {selectedProof.verification_info.signature_algorithm}
                </InfoRow>
                <InfoRow label="Documentation">
                  <a
                    href={selectedProof.verification_info.reclaim_documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0284c7', textDecoration: 'underline' }}
                  >
                    {selectedProof.verification_info.reclaim_documentation}
                  </a>
                </InfoRow>
              </div>
            </Section>
          )}

          {/* Workflow Metadata */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '0.75rem' }}>Workflow Metadata</h3>
            <Grid>
              {selectedProof.workflow_stage && (
                <Field label="Workflow Stage">
                  <span style={{ textTransform: 'capitalize' }}>
                    {selectedProof.workflow_stage}
                  </span>
                </Field>
              )}
              {selectedProof.sequence && (
                <Field label="Sequence">#{selectedProof.sequence}</Field>
              )}
              {selectedProof.submitted_by && (
                <Field label="Submitted By">{selectedProof.submitted_by}</Field>
              )}
              {selectedProof.related_proof_id && (
                <Field label="Related Proof" mono breakAll>
                  {selectedProof.related_proof_id}
                </Field>
              )}
            </Grid>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2d3748',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  },
);

ProofModal.displayName = 'ProofModal';
export default ProofModal;

// ---------------------------------------------------------------------------
// Tiny helpers (internal only)
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <h3 style={{ color: '#2d3748', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  mono,
  breakAll,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  breakAll?: boolean;
}) {
  return (
    <div>
      <strong style={{ color: '#4a5568' }}>{label}:</strong>
      <div
        style={{
          marginTop: '0.25rem',
          fontSize: '0.85rem',
          background: '#f7fafc',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          ...(mono ? { fontFamily: 'monospace' } : {}),
          ...(breakAll ? { wordBreak: 'break-all' } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StatusCard({
  ok,
  okText,
  failText,
  children,
}: {
  ok: boolean;
  okText: string;
  failText: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: ok ? '#ecfdf5' : '#fef2f2',
        padding: '0.75rem',
        borderRadius: '0.25rem',
        borderLeft: `3px solid ${ok ? '#10b981' : '#ef4444'}`,
      }}
    >
      <strong style={{ color: ok ? '#065f46' : '#7f1d1d' }}>{ok ? okText : failText}</strong>
      <p
        style={{
          margin: '0.25rem 0 0 0',
          fontSize: '0.85rem',
          color: ok ? '#047857' : '#991b1b',
        }}
      >
        {children}
      </p>
    </div>
  );
}

function Pre({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <pre
      style={{
        background: '#f7fafc',
        padding: '0.75rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        overflow: 'auto',
        maxHeight: '200px',
        marginTop: '0.5rem',
        ...style,
      }}
    >
      {children}
    </pre>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <strong style={{ color: '#0c4a6e' }}>{label}:</strong> {children}
    </div>
  );
}
