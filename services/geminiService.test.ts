import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiAgent } from './geminiService';

describe('GeminiAgent', () => {
  let agent: GeminiAgent;

  beforeEach(() => {
    agent = new GeminiAgent('test-api-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseToolCalls', () => {
    it('should parse a single valid tool call', () => {
      const text = '<tool_call>{"name": "test_tool", "args": {"foo": "bar"}}</tool_call>';
      const result = agent.parseToolCalls(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'test_tool',
        args: { foo: 'bar' },
        status: 'pending',
      });
      expect(result[0].id).toBeDefined();
    });

    it('should parse multiple valid tool calls', () => {
      const text = `
        Some text.
        <tool_call>{"name": "tool1", "args": {"a": 1}}</tool_call>
        Intermediate text.
        <tool_call>{"name": "tool2", "args": {"b": 2}}</tool_call>
      `;
      const result = agent.parseToolCalls(text);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('tool1');
      expect(result[1].name).toBe('tool2');
    });

    it('should skip invalid JSON and log a warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidJson = '{"name": "bad_tool", "args": { "unclosed" }';
      const text = `<tool_call>${invalidJson}</tool_call>`;

      const result = agent.parseToolCalls(text);

      expect(result).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse tool call:", invalidJson);
    });

    it('should handle a mix of valid and invalid tool calls', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const text = `
        <tool_call>{"name": "valid1", "args": {}}</tool_call>
        <tool_call>invalid json</tool_call>
        <tool_call>{"name": "valid2", "args": {}}</tool_call>
      `;

      const result = agent.parseToolCalls(text);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('valid1');
      expect(result[1].name).toBe('valid2');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should return an empty array when no tool calls are present', () => {
      const text = 'Just some regular text without any tags.';
      const result = agent.parseToolCalls(text);
      expect(result).toEqual([]);
    });

    it('should handle empty tool_call tags', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const text = '<tool_call></tool_call>';
      const result = agent.parseToolCalls(text);
      expect(result).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should ignore malformed tags (e.g., missing closing tag)', () => {
      const text = '<tool_call>{"name": "tool"}';
      const result = agent.parseToolCalls(text);
      expect(result).toHaveLength(0);
    });
  });
});
