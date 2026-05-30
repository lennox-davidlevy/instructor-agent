## Fraud Detection App — Detailed Build TODO

### Phase 1: Kafka basics
**Goal:** Understand Kafka fundamentals before adding complexity.

- [ ] **Sign up for Confluent Cloud**
  - Free tier: $400 credit, no card required for basic cluster
  - Create an organization and environment before creating a cluster

- [ ] **Create cluster and topics via UI**
  - Basic cluster, region close to you (lower latency for local dev)
  - Create topic `transactions` with 3 partitions
  - Create topic `flagged-transactions` with 3 partitions
  - Partition count matters: you can increase but never decrease, so 3 is a safe starting point for learning consumer group rebalancing later
  - Generate a cluster API key + secret from the cluster's "API Keys" page. Save these immediately — the secret is shown only once

- [ ] **Set up local Python project**
  - `uv init fraud-detection-app && cd fraud-detection-app`
  - `uv add confluent-kafka faker`
  - `confluent-kafka` wraps librdkafka — the C client. Faster and more battle-tested than pure-Python alternatives like `kafka-python`

- [ ] **Write local producer (`producer.py`)**
  - Config dict needs: `bootstrap.servers`, `security.protocol=SASL_SSL`, `sasl.mechanisms=PLAIN`, `sasl.username=<api-key>`, `sasl.password=<api-secret>`
  - `SASL_SSL` (not `PLAINTEXT` or `SASL_PLAINTEXT`): Confluent Cloud terminates TLS at the broker and rejects unencrypted connections. `PLAIN` mechanism sends the API key/secret over the (now-encrypted) channel.
  - Generate fake transactions with `faker`: `card_id`, `amount` (use `faker.pyfloat(positive=True, max_value=5000)`), `merchant`, `timestamp` (ISO 8601), `lat`, `lon`
  - Serialize as JSON, encode to bytes before producing
  - Call `producer.produce()` then `producer.poll(0)` each iteration; `producer.flush()` before exit
  - `poll(0)` after every `produce()` is non-obvious: `produce()` is async and queues to an internal buffer. Without `poll()`, delivery callbacks never fire and the buffer can overflow silently. `flush()` blocks until all queued messages are delivered, so it's required before exit.
  - Sleep 1 second between messages to keep the rate observable
  - Expected: messages appear in Confluent UI under topic → Messages tab within a few seconds

- [ ] **Write local consumer (`consumer.py`)**
  - Config dict needs the same auth fields, plus `group.id=fraud-detection-local`, `auto.offset.reset=earliest`
  - `consumer.subscribe(['transactions'])` then loop with `consumer.poll(1.0)`
  - Decode and JSON-parse each message; print
  - Handle `KeyboardInterrupt` to call `consumer.close()` cleanly — uncommitted offsets are lost otherwise

- [ ] **Verify end-to-end flow**
  - Terminal 1: `uv run producer.py`
  - Terminal 2: `uv run consumer.py`
  - Confirm messages flow in real time
  - Kill consumer (Ctrl+C), restart — verify it resumes from last committed offset, not the beginning
  - Gotcha: if `auto.offset.reset=earliest` and the consumer group has never committed, it reads from offset 0. After the first commit, that setting no longer applies for that group

---

### Phase 2: OpenShift basics
**Goal:** Get the app running on OCP with intentionally bad secret handling.

- [ ] **Containerize producer and consumer**
  - Base image: `registry.access.redhat.com/ubi9/python-311` — UBI is supported on OCP without entitlement and runs as a non-root user by default
  - Two Dockerfiles: `producer.Dockerfile`, `consumer.Dockerfile`. Keep them separate even if they're nearly identical — they will diverge
  - `COPY --chown=1001:0` for files; UID 1001 is the default UBI Python user
  - Use `uv pip install --system -r requirements.txt` after `uv export --no-hashes > requirements.txt`
  - Build locally first: `podman build -f producer.Dockerfile -t fraud-producer:0.1.0 .`
  - Test against Confluent before pushing: `podman run --rm -e CONFLUENT_BOOTSTRAP=... -e CONFLUENT_KEY=... -e CONFLUENT_SECRET=... fraud-producer:0.1.0`
  - Gotcha: OCP refuses images that try to run as root. UBI images already handle this, but if you switch to a slim Debian base later you'll hit `permission denied` on bind mounts

- [ ] **Push images to a registry**
  - Quay.io free tier for public repos. Create a repo per image: `fraud-producer`, `fraud-consumer`
  - `podman login quay.io`
  - `podman tag fraud-producer:0.1.0 quay.io/<user>/fraud-producer:0.1.0`
  - `podman push quay.io/<user>/fraud-producer:0.1.0`
  - Never tag with `latest` — OCP caches by tag, and `latest` makes rollouts non-deterministic

- [ ] **Create OCP project**
  - `oc new-project fraud-detection-dev`
  - Verify: `oc project` shows `fraud-detection-dev`

- [ ] **Write deployment manifests**
  - Location: `infrastructure/ocp/apps/fraud-detection/k8s/` (this directory convention is intentional — yaml-language-server attaches via `**/k8s/**` glob in nvim)
  - Files: `producer-deployment.yaml`, `consumer-deployment.yaml`, `kustomization.yaml`
  - One replica each initially. `imagePullPolicy: IfNotPresent`
  - Env vars sourced from a Secret (created next step)
  - Set `securityContext.runAsNonRoot: true` explicitly — OCP enforces this but being explicit catches portability issues early

