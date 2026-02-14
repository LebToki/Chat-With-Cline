
import { io, Socket } from 'socket.io-client';

export class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io('http://localhost:3001');
    }

    on(event: string, callback: (...args: any[]) => void) {
        this.socket.on(event, callback);
    }

    off(event: string, callback: (...args: any[]) => void) {
        this.socket.off(event, callback);
    }

    createAgent(name: string, config: any) {
        return fetch('http://localhost:3001/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, config })
        }).then(res => res.json());
    }

    listAgents() {
        return fetch('http://localhost:3001/api/agents').then(res => res.json());
    }

    sendMessage(agentId: string, message: string) {
        return fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, message })
        }).then(res => res.json());
    }
}

export const socketService = new SocketService();
