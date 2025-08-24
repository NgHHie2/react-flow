// src/constants/websocket.constants.ts - Updated with FK constants
import { WebSocketConfig } from "../types/websocket.types";

// WebSocket Configuration
export const WS_CONFIG: WebSocketConfig = {
  url: "http://localhost:8080/ws",
  reconnectDelay: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 4000,
} as const;

// Message Types
export const MESSAGE_TYPES = {
  NODE_POSITION_UPDATE: "NODE_POSITION_UPDATE",
  FIELD_UPDATE: "FIELD_UPDATE",
  TOGGLE_PRIMARY_KEY: "TOGGLE_PRIMARY_KEY",
  TOGGLE_FOREIGN_KEY: "TOGGLE_FOREIGN_KEY",
  ADD_ATTRIBUTE: "ADD_ATTRIBUTE",
  DELETE_ATTRIBUTE: "DELETE_ATTRIBUTE",
  FOREIGN_KEY_CONNECT: "FOREIGN_KEY_CONNECT",
  FOREIGN_KEY_DISCONNECT: "FOREIGN_KEY_DISCONNECT",
  ERROR: "ERROR",
} as const;

// WebSocket Destinations
export const DESTINATIONS = {
  updateNodePosition: "/app/updateNodePosition",
  updateAttribute: "/app/updateAttribute",
  togglePrimaryKey: "/app/togglePrimaryKey",
  toggleForeignKey: "/app/toggleForeignKey",
  addAttribute: "/app/addAttribute",
  deleteAttribute: "/app/deleteAttribute",
  connectForeignKey: "/app/connectForeignKey",
  disconnectForeignKey: "/app/disconnectForeignKey",
} as const;

// Subscription Topics
export const TOPICS = {
  schemaUpdates: "/topic/schema-updates",
  userErrors: "/user/queue/errors",
} as const;

// Filtering Configuration
export const FILTER_CONFIG = {
  enableMessageFiltering: true,
  messageTrackingTTL: 30000, // 30 seconds
  maxTrackedMessages: 1000,
} as const;
