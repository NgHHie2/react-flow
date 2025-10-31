// src/services/websocketService.ts - Updated with Diagram Support
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Types
import {
  MessageHandler,
  ConnectionState,
  NodePositionUpdate,
  FieldUpdate,
  AddAttributeUpdate,
  DeleteAttributeUpdate,
  ForeignKeyConnectionUpdate,
  ForeignKeyDisconnectUpdate,
  AddModelUpdate,
  UpdateModelNameUpdate,
  DeleteModelUpdate,
  ToggleKeyTypeUpdate,
  FieldNameUpdate,
  FieldTypeUpdate,
} from "../types/websocket.types";

// Constants
import {
  WS_CONFIG,
  createDestinations,
  createTopics,
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

// ⭐ Extended ConnectionState with diagramId
interface ExtendedConnectionState extends ConnectionState {
  diagramId: string | null; // Current diagram being viewed
}

class WebSocketService {
  private client: Client | null = null;
  private handlers: MessageHandler = {};
  private state: ExtendedConnectionState = {
    connected: false,
    reconnectAttempts: 0,
    isManualDisconnect: false,
    reconnectTimeoutId: null,
    sessionId: null,
    diagramId: null, // ⭐ NEW
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
          if (Object.keys(this.handlers).length > 0 && this.state.diagramId) {
            this.connect(this.handlers, this.state.diagramId);
          }
        }, 1000);
      });
    }
  }

  private resetState(): void {
    this.state.isManualDisconnect = false;
    this.state.reconnectAttempts = 0;
    this.state.sessionId = null;
    // ⚠️ Don't reset diagramId - we might need it for reconnect
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

    // ✅ Prevent double subscription
    if (this.state.connected) {
      console.warn("⚠️ Already connected and subscribed");
      return;
    }

    this.state.connected = true;
    this.state.reconnectAttempts = 0;

    // Get sessionId...
    const socket = (this.client as any)?._webSocket;
    if (socket) {
      const sessionUrl = socket._transport?.url;
      if (sessionUrl) {
        const result = /\/([^/]+)\/websocket$/.exec(sessionUrl);
        if (result && result[1]) {
          this.state.sessionId = result[1];
          console.log(`🆔 Session ID: ${this.state.sessionId}`);
        }
      }
    }

    // ⭐ Check if we have a diagramId before subscribing
    if (!this.state.diagramId) {
      console.warn("⚠️ No diagramId set, skipping subscription");
      return;
    }

    // ✅ Subscribe with a small delay to ensure STOMP is ready
    setTimeout(() => {
      this.subscribeToUpdates();
      this.handlers.onConnect?.();
    }, 50);
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
          // ⭐ Use stored diagramId for reconnect
          if (this.state.diagramId) {
            this.connect(this.handlers, this.state.diagramId);
          }
        }
      }, delay);
    }
  }

  private subscribeToUpdates(): void {
    if (!this.client || !this.state.connected || !this.state.diagramId) {
      console.warn("⚠️ Cannot subscribe: client not ready or no diagramId");
      return;
    }

    try {
      const TOPICS = createTopics(this.state.diagramId);

      // ⭐ 1. Subscribe to VALIDATION ERRORS first
      console.log("📡 Subscribing to validation errors...");
      this.client.subscribe("/topic/validation-errors", (message) => {
        try {
          const error = JSON.parse(message.body);
          console.log("🚨 Received validation error:", error);

          // ⭐ Check if error is for current session
          if (error.sessionId === this.state.sessionId) {
            console.error(
              `❌ Diagram ${error.diagramId} validation failed: ${error.message}`
            );
            this.handlers.onError?.(error.message);
          }
        } catch (e) {
          console.error("Error parsing validation error:", e);
        }
      });

      // ⭐ 2. Subscribe to diagram-specific updates
      console.log(
        `📡 Subscribing to diagram ${this.state.diagramId} updates...`
      );
      this.client.subscribe(TOPICS.schemaUpdates, (message) => {
        this.handleMessage(message.body);
      });

      // ⭐ 3. Subscribe to personal error queue (for other errors)
      this.client.subscribe(TOPICS.userErrors, (message) => {
        this.handleErrorMessage(message.body);
      });

      console.log(
        `✅ Successfully subscribed to all topics for diagram ${this.state.diagramId}`
      );
    } catch (error) {
      console.error("❌ Error subscribing to updates:", error);
      this.handlers.onError?.("Failed to subscribe to updates");
      throw error;
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
      // Create message with tracking ID and diagramId
      const enhancedData = {
        ...createTrackedMessage(messageType, data),
        diagramId: this.state.diagramId, // ⭐ Include diagramId
      };

      this.client!.publish({
        destination,
        body: JSON.stringify(enhancedData),
      });

      console.log(
        `📤 Sent ${messageType} to diagram ${this.state.diagramId}:`,
        enhancedData
      );
    } catch (error) {
      console.error(`❌ Error sending ${messageType}:`, error);
      this.handlers.onError?.(`Failed to send ${messageType}`);
    }
  }

  // ⭐ NEW: Public API with diagramId parameter
  connect(handlers: MessageHandler = {}, diagramId: string): void {
    this.handlers = { ...this.handlers, ...handlers };
    this.state.isManualDisconnect = false;
    this.state.diagramId = diagramId; // ⭐ Store diagramId

    console.log(`🔌 Connecting to diagram ${diagramId}...`);

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

  // ⭐ NEW: Switch to different diagram
  switchDiagram(newDiagramId: string): void {
    if (this.state.diagramId === newDiagramId) {
      console.log(`Already subscribed to diagram ${newDiagramId}`);
      return;
    }

    console.log(
      `🔄 Switching from diagram ${this.state.diagramId} to ${newDiagramId}`
    );

    // Disconnect and reconnect with new diagramId
    this.disconnect();
    setTimeout(() => {
      this.connect(this.handlers, newDiagramId);
    }, 100);
  }

  // Message sending methods - ⭐ Now use dynamic destinations
  sendNodePositionUpdate(update: NodePositionUpdate): void {
    if (!this.state.diagramId) {
      console.error("❌ No diagramId set");
      return;
    }
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(
      DESTINATIONS.updateNodePosition,
      "NODE_POSITION_UPDATE",
      update
    );
  }

  sendFieldNameUpdate(update: FieldNameUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(
      DESTINATIONS.updateAttributeName,
      "FIELD_NAME_UPDATE",
      update
    );
  }

  sendFieldTypeUpdate(update: FieldTypeUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(
      DESTINATIONS.updateAttributeType,
      "FIELD_TYPE_UPDATE",
      update
    );
  }

  sendToggleKeyType(update: ToggleKeyTypeUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(DESTINATIONS.toggleKeyType, "TOGGLE_KEY_TYPE", update);
  }

  sendAddAttribute(update: AddAttributeUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    console.log("???");
    this.sendMessage(DESTINATIONS.addAttribute, "ADD_ATTRIBUTE", update);
  }

  sendDeleteAttribute(update: DeleteAttributeUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(DESTINATIONS.deleteAttribute, "DELETE_ATTRIBUTE", update);
  }

  sendForeignKeyConnect(update: ForeignKeyConnectionUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(
      DESTINATIONS.connectForeignKey,
      "FOREIGN_KEY_CONNECT",
      update
    );
  }

  sendForeignKeyDisconnect(update: ForeignKeyDisconnectUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(
      DESTINATIONS.disconnectForeignKey,
      "FOREIGN_KEY_DISCONNECT",
      update
    );
  }

  sendAddModel(update: AddModelUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(DESTINATIONS.addModel, "ADD_MODEL", update);
  }

  sendUpdateModelName(update: UpdateModelNameUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(DESTINATIONS.updateModelName, "UPDATE_MODEL_NAME", update);
  }

  sendDeleteModel(update: DeleteModelUpdate): void {
    if (!this.state.diagramId) return;
    const DESTINATIONS = createDestinations(this.state.diagramId);
    this.sendMessage(DESTINATIONS.deleteModel, "DELETE_MODEL", update);
  }

  // Utility methods
  isConnected(): boolean {
    return this.state.connected;
  }

  getSessionId(): string | null {
    return this.state.sessionId;
  }

  // ⭐ NEW
  getDiagramId(): string | null {
    return this.state.diagramId;
  }

  updateHandlers(handlers: Partial<MessageHandler>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  reset(): void {
    this.resetState();
  }

  // Debug methods (development only)
  getConnectionState(): ExtendedConnectionState {
    return { ...this.state };
  }

  getHandlers(): MessageHandler {
    return { ...this.handlers };
  }
}

export const websocketService = new WebSocketService();
