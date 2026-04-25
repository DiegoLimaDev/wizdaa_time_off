# Technical Requirement Document (TRD): Time-Off Microservice

## 1. Document Status

- **Version:** 1.1.0
- **Author:** Diego Lima
- **Status:** Final / Ready for Review

## 2. Context & Problem Statement

ReadyOn provides a platform for employees to request time off. The official **Source of Truth (SoT)** is an external Human Capital Management (HCM) system.

**The Challenge:** Maintaining consistency between ReadyOn's local cache and the HCM is complex due to:

1. **Asynchronous Updates:** Events like "Work Anniversary" bonuses happen directly in the HCM.
2. **Resilience:** The HCM API might be slow or unstable.
3. **Integrity:** We must prevent "double-spending" of leave days while ensuring the HCM is always notified.

## 3. User Personas

- **The Employee:** Wants instant feedback on requests and a reliable view of their balance.
- **The Manager:** Needs to approve requests knowing the data is valid against the SoT.

## 4. Goals & Non-Goals

### Goals

- Manage the lifecycle of a request: `PENDING_APPROVAL` -> `PENDING_SYNC` -> `APPROVED`.
- Implement **Bi-directional Sync**: Real-time (ReadyOn → HCM) and Batch (HCM → ReadyOn).
- **Defensive Architecture:** Local validation to fail-fast before calling external APIs.
- **Resilience:** Handle HCM downtime without losing employee requests.

### Non-Goals

- Complex payroll calculations or tax withholding.
- Full Auth/IAM (assumed to be provided by a gateway).

## 5. Technical Stack

- **Framework:** NestJS (TypeScript)
- **API Layer:** GraphQL (Apollo)
- **Database:** SQLite (TypeORM)
- **Testing:** Jest (Unitary)

## 6. Proposed Solution: Architectural Design

### 6.1. System Overview

We use a **Modular Monolith** with a focus on **Domain-Driven Design (DDD)**. The service is split into `Time-Off` (Internal logic) and `Sync` (External communication).

#### Data Consistency Strategy

1. **Optimistic Local Cache:** We maintain `availableDays` locally to provide 1ms latency for Queries.
2. **Pending Sync State:** Approved requests enter a `PENDING_SYNC` state. A background worker (Sync Service) handles the external call.
3. **Batch Leveling (Upsert):** To handle work anniversaries, the HCM pushes a full corpus of balances via the `syncBalancesFromHcm` Mutation. This "resets" the local cache to the SoT.

### 6.2. Request State Machine

- **PENDING_APPROVAL:** Manager needs to review.
- **PENDING_SYNC:** Approved locally, waiting for HCM confirmation.
- **APPROVED:** Synchronized with HCM.
- **REJECTED_BY_HCM:** HCM rejected the deduction (e.g., business rule violation).
- **SYNC_FAILED:** Technical error (Retry logic triggered).
- **REJECTED_BY_ADMIN:** ADM rejected the deduction.

## 7. Challenges & Mitigation

| Challenge                  | Mitigation Strategy                                                                                                                              |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **HCM Downtime**           | **Outbox Pattern:** Requests in `PENDING_SYNC` stay in the queue until the HCM is reachable.                                                     |
| **Work Anniversary Bonus** | **Batch Upsert:** The system supports an idempotency-safe batch update that overrides local balances with HCM values.                            |
| **Defensive Validation**   | **Fail-Fast Logic:** Even if the HCM is supposed to validate, ReadyOn performs a local balance check to give immediate feedback to the employee. |

## 8. Alternatives Considered

- **Pure Real-time (No Local Cache):** Rejected. If HCM is down, the app becomes useless. Local cache ensures high availability.
- **Pessimistic Locking:** Rejected. Locking database rows during network calls (HCM sync) would cause performance bottlenecks. We use a **State Machine** instead.

## 9. API Contracts (GraphQL)

### Queries

- `balance(employeeId, locationId)`: Returns cached balance and last sync date.
- `requests(status)`: Lists time-off requests with current sync status.

### Mutations

- `createRequest(input)`: Validates and creates a `PENDING_APPROVAL` record.
- `approveRequest(id)`: Moves request to `PENDING_SYNC`.
- `syncBalancesFromHcm(balances)`: **The Batch Sink.** Performs an upsert of the HCM corpus into the local database.

---

## 10. Testing & Quality Assurance

The reliability of this service is proven by its **Test Suite**:

- **Unit Tests:** 100% coverage on business logic (Services).
- **Mock HCM:** A dedicated module to simulate failure scenarios (400, 500, Latency).
