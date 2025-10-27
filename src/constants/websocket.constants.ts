// src/constants/websocket.constants.ts - Updated with FK constants
import { WebSocketConfig } from "../types/websocket.types";

// WebSocket Configuration
export const WS_CONFIG: WebSocketConfig = {
  url: "http://localhost:8080/ws",
  reconnectDelay: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 4000,
} as const;

/**
 * ⭐ NEW: Dynamic destinations based on diagramId
 * Usage: createDestinations(123) → /app/diagram/123/updateNodePosition
 */
export const createDestinations = (diagramId: number | string) => ({
  updateNodePosition: `/app/diagram/${diagramId}/updateNodePosition`,
  updateAttributeName: `/app/diagram/${diagramId}/updateAttributeName`,
  updateAttributeType: `/app/diagram/${diagramId}/updateAttributeType`,
  toggleKeyType: `/app/diagram/${diagramId}/toggleKeyType`,
  addAttribute: `/app/diagram/${diagramId}/addAttribute`,
  deleteAttribute: `/app/diagram/${diagramId}/deleteAttribute`,
  connectForeignKey: `/app/diagram/${diagramId}/connectForeignKey`,
  disconnectForeignKey: `/app/diagram/${diagramId}/disconnectForeignKey`,
  addModel: `/app/diagram/${diagramId}/addModel`,
  updateModelName: `/app/diagram/${diagramId}/updateModelName`,
  deleteModel: `/app/diagram/${diagramId}/deleteModel`,
});

/**
 * ⭐ NEW: Dynamic topics based on diagramId
 * Usage: createTopics(123) → /topic/diagram/123
 */
export const createTopics = (diagramId: number | string) => ({
  schemaUpdates: `/topic/diagram/${diagramId}`,
  userErrors: `/queue/errors`,
});

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
  ADD_MODEL: "ADD_MODEL",
  UPDATE_MODEL_NAME: "UPDATE_MODEL_NAME",
  DELETE_MODEL: "DELETE_MODEL",
  ERROR: "ERROR",
} as const;

// WebSocket Destinations
export const DESTINATIONS = {
  updateNodePosition: "/app/updateNodePosition",
  updateAttributeName: "/app/updateAttributeName",
  updateAttributeType: "/app/updateAttributeType",
  toggleKeyType: "/app/toggleKeyType",
  addAttribute: "/app/addAttribute",
  deleteAttribute: "/app/deleteAttribute",
  connectForeignKey: "/app/connectForeignKey",
  disconnectForeignKey: "/app/disconnectForeignKey",
  addModel: "/app/addModel",
  updateModelName: "/app/updateModelName",
  deleteModel: "/app/deleteModel",
} as const;

// Subscription Topics
export const TOPICS = {
  schemaUpdates: "/topic/schema-updates",
  userErrors: "/queue/errors",
} as const;

// Filtering Configuration
export const FILTER_CONFIG = {
  enableMessageFiltering: true,
  messageTrackingTTL: 30000, // 30 seconds
  maxTrackedMessages: 1000,
} as const;
