// src/hooks/useSchemaVisualizer.ts - Fixed
import { useCallback, useRef, useEffect } from "react";
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
} from "reactflow";
import { useSchemaData } from "./useSchemaData";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketHandlers } from "./useWebSocketHandlers";
import { useNodeHandlers } from "./useNodeHandlers";
import { useDragHandlers } from "./useDragHandlers";

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
  } = useSchemaData();

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  const hasInitialized = useRef(false);

  // WebSocket handlers
  const websocketHandlers = useWebSocketHandlers({
    updateNodePosition,
    updateField,
    togglePrimaryKey,
    toggleForeignKey,
    addAttribute,
    deleteAttribute,
    setReactFlowNodes,
  });

  // WebSocket connection
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
  } = useWebSocket(websocketHandlers.current);

  // Node action handlers
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
  });

  // Drag handlers
  const { onNodeDragStart, onNodeDrag, onNodeDragStop } = useDragHandlers({
    sendNodePositionUpdate,
  });

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  // Action handlers
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

  // Update nodes when data changes
  useEffect(() => {
    console.log("🔄 Syncing nodes, count:", nodes.length);
    if (nodes.length > 0) {
      setReactFlowNodes((currentNodes) => {
        const positionMap = new Map();
        currentNodes.forEach((node) => {
          positionMap.set(node.id, node.position);
        });

        // Extract raw model data for allModels prop
        const rawModelsData = nodes.map((node) => {
          // Ensure we're getting the actual model data
          const modelData = node.data || node;
          console.log("🔍 Raw model data for", modelData.name, ":", modelData);
          return modelData;
        });

        const nodesWithCallbacks = nodes.map((node) => {
          const currentPosition = positionMap.get(node.id) || node.position;

          return {
            ...node,
            position: currentPosition,
            data: {
              ...node.data,
              allModels: rawModelsData, // Pass clean model data
              onFieldUpdate: handleFieldUpdate,
              onToggleKeyType: handleToggleKeyType,
              onAddAttribute: handleAddAttribute,
              onDeleteAttribute: handleDeleteAttribute,
              onForeignKeyTargetSelect: handleForeignKeyTargetSelect,
              onForeignKeyDisconnect: handleForeignKeyDisconnect,
            },
          };
        });

        console.log("🔄 Updated nodes with callbacks and allModels");
        return nodesWithCallbacks;
      });
    } else {
      setReactFlowNodes([]);
    }
  }, [
    nodes,
    setReactFlowNodes,
    handleFieldUpdate,
    handleToggleKeyType,
    handleAddAttribute,
    handleDeleteAttribute,
    handleForeignKeyTargetSelect,
    handleForeignKeyDisconnect,
  ]);

  // Update edges when data changes
  useEffect(() => {
    console.log("🔄 Syncing edges, count:", edges.length);
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

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

    // Enhanced drag handlers
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,

    // WebSocket state
    isConnected,

    // Action handlers
    handleRefresh,
    handleReset,
    handleInitialize,
  };
};
