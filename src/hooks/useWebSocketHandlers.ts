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
}: UseWebSocketHandlersProps) => {
  // Create stable handlers with useCallback to prevent unnecessary re-renders
  const handleNodePositionUpdate = useCallback(
    (data: any) => {
      console.log("📍 Received position update from OTHER client:", data);
      // FIX 1: Force immediate position update with timestamp
      updateNodePosition(data.nodeId, data.positionX, data.positionY);
    },
    [updateNodePosition]
  );

  const handleFieldUpdate = useCallback(
    (data: any) => {
      console.log("✏️ Received field update from OTHER client:", data);
      updateField(
        data.modelName,
        data.attributeId,
        data.attributeName,
        data.attributeType
      );
    },
    [updateField]
  );

  const handleTogglePrimaryKey = useCallback(
    (data: any) => {
      console.log("🔑 Received primary key toggle from OTHER client:", data);
      togglePrimaryKey(data.modelName, data.attributeId);
    },
    [togglePrimaryKey]
  );

  const handleToggleForeignKey = useCallback(
    (data: any) => {
      console.log("🔗 Received foreign key toggle from OTHER client:", data);
      toggleForeignKey(data.modelName, data.attributeId);
    },
    [toggleForeignKey]
  );

  const handleAddAttribute = useCallback(
    (data: any) => {
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
    [addAttribute]
  );

  const handleDeleteAttribute = useCallback(
    (data: any) => {
      console.log("➖ Received delete attribute from OTHER client:", data);
      deleteAttribute(data.modelName, data.attributeId);
    },
    [deleteAttribute]
  );

  const handleAddModel = useCallback(
    (data: any) => {
      console.log("🆕 Received add model from OTHER client:", data);
      if (data.realModelId) {
        // This is response with real ID, sync it
        addModel(
          data.modelName,
          data.positionX,
          data.positionY,
          data.realModelId
        );
      } else {
        // This is initial add from other client
        addModel(data.modelName, data.positionX, data.positionY);
      }
    },
    [addModel]
  );

  const handleUpdateModelName = useCallback(
    (data: any) => {
      console.log("📝 Received model name update from OTHER client:", data);
      updateModelName(data.oldModelName, data.newModelName);
    },
    [updateModelName]
  );

  const handleDeleteModel = useCallback(
    (data: any) => {
      console.log("🗑️ Received delete model from OTHER client:", data);
      deleteModel(data.modelName);
    },
    [deleteModel]
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
