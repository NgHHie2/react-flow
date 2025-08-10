// src/services/websocketService.ts - Updated with new message types
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface NodePositionUpdate {
  nodeId: string;
  modelId: number;
  positionX: number;
  positionY: number;
  diagramId: number;
  sessionId?: string;
}

export interface FieldUpdate {
  attributeId: number;
  attributeName: string;
  attributeType: string;
  modelName: string;
  modelId: number;
  sessionId?: string;
}

export interface TogglePrimaryKeyUpdate {
  modelName: string;
  modelId: number;
  attributeId: number;
  sessionId?: string;
}

export interface ToggleForeignKeyUpdate {
  modelName: string;
  modelId: number;
  attributeId: number;
  sessionId?: string;
}

export interface AddAttributeUpdate {
  modelName: string;
  modelId: number;
  attributeName: string;
  dataType: string;
  sessionId?: string;
}

export interface DeleteAttributeUpdate {
  modelName: string;
  modelId: number;
  attributeId: number;
  sessionId?: string;
}

export interface WebSocketResponse<T> {
  type: string;
  data: T;
  sessionId: string;
  timestamp: number;
}

export type MessageHandler = {
  onNodePositionUpdate?: (data: NodePositionUpdate) => void;
  onFieldUpdate?: (data: FieldUpdate) => void;
  onTogglePrimaryKey?: (data: TogglePrimaryKeyUpdate) => void;
  onToggleForeignKey?: (data: ToggleForeignKeyUpdate) => void;
  onAddAttribute?: (data: AddAttributeUpdate) => void;
  onDeleteAttribute?: (data: DeleteAttributeUpdate) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private handlers: MessageHandler = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isManualDisconnect = false;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;

  constructor() {
    this.setupClient();

    // Handle Vite HMR
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        console.log("HMR: Disposing WebSocket connection");
        this.isManualDisconnect = true;
        this.disconnect();
      });

      import.meta.hot.accept(() => {
        console.log("HMR: Re-initializing WebSocket");
        this.isManualDisconnect = false;
        this.reconnectAttempts = 0;
        setTimeout(() => {
          if (Object.keys(this.handlers).length > 0) {
            this.connect(this.handlers);
          }
        }, 1000);
      });
    }
  }

  private setupClient() {
    this.client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: {},
      debug: (str) => {
        console.log("STOMP: " + str);
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("Connected to WebSocket");
        this.connected = true;
        this.reconnectAttempts = 0;
        this.handlers.onConnect?.();
        this.subscribeToUpdates();
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
        this.connected = false;
        this.handlers.onDisconnect?.();

        if (!this.isManualDisconnect) {
          this.scheduleReconnect();
        }
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        this.handlers.onError?.(
          "Connection error: " + frame.headers["message"]
        );

        if (!this.isManualDisconnect) {
          this.scheduleReconnect();
        }
      },
      onWebSocketError: (error) => {
        console.error("WebSocket error:", error);
        if (!this.isManualDisconnect) {
          this.scheduleReconnect();
        }
      },
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.isManualDisconnect
    ) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        30000
      );

      console.log(
        `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
      );

      this.reconnectTimeoutId = setTimeout(() => {
        if (!this.isManualDisconnect && !this.connected) {
          console.log(`Reconnect attempt ${this.reconnectAttempts}`);
          this.setupClient();
          this.connect(this.handlers);
        }
      }, delay);
    }
  }

  connect(handlers: MessageHandler = {}) {
    this.handlers = { ...this.handlers, ...handlers };
    this.isManualDisconnect = false;

    if (!this.connected && this.client) {
      try {
        this.client.activate();
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
        this.handlers.onError?.("Failed to connect to WebSocket");
        this.scheduleReconnect();
      }
    }
  }

  disconnect() {
    this.isManualDisconnect = true;

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.client && this.connected) {
      this.client.deactivate();
    }
  }

  private subscribeToUpdates() {
    if (!this.client || !this.connected) return;

    try {
      // Subscribe to schema updates
      this.client.subscribe("/topic/schema-updates", (message) => {
        try {
          const response: WebSocketResponse<any> = JSON.parse(message.body);

          // Don't process messages from our own session
          if (response.sessionId === this.getSessionId()) {
            return;
          }

          switch (response.type) {
            case "NODE_POSITION_UPDATE":
              this.handlers.onNodePositionUpdate?.(
                response.data as NodePositionUpdate
              );
              break;
            case "FIELD_UPDATE":
              this.handlers.onFieldUpdate?.(response.data as FieldUpdate);
              break;
            case "TOGGLE_PRIMARY_KEY":
              this.handlers.onTogglePrimaryKey?.(
                response.data as TogglePrimaryKeyUpdate
              );
              break;
            case "TOGGLE_FOREIGN_KEY":
              this.handlers.onToggleForeignKey?.(
                response.data as ToggleForeignKeyUpdate
              );
              break;
            case "ADD_ATTRIBUTE":
              this.handlers.onAddAttribute?.(
                response.data as AddAttributeUpdate
              );
              break;
            case "DELETE_ATTRIBUTE":
              this.handlers.onDeleteAttribute?.(
                response.data as DeleteAttributeUpdate
              );
              break;
            case "ERROR":
              this.handlers.onError?.(response.data as string);
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      // Subscribe to personal error queue
      this.client.subscribe("/user/queue/errors", (message) => {
        try {
          const response: WebSocketResponse<string> = JSON.parse(message.body);
          this.handlers.onError?.(response.data);
        } catch (error) {
          console.error("Error parsing error message:", error);
        }
      });
    } catch (error) {
      console.error("Error subscribing to updates:", error);
      this.handlers.onError?.("Failed to subscribe to updates");
    }
  }

  sendNodePositionUpdate(update: NodePositionUpdate) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected, queuing message...");
      return;
    }

    try {
      this.client.publish({
        destination: "/app/updateNodePosition",
        body: JSON.stringify(update),
      });
    } catch (error) {
      console.error("Error sending node position update:", error);
      this.handlers.onError?.("Failed to send position update");
    }
  }

  sendFieldUpdate(update: FieldUpdate) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected, queuing message...");
      return;
    }

    try {
      this.client.publish({
        destination: "/app/updateAttribute",
        body: JSON.stringify(update),
      });
    } catch (error) {
      console.error("Error sending field update:", error);
      this.handlers.onError?.("Failed to send field update");
    }
  }

  sendTogglePrimaryKey(update: TogglePrimaryKeyUpdate) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected, queuing message...");
      return;
    }

    try {
      this.client.publish({
        destination: "/app/togglePrimaryKey",
        body: JSON.stringify(update),
      });
    } catch (error) {
      console.error("Error sending toggle primary key:", error);
      this.handlers.onError?.("Failed to toggle primary key");
    }
  }

  sendToggleForeignKey(update: ToggleForeignKeyUpdate) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected, queuing message...");
      return;
    }

    try {
      this.client.publish({
        destination: "/app/toggleForeignKey",
        body: JSON.stringify(update),
      });
    } catch (error) {
      console.error("Error sending toggle foreign key:", error);
      this.handlers.onError?.("Failed to toggle foreign key");
    }
  }

  sendAddAttribute(update: AddAttributeUpdate) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected, queuing message...");
      return;
    }

    try {
      this.client.publish({
        destination: "/app/addAttribute",
        body: JSON.stringify(update),
      });
    } catch (error) {
      console.error("Error sending add attribute:", error);
      this.handlers.onError?.("Failed to add attribute");
    }
  }

  sendDeleteAttribute(update: DeleteAttributeUpdate) {
    if (!this.client || !this.connected) {
      console.warn("WebSocket not connected, queuing message...");
      return;
    }

    try {
      this.client.publish({
        destination: "/app/deleteAttribute",
        body: JSON.stringify(update),
      });
    } catch (error) {
      console.error("Error sending delete attribute:", error);
      this.handlers.onError?.("Failed to delete attribute");
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private getSessionId(): string | null {
    return this.client?.connectedVersion || null;
  }

  updateHandlers(handlers: Partial<MessageHandler>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  reset() {
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
}

export const websocketService = new WebSocketService();
