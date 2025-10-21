// types/react-native-event-source.d.ts
declare module 'react-native-event-source' {
  export interface RNEventSourceInit {
    headers?: Record<string, string>;
  }

  export interface RNEventSourceMessage {
    data: string;
    lastEventId?: string;
  }

  export default class EventSource {
    constructor(url: string, init?: RNEventSourceInit);
    onopen: ((ev: any) => void) | null;
    onmessage: ((ev: RNEventSourceMessage) => void) | null;
    onerror: ((ev: any) => void) | null;
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    close(): void;
    readyState?: number;
  }
}
