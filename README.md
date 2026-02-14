# Chat With Cline (Mission Control)

A "Mission Control" dashboard for the [Cline CLI](https://docs.cline.bot/cline-cli) that orchestrates autonomous AI agents via a beautiful, glassmorphic web interface.

![Mission Control](https://via.placeholder.com/1200x600/050505/3b82f6?text=Chat+With+Cline+Mission+Control)

## Features

- **Virtual Team Orchestration**: Spawn specialized agents (e.g., "Frontend Architect", "Security Auditor") with distinct configurations.
- **Real-time Terminal**: Integrated `xterm.js` terminal streaming direct output from the `cline` CLI.
- **Visual Context**: Drag-and-drop file uploads and context synchronization.
- **Persistent Memory**: "Rules" and "Skills" persistence to guide agent behavior.

## Architecture

This project uses a **Client-Server** architecture:
- **Frontend**: React (Vite) + Tailwind CSS + Socket.io Client.
- **Backend**: Node.js + Express + Socket.io + node-pty.

## Getting Started

### Prerequisites

1.  **Cline CLI**: Must be installed globally.
    ```bash
    npm install -g cline
    ```
2.  **Node.js**: v18+ recommended.

### Installation

1.  Clone the repository.
2.  Install dependencies (for both frontend and backend).
    ```bash
    npm install
    ```
3.  Create a `.env` file (see `.env.example`).
    ```bash
    cp .env.example .env
    ```

### Running the App

Start both the backend server and frontend client with one command:

```bash
npm start
```

- **Frontend**: Open [http://localhost:3000](http://localhost:3000)
- **Backend API**: Running at [http://localhost:3001](http://localhost:3001)

## License

MIT
