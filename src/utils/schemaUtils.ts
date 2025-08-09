// src/utils/schemaUtils.ts
import { Node, Edge, MarkerType } from "reactflow";
import { NodePositionUpdate, FieldUpdate } from "../services/websocketService";
import {
  SchemaData,
  Model,
  Attribute,
} from "../SchemaVisualizer/SchemaVisualizer.types";

export const createNodePositionUpdate = (node: Node): NodePositionUpdate => ({
  nodeId: node.id,
  positionX: node.position.x,
  positionY: node.position.y,
  diagramId: node.data.diagramId,
});

export const createFieldUpdate = (
  nodes: Node[],
  fieldId: number,
  fieldName: string,
  fieldType: string
): FieldUpdate | null => {
  const modelName = nodes.find((node) =>
    node.data.attributes?.some((attribute: any) => attribute.id === fieldId)
  )?.id;

  if (!modelName) return null;

  return {
    fieldId,
    fieldName,
    fieldType,
    modelName,
  };
};

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
  onFieldUpdate?: any
) => {
  // Create nodes from models
  const nodes: Node[] = data.models.map((model: Model) => ({
    id: model.name,
    position: { x: model.positionX, y: model.positionY },
    data: {
      ...model,
      diagramId: data.id,
      onFieldUpdate,
    },
    type: "model",
  }));

  // Create edges from connections within attributes
  const edges: Edge[] = [];

  data.models.forEach((model) => {
    model.attributes.forEach((attribute) => {
      if (attribute.connection) {
        const connection = attribute.connection;
        const edgeId = `${model.name}-${attribute.name}-${connection.targetModelName}`;

        // Create source and target handle IDs
        const sourceHandleId = `${model.name}-${attribute.name}-source`;
        const targetHandleId = `${connection.targetModelName}-${connection.targetAttributeName}-target`;

        edges.push({
          id: edgeId,
          source: model.name,
          target: connection.targetModelName,
          sourceHandle: sourceHandleId,
          targetHandle: targetHandleId,
          animated: connection.isAnimated,
          style: {
            stroke: connection.strokeColor,
            strokeWidth: connection.strokeWidth,
          },

          label: connection.foreignKeyName,
          labelStyle: {
            fontSize: "10px",
            fontWeight: "bold",
            fill: connection.strokeColor,
          },
          labelBgStyle: {
            fill: "rgba(255, 255, 255, 0.8)",
            fillOpacity: 0.8,
          },
          type: "smoothstep",
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
    targetModel: attribute.connection.targetModelName,
    targetField: attribute.connection.targetAttributeName,
    connectionType: attribute.connection.connectionType,
    color: attribute.connection.strokeColor,
  };
};

// Helper function to determine if a model is a child (has incoming foreign keys)
export const isChildModel = (model: Model, allModels: Model[]): boolean => {
  return allModels.some((otherModel) =>
    otherModel.attributes.some(
      (attr) => attr.connection?.targetModelName === model.name
    )
  );
};

// Helper function to get all primary key fields
export const getPrimaryKeyFields = (model: Model): Attribute[] => {
  return model.attributes.filter((attr) => attr.isPrimaryKey);
};

// Helper function to get all foreign key fields
export const getForeignKeyFields = (model: Model): Attribute[] => {
  return model.attributes.filter((attr) => attr.isForeignKey);
};
