
import { describe, it, expect, mock } from "bun:test";
import { GeminiAgent } from "./geminiService";

// Mock @google/genai
mock.module("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {}
    models = {
      generateContentStream: () => {}
    }
  }
}));

describe("GeminiAgent", () => {
  const agent = new GeminiAgent("test-api-key");

  describe("parseToolCalls", () => {
    it("should parse tool calls and generate UUIDs for IDs", () => {
      const text = `
        I will now read the file.
        <tool_call>
        {
          "name": "read_file",
          "args": { "path": "test.txt" }
        }
        </tool_call>
      `;

      const tools = agent.parseToolCalls(text);

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("read_file");
      expect(tools[0].args).toEqual({ path: "test.txt" });
      expect(tools[0].status).toBe("pending");

      // UUID regex (v4-like)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(tools[0].id).toMatch(uuidRegex);
    });

    it("should handle multiple tool calls with unique UUIDs", () => {
      const text = `
        <tool_call>{"name": "tool1", "args": {}}</tool_call>
        <tool_call>{"name": "tool2", "args": {}}</tool_call>
      `;

      const tools = agent.parseToolCalls(text);

      expect(tools).toHaveLength(2);
      expect(tools[0].id).not.toBe(tools[1].id);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(tools[0].id).toMatch(uuidRegex);
      expect(tools[1].id).toMatch(uuidRegex);
    });

    it("should skip invalid JSON within tool_call tags", () => {
      const text = `
        <tool_call>invalid json</tool_call>
        <tool_call>{"name": "valid_tool", "args": {}}</tool_call>
      `;

      const tools = agent.parseToolCalls(text);

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("valid_tool");
    });
  });
});
