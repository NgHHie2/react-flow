// src/hooks/useSchemaVisualizer.ts - Complete version with model operations
import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
  MarkerType,
} from "reactflow";
import { useSchemaData } from "./useSchemaData";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketHandlers } from "./useWebSocketHandlers";
import { useNodeHandlers } from "./useNodeHandlers";
import { useDragHandlers } from "./useDragHandlers";
import { calculateOptimalHandlePositions } from "../utils/handlePositioning";

export const useSchemaVisualizer = () => {
  const {
    nodes,
    edges,
    loading,
    error,
    schemaInfo,
    fetchSchemaData,
    initializeData,
    updateNodePosition,
    updateField,
    togglePrimaryKey,
    toggleForeignKey,
    addAttribute,
    deleteAttribute,
    addModel,
    updateModelName,
    deleteModel,
  } = useSchemaData();

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  const hasInitialized = useRef(false);

  // WebSocket handlers - bao gồm cả model handlers
  const websocketHandlers = useWebSocketHandlers({
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
  });

  // WebSocket connection - bao gồm cả model operations
  const {
    isConnected,
    sendNodePositionUpdate,
    sendFieldUpdate,
    sendTogglePrimaryKey,
    sendToggleForeignKey,
    sendAddAttribute,
    sendDeleteAttribute,
    sendForeignKeyConnect,
    sendForeignKeyDisconnect,
    sendAddModel,
    sendUpdateModelName,
    sendDeleteModel,
  } = useWebSocket(websocketHandlers.current);

  // Node action handlers (attributes)
  const {
    handleFieldUpdate,
    handleToggleKeyType,
    handleAddAttribute,
    handleDeleteAttribute,
    handleForeignKeyTargetSelect,
    handleForeignKeyDisconnect,
  } = useNodeHandlers({
    setReactFlowNodes,
    sendFieldUpdate,
    sendTogglePrimaryKey,
    sendToggleForeignKey,
    sendAddAttribute,
    sendDeleteAttribute,
    sendForeignKeyConnect,
    sendForeignKeyDisconnect,
    reactFlowNodes,
  });

  // Drag handlers
  const { onNodeDragStart, onNodeDrag, onNodeDragStop } = useDragHandlers({
    sendNodePositionUpdate,
  });

  // ReactFlow connection handler
  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  // Model operation handlers
  const handleAddModel = useCallback(() => {
    const timestamp = Date.now();
    const newModelName = `Table_${timestamp}`;
    const positionX = Math.random() * 400 + 100;
    const positionY = Math.random() * 300 + 100;

    console.log("🆕 Adding new model:", { newModelName, positionX, positionY });

    // Add to local state first (optimistic update)
    addModel(newModelName, positionX, positionY);

    // Send WebSocket message if connected and schemaInfo is available
    if (isConnected && schemaInfo) {
      sendAddModel({
        modelName: newModelName,
        positionX,
        positionY,
        databaseDiagramId: schemaInfo.id,
      });
    }
  }, [addModel, sendAddModel, schemaInfo, isConnected]);

  const handleModelNameUpdate = useCallback(
    (oldName: string, newName: string) => {
      if (oldName === newName) return;

      const node = reactFlowNodes.find((n) => n.id === oldName);
      if (!node) {
        console.warn("Node not found for name update:", oldName);
        return;
      }

      console.log("📝 Updating model name:", {
        oldName,
        newName,
        modelId: node.data.id,
      });

      // Update local state first
      updateModelName(oldName, newName);

      // Send WebSocket message if connected
      if (isConnected) {
        sendUpdateModelName({
          modelId: node.data.id,
          oldModelName: oldName,
          newModelName: newName,
        });
      }
    },
    [reactFlowNodes, updateModelName, sendUpdateModelName, isConnected]
  );

  const handleDeleteModel = useCallback(
    (modelName: string) => {
      const node = reactFlowNodes.find((n) => n.id === modelName);
      if (!node) {
        console.warn("Node not found for deletion:", modelName);
        return;
      }

      // Check if model has connections (prevent deletion)
      const hasOutgoingConnections = node.data.attributes?.some(
        (attr: any) => attr.connection
      );
      const hasIncomingConnections = reactFlowNodes.some(
        (otherNode: any) =>
          otherNode.id !== modelName &&
          otherNode.data.attributes?.some(
            (attr: any) => attr.connection?.targetModelName === modelName
          )
      );

      if (hasOutgoingConnections || hasIncomingConnections) {
        console.warn("Cannot delete model with connections:", modelName);
        // You might want to show a toast here
        return;
      }

      console.log("🗑️ Deleting model:", { modelName, modelId: node.data.id });

      // Update local state first
      deleteModel(modelName);

      // Send WebSocket message if connected
      if (isConnected) {
        sendDeleteModel({
          modelId: node.data.id,
          modelName,
        });
      }
    },
    [reactFlowNodes, deleteModel, sendDeleteModel, isConnected]
  );

  // Basic action handlers
  const handleRefresh = useCallback(() => {
    console.log("🔄 Refreshing data...");
    fetchSchemaData();
  }, [fetchSchemaData]);

  const handleReset = useCallback(() => {
    console.log("🔄 Resetting data...");
    initializeData();
  }, [initializeData]);

  const handleInitialize = useCallback(() => {
    console.log("🔄 Initializing data...");
    initializeData();
  }, [initializeData]);

  // Initialize data on first mount
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log("🚀 Loading initial data...");
      hasInitialized.current = true;
      fetchSchemaData();
    }
  }, [fetchSchemaData]);

  // Keep reference to current nodes for callbacks
  const currentNodesRef = useRef<any[]>([]);

  // Wrap tất cả handlers với useCallback để stable
  const stableHandleFieldUpdate = useCallback(handleFieldUpdate, [
    handleFieldUpdate,
  ]);
  const stableHandleToggleKeyType = useCallback(handleToggleKeyType, [
    handleToggleKeyType,
  ]);
  const stableHandleAddAttribute = useCallback(handleAddAttribute, [
    handleAddAttribute,
  ]);
  const stableHandleDeleteAttribute = useCallback(handleDeleteAttribute, [
    handleDeleteAttribute,
  ]);
  const stableHandleForeignKeyTargetSelect = useCallback(
    handleForeignKeyTargetSelect,
    [handleForeignKeyTargetSelect]
  );
  const stableHandleForeignKeyDisconnect = useCallback(
    handleForeignKeyDisconnect,
    [handleForeignKeyDisconnect]
  );
  const stableHandleModelNameUpdate = useCallback(handleModelNameUpdate, [
    handleModelNameUpdate,
  ]);
  const stableHandleDeleteModel = useCallback(handleDeleteModel, [
    handleDeleteModel,
  ]);

  // Sync nodes from useSchemaData to ReactFlow nodes - CHỈ depend vào nodes
  useEffect(() => {
    console.log("🔄 Syncing nodes, count:", nodes.length);

    if (nodes.length === 0) {
      setReactFlowNodes([]);
      return;
    }

    setReactFlowNodes((currentNodes) => {
      // Update ref with current nodes
      currentNodesRef.current = currentNodes;

      // Preserve current positions
      const positionMap = new Map();
      currentNodes.forEach((node) => {
        positionMap.set(node.id, node.position);
      });

      // Create nodes with stable callbacks
      const nodesWithCallbacks = nodes.map((node) => {
        const currentPosition = positionMap.get(node.id) || node.position;

        return {
          ...node,
          position: currentPosition,
          data: {
            ...node.data,
            // Inline stable callbacks - không depend vào useMemo
            getAllModels: () => {
              return currentNodesRef.current.map((n) => n.data);
            },
            onFieldUpdate: stableHandleFieldUpdate,
            onToggleKeyType: stableHandleToggleKeyType,
            onAddAttribute: stableHandleAddAttribute,
            onDeleteAttribute: stableHandleDeleteAttribute,
            onForeignKeyTargetSelect: stableHandleForeignKeyTargetSelect,
            onForeignKeyDisconnect: stableHandleForeignKeyDisconnect,
            onModelNameUpdate: stableHandleModelNameUpdate,
            onDeleteModel: stableHandleDeleteModel,
          },
        };
      });

      return nodesWithCallbacks;
    });
  }, [
    nodes,
    stableHandleFieldUpdate,
    stableHandleToggleKeyType,
    stableHandleAddAttribute,
    stableHandleDeleteAttribute,
    stableHandleForeignKeyTargetSelect,
    stableHandleForeignKeyDisconnect,
    stableHandleModelNameUpdate,
    stableHandleDeleteModel,
  ]); // CHỈ depend vào stable handlers

  // Keep currentNodesRef updated khi reactFlowNodes thay đổi
  useEffect(() => {
    currentNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  // Memoize edges data để tránh re-calculate liên tục
  const edgesData = useMemo(() => {
    if (reactFlowNodes.length === 0) return [];

    const nodeMap = new Map(reactFlowNodes.map((node) => [node.id, node]));
    const newEdges: Edge[] = [];

    // Create edges from attribute connections
    reactFlowNodes.forEach((node) => {
      node.data.attributes?.forEach((attribute: any) => {
        if (attribute.connection) {
          const connection = attribute.connection;
          const sourceNode = nodeMap.get(node.id);
          const targetNode = nodeMap.get(connection.targetModelName);

          if (!sourceNode || !targetNode) {
            return;
          }

          // Calculate optimal handle positions
          const handlePositions = calculateOptimalHandlePositions(
            sourceNode,
            targetNode,
            attribute.name,
            connection.targetAttributeName
          );

          const edgeId = `${node.id}-${attribute.name}-${connection.targetModelName}`;

          newEdges.push({
            id: edgeId,
            source: node.id,
            target: connection.targetModelName,
            sourceHandle: handlePositions.sourceHandleId,
            targetHandle: handlePositions.targetHandleId,
            animated: connection.isAnimated || true,
            type: "smoothstep",
            pathOptions: {
              borderRadius: 30,
              offset: 50,
            },
            style: {
              strokeWidth: 2,
              stroke: connection.strokeColor || "#4A90E2",
            },
            label: connection.foreignKeyName,
            labelStyle: {
              fontSize: "10px",
              fontWeight: "bold",
              fill: connection.strokeColor || "#4A90E2",
            },
            labelBgStyle: {
              fill: "rgba(255, 255, 255, 0.8)",
              fillOpacity: 0.8,
            },
          });
        }
      });
    });

    return newEdges;
  }, [reactFlowNodes]);

  // Update edges when edgesData changes
  useEffect(() => {
    if (JSON.stringify(reactFlowEdges) !== JSON.stringify(edgesData)) {
      console.log(`🔗 Setting ${edgesData.length} edges`);
      setReactFlowEdges(edgesData);
    }
  }, [edgesData, reactFlowEdges, setReactFlowEdges]);

  return {
    // Data state
    loading,
    error,
    schemaInfo,

    // ReactFlow state
    reactFlowNodes,
    reactFlowEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,

    // Drag handlers
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,

    // WebSocket state
    isConnected,

    // Basic action handlers
    handleRefresh,
    handleReset,
    handleInitialize,

    // Model action handlers
    handleAddModel,
    handleModelNameUpdate,
    handleDeleteModel,
  };
};
