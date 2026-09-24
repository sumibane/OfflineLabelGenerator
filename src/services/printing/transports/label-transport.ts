export interface LabelTransport {
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  send(data: Uint8Array): Promise<void>;
}
