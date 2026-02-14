
import { GoogleGenAI, Type } from "@google/genai";
import { Message, ToolCall, AgentConfig } from "../types";

const CLINE_SYSTEM_PROMPT = `
You are Cline, a highly advanced autonomous AI coding agent. 
Your goal is to help users build complex software by planning, executing commands, reading/writing files, and iterating until a task is complete.

Capabilities:
1. File System Access: read_file, write_file, list_files, search_files.
2. Terminal Access: execute_command (bash).
3. Browser Access: (Simulated) visit_url, screenshot.
4. Reasoning: Self-correcting logic, breaking large tasks into manageable steps.

Always follow a strict thought-action cycle:
- Thought: Analyze the user's request and current state.
- Action: Call a tool if needed.
- Result: Wait for the result of the tool call.

Current environment: Web Sandbox.
`;

export class GeminiAgent {
  private ai: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateResponse(
    messages: Message[], 
    config: AgentConfig,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const chatMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Use the model and temperature from the agent's unique configuration
      const stream = await this.ai.models.generateContentStream({
        model: config.model || 'gemini-2.5-flash-lite-latest',
        contents: chatMessages,
        config: {
          systemInstruction: CLINE_SYSTEM_PROMPT,
          temperature: config.temperature ?? 0.1,
        }
      });

      let fullText = "";
      for await (const chunk of stream) {
        const text = chunk.text || "";
        fullText += text;
        onChunk(text);
      }

      return fullText;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  // Helper to extract tool calls from text (Cline format)
  parseToolCalls(text: string): ToolCall[] {
    const tools: ToolCall[] = [];
    const toolRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
    let match;
    while ((match = toolRegex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        tools.push({
          id: Math.random().toString(36).substr(2, 9),
          name: parsed.name,
          args: parsed.args,
          status: 'pending'
        });
      } catch (e) {
        console.warn("Failed to parse tool call:", match[1]);
      }
    }
    return tools;
  }
}
