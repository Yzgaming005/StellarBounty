# EscrowContract Event Schema

The `EscrowContract` emits one event per state-changing function so that off-chain indexers and frontends can react to bounty lifecycle transitions in real time without scraping every transaction.

## Topic

All events share the same topic shape:

```rust
(Symbol, Address)  // (event_name, actor_address)
```

`event_name` is a `SymbolShort` of the function that emitted the event. `actor_address` is the `Address` that called the function and triggered the state change.

## Data

Event data is a tuple whose first element is always the new `BountyStatus`. Additional fields are described per event.

| Event name     | Triggered by                  | New status  | Additional data                                          |
|----------------|-------------------------------|-------------|----------------------------------------------------------|
| `initialize`   | `initialize(...)`             | `Created`   | `(amount: i128, token: Address, arbitrator: Address)`    |
| `fund`         | `fund(...)`                   | `Funded`    | `(amount: i128)`                                         |
| `start_work`   | `start_work(...)`             | `InProgress`| *(none)*                                                 |
| `submit`       | `submit(...)`                 | `UnderReview`| *(none)*                                                |
| `approve`      | `approve(...)`                | `Completed` | `(amount: i128, contributor: Address)`                   |
| `cancel`       | `cancel(...)`                 | `Cancelled` | `(refund: Option<i128>)` — `Some(amount)` if was funded |
| `dispute`      | `dispute(...)`                | `Disputed`  | *(none)*                                                 |
| `resolve`      | `resolve(arbitrator, winner)` | `Completed` | *(none)*                                                 |

> Note: `dispute` and `resolve` existed before the lifecycle-wide event schema. They follow the same topic shape but do not yet include the new status in the data payload — that is left for a follow-up PR.

## Ordering

Events are emitted **before** the final storage write. The storage write that flips the status to the new value happens immediately after the `env.events().publish(...)` call. Both are part of the same host-function invocation, so consumers will see the event in the same transaction result they observe the new on-chain status in.

## Example subscription (JavaScript, using `@stellar/stellar-sdk`)

```js
import { rpc } from '@stellar/stellar-sdk';

const server = new rpc.Server('https://soroban-testnet.stellar.org');
const topic = ['initialize']; // or any other event name

const events = await server.getEvents({
  startLedger: latestLedger,
  filters: [{ type: 'contract', topics: [topic] }],
});

for (const e of events.events) {
  const eventName = e.topic[0];          // e.g. "initialize"
  const actor    = e.topic[1];          // actor Address (strkey)
  const status   = e.value?.[0];         // new BountyStatus (variant)
  // e.value[1..] holds the additional data fields per the table above
}
```

## Indexer guidelines

- Always read `BountyStatus` as the first element of the data tuple. Treat unknown values as a contract version upgrade.
- The `actor_address` in the topic is the only authoritative record of who triggered the transition. Do not infer it from transaction source accounts, which may be a relayer or fee-paying account.
- For `cancel`, `refund: null` means the bounty was cancelled from `Created` (no funds to return). `refund: <n>` means it was cancelled from `Funded` and `<n>` was returned to the owner.
