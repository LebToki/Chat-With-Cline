import { mock, vi } from "bun:test";

// Polyfill vi for bun test
if (typeof (globalThis as any).vi === 'undefined') {
  (globalThis as any).vi = {
    mock: (moduleName: string, factory: any) => mock.module(moduleName, factory),
    fn: (implementation?: any) => {
      const f = mock(implementation || (() => {}));
      (f as any).mockImplementation = (fn: any) => {
        f.mockImplementation(fn);
        return f;
      };
      (f as any).mockResolvedValue = (val: any) => {
        f.mockImplementation(() => Promise.resolve(val));
        return f;
      };
      (f as any).mockRejectedValue = (val: any) => {
        f.mockImplementation(() => Promise.reject(val));
        return f;
      };
      return f;
    },
    spyOn: (obj: any, method: string) => {
      const original = obj[method];
      const m = mock(original);
      obj[method] = m;
      (m as any).mockImplementation = (fn: any) => {
        obj[method] = fn;
        return m;
      };
      (m as any).mockRestore = () => {
        obj[method] = original;
      };
      return m;
    },
    restoreAllMocks: () => {}, // placeholder
    clearAllMocks: () => {} // placeholder
  };
}

mock.module("@google/genai", () => {
  return {
    GoogleGenAI: class {
      constructor() {}
      models = {
        generateContentStream: () => {}
      };
    },
    Type: {
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN',
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY'
    }
  };
});

// Also mock vitest so the import in the test file doesn't fail
mock.module("vitest", () => {
  return {
    describe: (name: string, fn: any) => (globalThis as any).describe(name, fn),
    it: (name: string, fn: any) => (globalThis as any).it(name, fn),
    expect: (val: any) => (globalThis as any).expect(val),
    vi: (globalThis as any).vi,
    beforeEach: (fn: any) => (globalThis as any).beforeEach(fn),
    afterEach: (fn: any) => (globalThis as any).afterEach(fn),
  };
});
