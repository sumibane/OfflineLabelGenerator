import type { LabelTransport } from "../label-transport";

export class MockTransport implements LabelTransport {
  async connect(): Promise<void> {
    console.log("=== MOCK TRANSPORT CONNECT ===");
  }

  async disconnect(): Promise<void> {
    console.log("=== MOCK TRANSPORT DISCONNECT ===");
  }

  async send(data: Uint8Array): Promise<void> {
    const commands = new TextDecoder().decode(data);

    console.log("=== MOCK TRANSPORT SEND ===");
    console.log(commands);
    console.log("Byte length:", data.length);
  }
}
