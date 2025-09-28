// src/utils/schemaUtils.ts
import { Node, Edge, MarkerType } from "reactflow";
import {
  NodePositionUpdate,
  FieldUpdate,
  FieldNameUpdate,
  FieldTypeUpdate,
} from "../types/websocket.types";
import {
  SchemaData,
  Model,
  Attribute,
} from "../SchemaVisualizer/SchemaVisualizer.types";

export const createNodePositionUpdate = (node: Node): NodePositionUpdate => ({
  nodeId: node.id,
  modelId: node.data.id, // Get modelId from node data
  positionX: node.position.x,
  positionY: node.position.y,
  diagramId: node.data.diagramId,
});

export const findModelByFieldId = (
  nodes: Node[],
  fieldId: number
): string | null => {
  const model = nodes.find((node) =>
    node.data.attributes?.some((attribute: any) => attribute.id === fieldId)
  );
  return model?.id || null;
};

// Convert API data to ReactFlow format
export const convertToReactFlowData = (
  data: SchemaData,
  callbacks?: {
    onFieldUpdate?: any;
    onToggleKeyType?: any;
    onAddAttribute?: any;
    onDeleteAttribute?: any;
    onForeignKeyTargetSelect?: any;
    onForeignKeyDisconnect?: any;
    onModelNameUpdate?: any;
    onDeleteModel?: any;
  }
) => {
  // Create nodes from models with ALL callbacks
  const nodes: Node[] = data.models.map((model: Model) => ({
    id: model.id,
    position: { x: model.positionX, y: model.positionY },
    data: {
      ...model,
      diagramId: data.id,
      // ✅ THÊM TẤT CẢ CALLBACKS
      ...callbacks,
      // ✅ QUAN TRỌNG: Pass reference đến tất cả models để ForeignKeyTargetSelector có thể access
      reactFlowNodes: [], // Sẽ được update sau
    },
    type: "model",
  }));

  // ✅ UPDATE: Set reactFlowNodes reference cho tất cả nodes
  nodes.forEach((node) => {
    node.data.reactFlowNodes = nodes;
  });

  // Create edges from connections within attributes
  const edges: Edge[] = [];

  data.models.forEach((model) => {
    model.attributes.forEach((attribute) => {
      if (attribute.connection) {
        const connection = attribute.connection;
        const edgeId = connection.id;

        // Create source and target handle IDs
        const sourceHandleId = `${model.id}-${attribute.id}-source`;
        const targetHandleId = `${connection.targetModelId}-${connection.targetAttributeId}-target`;

        console.log("connectionId: " + connection.id);
        console.log("source: " + model.id);
        console.log("target: " + connection.targetModelId);

        edges.push({
          id: edgeId,
          source: model.id,
          target: connection.targetModelId,
          sourceHandle: sourceHandleId,
          targetHandle: targetHandleId,
          animated: true,
          style: {
            stroke: connection.strokeColor,
            strokeWidth: connection.strokeWidth,
          },
          label: connection.foreignKeyName,
          labelStyle: {
            fontSize: "8px",
            fontWeight: "bold",
            fill: connection.strokeColor,
          },
          labelBgStyle: {
            fill: "rgba(255, 255, 255, 0.8)",
            fillOpacity: 0.8,
          },
        });
      }
    });
  });

  return { nodes, edges };
};

// Helper function to get connection info for a field
export const getConnectionInfo = (attribute: Attribute) => {
  if (!attribute.connection) return null;

  return {
    targetModel: attribute.connection.targetModelId,
    targetField: attribute.connection.targetAttributeId,
    connectionType: attribute.connection.connectionType,
    color: attribute.connection.strokeColor,
  };
};

// Helper function to get all primary key fields
export const getPrimaryKeyFields = (model: Model): Attribute[] => {
  return model.attributes.filter((attr) => attr.isPrimaryKey);
};

// Helper function to get all foreign key fields
export const getForeignKeyFields = (model: Model): Attribute[] => {
  return model.attributes.filter((attr) => attr.isForeignKey);
};
