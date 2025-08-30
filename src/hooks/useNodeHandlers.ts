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
      attributeId: number, // ⭐ SỬA: Nhận attributeId trực tiếp thay vì fieldIndex
      keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
    ) => {
      console.log("📤 handleToggleKeyType called:", {
        modelName,
        attributeId,
        keyType,
      });

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== modelName) return node;

          const modelId = node.data.id;

          // ⭐ Tìm attribute hiện tại để debug
          const currentAttr = node.data.attributes.find(
            (attr: any) => attr.id === attributeId
          );

          if (!currentAttr) {
            console.warn("❌ Attribute not found:", attributeId);
            return node;
          }

          console.log("🔍 Found attribute to toggle:", {
            id: currentAttr.id,
            name: currentAttr.name,
            currentPK: currentAttr.isPrimaryKey,
            currentFK: currentAttr.isForeignKey,
            targetType: keyType,
          });

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id !== attributeId) return attr;

            // ⭐ Apply new key type
            if (keyType === "PRIMARY") {
              return {
                ...attr,
                isPrimaryKey: true,
                isForeignKey: false,
                connection: undefined,
              };
            } else if (keyType === "FOREIGN") {
              return {
                ...attr,
                isPrimaryKey: false,
                isForeignKey: true,
                // Keep connection if exists
              };
            } else {
              // NORMAL
              return {
                ...attr,
                isPrimaryKey: false,
                isForeignKey: false,
                connection: undefined,
              };
            }
          });

          // Send WebSocket based on target keyType
          if (keyType === "PRIMARY") {
            sendTogglePrimaryKey({ modelName, modelId, attributeId });
          } else if (keyType === "FOREIGN") {
            sendToggleForeignKey({ modelName, modelId, attributeId });
          } else {
            // For NORMAL, send toggle based on current state
            if (currentAttr.isPrimaryKey) {
              sendTogglePrimaryKey({ modelName, modelId, attributeId });
            } else if (currentAttr.isForeignKey) {
              sendToggleForeignKey({ modelName, modelId, attributeId });
            }
          }

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
              allModels: currentNodes.map((n: any) => ({
                ...n.data,
                attributes:
                  n.id === modelName ? updatedAttributes : n.data.attributes,
              })),
              lastKeyUpdate: Date.now(), // Force re-render
            },
          };
        });

        return updatedNodes;
      });
    },
    [setReactFlowNodes, sendTogglePrimaryKey, sendToggleForeignKey]
  );

  // Add attribute handler
  const handleAddAttribute = useCallback(
    (modelName: string) => {
      console.log("📤 Adding attribute to:", { modelName });

      const node = reactFlowNodesRef.current.find(
        (n: any) => n.id === modelName
      );
      if (!node) {
        console.error("❌ Node not found:", modelName);
        return;
      }

      const modelId = node.data.id;

      // KHÔNG cập nhật UI ngay, chỉ gửi WebSocket và chờ response
      sendAddAttribute({
        modelName,
        modelId,
        attributeName: "new_field",
        dataType: "VARCHAR(255)",
      });

      console.log(
        "📤 Sent add attribute request, waiting for backend response..."
      );
    },
    [sendAddAttribute]
  );

  // Delete attribute handler
  const handleDeleteAttribute = useCallback(
    (modelName: string, attributeId: number) => {
      console.log("📤 Deleting attribute:", { modelName, attributeId });

      // CẬP NHẬT LOCAL STATE NGAY LẬP TỨC
      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== modelName) return node;

          const filteredAttributes = node.data.attributes.filter(
            (attr: any) => attr.id !== attributeId
          );

          return {
            ...node,
            data: {
              ...node.data,
              attributes: filteredAttributes,
              allModels: currentNodes.map((n: any) => ({
                ...n.data,
                attributes:
                  n.id === modelName ? filteredAttributes : n.data.attributes,
              })),
            },
          };
        });

        // Gửi WebSocket sau khi đã cập nhật UI
        const node = currentNodes.find((n: any) => n.id === modelName);
        if (node) {
          const modelId = node.data.id;
          sendDeleteAttribute({ modelName, modelId, attributeId });
        }

        return updatedNodes;
      });
    },
    [setReactFlowNodes, sendDeleteAttribute]
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
