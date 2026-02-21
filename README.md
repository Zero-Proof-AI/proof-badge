# @zeroproof/proof-ui

React components for displaying and verifying ZK-TLS cryptographic proofs from the [Zero Proof](https://zeroproofai.com) attestation service.

## Installation

```bash
npm install @zeroproof/proof-ui
```

### Peer dependencies

| Package     | Version  | Required |
| ----------- | -------- | -------- |
| `react`     | ≥ 18.0.0 | yes      |
| `react-dom` | ≥ 18.0.0 | yes      |

## Quick start

### 1. Wrap your app with `ProofsProvider`

```tsx
import { ProofsProvider } from '@zeroproof/proof-ui';

function App() {
  return (
    <ProofsProvider
      attestationServiceUrl="https://dev.attester.zeroproofai.com"
      sessionId={currentSessionId}
    >
      <MyChat />
    </ProofsProvider>
  );
}
```

The provider opens a WebSocket to `{attestationServiceUrl}/ws/proofs?sessionId=…` and
streams proof updates into context automatically.

### 2. Display proofs with `ProofBadge`

```tsx
import { useProofs, ProofBadge } from '@zeroproof/proof-ui';

function ProofList() {
  const { proofs, fetchFullProof } = useProofs();

  return (
    <div>
      {proofs.map((proof, i) => (
        <ProofBadge
          key={proof.proof_id ?? i}
          proof={proof}
          index={i}
          onFetchFullProof={(id) => fetchFullProof(id)}
        />
      ))}
    </div>
  );
}
```

### 3. Show full proof details with `ProofModal`

```tsx
import { ProofModal, useProofs } from '@zeroproof/proof-ui';
import type { FullProofData } from '@zeroproof/proof-ui';

function ProofViewer() {
  const { fetchFullProof } = useProofs();
  const [selected, setSelected] = useState<FullProofData | null>(null);

  const handleOpen = async (proofId: string) => {
    const full = await fetchFullProof(proofId);
    setSelected(full as FullProofData);
  };

  return (
    <ProofModal
      open={!!selected}
      selectedProof={selected}
      onClose={() => setSelected(null)}
      // Optional: on-chain verification callback
      onVerify={async (proof) => {
        // your wallet/ethers integration here
        return true;
      }}
      verification={{
        isVerifying: false,
        isVerified: false,
        error: null,
        clearError: () => {},
      }}
      explorerContractUrl="https://sepolia.etherscan.io/address/0xAe94FB09711e1c6B057853a515483792d8e474d0#code"
    />
  );
}
```

## Exports

| Export             | Type      | Description                                         |
| ------------------ | --------- | --------------------------------------------------- |
| `ProofsProvider`   | Component | Context provider — connects to attestation WebSocket |
| `useProofs`        | Hook      | Access `proofs`, `loading`, `error`, `fetchFullProof` |
| `ProofBadge`       | Component | Expandable proof summary card                       |
| `ProofModal`       | Component | Full proof detail overlay                           |
| `CryptographicProof` | Type   | Proof summary shape                                 |
| `FullProofData`    | Type      | Complete proof with request/response/onchainProof   |

## Props reference

### `ProofsProvider`

| Prop                    | Type     | Required | Description                        |
| ----------------------- | -------- | -------- | ---------------------------------- |
| `attestationServiceUrl` | `string` | yes      | Base URL of the attestation service |
| `sessionId`             | `string` | no       | Session ID for WebSocket connection |

### `ProofBadge`

| Prop              | Type                          | Description                         |
| ----------------- | ----------------------------- | ----------------------------------- |
| `proof`           | `CryptographicProof`         | Proof data to display               |
| `index`           | `number`                      | Position index (for memoisation)    |
| `onFetchFullProof`| `(proofId: string) => void`   | Callback when user clicks proof ID  |

### `ProofModal`

| Prop                 | Type                                    | Description                                 |
| -------------------- | --------------------------------------- | ------------------------------------------- |
| `open`               | `boolean`                               | Show/hide the modal                         |
| `selectedProof`      | `FullProofData \| null`                | Proof to display                            |
| `onClose`            | `() => void`                            | Close callback                              |
| `onVerify`           | `(proof) => Promise<boolean>` (opt)     | On-chain verification callback              |
| `verification`       | `{ isVerifying, isVerified, error, clearError }` (opt) | External verification state  |
| `explorerContractUrl`| `string` (opt)                          | Link to the Reclaim contract on a block explorer |

## Development

```bash
npm install
npm run build     # compile to dist/
npm run dev       # watch mode
```

## License

MIT
