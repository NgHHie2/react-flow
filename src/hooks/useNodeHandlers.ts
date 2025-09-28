// src/hooks/useNodeHandlers.ts - Fixed version
import { useCallback, useEffect, useRef } from "react";
import { createFieldUpdate } from "../utils/schemaUtils";
import { generateAttributeId } from "../utils/uuid.utils";

interface UseNodeHandlersProps {
  setReactFlowNodes: any;
  sendFieldUpdate: any;
  sendToggleKeyType: any;
  sendAddAttribute: any;
  sendDeleteAttribute: any;
  sendForeignKeyConnect: any;
  sendForeignKeyDisconnect: any;
  reactFlowNodes: any;
}

export const useNodeHandlers = ({
  setReactFlowNodes, // ✅ Sử dụng prop này thay vì tạo mới
  sendFieldUpdate,
  sendToggleKeyType,
  sendAddAttribute,
  sendDeleteAttribute,
  sendForeignKeyConnect,
  sendForeignKeyDisconnect,
  reactFlowNodes, // ✅ Sử dụng prop này
}: UseNodeHandlersProps) => {
  const reactFlowNodesRef = useRef<any[]>([]);

  // ✅ Cập nhật ref khi reactFlowNodes thay đổi
  useEffect(() => {
    reactFlowNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  // Field update handler
  const handleFieldUpdate = useCallback(
    (attributeId: string, attributeName: string, attributeType: string) => {
      console.log("📤 Sending field update:", {
        attributeId,
        attributeName,
        attributeType,
      });

      setReactFlowNodes((currentNodes: any) => {
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
              lastFieldUpdate: Date.now(), // ✅ Force re-render
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
      modelId: string,
      attributeId: string,
      keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
    ) => {
      console.log("📤 handleToggleKeyType called:", {
        modelId,
        attributeId,
        keyType,
      });

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== modelId) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id !== attributeId) return attr;

            // ✅ Handle all 3 cases in one place
            switch (keyType) {
              case "PRIMARY":
                return {
                  ...attr,
                  isPrimaryKey: true,
                  isForeignKey: false,
                  connection: undefined,
                };
              case "FOREIGN":
                return {
                  ...attr,
                  isPrimaryKey: false,
                  isForeignKey: true,
                  // Keep existing connection if any
                };
              case "NORMAL":
                return {
                  ...attr,
                  isPrimaryKey: false,
                  isForeignKey: false,
                  connection: undefined,
                };
              default:
                return attr;
            }
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
              lastKeyUpdate: Date.now(),
            },
          };
        });

        return updatedNodes;
      });

      // ✅ Single WebSocket call
      sendToggleKeyType({ modelId, attributeId, keyType });
    },
    [setReactFlowNodes, sendToggleKeyType]
  );

  // ✅ FIX: Add attribute handler với proper state update
  const handleAddAttribute = useCallback(
    (modelId: string) => {
      console.log("📤 Adding attribute to:", { modelId });
      const newAttributeId = generateAttributeId();

      const newAttribute = {
        id: newAttributeId,
        name: "new_field",
        dataType: "VARCHAR(255)",
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        attributeOrder: 0,
      };

      console.log("🆕 Creating new attribute:", newAttribute);

      // ✅ IMMEDIATELY update UI with proper state management
      setReactFlowNodes((currentNodes: any[]) => {
        const updatedNodes = currentNodes.map((node) => {
          if (node.id !== modelId) return node;

          const updatedAttributes = [...node.data.attributes, newAttribute];
          console.log("updatedAttributes: ", updatedAttributes);
          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
              // ✅ Force component re-render with timestamp
              lastUpdate: Date.now(),
              lastFieldUpdate: Date.now(),
            },
          };
        });

        return updatedNodes;
      });

      // ✅ Send WebSocket AFTER UI update
      sendAddAttribute({
        modelId,
        newAttributeId,
        attributeName: "new_field",
        dataType: "VARCHAR(255)",
      });

      console.log("📤 Sent add attribute request to WebSocket");
    },
    [setReactFlowNodes, sendAddAttribute]
  );

  // Delete attribute handler
  const handleDeleteAttribute = useCallback(
    (modelId: string, attributeId: string) => {
      // ✅ Đổi từ number sang string
      console.log("📤 Deleting attribute:", { modelId, attributeId });

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== modelId) return node;

          const filteredAttributes = node.data.attributes.filter(
            (attr: any) => attr.id !== attributeId
          );

          return {
            ...node,
            data: {
              ...node.data,
              attributes: filteredAttributes,
              lastUpdate: Date.now(),
            },
          };
        });

        // Send WebSocket after UI update

        sendDeleteAttribute({ modelId, attributeId });

        return updatedNodes;
      });
    },
    [setReactFlowNodes, sendDeleteAttribute]
  );

  // Foreign key connection handlers
  const handleForeignKeyTargetSelect = useCallback(
    (
      attributeId: string, // ✅ Đổi từ number sang string
      targetModelId: string,
      targetAttributeId: string // ✅ Đổi từ number sang string
    ) => {
      console.log("📤 Sending FK connect:", {
        attributeId,
        targetModelId,
        targetAttributeId,
      });

      const foreignKeyName = null;

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === attributeId) {
              return {
                ...attr,
                connection: {
                  id: attributeId,
                  targetModelId: targetModelId,
                  targetAttributeId: targetAttributeId,
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
              lastConnectionUpdate: Date.now(),
            },
          };
        });

        sendForeignKeyConnect({
          attributeId,
          targetModelId,
          targetAttributeId,
          foreignKeyName,
        });

        return updatedNodes;
      });
    },
    [setReactFlowNodes, sendForeignKeyConnect]
  );

  const handleForeignKeyDisconnect = useCallback(
    (attributeId: string) => {
      // ✅ Đổi từ number sang string
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
              lastConnectionUpdate: Date.now(),
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
