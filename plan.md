# Project summary (one-line)

Build a browser-first, n8n-style visual network lab (drag/drop nodes, per-node settings, access/trunk/VLAN/subnet/ACL simulation), with a deterministic TypeScript simulator running in a WebWorker. MVP: single-user, save/load JSON, run/step/trace for packet reachability.

---

# High-level goals (MVP)

1. Visual canvas: drag/drop nodes, connect links (React Flow).
2. Topology model: canonical JSON representation, import/export.
3. Simulator: deterministic L2/L3 abstractions (MAC learning, VLAN tagging, access/trunk, static routing, stateless ACLs).
4. Run/trace UI: pick source packet → run → show per-hop decisions and final verdict (reach/blocked).
5. Basic validation and scenario unit tests.

Acceptance criteria (MVP): create topology → configure VLANs/ports/ACLs → run a packet test and get a reproducible path + reason why blocked or allowed.

---

# SDLC overview (agile, 12–14 week solo plan)

Phases: Requirements → Design → Implementation (iterative sprints) → Test → Release → Maintain/Enhance.

Sprint cadence: 2 week sprints. Deliverable at end of each sprint. Target solo dev full-time: **12–14 weeks** to MVP.

Sprint breakdown (detailed later). If you have extra help, timeline compresses.

---

# Tech stack (opinionated — builds fast & maintainable)

Frontend

* React + TypeScript
* React Flow (canvas & nodes)
* React Hook Form (node config)
* Zustand (lightweight state)
* WebWorker (simulation)
* IndexedDB via idb (local persistence)
* Vite for dev tooling

Simulator

* TypeScript simulator module (runs in WebWorker). Optionally compile to WASM later if needed.

Backend (optional for v1)

* None. If needed later: Node (Fastify) or Go microservice exposing simulator via HTTP/WebSocket.

Testing

* Unit: Vitest / Jest
* Property testing: fast-check
* E2E: Playwright (UI flows: create topology, run test, assert trace)

CI / CD

* GitHub Actions: run tests, lint, build.
* Release: GitHub Releases / simple static host (Netlify / Vercel) for frontend. App runs entirely client-side, so just host built static assets.

DevOps / infra

* Docker for optional server components and reproducible dev env

Observability

* Sentry (errors) and simple local telemetry (opt-in) later

---

# Core data model (canonical JSON)

You need a single canonical topology schema. Design it now — everything else maps to this.

Example (shortened) — **Topology JSON schema (excerpt)**:

```json
{
  "id": "topo-uuid",
  "name": "Office Lab",
  "nodes": [
    {
      "id": "node-1",
      "type": "host",           // host | switch | router | firewall | server
      "label": "Host-A",
      "position": { "x": 120, "y": 80 },
      "config": {
        "interfaces": [
          { "id": "eth0", "mac": "02:aa:bb:cc:01", "ip": "192.168.10.10/24", "vlan": 10, "portMode": "access" }
        ]
      }
    }
  ],
  "links": [
    {
      "id": "link-1",
      "endpoints": [{ "nodeId":"node-1","ifId":"eth0" }, { "nodeId":"sw-1","ifId":"gi0/1" }],
      "linkType": "ethernet",   // ethernet / trunk
      "trunkVlans": [10,20]
    }
  ],
  "metadata": { "createdBy":"me", "version": 1 }
}
```

Full schema will include:

* Node types and allowed config keys
* Interface object (id, mac, ip with CIDR, vlan for access, allowedVlans for trunk, portMode)
* ACL objects: `{ id, order, action: "allow|deny", match: { srcIp, dstIp, srcPort, dstPort, proto, vlan } }`
* Router static routes: `{prefix, nextHopNodeId, outInterface}`
* Simulation settings: stepMode, maxHops, loopDetection

Save this schema as `topology.schema.json` and use it for validation in UI & tests.

---

# Simulator design (core logic)

Keep it abstract, deterministic, and explainable.

Core models:

