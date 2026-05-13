
import { mock } from "bun:test";

mock.module("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {}
    models = {
      generateContentStream: () => {}
    }
  },
  Type: {}
}));

mock.module("socket.io-client", () => ({
  io: () => ({
    on: () => {},
    emit: () => {},
    off: () => {}
  })
}));
