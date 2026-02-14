
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { AgentManager } from './agentManager.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Vite default
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;
const agentManager = new AgentManager(io);

app.use(cors({
  origin: "http://localhost:3000"
}));
app.use(express.json());

// Root route for sanity check
app.get('/', (req, res) => {
  res.send('Chat-With-Cline API Server is running. Visit <a href="http://localhost:3000">http://localhost:3000</a> to use the app.');
});

// API Routes
app.post('/api/agent', async (req, res) => {
  try {
    const { name, config } = req.body;
    const agentId = await agentManager.createAgent(name, config);
    res.json({ success: true, agentId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/agents', (req, res) => {
  const agents = agentManager.listAgents();
  res.json({ success: true, agents });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { agentId, message } = req.body;
    await agentManager.sendMessage(agentId, message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
