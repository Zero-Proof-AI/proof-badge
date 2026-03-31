import React, { useState } from 'react';
import { useProofs } from './useProofs';
import type { CryptographicProof } from './types';

export interface ProofBadgeProps {
  proof: CryptographicProof;
  index: number;
  onFetchFullProof: (proofId: string) => void;
}

const WORKFLOW_COLORS: Record<string, string> = {
  pricing: '#e6f3ff',
  payment_enrollment: '#fff0f5',
  payment: '#fff5e6',
  booking: '#e6ffe6',
  'card-enrollment': '#fff0f5',
  'instrument-identifiers': '#e8f4fd',
  'payment-instruments': '#fff8e1',
};

const WORKFLOW_BORDERS: Record<string, string> = {
  pricing: '#4299e1',
  payment_enrollment: '#ed64a6',
  payment: '#f6ad55',
  booking: '#48bb78',
  'card-enrollment': '#ed64a6',
  'instrument-identifiers': '#2b6cb0',
  'payment-instruments': '#dd6b20',
};

const ProofBadge = React.memo(
  ({ proof, index, onFetchFullProof }: ProofBadgeProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { loading: proofModalLoading } = useProofs();

    const stageColor = WORKFLOW_COLORS[proof.workflow_stage || ''] || '#f0f4f8';
    const stageBorder = WORKFLOW_BORDERS[proof.workflow_stage || ''] || '#cbd5e0';

    return (
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem',
          background: stageColor,
          border: `2px solid ${stageBorder}`,
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          borderLeft: `4px solid ${proof.verified ? '#48bb78' : '#f56565'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isExpanded ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 'bold',
                color: proof.verified ? '#22543d' : '#742a2a',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '1rem',
                  transition: 'transform 0.2s ease',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              >
                ▶
              </span>
              {proof.sequence && (
                <span
                  style={{
                    marginRight: '0.5rem',
                    background: stageBorder,
                    color: '#fff',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                  }}
                >
                  #{proof.sequence}
                </span>
              )}
              🔐 {proof.verified ? '✓ Verified' : '✗ Unverified'} Proof
            </div>

            <div style={{ marginTop: '0.25rem', color: '#4a5568' }}>
              <strong>Tool:</strong> {proof.tool_name}
            </div>

            {proof.workflow_stage && (
              <div style={{ marginTop: '0.25rem', color: '#4a5568' }}>
                <strong>Stage:</strong>{' '}
                <span
                  style={{
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    background: stageBorder,
                    color: '#fff',
                    padding: '0.1rem 0.3rem',
                    borderRadius: '0.2rem',
                  }}
                >
                  {proof.workflow_stage}
                </span>
              </div>
            )}

            {proof.submitted_by && (
              <div style={{ marginTop: '0.25rem', color: '#4a5568' }}>
                <strong>Submitted By:</strong> {proof.submitted_by}
              </div>
            )}

            {/* Collapsed proof ID link */}
            {!isExpanded && proof.proof_id && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onFetchFullProof(proof.proof_id!);
                }}
                style={{
                  marginTop: '0.25rem',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  background: 'rgba(37, 99, 235, 0.05)',
                  padding: '0.25rem',
                  borderRadius: '0.2rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)')
                }
              >
                <strong>ID:</strong> {proof.proof_id.substring(0, 32)}…{' '}
                <span style={{ fontSize: '0.65rem' }}>🔍 click to verify</span>
              </div>
            )}

            <div style={{ marginTop: '0.25rem', color: '#4a5568' }}>
              <strong>On-chain:</strong> {proof.onchain_compatible ? '✓ Yes' : '✗ No'}
            </div>
          </div>
        </div>

        {proof.related_proof_id && (
          <div
            style={{
              marginTop: '0.25rem',
              padding: '0.25rem',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '0.2rem',
              fontSize: '0.75rem',
              color: '#4a5568',
            }}
          >
            ↳ Related to: {proof.related_proof_id.substring(0, 16)}…
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && (
          <div
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: `1px solid ${stageBorder}`,
            }}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.02)',
                padding: '0.75rem',
                borderRadius: '0.35rem',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
              }}
            >
              <ExpandedField label="Proof ID">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ wordBreak: 'break-all' }}>
                    {proof.proof_id || 'Not available'}
                  </span>
                  {proof.proof_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFetchFullProof(proof.proof_id!);
                      }}
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.2rem',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      disabled={proofModalLoading}
                    >
                      {proofModalLoading ? '🔄 Loading…' : '🔍 View Full'}
                    </button>
                  )}
                </div>
              </ExpandedField>

              <ExpandedField label="Timestamp">
                {new Date(proof.timestamp * 1000).toLocaleString()}
              </ExpandedField>

              <ExpandedField label="Verified">
                <span style={{ color: proof.verified ? '#22543d' : '#742a2a' }}>
                  {proof.verified
                    ? '✓ Yes (Cryptographically signed by Reclaim)'
                    : '✗ No (Proof validation pending)'}
                </span>
              </ExpandedField>

              <ExpandedField label="On-Chain Compatible">
                {proof.onchain_compatible
                  ? '✓ Yes (Ready for blockchain)'
                  : '⏳ Processing (Converting for on-chain)'}
              </ExpandedField>

              {proof.workflow_stage && (
                <ExpandedField label="Workflow Stage">
                  <span style={{ textTransform: 'capitalize' }}>{proof.workflow_stage}</span>
                </ExpandedField>
              )}

              {proof.submitted_by && (
                <ExpandedField label="Submitted By">{proof.submitted_by}</ExpandedField>
              )}

              {proof.sequence && (
                <ExpandedField label="Sequence Number">{proof.sequence}</ExpandedField>
              )}

              {proof.related_proof_id && (
                <ExpandedField label="Related Proof ID">
                  <span style={{ wordBreak: 'break-all' }}>{proof.related_proof_id}</span>
                </ExpandedField>
              )}

              {/* Explanation box */}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem',
                  background: '#e6f0ff',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#2c5282',
                  lineHeight: '1.4',
                }}
              >
                <strong>What this proves:</strong>
                <div style={{ marginTop: '0.25rem' }}>
                  ✓ An authenticated HTTPS request was made to the {proof.tool_name} endpoint
                  <br />
                  ✓ The response data is genuine and cryptographically verified (Zero-Knowledge TLS)
                  <br />
                  ✓ No intermediary could have tampered with the data
                  <br />
                  {proof.onchain_compatible &&
                    '✓ This proof can be stored permanently on blockchain for audit trail'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.proof.proof_id === nextProps.proof.proof_id &&
    prevProps.proof.verified === nextProps.proof.verified &&
    prevProps.proof.onchain_compatible === nextProps.proof.onchain_compatible &&
    prevProps.index === nextProps.index,
);

ProofBadge.displayName = 'ProofBadge';

export default ProofBadge;

// ---------------------------------------------------------------------------
// Small helper used only inside expanded detail rows
// ---------------------------------------------------------------------------

function ExpandedField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <strong style={{ color: '#2d3748' }}>{label}:</strong>
      <div
        style={{
          marginTop: '0.25rem',
          color: '#4a5568',
          background: '#fff',
          padding: '0.35rem',
          borderRadius: '0.25rem',
        }}
      >
        {children}
      </div>
    </div>
  );
}
