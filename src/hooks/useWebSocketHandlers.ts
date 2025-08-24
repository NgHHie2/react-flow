// src/hooks/useWebSocketHandlers.ts - WebSocket message handlers
import { useRef, useEffect } from "react";

interface UseWebSocketHandlersProps {
  updateNodePosition: any;
  updateField: any;
  togglePrimaryKey: any;
  toggleForeignKey: any;
  addAttribute: any;
  deleteAttribute: any;
  setReactFlowNodes: any;
}

export const useWebSocketHandlers = ({
  updateNodePosition,
  updateField,
  togglePrimaryKey,
  toggleForeignKey,
  addAttribute,
  deleteAttribute,
  setReactFlowNodes,
}: UseWebSocketHandlersProps) => {
  const websocketHandlers = useRef({
    onNodePositionUpdate: (data: any) => {
      console.log("📍 Received position update from OTHER client:", data);
      updateNodePosition(data.nodeId, data.positionX, data.positionY);
    },
    onFieldUpdate: (data: any) => {
      console.log("✏️ Received field update from OTHER client:", data);
      updateField(
        data.modelName,
        data.attributeId,
        data.attributeName,
        data.attributeType
      );
    },
    onTogglePrimaryKey: (data: any) => {
      console.log("🔑 Received primary key toggle from OTHER client:", data);
      togglePrimaryKey(data.modelName, data.attributeId);
    },
    onToggleForeignKey: (data: any) => {
      console.log("🔗 Received foreign key toggle from OTHER client:", data);
      toggleForeignKey(data.modelName, data.attributeId);
    },
    onAddAttribute: (data: any) => {
      console.log("➕ Received add attribute from OTHER client:", data);
      if (data.realAttributeId) {
        addAttribute(
          data.modelName,
          data.attributeName,
          data.dataType,
          data.realAttributeId
        );
      } else {
        addAttribute(data.modelName, data.attributeName, data.dataType);
      }
    },
    onDeleteAttribute: (data: any) => {
      console.log("➖ Received delete attribute from OTHER client:", data);
      deleteAttribute(data.modelName, data.attributeId);
    },
    onForeignKeyConnect: (data: any) => {
      console.log("🔗 Received FK connect from OTHER client:", data);
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
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
            },
          };
        });
      });
    },
    onForeignKeyDisconnect: (data: any) => {
      console.log("🔓 Received FK disconnect from OTHER client:", data);
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
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
            },
          };
        });
      });
    },
  });

  // Update handlers when dependencies change
  useEffect(() => {
    websocketHandlers.current.onNodePositionUpdate = (data: any) => {
      updateNodePosition(data.nodeId, data.positionX, data.positionY);
    };
    websocketHandlers.current.onFieldUpdate = (data: any) => {
      updateField(
        data.modelName,
        data.attributeId,
        data.attributeName,
        data.attributeType
      );
    };
    websocketHandlers.current.onTogglePrimaryKey = (data: any) => {
      togglePrimaryKey(data.modelName, data.attributeId);
    };
    websocketHandlers.current.onToggleForeignKey = (data: any) => {
      toggleForeignKey(data.modelName, data.attributeId);
    };
    websocketHandlers.current.onAddAttribute = (data: any) => {
      addAttribute(data.modelName, data.attributeName, data.dataType);
    };
    websocketHandlers.current.onDeleteAttribute = (data: any) => {
      deleteAttribute(data.modelName, data.attributeId);
    };
  }, [
    updateNodePosition,
    updateField,
    togglePrimaryKey,
    toggleForeignKey,
    addAttribute,
    deleteAttribute,
  ]);

  return websocketHandlers;
};
