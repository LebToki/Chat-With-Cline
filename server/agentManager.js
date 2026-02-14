
import pty from 'node-pty';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AgentManager {
  constructor(io) {
    this.io = io;
    this.agents = new Map(); // id -> { process, config, history }
    this.baseDir = path.join(process.cwd(), 'data', 'agents');
    
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async createAgent(name, config) {
    const agentId = `agent_${Date.now()}`;
    const agentDir = path.join(this.baseDir, agentId);
    
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }

    // Initialize Cline process
    // We launch 'cline' in the agent's directory to isolate context.
    
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    
    // In a real implementation, we would pass specific flags.
    // For now, we start the shell and then send the 'cline' command.
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: agentDir,
      env: process.env
    });

    ptyProcess.onData((data) => {
      // Stream raw output to frontend via Socket.io
      this.io.emit(`agent:${agentId}:output`, data);
    });

    this.agents.set(agentId, {
      id: agentId,
      name,
      config,
      process: ptyProcess,
      createdAt: Date.now()
    });

    console.log(`Agent ${agentId} created.`);
    
    // Start Cline immediately
    // If we want JSON mode, we'd use: ptyProcess.write('cline --json\r');
    // But for the "Mission Control" visual terminal, standard output is fine for now.
    // We send a clear screen first just in case.
    ptyProcess.write('cline\r'); 

    return agentId;
  }

  listAgents() {
    return Array.from(this.agents.values()).map(a => ({
      id: a.id,
      name: a.name,
      status: 'active' 
    }));
  }

  async sendMessage(agentId, message) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');
    
    // Send input to the PTY process
    agent.process.write(message + '\r');
  }
}
