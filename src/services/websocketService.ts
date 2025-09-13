// src/services/websocketService.ts - Updated with FK methods
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Types
import {
  MessageHandler,
  ConnectionState,
  NodePositionUpdate,
  FieldUpdate,
  TogglePrimaryKeyUpdate,
  ToggleForeignKeyUpdate,
  AddAttributeUpdate,
  DeleteAttributeUpdate,
  ForeignKeyConnectionUpdate,
  ForeignKeyDisconnectUpdate,
  AddModelUpdate,
  UpdateModelNameUpdate,
  DeleteModelUpdate,
} from "../types/websocket.types";

// Constants
import {
  WS_CONFIG,
  DESTINATIONS,
  TOPICS,
} from "../constants/websocket.constants";

// Utils
import {
  calculateReconnectDelay,
  parseWebSocketMessage,
  routeMessage,
  createDebugLogger,
  validateMessagePayload,
  canSendMessage,
  safeCleanupTimeout,
  createTrackedMessage,
  messageTracker,
} from "../utils/websocket.utils";

class WebSocketService {
  private client: Client | null = null;
  private handlers: MessageHandler = {};
  private state: ConnectionState = {
    connected: false,
    reconnectAttempts: 0,
    isManualDisconnect: false,
    reconnectTimeoutId: null,
    sessionId: null,
  };

  constructor() {
    this.setupHMR();
  }