- [ ] **Store Confluent creds in a Kubernetes Secret (intentionally wrong)**
  - `oc create secret generic confluent-creds --from-literal=bootstrap=... --from-literal=key=... --from-literal=secret=...`
  - This is the wrong long-term answer: secrets in etcd are only base64-encoded, not encrypted at rest by default, and they leak via `oc get secret -o yaml`. We'll fix this in Phase 3 with Vault
  - Reference the secret in both Deployments via `envFrom.secretRef`

- [ ] **Deploy and verify**
  - `oc apply -k infrastructure/ocp/apps/fraud-detection/k8s/`
  - `oc get pods -w` until both pods are `Running`
  - `oc logs deploy/producer` shows messages being produced
  - `oc logs deploy/consumer` shows messages being consumed
  - Scale: `oc scale deploy/consumer --replicas=3`
  - Watch partition rebalancing: `oc logs -f deploy/consumer --all-containers --prefix` — each pod should claim 1 partition
  - Gotcha: scaling beyond 3 replicas yields idle consumers because the topic only has 3 partitions

---

### Phase 3: Vault
**Goal:** Centralize secrets; remove credentials from Kubernetes manifests entirely.

- [ ] **Deploy Vault Community Edition via Helm**
  - `helm repo add hashicorp https://helm.releases.hashicorp.com && helm repo update`
  - Create namespace: `oc new-project vault`
  - Values to set: `server.ha.enabled=true`, `server.ha.raft.enabled=true`, `server.ha.replicas=3`, `injector.enabled=true`
  - `helm install vault hashicorp/vault -n vault -f vault-values.yaml`
  - HA + Raft means Vault manages its own consensus; no external storage backend (Consul, etcd) needed
  - Gotcha: on OCP, Vault's default securityContext won't satisfy the restricted SCC. Add `server.statefulSet.securityContext.pod.fsGroup: null` and `runAsUser: null` to let OCP assign UIDs

- [ ] **Initialize and unseal**
  - `oc exec -n vault vault-0 -- vault operator init` — outputs 5 unseal keys and a root token
  - Save the output to a password manager immediately. Losing these means losing the cluster
  - Unseal each pod: `oc exec -n vault vault-<N> -- vault operator unseal <key>` (3 of 5 keys, repeated for each pod)
  - Verify: `oc exec -n vault vault-0 -- vault status` shows `Sealed: false` and `HA Mode: active` on one pod

- [ ] **Configure Kubernetes auth method**
  - Set `VAULT_ADDR` and `VAULT_TOKEN` env vars locally to talk to Vault via port-forward, or `oc exec` into a pod
  - `vault auth enable kubernetes`
  - `vault write auth/kubernetes/config kubernetes_host="https://kubernetes.default.svc"` — Vault uses the pod's own service account token to authenticate to the K8s API
  - Gotcha: on OCP 4.11+, the default service account no longer auto-creates a long-lived token secret. You need `disable_iss_validation=true` or pre-create a token secret

- [ ] **Create policy and role**
  - Policy file `fraud-detection-policy.hcl`: `path "secret/data/fraud-detection/*" { capabilities = ["read"] }`
  - `vault policy write fraud-detection fraud-detection-policy.hcl`
  - `vault write auth/kubernetes/role/fraud-detection bound_service_account_names=default bound_service_account_namespaces=fraud-detection-dev policies=fraud-detection ttl=24h`

- [ ] **Move Confluent creds into Vault KV**
  - Enable KV v2 if not already: `vault secrets enable -path=secret kv-v2`
  - `vault kv put secret/fraud-detection/confluent bootstrap=... key=... secret=...`
  - Verify: `vault kv get secret/fraud-detection/confluent`

- [ ] **Annotate pods for Vault Agent injection**
  - Add to both Deployments' pod template metadata:
    - `vault.hashicorp.com/agent-inject: "true"`
    - `vault.hashicorp.com/role: "fraud-detection"`
    - `vault.hashicorp.com/agent-inject-secret-confluent: "secret/data/fraud-detection/confluent"`
    - `vault.hashicorp.com/agent-inject-template-confluent`: a Go template that renders the secret to a file at `/vault/secrets/confluent`
  - The injector mutates pods on admission — existing pods are not retroactively injected. Delete pods to trigger recreation

- [ ] **Update app code to read from file**
  - Replace `os.environ["CONFLUENT_KEY"]` with reading `/vault/secrets/confluent`
  - Parse the rendered template format you defined in the annotation
  - Redeploy

- [ ] **Delete the Kubernetes Secret**
  - `oc delete secret confluent-creds -n fraud-detection-dev`
  - Remove `envFrom.secretRef` from the Deployments
  - Pods should still work — if they do, you've genuinely centralized secrets. If not, the Vault path is misconfigured

---

### Phase 9: Polish
**Goal:** Prove you understand it by being able to rebuild it without your own help.

- [ ] **Write a README**
  - Architecture diagram in Mermaid (renders in GitHub markdown — easier than maintaining an external draw.io file)
  - Prerequisites: accounts, tools, cluster access, versions
  - Bootstrap order with one-line rationale for each step

- [ ] **Document the bootstrap from zero**
  - One doc that takes someone from "I have a cluster and nothing else" to a running app
  - Should be runnable top-to-bottom, no implicit knowledge

- [ ] **Tear it all down**
  - `oc delete project fraud-detection-dev vault`
  - Revoke Confluent API keys
  - Verify nothing in Quay you don't want public

- [ ] **Rebuild using only your docs**
  - If you get stuck, the doc is wrong — fix the doc, don't fix it from memory
  - When it works end-to-end from docs alone, you've genuinely learned this stack
