// src/SchemaVisualizer/SchemaVisualizer.types.ts
export interface Connection {
  id: string;
  connectionType: string;
  targetModelId: string;
  targetAttributeId: string;
  foreignKeyName: string;
  onUpdate?: string;
  onDelete?: string;
  isEnforced?: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle?: string;
  isAnimated: boolean;
  sourceArrowType?: string;
  targetArrowType: string;
}

export interface Attribute {
  id: string;
  name: string;
  dataType: string;
  length?: number;
  precisionValue?: number;
  scaleValue?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique?: boolean;
  isAutoIncrement?: boolean;
  defaultValue?: string;
  comment?: string;
  hasIndex?: boolean;
  indexName?: string;
  indexType?: string;
  connection?: Connection;
  attributeOrder: number;
}

export interface Model {
  id: string;
  nodeId: string;
  name: string;
  modelType: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle?: string;
  borderRadius: number;
  rotation?: number;
  attributes: Attribute[];
  zindex: number;
}

export interface SchemaData {
  id: number;
  name: string;
  description: string;
  databaseType: string;
  version: string;
  charset: string;
  collation: string;
  isPublic: boolean;
  isTemplate: boolean;
  zoomLevel: number;
  panX: number;
  panY: number;
  models: Model[];
}