  private setupHMR(): void {
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        console.log("🔄 HMR: Disposing WebSocket connection");
        this.state.isManualDisconnect = true;
        this.disconnect();
      });

      import.meta.hot.accept(() => {
        console.log("🔄 HMR: Re-initializing WebSocket");
        this.resetState();
        setTimeout(() => {
          if (Object.keys(this.handlers).length > 0) {
            this.connect(this.handlers);
          }
        }, 1000);
      });
    }
  }

  private resetState(): void {
    this.state.isManualDisconnect = false;
    this.state.reconnectAttempts = 0;
    this.state.sessionId = null;
    safeCleanupTimeout(this.state.reconnectTimeoutId);
    this.state.reconnectTimeoutId = null;
    messageTracker.clear();
  }

  private createClient(): Client {
    const socket = new SockJS(WS_CONFIG.url);
    return new Client({
      webSocketFactory: () => socket,
      connectHeaders: {},
      debug: createDebugLogger(),
      reconnectDelay: WS_CONFIG.reconnectDelay,
      heartbeatIncoming: WS_CONFIG.heartbeatInterval,
      heartbeatOutgoing: WS_CONFIG.heartbeatInterval,
      onConnect: (frame) => {
        // lấy sessionId từ SockJS transport URL
        // @ts-ignore vì SockJS không export type này
        const sessionUrl = socket._transport?.url;
        if (sessionUrl) {
          const result = /\/([^/]+)\/websocket$/.exec(sessionUrl);
          if (result && result[1]) {
            const sessionId = result[1];
            console.log("SockJS sessionId:", sessionId);
            this.state.sessionId = sessionId;
          }
        }

        this.handleConnect(frame);
      },
      onDisconnect: this.handleDisconnect.bind(this),
      onStompError: this.handleStompError.bind(this),
      onWebSocketError: this.handleWebSocketError.bind(this),
    });
  }

  private handleConnect(frame: any): void {
    console.log("✅ Connected to WebSocket");
    this.state.connected = true;
    this.state.reconnectAttempts = 0;
    console.log(`🆔 Session ID: ${this.state.sessionId}`);

    this.handlers.onConnect?.();
    this.subscribeToUpdates();
  }

  private handleDisconnect(): void {
    console.log("❌ Disconnected from WebSocket");
    this.state.connected = false;
    this.state.sessionId = null;
    this.handlers.onDisconnect?.();

    if (!this.state.isManualDisconnect) {
      this.scheduleReconnect();
    }
  }

  private handleStompError(frame: any): void {
    const errorMessage = frame.headers?.["message"] || "Unknown STOMP error";
    console.error("💥 STOMP Error:", errorMessage);
    this.handlers.onError?.(errorMessage);

    if (!this.state.isManualDisconnect) {
      this.scheduleReconnect();
    }
  }

  private handleWebSocketError(error: any): void {
    console.error("💥 WebSocket Error:", error);
    if (!this.state.isManualDisconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    safeCleanupTimeout(this.state.reconnectTimeoutId);

    if (
      this.state.reconnectAttempts < WS_CONFIG.maxReconnectAttempts &&
      !this.state.isManualDisconnect
    ) {
      this.state.reconnectAttempts++;
      const delay = calculateReconnectDelay(
        this.state.reconnectAttempts,
        WS_CONFIG.reconnectDelay
      );

      console.log(
        `🔄 Reconnect attempt ${this.state.reconnectAttempts}/${WS_CONFIG.maxReconnectAttempts} in ${delay}ms`
      );

      this.state.reconnectTimeoutId = setTimeout(() => {
        if (!this.state.isManualDisconnect && !this.state.connected) {
          this.client = this.createClient();
          this.connect(this.handlers);
        }
      }, delay);
    }
  }

  private subscribeToUpdates(): void {
    if (!this.client || !this.state.connected) return;

    try {
      // Subscribe to schema updates
      this.client.subscribe(TOPICS.schemaUpdates, (message) => {
        this.handleMessage(message.body);
      });

      // Subscribe to personal error queue
      this.client.subscribe(TOPICS.userErrors, (message) => {
        this.handleErrorMessage(message.body);
      });

      console.log("📡 Subscribed to WebSocket topics");
    } catch (error) {
      console.error("❌ Error subscribing to updates:", error);
      this.handlers.onError?.("Failed to subscribe to updates");
    }
  }

  private handleMessage(messageBody: string): void {
    const response = parseWebSocketMessage(messageBody);
    console.log("state: ", this.state);
    if (response) {
      routeMessage(response, this.handlers, this.state.sessionId);
    }
  }

  private handleErrorMessage(messageBody: string): void {
    const response = parseWebSocketMessage<string>(messageBody);
    if (response) {
      this.handlers.onError?.(response.data);
    }
  }

  private sendMessage(
    destination: string,
    messageType: string,
    data: any
  ): void {
    if (!canSendMessage(this.state.connected, this.client)) {
      return;
    }

    if (!validateMessagePayload(data)) {
      this.handlers.onError?.("Invalid message payload");
      return;
    }

    try {
      // Create message with tracking ID
      const enhancedData = createTrackedMessage(messageType, data);

      this.client!.publish({
        destination,
        body: JSON.stringify(enhancedData),
      });

      console.log(`📤 Sent ${messageType}:`, enhancedData);
    } catch (error) {
      console.error(`❌ Error sending ${messageType}:`, error);
      this.handlers.onError?.(`Failed to send ${messageType}`);
    }
  }

  // Public API
  connect(handlers: MessageHandler = {}): void {
    this.handlers = { ...this.handlers, ...handlers };
    this.state.isManualDisconnect = false;

    if (!this.state.connected) {
      try {
        this.client = this.createClient();
        this.client.activate();
      } catch (error) {
        console.error("❌ Failed to connect:", error);
        this.handlers.onError?.("Failed to connect to WebSocket");
        this.scheduleReconnect();
      }
    }
  }

  disconnect(): void {
    this.state.isManualDisconnect = true;
    safeCleanupTimeout(this.state.reconnectTimeoutId);
    this.state.reconnectTimeoutId = null;

    if (this.client && this.state.connected) {
      this.client.deactivate();
    }
  }

  // Message sending methods
  sendNodePositionUpdate(update: NodePositionUpdate): void {
    this.sendMessage(
      DESTINATIONS.updateNodePosition,
      "NODE_POSITION_UPDATE",
      update
    );
  }

  sendFieldUpdate(update: FieldUpdate): void {
    this.sendMessage(DESTINATIONS.updateAttribute, "FIELD_UPDATE", update);
  }

  sendTogglePrimaryKey(update: TogglePrimaryKeyUpdate): void {
    this.sendMessage(
      DESTINATIONS.togglePrimaryKey,
      "TOGGLE_PRIMARY_KEY",
      update
    );
  }

  sendToggleForeignKey(update: ToggleForeignKeyUpdate): void {
    this.sendMessage(
      DESTINATIONS.toggleForeignKey,
      "TOGGLE_FOREIGN_KEY",
      update
    );
  }

  sendAddAttribute(update: AddAttributeUpdate): void {
    console.log("???");
    this.sendMessage(DESTINATIONS.addAttribute, "ADD_ATTRIBUTE", update);
  }

  sendDeleteAttribute(update: DeleteAttributeUpdate): void {
    this.sendMessage(DESTINATIONS.deleteAttribute, "DELETE_ATTRIBUTE", update);
  }

  sendForeignKeyConnect(update: ForeignKeyConnectionUpdate): void {
    this.sendMessage(
      DESTINATIONS.connectForeignKey,
      "FOREIGN_KEY_CONNECT",
      update
    );
  }

  sendForeignKeyDisconnect(update: ForeignKeyDisconnectUpdate): void {
    this.sendMessage(
      DESTINATIONS.disconnectForeignKey,
      "FOREIGN_KEY_DISCONNECT",
      update
    );
  }

  sendAddModel(update: AddModelUpdate): void {
    this.sendMessage(DESTINATIONS.addModel, "ADD_MODEL", update);
  }

  sendUpdateModelName(update: UpdateModelNameUpdate): void {
    this.sendMessage(DESTINATIONS.updateModelName, "UPDATE_MODEL_NAME", update);
  }

  sendDeleteModel(update: DeleteModelUpdate): void {
    this.sendMessage(DESTINATIONS.deleteModel, "DELETE_MODEL", update);
  }

  // Utility methods
  isConnected(): boolean {
    return this.state.connected;
  }

  getSessionId(): string | null {
    return this.state.sessionId;
  }

  updateHandlers(handlers: Partial<MessageHandler>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  reset(): void {
    this.resetState();
  }

  // Debug methods (development only)
  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  getHandlers(): MessageHandler {
    return { ...this.handlers };
  }
}

export const websocketService = new WebSocketService();
