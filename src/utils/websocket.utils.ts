// src/utils/websocket.utils.ts - Updated with FK message routing
import { WebSocketResponse, MessageHandler } from "../types/websocket.types";
import { MESSAGE_TYPES, FILTER_CONFIG } from "../constants/websocket.constants";

// Message Tracker for preventing echo
class MessageTracker {
  private sentMessages = new Set<string>();

  /**
   * Generate unique message ID
   */
  generateMessageId(type: string, data: any): string {
    const timestamp = Date.now();
    const dataHash = this.hashData(data);
    return `${type}_${dataHash}_${timestamp}`;
  }

  /**
   * Mark message as sent by this client
   */
  markAsSent(messageId: string): void {
    this.sentMessages.add(messageId);

    // Auto cleanup after TTL
    setTimeout(() => {
      this.sentMessages.delete(messageId);
    }, FILTER_CONFIG.messageTrackingTTL);
  }

  /**
   * Check if message was sent by this client
   */
  wasSentByClient(messageId: string): boolean {
    return this.sentMessages.has(messageId);
  }

  /**
   * Simple hash function for data
   */
  private hashData(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear all tracked messages
   */
  clear(): void {
    this.sentMessages.clear();
  }
}

// Global message tracker
export const messageTracker = new MessageTracker();

/**
 * Calculate exponential backoff delay
 */
export const calculateReconnectDelay = (
  attempt: number,
  baseDelay: number
): number => {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
};

/**
 * Parse WebSocket message safely
 */
export const parseWebSocketMessage = <T>(
  messageBody: string
): WebSocketResponse<T> | null => {
  try {
    return JSON.parse(messageBody) as WebSocketResponse<T>;
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
    return null;
  }
};

/**
 * Route message to appropriate handler with filtering
 */
export const routeMessage = (
  response: WebSocketResponse<any>,
  handlers: MessageHandler,
  currentSessionId: string | null
): void => {
  if (!response || !response.type) return;

  // CHỈ FILTER CHO POSITION UPDATES để tránh echo khi drag
  // Các update khác như ADD_ATTRIBUTE, ADD_MODEL thì tất cả clients đều nhận
  const shouldFilterForCurrentClient =
    response.type === "NODE_POSITION_UPDATE" &&
    response.sessionId === currentSessionId;

  if (shouldFilterForCurrentClient) {
    console.log(`⏸️ Filtering ${response.type} for current client`);
    return;
  }

  console.log(`📨 Processing ${response.type} for client`);

  try {
    switch (response.type) {
      case "NODE_POSITION_UPDATE":
        handlers.onNodePositionUpdate?.(response.data);
        break;
      case "FIELD_UPDATE":
        handlers.onFieldUpdate?.(response.data);
        break;
      case "TOGGLE_PRIMARY_KEY":
        handlers.onTogglePrimaryKey?.(response.data);
        break;
      case "TOGGLE_FOREIGN_KEY":
        handlers.onToggleForeignKey?.(response.data);
        break;
      case "ADD_ATTRIBUTE":
        handlers.onAddAttribute?.(response.data);
        break;
      case "DELETE_ATTRIBUTE":
        handlers.onDeleteAttribute?.(response.data);
        break;
      case "FOREIGN_KEY_CONNECT":
        handlers.onForeignKeyConnect?.(response.data);
        break;
      case "FOREIGN_KEY_DISCONNECT":
        handlers.onForeignKeyDisconnect?.(response.data);
        break;
      case "ADD_MODEL":
        handlers.onAddModel?.(response.data);
        break;
      case "UPDATE_MODEL_NAME":
        handlers.onUpdateModelName?.(response.data);
        break;
      case "DELETE_MODEL":
        handlers.onDeleteModel?.(response.data);
        break;
      default:
        console.warn(`Unknown message type: ${response.type}`);
    }
  } catch (error) {
    console.error(`Error processing ${response.type}:`, error);
  }
};

/**
 * Create message with tracking ID
 */
export const createTrackedMessage = (type: string, data: any): any => {
  const messageId = messageTracker.generateMessageId(type, data);
  messageTracker.markAsSent(messageId);

  return {
    ...data,
    messageId,
    clientTimestamp: Date.now(),
  };
};

/**
 * Create debug logger
 */
export const createDebugLogger = () => {
  if (import.meta.env.DEV) {
    return (str: string) => console.log("🔌 STOMP:", str);
  }
  return () => {};
};

/**
 * Validate message payload
 */
export const validateMessagePayload = (data: any): boolean => {
  if (!data || typeof data !== "object") {
    console.error("❌ Invalid message payload: must be an object");
    return false;
  }
  return true;
};

/**
 * Check if WebSocket can send messages
 */
export const canSendMessage = (connected: boolean, client: any): boolean => {
  if (!connected) {
    console.warn("⚠️ WebSocket not connected, message not sent");
    return false;
  }
  if (!client) {
    console.error("❌ WebSocket client not initialized");
    return false;
  }
  return true;
};

/**
 * Safely cleanup timeout
 */
export const safeCleanupTimeout = (timeoutId: NodeJS.Timeout | null): void => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
};
