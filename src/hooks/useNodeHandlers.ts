// src/hooks/useNodeHandlers.ts - Node action handlers
import { useCallback, useEffect, useRef } from "react";
import { createFieldUpdate } from "../utils/schemaUtils";

interface UseNodeHandlersProps {
  setReactFlowNodes: any;
  sendFieldUpdate: any;
  sendTogglePrimaryKey: any;
  sendToggleForeignKey: any;
  sendAddAttribute: any;
  sendDeleteAttribute: any;
  sendForeignKeyConnect: any;
  sendForeignKeyDisconnect: any;
  reactFlowNodes: any;
}

export const useNodeHandlers = ({
  setReactFlowNodes,
  sendFieldUpdate,
  sendTogglePrimaryKey,
  sendToggleForeignKey,
  sendAddAttribute,
  sendDeleteAttribute,
  sendForeignKeyConnect,
  sendForeignKeyDisconnect,
  reactFlowNodes,
}: UseNodeHandlersProps) => {
  const reactFlowNodesRef = useRef<any[]>([]);

  useEffect(() => {
    reactFlowNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  // Field update handler
  const handleFieldUpdate = useCallback(
    (attributeId: number, attributeName: string, attributeType: string) => {
      console.log("📤 Sending field update:", {
        attributeId,
        attributeName,
        attributeType,
      });

      setReactFlowNodes((currentNodes: any) => {
        reactFlowNodesRef.current = currentNodes;

        return currentNodes.map((node: any) => {
          const hasAttribute = node.data.attributes.some(
            (attr: any) => attr.id === attributeId
          );
          if (!hasAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === attributeId) {
              return { ...attr, name: attributeName, dataType: attributeType };
            }
            return attr;
          });

          // Send WebSocket update
          const fieldUpdate = createFieldUpdate(
            currentNodes,
            attributeId,
            attributeName,
            attributeType
          );
          if (fieldUpdate) {
            sendFieldUpdate(fieldUpdate);
          }

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        });
      });
    },
    [setReactFlowNodes, sendFieldUpdate]
  );

  // Toggle key type handler
  const handleToggleKeyType = useCallback(
    (
      modelName: string,
      attributeId: number,
      keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
    ) => {
      console.log("📤 Sending toggle key type:", {
        modelName,
        attributeId,
        keyType,
      });

      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          if (node.id !== modelName) return node;

          const modelId = node.data.id;
          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id !== attributeId) return attr;

            // Apply key type change and handle connection removal
            if (keyType === "PRIMARY") {
              return {
                ...attr,
                isPrimaryKey: true,
                isForeignKey: false,
                connection: undefined, // Remove connection when converting to PK
              };
            } else if (keyType === "FOREIGN") {
              return {
                ...attr,
                isPrimaryKey: false,
                isForeignKey: true,
                // Keep connection if exists
              };
            } else {
              return {
                ...attr,
                isPrimaryKey: false,
                isForeignKey: false,
                connection: undefined, // Remove connection when converting to normal
              };
            }
          });

          // Send WebSocket update
          const currentAttr = node.data.attributes.find(
            (attr: any) => attr.id === attributeId
          );

          if (
            keyType === "PRIMARY" ||
            (keyType === "NORMAL" && currentAttr?.isPrimaryKey)
          ) {
            sendTogglePrimaryKey({ modelName, modelId, attributeId });
          } else if (
            keyType === "FOREIGN" ||
            (keyType === "NORMAL" && currentAttr?.isForeignKey)
          ) {
            sendToggleForeignKey({ modelName, modelId, attributeId });
          }

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        });
      });
    },
    [setReactFlowNodes, sendTogglePrimaryKey, sendToggleForeignKey]
  );

  // Add attribute handler
  const handleAddAttribute = useCallback(
    (modelName: string) => {
      console.log("📤 Sending add attribute:", { modelName });

      // Use current nodes from ref
      const currentNodes = reactFlowNodesRef.current;
      console.log(currentNodes);
      console.log(modelName);
      const node = currentNodes.find((n: any) => n.id === modelName);
      console.log(node);
      if (!node) return;
      console.log("???");
      const modelId = node.data.id;

      sendAddAttribute({
        modelName,
        modelId,
        attributeName: "new_field",
        dataType: "VARCHAR(255)",
      });
    },
    [sendAddAttribute]
  );

  // Delete attribute handler
  const handleDeleteAttribute = useCallback(
    (modelName: string, attributeId: number) => {
      console.log("📤 Sending delete attribute:", { modelName, attributeId });

      const currentNodes = reactFlowNodesRef.current;
      const node = currentNodes.find((n: any) => n.id === modelName);
      if (!node) {
        console.error("Node not found for modelName:", modelName);
        return;
      }

      const modelId = node.data.id;
      const attribute = node.data.attributes.find(
        (attr: any) => attr.id === attributeId
      );

      if (!attribute) {
        console.error(
          "Attribute not found:",
          attributeId,
          "in model:",
          modelName
        );
        return;
      }

      sendDeleteAttribute({ modelName, modelId, attributeId });
    },
    [sendDeleteAttribute]
  );

  // Foreign key connection handlers
  const handleForeignKeyTargetSelect = useCallback(
    (
      attributeId: number,
      targetModelName: string,
      targetAttributeName: string,
      targetAttributeId: number
    ) => {
      console.log("📤 Sending FK connect:", {
        attributeId,
        targetModelName,
        targetAttributeName,
        targetAttributeId,
      });

      const foreignKeyName = `fk_${targetModelName.toLowerCase()}_${targetAttributeName}`;

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === attributeId) {
              return {
                ...attr,
                connection: {
                  id: attributeId,
                  targetModelName,
                  targetAttributeName,
                  foreignKeyName,
                  strokeColor: "#4A90E2",
                  strokeWidth: 2,
                  isAnimated: true,
                  targetArrowType: "ARROW",
                  connectionType: "MANY_TO_ONE",
                },
              };
            }
            return attr;
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        });

        sendForeignKeyConnect({
          attributeId,
          targetModelName,
          targetAttributeName,
          targetAttributeId,
          foreignKeyName,
        });

        return updatedNodes;
      });
    },
    [setReactFlowNodes, sendForeignKeyConnect]
  );

  const handleForeignKeyDisconnect = useCallback(
    (attributeId: number) => {
      console.log("📤 Sending FK disconnect:", { attributeId });

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === attributeId) {
              return {
                ...attr,
                connection: undefined,
              };
            }
            return attr;
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        });

        sendForeignKeyDisconnect({ attributeId });

        return updatedNodes;
      });
    },
    [setReactFlowNodes, sendForeignKeyDisconnect]
  );

  return {
    handleFieldUpdate,
    handleToggleKeyType,
    handleAddAttribute,
    handleDeleteAttribute,
    handleForeignKeyTargetSelect,
    handleForeignKeyDisconnect,
    reactFlowNodesRef,
  };
};