* Packet: `{srcMac, srcIp?, dstMac?, dstIp?, vlanTag?, proto, srcPort?, dstPort?, ingressNode, ingressIf}`
* Interfaces: maintain `mac` and `ip` and `vlan` assignments.
* Switch behavior: MAC table {mac -> port}, on unknown dst MAC → flood to ports within same VLAN. Access/trunk port semantics: access strips/tags accordingly; trunk carries tags.
* Router behavior: based on routing table (static routes), decrement TTL, forward to next hop via interface; perform L3 lookup.
* Firewall/ACL behavior: evaluate ACLs in order, action first-match, default deny/allow configurable. Stateless in MVP.
* NAT: skip for MVP (future).
* Event queue: discrete tick-based processing of packet events.

Simplified simulation loop (pseudocode):

```
enqueue initial packet at source interface
while queue not empty and steps < MAX:
  event = dequeue()
  if event.node.type == 'host' and event.node.id == dstHost: mark success
  else:
    process_by_node(event)
    emit events for forwarded packets (append to queue)
detect loops via visited (packetId + nodeId + ifId), stop and mark loop
```

Keep packet objects immutable and track `trace` list of hop records for UI.

Determinism: process queue FIFO and fixed port ordering.

---

# Node config model (minimum for MVP)

* Host: interface(s) with MAC, IP/CIDR
* Switch: ports (no IP), VLAN database (VLAN IDs present), portMode (access/trunk), allowedVlans for trunk, MAC learning enabled (true/false)
* Router: interfaces with IP, static routes, ARP table (learned or static)
* Firewall: list of ACL rules, interfaces, default policy (allow/deny)
* Server: like host, but can run “services” (TCP port listeners) for future testing

UI will present per-node config as form based on JSON schema for that node type.

---

# UX flows (MVP)

* Drag node palette → place on canvas
* Click node → open config panel (forms with validation)
* Connect endpoints → create link; link properties modal for trunk/access selection
* Run test: select source host + destination host + packet proto/ports → Run → show progress bar, then display trace with per-hop decisions (expandable)
* Step mode: step through each trace record, animate packet on canvas

Error & explainability: when blocked, show the precise rule or config line that blocked it (ACL id, port, node).

---

# Security & data handling

* Local by default. Topology JSON stored in IndexedDB and exportable.
* No telemetry by default. If adding any telemetry, make it opt-in and anonymized.
* Validate all user inputs (CIDR, MAC formats) strictly.

---

# Sprint plan (detailed 12 weeks, 6 two-week sprints)

### Sprint 0 — Prep (week 0, optional 1 week)

* Repo + templates + tooling (Vite + React + TypeScript).
* Create `topology.schema.json` and initial acceptance tests (manual scenarios).
  Deliverable: repo skeleton + schema + CI unit test stub.

### Sprint 1 — Canvas & Basic Model (weeks 1–2)

* Implement React Flow canvas with node palette (host, switch, router, firewall).
* Implement create/delete nodes, drag/drop, position persist to a `Topology` object in Zustand.
* Implement link creation and basic link model.
* Save/load topology JSON to IndexedDB and export/import file.
  Deliverable: empty canvas → place nodes → connect → save/load JSON.

### Sprint 2 — Node Config UI & Validation (weeks 3–4)

* Build node config panels using React Hook Form for each node type.
* Implement CIDR/MAC validation. Update topology model when config saved.
* Implement link properties (access/trunk) UI.
* Add UI validation (e.g., IP collisions, duplicate MACs warnings).
  Deliverable: full config panels + validation.

### Sprint 3 — Simulator Core (weeks 5–6)

* Implement TypeScript simulator module (WebWorker) with core models: Packet, EventQueue.
* Implement host behavior, switch (MAC learning, VLAN handling), and link behavior.
* Unit tests for L2 behaviors: MAC learning, flooding, access/trunk tagging.
  Deliverable: run simulation in WebWorker (headless) with test harness.

### Sprint 4 — Routing & ACLs (weeks 7–8)

* Add router static routing, ARP resolution (simple), IP forwarding.
* Add ACL engine: ordered stateless rules with match fields. Unit tests + property tests for ACL correctness.
* Integrate simulator with topology model; implement API: `simulate(topology, packetSpec)` → trace.
  Deliverable: run reachability tests: host→host across VLANs and routing, with ACLs blocking/allowing.

### Sprint 5 — Run UI & Trace Visualization (weeks 9–10)

* Build Run panel: choose source host, dest, proto/ports; hit Run.
* Visualize trace: list of hops with decision reasons; animate packet on canvas in step mode.
* Implement loop detection & error messages.
* Add scenario examples: VLAN interconnect, trunk behavior, firewall blocked trace.
  Deliverable: full run/trace UX and three canonical scenario examples.

