🚀 ReadyOn: Time-Off Microservice
This microservice manages the lifecycle of time-off requests while maintaining balance integrity. It synchronizes with an external Human Capital Management (HCM) system, which acts as the ultimate Source of Truth (SoT).

For a deep dive into the architectural decisions, resilience strategies, and challenges addressed, please refer to the TRD.md.

🛠 Tech Stack
Framework: NestJS + TypeScript

API Layer: GraphQL (Apollo)

Database: SQLite (TypeORM)

Containerization: Docker & Docker Compose

Testing: Jest (Unit)

📦 Getting Started (Docker)
The fastest way to run the service and its dependencies (including the Mock HCM server) is via Docker.

1. Spin up the containers
   Bash
   docker-compose up -d --build
   This command will:

Install all dependencies.

Initialize the SQLite database.

Execute the SeedService to populate the database with initial test data (e.g., employee diego-123).

Start the GraphQL API on port 3000.

2. Access the GraphQL Playground
   Once the containers are healthy, you can explore the API and run queries/mutations at:
   👉 http://localhost:3000/graphql

🧪 Testing & Reliability
As this project follows an Agentic Development approach, the rigor of the test suite is the primary proof of the system's robustness.

Run Unit Tests
Bash
docker-compose exec app npm run test
Run Coverage Report
Bash
docker-compose exec app npm run test:cov

🔄 Core Features & Flows
Real-time Request Flow: File time-off requests with local balance validation (Fail-fast strategy).

HCM Synchronization: Automatic synchronization triggered upon manager approval.

Batch Balance Sync: A dedicated "Source of Truth" mutation to receive the full corpus of balances from the HCM (handling work anniversaries and annual refreshes).

Defensive Error Handling: Specialized states like REJECTED_BY_HCM and SYNC_FAILED to handle API logic errors and network instability.

📂 Project Structure
src/modules/time-off: Core domain logic, balance calculations, and entities.

src/modules/sync: External communication layer and API error handling.

src/modules/hcm-mock: Dedicated mock server to simulate HCM behaviors (Success, 400, 500, Latency).

📜 API Highlights (GraphQL)
Queries
balance(employeeId, locationId): Fetches current cached balance.

requests(status): Lists time-off requests filtered by state.

Mutations
createRequest(input): Submits a new request for approval.

approveRequest(id): Authorizes the request and queues it for HCM synchronization.

syncBalancesFromHcm(balances): Bulk upsert to reconcile local data with the HCM.

⚖️ License
This project is MIT licensed.
