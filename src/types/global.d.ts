// src/types/global.d.ts
declare global {
  interface Window {
    sendFieldUpdate?: (update: any) => void;
    sendTogglePrimaryKey?: (update: any) => void;
    sendToggleForeignKey?: (update: any) => void;
    sendAddAttribute?: (update: any) => void;
    sendDeleteAttribute?: (update: any) => void;
    sendForeignKeyConnect?: (update: any) => void;
    sendForeignKeyDisconnect?: (update: any) => void;
  }
}

export {};
