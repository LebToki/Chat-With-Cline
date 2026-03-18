import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('socket.io-client', () => {
    return {
        io: vi.fn(() => ({
            on: vi.fn(),
            off: vi.fn()
        }))
    };
});

import { SocketService, socketService } from './socketService';

describe('SocketService', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it('should be instantiated as a singleton', () => {
        expect(socketService).toBeInstanceOf(SocketService);
    });

    describe('sendMessage', () => {
        it('should make a POST request with correct parameters', async () => {
            const mockResponse = { success: true };
            vi.mocked(global.fetch).mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            } as any);

            const result = await socketService.sendMessage('agent-1', 'Hello');

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: 'agent-1', message: 'Hello' })
            });
            expect(result).toEqual(mockResponse);
        });

        it('should handle fetch errors', async () => {
            vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
            await expect(socketService.sendMessage('agent-1', 'Hello')).rejects.toThrow('Network error');
        });
    });

    describe('createAgent', () => {
        it('should make a POST request to create an agent', async () => {
            const mockResponse = { id: 'agent-1', name: 'Agent Smith' };
            vi.mocked(global.fetch).mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            } as any);

            const config = { type: 'chat' };
            const result = await socketService.createAgent('Agent Smith', config);

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Agent Smith', config })
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('listAgents', () => {
        it('should make a GET request to list agents', async () => {
            const mockResponse = [{ id: 'agent-1' }];
            vi.mocked(global.fetch).mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            } as any);

            const result = await socketService.listAgents();

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/agents');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('socket operations', () => {
        it('should bind events using on()', () => {
            const callback = vi.fn();
            socketService.on('test-event', callback);

            // We need to access the private socket object to verify
            // Since it's typescript, we can use ts-ignore or any
            const socketInstance = (socketService as any).socket;
            expect(socketInstance.on).toHaveBeenCalledWith('test-event', callback);
        });

        it('should unbind events using off()', () => {
            const callback = vi.fn();
            socketService.off('test-event', callback);

            const socketInstance = (socketService as any).socket;
            expect(socketInstance.off).toHaveBeenCalledWith('test-event', callback);
        });
    });
});
