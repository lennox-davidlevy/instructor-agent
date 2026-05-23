## Fraud Detection App — Detailed Build TODO

### Phase 1: Kafka basics
**Goal:** Understand Kafka fundamentals before adding complexity.

- [ ] **Sign up for Confluent Cloud**
  - Use free tier ($400 credit, no card required for basic cluster)
  - Create an organization and environment
- [ ] **Create cluster and topic via UI**
  - Basic cluster in a region close to you
  - Create topic `transactions` with 3 partitions
  - Create topic `flagged-transactions` with 3 partitions
  - Generate a cluster API key + secret (save these)
- [ ] **Write local producer**
  - Language: Python (simpler) or Go (closer to enterprise patterns)
  - Use `confluent-kafka` library
  - Generate fake transactions with `faker`: card ID, amount, merchant, timestamp, lat/lon
  - Publish one message/second to `transactions` topic
- [ ] **Write local consumer**
  - Subscribe to `transactions` topic in a consumer group
  - Print each message as it arrives
- [ ] **Verify end-to-end flow**
  - Run producer and consumer in separate terminals
  - Confirm messages flow
  - Kill consumer, restart — verify it resumes from last offset

---

### Phase 2: OpenShift basics
**Goal:** Get the app running on OCP with intentionally bad secret handling.

- [ ] **Containerize producer and consumer**
  - Write Dockerfiles (use `ubi9-minimal` base for OCP friendliness)
  - Build locally, test that containers run against Confluent
- [ ] **Push images to a registry**
  - Use Quay.io (free for public repos, integrates well with OCP) or your OCP's internal registry
  - Tag with a version, not `latest`
- [ ] **Create OCP namespace/project**
  - `oc new-project fraud-detection-dev`
- [ ] **Deploy with plain YAML**
  - Deployment for producer, Deployment for consumer
  - One replica each for now
- [ ] **Store Confluent creds in secret**
  - Bootstrap servers, API key, API secret as env vars
- [ ] **Verify**
  - `oc logs` shows producer publishing and consumer receiving
  - Scale consumer to 3 replicas, verify partition rebalancing

---

### Phase 3: Vault
**Goal:** Centralize secrets; remove credentials from Kubernetes manifests entirely.

- [ ] **Deploy Vault Community Edition via Helm**
  - Add HashiCorp Helm repo
  - Use HA mode with integrated Raft storage (3 replicas)
  - Enable the Vault Agent Injector in the Helm values
- [ ] **Initialize and unseal**
  - `vault operator init` — save unseal keys and root token somewhere safe
  - Unseal each replica with 3 of the 5 keys
  - Verify cluster is healthy
- [ ] **Enable Kubernetes auth method**
  - `vault auth enable kubernetes`
  - Configure it with the OCP API server URL and CA cert
- [ ] **Create policy for fraud app**
  - Policy grants read on `secret/data/fraud-detection/*`
- [ ] **Move Confluent creds into Vault KV engine**
  - `vault kv put secret/fraud-detection/confluent bootstrap=... key=... secret=...`
- [ ] **Annotate pods for Vault Agent injection**
  - Add `vault.hashicorp.com/agent-inject` and template annotations
  - Secrets mount as files at `/vault/secrets/confluent`
- [ ] **Update app code to read from file, not env var**
- [ ] **Delete the Kubernetes Secret**
  - Verify the app still works — if it does, you've really done it

---

### Phase 9: Polish
**Goal:** Prove you understand it by being able to rebuild it without your own help.

- [ ] **Write a README**
  - Architecture diagram (draw.io, Excalidraw, or Mermaid)
  - Prerequisites (accounts, tools, cluster access)
  - Bootstrap order
- [ ] **Document the bootstrap from zero**
  - One doc that takes someone from "I have a cluster and nothing else" to a running app
- [ ] **Tear it all down**
  - Delete all resources
- [ ] **Rebuild using only your docs**
  - If you get stuck, the doc is wrong — fix the doc, don't fix it from memory
  - When it works end-to-end from docs alone, you've genuinely learned this stack
