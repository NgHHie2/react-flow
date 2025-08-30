// src/hooks/useSchemaVisualizer.ts - Balanced optimization version
import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
  NodeChange,
} from "reactflow";
import { useSchemaData } from "./useSchemaData";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketHandlers } from "./useWebSocketHandlers";
import { useNodeHandlers } from "./useNodeHandlers";
import { useDragHandlers } from "./useDragHandlers";
import { calculateOptimalHandlePositions } from "../utils/handlePositioning";
import { Attribute } from "../SchemaVisualizer/SchemaVisualizer.types";

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
  const currentNodesRef = useRef<any[]>([]);

  // WebSocket handlers
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
    sendAddModel,
    sendUpdateModelName,
    sendDeleteModel,
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

  // ReactFlow connection handler
  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  // Model operation handlers - STABLE callbacks
  const handleAddModel = useCallback(() => {
    const timestamp = Date.now();
    const newModelName = `Table_${timestamp}`;
    const positionX = Math.random() * 400 + 100;
    const positionY = Math.random() * 300 + 100;

    console.log("🆕 Adding new model:", { newModelName, positionX, positionY });

    addModel(newModelName, positionX, positionY);

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
      if (!node) return;

      updateModelName(oldName, newName);

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
      if (!node) return;

      // Check connections
      const hasConnections =
        node.data.attributes?.some((attr: any) => attr.connection) ||
        reactFlowNodes.some(
          (otherNode: any) =>
            otherNode.id !== modelName &&
            otherNode.data.attributes?.some(
              (attr: any) => attr.connection?.targetModelName === modelName
            )
        );

      if (hasConnections) {
        console.warn("Cannot delete model with connections:", modelName);
        return;
      }

      deleteModel(modelName);

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
    fetchSchemaData();
  }, [fetchSchemaData]);

  const handleReset = useCallback(() => {
    initializeData();
  }, [initializeData]);

  const handleInitialize = useCallback(() => {
    initializeData();
  }, [initializeData]);

  // Initialize data on first mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchSchemaData();
    }
  }, [fetchSchemaData]);

  // ✅ FIX 1: Stable callbacks - but allow for updates when needed
  const stableCallbacks = useMemo(
    () => ({
      getAllModels: () => currentNodesRef.current.map((n) => n.data),
      onFieldUpdate: handleFieldUpdate,
      onToggleKeyType: handleToggleKeyType,
      onAddAttribute: handleAddAttribute,
      onDeleteAttribute: handleDeleteAttribute,
      onForeignKeyTargetSelect: handleForeignKeyTargetSelect,
      onForeignKeyDisconnect: handleForeignKeyDisconnect,
      onModelNameUpdate: handleModelNameUpdate,
      onDeleteModel: handleDeleteModel,
    }),
    [
      handleFieldUpdate,
      handleToggleKeyType,
      handleAddAttribute,
      handleDeleteAttribute,
      handleForeignKeyTargetSelect,
      handleForeignKeyDisconnect,
      handleModelNameUpdate,
      handleDeleteModel,
    ]
  );

  // ✅ FIX 2: Only sync when nodes actually change - use JSON for comparison
  const nodesDataString = useMemo(() => {
    return JSON.stringify(
      nodes.map((node) => ({
        id: node.id,
        attributesCount: node.data.attributes?.length || 0,
        attributesHash:
          node.data.attributes
            ?.map(
              (attr: any) =>
                `${attr.id}-${attr.name}-${attr.dataType}-${
                  attr.isPrimaryKey
                }-${attr.isForeignKey}-${
                  attr.connection?.targetModelName || "none"
                }`
            )
            .join("|") || "",
      }))
    );
  }, [nodes]);

  const lastNodesDataString = useRef<string>("");

  useEffect(() => {
    if (nodes.length === 0) {
      setReactFlowNodes([]);
      lastNodesDataString.current = "";
      return;
    }

    // Only sync if data actually changed
    if (nodesDataString === lastNodesDataString.current) {
      return;
    }

    console.log("🔄 Syncing nodes data - data changed");
    lastNodesDataString.current = nodesDataString;

    setReactFlowNodes((currentNodes) => {
      currentNodesRef.current = currentNodes;

      // Preserve positions for existing nodes
      const positionMap = new Map();
      currentNodes.forEach((node) => {
        positionMap.set(node.id, node.position);
      });

      return nodes.map((node) => ({
        ...node,
        position: positionMap.get(node.id) || node.position,
        data: {
          ...node.data,
          ...stableCallbacks,
        },
      }));
    });
  }, [nodesDataString, stableCallbacks]);

  // Keep ref updated
  useEffect(() => {
    currentNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  // ✅ FIX 3: Calculate edges properly - including on model name changes
  const edgesData = useMemo(() => {
    if (reactFlowNodes.length === 0) return [];

    console.log("🔗 Calculating edges...");

    const nodeMap = new Map(reactFlowNodes.map((node) => [node.id, node]));
    const newEdges: Edge[] = [];

    reactFlowNodes.forEach((node) => {
      const attributes: Attribute[] = node.data.attributes || [];
      attributes.forEach((attribute: Attribute) => {
        if (!attribute.connection) return;

        const connection = attribute.connection;
        const sourceNode = nodeMap.get(node.id);
        const targetNode = nodeMap.get(connection.targetModelName);

        if (!sourceNode || !targetNode) return;

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
      });
    });

    return newEdges;
  }, [reactFlowNodes]); // Depend on full reactFlowNodes to catch all changes

  // ✅ FIX 4: Update edges when they change
  useEffect(() => {
    console.log(`🔗 Setting ${edgesData.length} edges`);
    setReactFlowEdges(edgesData);
  }, [edgesData, setReactFlowEdges]);

  // ✅ FIX 5: Enhanced onNodesChange to handle position updates properly
  const enhancedOnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Handle position changes separately
      const positionChanges = changes.filter(
        (change) => change.type === "position"
      );
      const otherChanges = changes.filter(
        (change) => change.type !== "position"
      );

      // Apply non-position changes normally
      if (otherChanges.length > 0) {
        onNodesChange(otherChanges);
      }

      // Handle position changes
      positionChanges.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          // Position change is finalized (not during drag)
          const node = reactFlowNodes.find((n) => n.id === change.id);
          if (node) {
            console.log(
              `📍 Position finalized for ${change.id}:`,
              change.position
            );
            updateNodePosition(change.id, change.position.x, change.position.y);
          }
        }
      });

      // Apply position changes to local state
      if (positionChanges.length > 0) {
        onNodesChange(positionChanges);
      }
    },
    [onNodesChange, reactFlowNodes, updateNodePosition]
  );

  return {
    // Data state
    loading,
    error,
    schemaInfo,

    // ReactFlow state
    reactFlowNodes,
    reactFlowEdges,
    onNodesChange: enhancedOnNodesChange,
    onEdgesChange,
    onConnect,

    // Drag handlers
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,

    // WebSocket state
    isConnected,

    // Action handlers
    handleRefresh,
    handleReset,
    handleInitialize,
    handleAddModel,
    handleModelNameUpdate,
    handleDeleteModel,
  };
};