### Sprint 6 — Testing, Polish, Documentation & Release (weeks 11–12)

* Add E2E Playwright tests for the main flows.
* Polish UI: templates, undo/redo, persistent history.
* Write user docs and developer README (how to run, schema).
* Release v0.1 (host static build).
  Deliverable: MVP release + docs + test suite.

After MVP: plan sprints for advanced features (stateful firewall, NAT, DHCP, multi-user, plugins, performance via WASM).

---

# Testing strategy (detailed)

* Unit tests for each primitive (switch, router, ACL) — cover edge cases.
* Property tests (fast-check): random topologies but constrained (max nodes 20), assert invariants: no infinite loops; packets either reach or are blocked with a reason; VLAN isolation holds.
* Scenario regression tests: build canonical topologies (e.g., inter-VLAN routing via router-on-a-stick) and assert expected results.
* E2E UI tests: build a topology via UI, run a packet, assert UI shows success and expected trace.
* Continuous Integration: run unit + property + E2E on PRs.

---

# Quality gates & acceptance

* 80% unit test coverage on simulator core.
* All canonical scenarios pass.
* No UI regressions in E2E.
* Performance: small topologies (≤50 nodes) run trace in <2s on typical laptop for MVP.

---

# Non-functional requirements

* Deterministic simulation for reproducible debugging.
* UX responsive: canvas interactions <50ms ideally. Use virtualization for side panels.
* Extendable plugin model: node types described by JSON schema and registration API.

---

# Risk register & mitigations

* Simulator semantic bugs → mitigate with property testing + scenario tests.
* UI complexity → mitigate by small MVP scope and React Flow for heavy lifting.
* Performance at scale → mitigate: WebWorker, then WASM/Rust compiled simulator if needed.
* Scope creep → enforce MVP feature list and backlog prioritization.

---

# Developer deliverables (what you will produce each sprint)

* Sprint PRs with feature flags off until tested.
* Topology schema file and example JSON topologies.
* Simulator module with API and tests.
* README + developer docs for running locally.
* User docs: How to create topology, run test, explain results.

---

# Future roadmap (post-MVP priority)

1. Stateful firewall & connection tracking.
2. NAT, DHCP, and simple service emulation (HTTP/TCP listeners).
3. Multi-user collaboration (backend + WebSocket).
4. Plugin system + marketplace for node types.
5. Performance: compile simulator to WASM (Rust) for much larger topologies.
6. Import/Export to/from GNS3/EVE (if you want to allow transition to real emulation later).

---

# Dev environment checklist (what to provision now)

* Node 18+ (LTS), pnpm / yarn, GitHub repo, GitHub Actions, Vite.
* Install React Flow license? (free for community use; check licensing if commercial).
* Setup testing libs: Vitest, fast-check, Playwright.
* idb for IndexedDB persistence.
* Prettier + ESLint + TypeScript config.

---

# Example: Minimal simulator API (TypeScript types + functions)

```ts
// types.ts
type NodeId = string;
type IfId = string;

interface Packet {
  id: string;
  srcIp?: string;
  dstIp?: string;
  srcMac?: string;
  dstMac?: string;
  vlan?: number | null;
  proto?: 'tcp'|'udp'|'icmp'|'other';
  srcPort?: number;
  dstPort?: number;
}

interface TraceHop {
  time: number;
  nodeId: NodeId;
  ifId?: IfId;
  action: 'forward'|'drop'|'deliver'|'flood'|'learn'|'arp';
  reason?: string;
}

interface SimulationResult {
  success: boolean;
  trace: TraceHop[];
  reason?: string;
}

export function simulate(topology: Topology, packetSpec: Packet, opts?: SimOptions): SimulationResult
```

Implement simulate in a WebWorker, expose via `postMessage`.

---

# Final blunt advice

* Don’t overengineer protocols. Nail L2/L3 semantics cleanly first. If you get VLAN/tagging, MAC learning, and ACL ordering right, you already own 80% of the educational value.
* Prioritize testability: write the acceptance scenarios as tests before coding the simulator — this avoids subtle semantic bugs later.
* Build the UI and simulator in parallel (canvas + headless simulate harness) so you can test both independently.

---