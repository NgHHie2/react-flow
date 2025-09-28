// src/hooks/useWebSocketHandlers.ts - Optimized without external state functions
import { useRef, useEffect, useCallback } from "react";

interface UseWebSocketHandlersProps {
  setReactFlowNodes: any;
  setIsUpdatingFromWebSocket?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useWebSocketHandlers = ({
  setReactFlowNodes,
  setIsUpdatingFromWebSocket,
}: UseWebSocketHandlersProps) => {
  // Create stable handlers with useCallback to prevent unnecessary re-renders
  const handleNodePositionUpdate = useCallback(
    (data: any) => {
      console.log("📍 Received position update from OTHER client:", data);

      // FIX: Set flag to prevent echo
      if (setIsUpdatingFromWebSocket) {
        setIsUpdatingFromWebSocket(true);
      }

      // ✅ ONLY update ReactFlow nodes directly
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) =>
          node.id === data.nodeId
            ? {
                ...node,
                position: { x: data.positionX, y: data.positionY },
                data: {
                  ...node.data,
                  lastUpdate: Date.now(), // Force re-render
                },
              }
            : node
        );
      });

      // Reset flag after update
      if (setIsUpdatingFromWebSocket) {
        setTimeout(() => setIsUpdatingFromWebSocket(false), 100);
      }
    },
    [setReactFlowNodes, setIsUpdatingFromWebSocket]
  );

  const handleFieldNameUpdate = useCallback(
    (data: any) => {
      console.log("✏️ Received field name update from OTHER client:", data);

      // ✅ ONLY update ReactFlow nodes directly
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          const hasAttribute = node.data.attributes.some(
            (attr: any) => attr.id === data.attributeId
          );
          if (!hasAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              return { ...attr, name: data.attributeName };
            }
            return attr;
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
              lastFieldNameUpdate: Date.now(), // ✅ Force re-render
            },
          };
        });
      });
    },
    [setReactFlowNodes]
  );

  const handleFieldTypeUpdate = useCallback(
    (data: any) => {
      console.log("✏️ Received field type update from OTHER client:", data);

      // ✅ ONLY update ReactFlow nodes directly
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          const hasAttribute = node.data.attributes.some(
            (attr: any) => attr.id === data.attributeId
          );
          if (!hasAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              return { ...attr, dataType: data.attributeType };
            }
            return attr;
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
              lastFieldTypeUpdate: Date.now(), // ✅ Force re-render
            },
          };
        });
      });
    },
    [setReactFlowNodes]
  );

  const handleToggleKeyType = useCallback(
    (data: any) => {
      console.log("🔑 Received key type toggle:", data);

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== data.modelId) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id !== data.attributeId) return attr;

            // ✅ Apply the exact keyType from server
            switch (data.keyType) {
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
    },
    [setReactFlowNodes]
  );

  const handleAddAttribute = useCallback(
    (data: any) => {
      console.log("➕ Received add attribute response from backend:", data);

      if (data.realAttributeId) {
        console.log("✅ Adding attribute with real ID:", data.realAttributeId);

        setReactFlowNodes((currentNodes: any) => {
          const updatedNodes = currentNodes.map((node: any) => {
            if (node.id !== data.modelId) return node;

            const newAttribute = {
              id: data.realAttributeId, // Real ID từ backend
              name: data.attributeName,
              dataType: data.dataType,
              isNullable: true,
              isPrimaryKey: false,
              isForeignKey: false,
              attributeOrder: node.data.attributes.length,
            };

            const updatedAttributes = [...node.data.attributes, newAttribute];

            return {
              ...node,
              data: {
                ...node.data,
                attributes: updatedAttributes,
                lastAttributeUpdate: Date.now(), // Force re-render
              },
            };
          });

          return updatedNodes;
        });
      }
    },
    [setReactFlowNodes]
  );

  const handleDeleteAttribute = useCallback(
    (data: any) => {
      console.log("🗑️ Received delete attribute response from backend:", data);

      if (data.attributeId) {
        console.log("✅ Deleting attribute with real ID:", data.attributeId);

        setReactFlowNodes((currentNodes: any) => {
          const updatedNodes = currentNodes.map((node: any) => {
            if (node.id !== data.modelId) return node;

            const updatedAttributes = node.data.attributes.filter(
              (attr: any) => attr.id !== data.attributeId
            );

            return {
              ...node,
              data: {
                ...node.data,
                attributes: updatedAttributes,
                lastAttributeUpdate: Date.now(), // Force re-render
              },
            };
          });

          return updatedNodes;
        });
      }
    },
    [setReactFlowNodes]
  );

  const handleAddModel = useCallback(
    (data: any) => {
      console.log("🆕 Received add model response from backend:", data);

      if (data.realModelId) {
        console.log("✅ Adding model with real ID:", data.realModelId);

        setReactFlowNodes((currentNodes: any) => {
          // ⭐ Lấy callbacks từ node hiện có để copy sang node mới
          const existingNodeWithCallbacks = currentNodes[0]; // Lấy callback từ node đầu tiên
          const callbacks = existingNodeWithCallbacks
            ? {
                onFieldNameUpdate:
                  existingNodeWithCallbacks.data.onFieldNameUpdate,
                onFieldTypeUpdate:
                  existingNodeWithCallbacks.data.onFieldTypeUpdate,
                onToggleKeyType: existingNodeWithCallbacks.data.onToggleKeyType,
                onAddAttribute: existingNodeWithCallbacks.data.onAddAttribute,
                onDeleteAttribute:
                  existingNodeWithCallbacks.data.onDeleteAttribute,
                onForeignKeyTargetSelect:
                  existingNodeWithCallbacks.data.onForeignKeyTargetSelect,
                onForeignKeyDisconnect:
                  existingNodeWithCallbacks.data.onForeignKeyDisconnect,
                onModelNameUpdate:
                  existingNodeWithCallbacks.data.onModelNameUpdate,
                onDeleteModel: existingNodeWithCallbacks.data.onDeleteModel,
              }
            : {};

          console.log("🔧 Copying callbacks to new node:", {
            hasCallbacks: Object.keys(callbacks).length > 0,
            hasOnDeleteModel: !!callbacks.onDeleteModel,
          });

          const newNode = {
            id: data.realModelId,
            position: { x: data.positionX, y: data.positionY },
            data: {
              id: data.realModelId,
              name: data.modelName,
              modelType: "TABLE",
              width: 280,
              height: 200,
              backgroundColor: "#f1f5f9",
              borderColor: "#e2e8f0",
              borderWidth: 2,
              borderRadius: 8,
              attributes: [],
              zindex: 10,
              // ⭐ Thêm callbacks ngay lập tức
              ...callbacks,
            },
            type: "model",
          };

          const updatedNodes = [...currentNodes, newNode];
          return updatedNodes;
        });
      }
    },
    [setReactFlowNodes]
  );

  const handleUpdateModelName = useCallback(
    (data: any) => {
      console.log("📝 Received model name update from backend:", data);

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          // Tìm node cần đổi tên theo modelId
          if (node.id === data.modelId) {
            console.log("✅ Found node to rename:", node.id);

            return {
              ...node,
              data: {
                ...node.data,
                name: data.newModelName, // Đổi tên trong data
                lastNameUpdate: Date.now(), // Force re-render
              },
            };
          }

          return {
            ...node,
            data: {
              ...node.data,
              lastUpdate: Date.now(), // Force dependency change
            },
          };
        });

        return updatedNodes;
      });
    },
    [setReactFlowNodes]
  );

  const handleDeleteModel = useCallback(
    (data: any) => {
      console.log("🗑️ Received delete model from backend:", data);

      setReactFlowNodes((prevNodes: any[]) =>
        prevNodes.filter((node) => node.id !== data.modelId)
      );
    },
    [setReactFlowNodes]
  );

  const handleForeignKeyConnect = useCallback(
    (data: any) => {
      console.log("🔗 Received FK connect from OTHER client:", data);

      // Use functional update to prevent stale closure issues
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          // Only update the node that has the connecting attribute
          const hasTargetAttribute = node.data.attributes?.some(
            (attr: any) => attr.id === data.attributeId
          );

          if (!hasTargetAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              return {
                ...attr,
                connection: {
                  id: data.attributeId,
                  targetModelId: data.targetModelId,
                  targetAttributeId: data.targetAttributeId,
                  foreignKeyName: data.foreignKeyName,
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
              // Add timestamp to force re-render
              lastConnectionUpdate: Date.now(),
            },
          };
        });
      });
    },
    [setReactFlowNodes]
  );

  const handleForeignKeyDisconnect = useCallback(
    (data: any) => {
      console.log("🔓 Received FK disconnect from OTHER client:", data);

      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          const hasTargetAttribute = node.data.attributes?.some(
            (attr: any) => attr.id === data.attributeId
          );

          if (!hasTargetAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
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
      });
    },
    [setReactFlowNodes]
  );

  // Create stable handlers object
  const websocketHandlers = useRef({
    onNodePositionUpdate: handleNodePositionUpdate,
    onFieldNameUpdate: handleFieldNameUpdate,
    onFieldTypeUpdate: handleFieldTypeUpdate,
    onToggleKeyType: handleToggleKeyType,
    onAddAttribute: handleAddAttribute,
    onDeleteAttribute: handleDeleteAttribute,
    onForeignKeyConnect: handleForeignKeyConnect,
    onForeignKeyDisconnect: handleForeignKeyDisconnect,
    onAddModel: handleAddModel,
    onUpdateModelName: handleUpdateModelName,
    onDeleteModel: handleDeleteModel,
  });

  // Update handlers only when dependencies actually change
  useEffect(() => {
    websocketHandlers.current = {
      onNodePositionUpdate: handleNodePositionUpdate,
      onFieldNameUpdate: handleFieldNameUpdate,
      onFieldTypeUpdate: handleFieldTypeUpdate,
      onToggleKeyType: handleToggleKeyType,
      onAddAttribute: handleAddAttribute,
      onDeleteAttribute: handleDeleteAttribute,
      onForeignKeyConnect: handleForeignKeyConnect,
      onForeignKeyDisconnect: handleForeignKeyDisconnect,
      onAddModel: handleAddModel,
      onUpdateModelName: handleUpdateModelName,
      onDeleteModel: handleDeleteModel,
    };
  }, [
    handleNodePositionUpdate,
    handleFieldNameUpdate,
    handleFieldTypeUpdate,
    handleToggleKeyType,
    handleAddAttribute,
    handleDeleteAttribute,
    handleForeignKeyConnect,
    handleForeignKeyDisconnect,
    handleAddModel,
    handleUpdateModelName,
    handleDeleteModel,
  ]);

  return websocketHandlers;
};
