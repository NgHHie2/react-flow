// src/hooks/useWebSocketHandlers.ts - Fixed WebSocket message handlers
import { useRef, useEffect, useCallback } from "react";

interface UseWebSocketHandlersProps {
  updateNodePosition: any;
  updateField: any;
  togglePrimaryKey: any;
  toggleForeignKey: any;
  addAttribute: any;
  deleteAttribute: any;
  setReactFlowNodes: any;
  addModel: any;
  updateModelName: any;
  deleteModel: any;
  setIsUpdatingFromWebSocket?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useWebSocketHandlers = ({
  updateNodePosition,
  updateField,
  togglePrimaryKey,
  toggleForeignKey,
  addAttribute,
  deleteAttribute,
  addModel,
  updateModelName,
  deleteModel,
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

      // Update both data store and ReactFlow nodes
      updateNodePosition(data.nodeId, data.positionX, data.positionY);

      // CRITICAL: Also update ReactFlow nodes directly
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
    [updateNodePosition, setReactFlowNodes, setIsUpdatingFromWebSocket]
  );

  const handleFieldUpdate = useCallback(
    (data: any) => {
      console.log("✏️ Received field update from OTHER client:", data);

      setReactFlowNodes((currentNodes: any) => {
        console.log("🔍 Looking for field to update:", {
          modelName: data.modelName,
          attributeId: data.attributeId,
          newName: data.attributeName,
          newType: data.attributeType,
        });

        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== data.modelName) return node;

          const hasAttribute = node.data.attributes.some(
            (attr: any) => attr.id === data.attributeId
          );

          if (!hasAttribute) {
            console.warn(
              "⚠️ Attribute not found:",
              data.attributeId,
              "in model:",
              data.modelName
            );
            return node;
          }

          console.log("✅ Found attribute to update");

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              return {
                ...attr,
                name: data.attributeName,
                dataType: data.attributeType,
              };
            }
            return attr;
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
              lastFieldUpdate: Date.now(),
            },
          };
        });

        // ⭐ Update allModels cho TẤT CẢ nodes
        return updatedNodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            allModels: updatedNodes.map((n: any) => n.data),
          },
        }));
      });

      // ⭐ Cũng update data store
      updateField(
        data.modelName,
        data.attributeId,
        data.attributeName,
        data.attributeType
      );
    },
    [setReactFlowNodes, updateField]
  );

  // Sửa handleTogglePrimaryKey trong useWebSocketHandlers.ts - fix state logic
  const handleTogglePrimaryKey = useCallback(
    (data: any) => {
      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== data.modelName) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              console.log(attr);

              return {
                ...attr,
                isPrimaryKey: !attr.isPrimaryKey,
                isForeignKey: false,
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
              lastKeyUpdate: Date.now(),
            },
          };
        });

        // Update allModels cho TẤT CẢ nodes
        return updatedNodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            allModels: updatedNodes.map((n: any) => n.data),
          },
        }));
      });

      // ⭐ KHÔNG gọi togglePrimaryKey ở đây vì sẽ gây double toggle
      // togglePrimaryKey(data.modelName, data.attributeId);
    },
    [setReactFlowNodes]
  );

  const handleToggleForeignKey = useCallback(
    (data: any) => {
      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== data.modelName) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              console.log(attr);

              return {
                ...attr,
                isForeignKey: !attr.isForeignKey, // Toggle FK
                isPrimaryKey: false,
              };
            }
            return attr;
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

        // Update allModels cho TẤT CẢ nodes
        return updatedNodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            allModels: updatedNodes.map((n: any) => n.data),
          },
        }));
      });

      // ⭐ KHÔNG gọi toggleForeignKey ở đây vì sẽ gây double toggle
      // toggleForeignKey(data.modelName, data.attributeId);
    },
    [setReactFlowNodes]
  );

  // Sửa handleAddAttribute trong useWebSocketHandlers.ts - đảm bảo allModels được update
  const handleAddAttribute = useCallback((data: any) => {
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
              // ⭐ QUAN TRỌNG: Update allModels để tất cả nodes biết về attribute mới
              allModels: currentNodes.map((n: any) => ({
                ...n.data,
                attributes:
                  n.id === data.modelId ? updatedAttributes : n.data.attributes,
              })),
              lastAttributeUpdate: Date.now(), // Force re-render
            },
          };
        });

        // ⭐ Update allModels cho TẤT CẢ nodes, không chỉ node hiện tại
        return updatedNodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            allModels: updatedNodes.map((n: any) => n.data),
          },
        }));
      });
    }
  }, []);

  const handleDeleteAttribute = useCallback(
    (data: any) => {
      console.log("➕ Received delete attribute response from backend:", data);

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
                // ⭐ QUAN TRỌNG: Update allModels để tất cả nodes biết về attribute mới
                allModels: currentNodes.map((n: any) => ({
                  ...n.data,
                  attributes:
                    n.id === data.modelId
                      ? updatedAttributes
                      : n.data.attributes,
                })),
                lastAttributeUpdate: Date.now(), // Force re-render
              },
            };
          });

          // ⭐ Update allModels cho TẤT CẢ nodes, không chỉ node hiện tại
          return updatedNodes.map((node: any) => ({
            ...node,
            data: {
              ...node.data,
              allModels: updatedNodes.map((n: any) => n.data),
            },
          }));
        });
      }
    },
    [setReactFlowNodes]
  );

  // Sửa handleAddModel trong useWebSocketHandlers.ts - thêm callbacks ngay lập tức
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
                getAllModels: existingNodeWithCallbacks.data.getAllModels,
                allModels: currentNodes.map((n: any) => n.data),
                onFieldUpdate: existingNodeWithCallbacks.data.onFieldUpdate,
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

          console.log("newnode: ", newNode);

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
          // Tìm node cần đổi tên theo oldModelName
          if (node.id === data.modelId) {
            console.log("✅ Found node to rename:", node.id);

            return {
              ...node,
              data: {
                ...node.data,
                name: data.newModelName, // Đổi tên trong data
                lastNameUpdate: Date.now(), // Force re-render
                allModels: node.data.allModels?.map((m: any) =>
                  m.id === data.modelId ? { ...m, name: data.newModelName } : m
                ),
              },
            };
          }

          return {
            ...node,
            data: {
              ...node.data,
              lastUpdate: Date.now(), // Force dependency change
              allModels: node.data.allModels?.map((m: any) =>
                m.id === data.modelId ? { ...m, name: data.newModelName } : m
              ),
            },
          };
        });

        return updatedNodes;
      });

      // // ⭐ QUAN TRỌNG: Cũng cần update data store để đồng bộ
      // updateModelName(data.oldModelName, data.newModelName);
    },
    [setReactFlowNodes]
  );

  const handleDeleteModel = useCallback(
    (data: any) => {
      console.log("🗑️ Received delete model from backend:", data);

      setReactFlowNodes((prevNodes: any[]) => {
        return (
          prevNodes
            // 1️⃣ Loại bỏ node có id = modelId
            .filter((node) => node.id !== data.modelId)
            // 2️⃣ Đồng thời xóa model khỏi allModels của các node còn lại
            .map((node) => ({
              ...node,
              data: {
                ...node.data,
                allModels: node.data.allModels?.filter(
                  (m: any) => m.id !== data.modelId
                ),
              },
            }))
        );
      });

      // ⭐ QUAN TRỌNG: Cũng cần update data store để đồng bộ
      deleteModel(data.modelName);
    },
    [setReactFlowNodes, deleteModel]
  );
  // FIX 2: Optimized FK handlers to prevent full re-render
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
                  targetModelName: data.targetModelName,
                  targetAttributeName: data.targetAttributeName,
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
    onFieldUpdate: handleFieldUpdate,
    onTogglePrimaryKey: handleTogglePrimaryKey,
    onToggleForeignKey: handleToggleForeignKey,
    onAddAttribute: handleAddAttribute,
    onDeleteAttribute: handleDeleteAttribute,
    onForeignKeyConnect: handleForeignKeyConnect,
    onForeignKeyDisconnect: handleForeignKeyDisconnect,
    onAddModel: handleAddModel,
    onUpdateModelName: handleUpdateModelName,
    onDeleteModel: handleDeleteModel,
  });

  // FIX 3: Update handlers only when dependencies actually change
  useEffect(() => {
    websocketHandlers.current = {
      onNodePositionUpdate: handleNodePositionUpdate,
      onFieldUpdate: handleFieldUpdate,
      onTogglePrimaryKey: handleTogglePrimaryKey,
      onToggleForeignKey: handleToggleForeignKey,
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
    handleFieldUpdate,
    handleTogglePrimaryKey,
    handleToggleForeignKey,
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
