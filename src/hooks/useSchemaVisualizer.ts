// src/hooks/useSchemaVisualizer.ts - Fixed
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
    reactFlowNodes,
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

  const currentNodesRef = useRef<any[]>([]);

  useEffect(() => {
    console.log("🔄 Syncing nodes, count:", nodes.length);
    if (nodes.length > 0) {
      setReactFlowNodes((currentNodes) => {
        // Cập nhật ref với current nodes
        currentNodesRef.current = currentNodes;

        const positionMap = new Map();
        currentNodes.forEach((node) => {
          positionMap.set(node.id, node.position);
        });

        const nodesWithCallbacks = nodes.map((node) => {
          const currentPosition = positionMap.get(node.id) || node.position;

          return {
            ...node,
            position: currentPosition,
            data: {
              ...node.data,
              // Sử dụng ref để lấy fresh data
              getAllModels: () => {
                const models = currentNodesRef.current.map((n) => n.data);
                console.log(
                  "🔍 getAllModels called, returning:",
                  models.length,
                  "models"
                );
                return models;
              },
              onFieldUpdate: handleFieldUpdate,
              onToggleKeyType: handleToggleKeyType,
              onAddAttribute: handleAddAttribute,
              onDeleteAttribute: handleDeleteAttribute,
              onForeignKeyTargetSelect: handleForeignKeyTargetSelect,
              onForeignKeyDisconnect: handleForeignKeyDisconnect,
            },
          };
        });

        console.log("🔄 Updated nodes with getAllModels function");
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

  useEffect(() => {
    currentNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  // Update edges when data changes - CREATE edges from model connections
  useEffect(() => {
    console.log("🔄 Creating edges from model connections...");

    if (reactFlowNodes.length === 0) {
      setReactFlowEdges([]);
      return;
    }

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
            console.warn(
              `Node not found for connection: ${node.id} -> ${connection.targetModelName}`
            );
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
              borderRadius: 30, // Đây mới là cách đúng cho smoothstep
              offset: 50, // Khoảng cách từ node
            },
            style: {
              strokeWidth: 2,
            },
            label: connection.foreignKeyName,
            labelBgStyle: {
              fill: "rgba(255, 255, 255, 0.8)",
              fillOpacity: 0.8,
            },
          });
        }
      });
    });

    console.log(`🔗 Created ${newEdges.length} edges from connections`);
    setReactFlowEdges(newEdges);
  }, [reactFlowNodes, setReactFlowEdges]);

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
