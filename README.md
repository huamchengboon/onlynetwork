# 🌐 OnlyNetwork - Network Simulator

> **A simplified, vendor-agnostic, drag-and-drop network simulator for learning and prototyping network topologies.**

[![Status](https://img.shields.io/badge/status-under%20development-yellow)](https://github.com/huamchengboon/onlynetwork)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🎯 Project Idea

**OnlyNetwork** is a web-based network simulation tool inspired by Cisco Packet Tracer, designed to make network topology design and testing accessible to everyone—from students learning networking fundamentals to professionals prototyping network architectures.

### Core Philosophy

- **No CLI, No Syntax** - Everything is visual and form-based
- **Vendor-Agnostic** - Learn networking concepts, not vendor-specific commands
- **Beginner-Friendly** - Drag, drop, configure, and simulate
- **100% Client-Side** - Runs entirely in your browser, no backend required

## ✨ Features

### 🎨 Visual Topology Builder
- **Drag & Drop Interface** - Build network topologies visually on an interactive canvas
- **Device Library** - PC, Laptop, Phone, Server, Switch, Router, Firewall, Cloud, and Text Labels
- **Connection Tools** - Multiple cable types (Auto, Straight, Crossover, Console) with port-based connections
- **Canvas Controls** - Zoom, pan, fit-to-screen, grid snapping, and more

### ⚙️ Device Configuration
- **Form-Based Config** - No command-line syntax required
- **IP Configuration** - Set IP addresses, subnet masks, and gateways
- **Switch Settings** - VLAN configuration and MAC learning
- **Router Settings** - Interface IPs and static routing
- **Firewall Rules** - Access control lists and policies

### 🚀 Network Simulation
- **Real-Time Packet Simulation** - Visualize packet flow through your network
- **ICMP Ping Testing** - Test connectivity between devices
- **Path Visualization** - See exactly how packets travel through your topology
- **ARP Resolution** - Automatic MAC address resolution
- **L2/L3 Forwarding** - Switch MAC learning and router routing

### 💾 Project Management
- **Save & Load** - Persist your topologies locally
- **Export/Import** - Share topologies as JSON files
- **Offline-First** - Works completely offline

## 🛠️ Technology Stack

- **React** + **TypeScript** - Modern UI framework
- **ReactFlow** - Interactive network canvas
- **Zustand** - Lightweight state management
- **Graphlib** - Graph algorithms for topology analysis
- **Object-Oriented Design** - Device classes with polymorphic behavior
- **Vite** - Fast build tooling

## 🚧 Development Status

**⚠️ This project is currently under active development.**

### ✅ Implemented
- Core topology builder with drag-and-drop
- Device library (PC, Switch, Router, Firewall, Server, Laptop, Phone, Cloud, Label)
- Port-based connection system
- Device configuration forms
- Basic simulation engine with packet routing
- Ping testing functionality
- Save/load functionality

### 🔨 In Progress
- Enhanced packet visualization
- More simulation features
- Performance optimizations
- UI/UX improvements

### 📋 Planned
- Additional device types
- Advanced routing protocols
- Network analysis tools
- Export to various formats
- Collaborative features

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun** 1.0+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/huamchengboon/onlynetwork.git
cd onlynetwork

# Install dependencies (using Bun)
bun install

# Or using npm
npm install
```

### Development

```bash
# Start development server
bun dev

# Or using npm
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## 📖 Usage

1. **Add Devices** - Drag devices from the left sidebar onto the canvas
2. **Connect Devices** - Select a cable type, click a device, choose a port, then connect to another device
3. **Configure Devices** - Click a device to open the configuration panel on the right
4. **Test Connectivity** - Use the Ping test feature in device config to test connections
5. **Save Your Work** - Use the toolbar to save your topology locally

## 🏗️ Architecture

The project follows a modular, object-oriented architecture:

- **`/src/devices`** - Device classes (Host, Switch, Router, Firewall, Cloud)
- **`/src/simulator`** - Simulation engine and graph analysis
- **`/src/components`** - React components (Canvas, Toolbar, Config Panels)
- **`/src/store`** - Zustand state management
- **`/src/lib`** - Utility functions and validators

See [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md) for detailed architectural decisions.

## 🤝 Contributing

Contributions are welcome! Since this project is under active development, please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Cisco Packet Tracer
- Built with modern web technologies
- Designed for educational and prototyping purposes

## 📧 Contact

For questions, suggestions, or contributions, please open an issue on GitHub.

---

**Note:** This project is in active development. Features may change, and some functionality may be incomplete. Use at your own discretion.
