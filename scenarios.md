# Manual Acceptance Scenarios

## Scenario 1: Basic Connectivity
1. Create two Host nodes (Host A, Host B).
2. Connect them via a Switch.
3. Configure Host A: IP 192.168.1.10/24.
4. Configure Host B: IP 192.168.1.11/24.
5. Run simulation: Ping from Host A to Host B.
6. Expectation: Success. Trace shows packet going Host A -> Switch -> Host B.

## Scenario 2: VLAN Isolation
1. Create two Host nodes (Host A, Host B) and one Switch.
2. Connect Host A to Switch Port 1 (Access VLAN 10).
3. Connect Host B to Switch Port 2 (Access VLAN 20).
4. Configure IPs in same subnet (e.g., 192.168.1.10 and .11).
5. Run simulation: Ping from Host A to Host B.
6. Expectation: Failure. Switch drops packet from Port 1 because destination is on Port 2 (VLAN 20) which is different from source VLAN 10.

## Scenario 3: Router Inter-VLAN
1. Setup Scenario 2.
2. Add a Router.
3. Connect Router to Switch Port 3 (Trunk VLANs 10, 20).
4. Configure Router with sub-interfaces/SVI for VLAN 10 (192.168.10.1/24) and VLAN 20 (192.168.20.1/24).
5. Configure Host A: 192.168.10.10/24, Gateway 192.168.10.1.
6. Configure Host B: 192.168.20.10/24, Gateway 192.168.20.1.
7. Run simulation: Ping Host A to Host B.
8. Expectation: Success. Host A -> Switch -> Router -> Switch -> Host B.
