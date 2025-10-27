// src/hooks/useWebSocketHandlers.ts - Fixed WebSocket message handlers
import { useRef, useEffect, useCallback } from "react";
import { getVietnamTime } from "../utils";

interface UseWebSocketHandlersProps {
  // updateNodePosition: any;
  // updateFieldName: any;
  // updateFieldType: any;
  // addAttribute: any;
  // deleteAttribute: any;
  setReactFlowNodes: any;
  // addModel: any;
  // updateModelName: any;
  // deleteModel: any;
  setIsUpdatingFromWebSocket?: React.Dispatch<React.SetStateAction<boolean>>;
  stableCallbacks?: any;
}

export const useWebSocketHandlers = ({
  // updateNodePosition,
  // updateFieldName,
  // updateFieldType,
  // addAttribute,
  // deleteAttribute,
  // addModel,
  // updateModelName,
  // deleteModel,
  setReactFlowNodes,
  setIsUpdatingFromWebSocket,
  stableCallbacks,
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
      // updateNodePosition(data.nodeId, data.positionX, data.positionY);

      // CRITICAL: Also update ReactFlow nodes directly
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          if (node.id !== data.nodeId) return node;

          const oldTime = new Date(node.data?.positionUpdatedAt || 0);
          const newTime = new Date(data.clientTimestamp + "Z");

          // Nếu node chưa có time, hoặc clientTimestamp mới hơn
          if (
            data.clientTimestamp &&
            (!oldTime.getTime() || oldTime < newTime)
          ) {
            return {
              ...node,
              position: { x: data.positionX, y: data.positionY },
              data: {
                ...node.data,
                positionUpdatedAt: data.clientTimestamp,
              },
            };
          }

          // Ngược lại, giữ nguyên
          return node;
        });
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

      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          // Kiểm tra xem node này có chứa attribute cần update không
          const hasAttribute = node.data.attributes?.some(
            (attr: any) => attr.id === data.attributeId
          );

          if (!hasAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              const oldTime = new Date(attr.nameUpdatedAt || 0);
              const newTime = new Date(data.clientTimestamp + "Z");
              if (
                data.clientTimestamp &&
                (!oldTime.getTime() || oldTime < newTime)
              ) {
                return {
                  ...attr,
                  name: data.attributeName,
                  nameUpdatedAt: data.clientTimestamp,
                };
              }
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
      });
    },
    [setReactFlowNodes]
  );

  const handleFieldTypeUpdate = useCallback(
    (data: any) => {
      console.log("🔧 Received field type update from OTHER client:", data);

      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          // Kiểm tra xem node này có chứa attribute cần update không
          const hasAttribute = node.data.attributes?.some(
            (attr: any) => attr.id === data.attributeId
          );

          if (!hasAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === data.attributeId) {
              const oldTime = new Date(attr.typeUpdatedAt || 0);
              const newTime = new Date(data.clientTimestamp + "Z");
              if (
                data.clientTimestamp &&
                (!oldTime.getTime() || oldTime < newTime)
              ) {
                return {
                  ...attr,
                  dataType: data.attributeType,
                  ...(data.length !== undefined && { length: data.length }),
                  ...(data.precisionValue !== undefined && {
                    precisionValue: data.precisionValue,
                  }),
                  ...(data.scaleValue !== undefined && {
                    scaleValue: data.scaleValue,
                  }),
                  typeUpdatedAt: data.clientTimestamp,
                };
              }
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
      });
    },
    [setReactFlowNodes]
  );

  // Sửa handleTogglePrimaryKey trong useWebSocketHandlers.ts - fix state logic
  const handleToggleKeyType = useCallback(
    (data: any) => {
      console.log("🔑 Received key type toggle:", data);

      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          if (node.id !== data.modelId) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id !== data.attributeId) return attr;
            const oldTime = new Date(attr.keyTypeUpdatedAt || 0);
            const newTime = new Date(data.clientTimestamp + "Z");
            if (
              data.clientTimestamp &&
              (!oldTime.getTime() || oldTime < newTime)
            ) {
              // ✅ Apply the exact keyType from server
              switch (data.keyType) {
                case "PRIMARY":
                  return {
                    ...attr,
                    isPrimaryKey: true,
                    isForeignKey: false,
                    connection: undefined,
                    keyTypeUpdatedAt: data.clientTimestamp,
                  };
                case "FOREIGN":
                  return {
                    ...attr,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    keyTypeUpdatedAt: data.clientTimestamp,
                  };
                case "NORMAL":
                  return {
                    ...attr,
                    isPrimaryKey: false,
                    isForeignKey: false,
                    connection: undefined,
                    keyTypeUpdatedAt: data.clientTimestamp,
                  };
                default:
                  return attr;
              }
            }
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        });

        return updatedNodes;
      });
    },
    [setReactFlowNodes]
  );

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

              lastAttributeUpdate: Date.now(), // Force re-render
            },
          };
        });

        return updatedNodes;
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

  // Sửa handleAddModel trong useWebSocketHandlers.ts - thêm callbacks ngay lập tức
  const handleAddModel = useCallback(
    (data: any) => {
      console.log("🆕 Received add model response from backend:", data);

      if (data.realModelId) {
        console.log("✅ Adding model with real ID:", data.realModelId);

        setReactFlowNodes((currentNodes: any) => {
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
              ...stableCallbacks, // ✅ Dùng stableCallbacks ở đây
            },
            type: "model",
          };

          return [...currentNodes, newNode];
        });
      }
    },
    [setReactFlowNodes, stableCallbacks] // ✅ Thêm dependency
  );

  const handleUpdateModelName = useCallback(
    (data: any) => {
      console.log("📝 Received model name update from backend:", data);
      setReactFlowNodes((currentNodes: any) => {
        const updatedNodes = currentNodes.map((node: any) => {
          // Tìm node cần đổi tên theo oldModelName
          if (node.id === data.modelId) {
            console.log("✅ Found node to rename:", node.id);
            const oldTime = new Date(node.data.nameUpdatedAt || 0);
            const newTime = new Date(data.clientTimestamp + "Z");
            if (
              data.clientTimestamp &&
              (!oldTime.getTime() || oldTime < newTime)
            ) {
              return {
                ...node,
                data: {
                  ...node.data,
                  name: data.newModelName, // Đổi tên trong data
                  nameUpdatedAt: data.clientTimestamp, // Force re-render
                },
              };
            }
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

      // // ⭐ QUAN TRỌNG: Cũng cần update data store để đồng bộ
      // updateModelName(data.oldModelName, data.newModelName);
    },
    [setReactFlowNodes]
  );

  const handleDeleteModel = useCallback(
    (data: any) => {
      console.log("🗑️ Received delete model from backend:", data);

      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.filter((node: any) => node.id !== data.modelId);
      });
    },
    [setReactFlowNodes]
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

  // FIX 3: Update handlers only when dependencies actually change
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

  return {
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
};
