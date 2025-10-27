// src/types/websocket.types.ts - Updated with FK types
export interface BaseUpdate {
  sessionId?: string;
  messageId?: string;
  clientTimestamp?: string;
}

export interface NodePositionUpdate extends BaseUpdate {
  nodeId: string;
  modelId: string;
  positionX: number;
  positionY: number;
  diagramId: number;
}

export interface FieldUpdate extends BaseUpdate {
  attributeId: string;
  attributeName: string;
  attributeType: string;
  modelId: string;
}

export interface FieldNameUpdate extends BaseUpdate {
  attributeId: string;
  attributeName: string;
}
export interface FieldTypeUpdate extends BaseUpdate {
  attributeId: string;
  attributeType: string;
}

export interface ToggleKeyTypeUpdate extends BaseUpdate {
  modelId: string;
  attributeId: string;
  keyType: "NORMAL" | "PRIMARY" | "FOREIGN";
}
export interface AddAttributeUpdate extends BaseUpdate {
  modelId: string;
  attributeId: string;
  attributeName: string;
  dataType: string;
}

export interface DeleteAttributeUpdate extends BaseUpdate {
  modelId: string;
  attributeId: string;
}

export interface ForeignKeyConnectionUpdate extends BaseUpdate {
  attributeId: string;
  targetModelId: string;
  targetAttributeId: string;
  foreignKeyName: string;
}

export interface ForeignKeyDisconnectUpdate extends BaseUpdate {
  attributeId: string;
}

export interface AddModelUpdate extends BaseUpdate {
  modelId: string;
  positionX: number;
  positionY: number;
  databaseDiagramId: number;
}

export interface UpdateModelNameUpdate extends BaseUpdate {
  modelId: string;
  oldModelName: string;
  newModelName: string;
}

export interface DeleteModelUpdate extends BaseUpdate {
  modelId: string;
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
  onFieldNameUpdate?: (data: FieldNameUpdate) => void;
  onFieldTypeUpdate?: (data: FieldTypeUpdate) => void;
  onToggleKeyType?: (data: ToggleKeyTypeUpdate) => void;
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
