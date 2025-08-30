// src/types/websocket.types.ts - Updated with FK types
export interface BaseUpdate {
  sessionId?: string;
  messageId?: string;
  clientTimestamp?: number;
}

export interface NodePositionUpdate extends BaseUpdate {
  nodeId: string;
  modelId: number;
  positionX: number;
  positionY: number;
  diagramId: number;
}

export interface FieldUpdate extends BaseUpdate {
  attributeId: number;
  attributeName: string;
  attributeType: string;
  modelName: string;
  modelId: number;
}

export interface ToggleKeyUpdate extends BaseUpdate {
  modelName: string;
  modelId: number;
  attributeId: number;
}

export type TogglePrimaryKeyUpdate = ToggleKeyUpdate;
export type ToggleForeignKeyUpdate = ToggleKeyUpdate;

export interface AddAttributeUpdate extends BaseUpdate {
  modelName: string;
  modelId: number;
  attributeName: string;
  dataType: string;
}

export interface DeleteAttributeUpdate extends BaseUpdate {
  modelName: string;
  modelId: number;
  attributeId: number;
}

export interface ForeignKeyConnectionUpdate extends BaseUpdate {
  attributeId: number;
  targetModelName: string;
  targetAttributeName: string;
  targetAttributeId: number;
  foreignKeyName: string;
}

export interface ForeignKeyDisconnectUpdate extends BaseUpdate {
  attributeId: number;
}

export interface AddModelUpdate extends BaseUpdate {
  modelName: string;
  positionX: number;
  positionY: number;
  databaseDiagramId: number;
}

export interface UpdateModelNameUpdate extends BaseUpdate {
  modelId: number;
  oldModelName: string;
  newModelName: string;
}

export interface DeleteModelUpdate extends BaseUpdate {
  modelId: number;
  modelName: string;
}

export interface WebSocketResponse<T> {
  type: string;
  data: T;
  sessionId: string;
  timestamp: number;
  messageId?: string;
}

// Message handlers
export interface MessageHandler {
  onNodePositionUpdate?: (data: NodePositionUpdate) => void;
  onFieldUpdate?: (data: FieldUpdate) => void;
  onTogglePrimaryKey?: (data: TogglePrimaryKeyUpdate) => void;
  onToggleForeignKey?: (data: ToggleForeignKeyUpdate) => void;
  onAddAttribute?: (data: AddAttributeUpdate) => void;
  onDeleteAttribute?: (data: DeleteAttributeUpdate) => void;
  onForeignKeyConnect?: (data: ForeignKeyConnectionUpdate) => void;
  onForeignKeyDisconnect?: (data: ForeignKeyDisconnectUpdate) => void;
  onAddModel?: ((data: AddModelUpdate) => void) | undefined;
  onUpdateModelName?: ((data: UpdateModelNameUpdate) => void) | undefined;
  onDeleteModel?: ((data: DeleteModelUpdate) => void) | undefined;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// WebSocket configuration
export interface WebSocketConfig {
  readonly url: string;
  readonly reconnectDelay: number;
  readonly maxReconnectAttempts: number;
  readonly heartbeatInterval: number;
}

// Connection state
export interface ConnectionState {
  connected: boolean;
  reconnectAttempts: number;
  isManualDisconnect: boolean;
  reconnectTimeoutId: NodeJS.Timeout | null;
  sessionId: string | null;
}
