// src/utils/schemaUtils.ts
import { Node } from "reactflow";
import { NodePositionUpdate, FieldUpdate } from "../services/websocketService";

export const createNodePositionUpdate = (node: Node): NodePositionUpdate => ({
  modelName: node.id,
  positionX: node.position.x,
  positionY: node.position.y,
});

export const createFieldUpdate = (
  nodes: Node[],
  fieldId: number,
  fieldName: string,
  fieldType: string
): FieldUpdate | null => {
  const modelName = nodes.find((node) =>
    node.data.fields.some((field: any) => field.id === fieldId)
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
    node.data.fields.some((field: any) => field.id === fieldId)
  );
  return model?.id || null;
};
