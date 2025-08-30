// src/hooks/useSchemaVisualizer.ts - Comprehensive fixes
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
  const isUpdatingFromWebSocketRef = useRef(false); // FIX 1: Add WebSocket update flag

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

  // FIX 2: Stable model operation handlers
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

  // FIX 3: Improved model name update handler
  const handleModelNameUpdate = useCallback(
    (oldName: string, newName: string) => {
      if (oldName === newName || !newName.trim()) return;

      const trimmedNewName = newName.trim();
      const node = reactFlowNodes.find((n) => n.id === oldName);
      if (!node) {
        console.warn(`⚠️ Node ${oldName} not found for name update`);
        return;
      }

      console.log(`📝 Updating model name: ${oldName} -> ${trimmedNewName}`);

      // Mark as WebSocket update to prevent echo
      isUpdatingFromWebSocketRef.current = true;

      updateModelName(oldName, trimmedNewName);

      if (isConnected) {
        sendUpdateModelName({
          modelId: node.data.id,
          oldModelName: oldName,
          newModelName: trimmedNewName,
        });
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isUpdatingFromWebSocketRef.current = false;
      }, 100);
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

  // FIX 4: Ultra-stable callbacks with proper memoization
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

  // FIX 5: Smarter node synchronization with change detection
  const nodesFingerprint = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      name: node.data.name,
      attributesHash:
        node.data.attributes
          ?.map(
            (attr: any) =>
              `${attr.id}-${attr.name}-${attr.dataType}-${attr.isPrimaryKey}-${
                attr.isForeignKey
              }-${
                attr.connection
                  ? `${attr.connection.targetModelName}.${attr.connection.targetAttributeName}`
                  : "none"
              }`
          )
          .join("|") || "",
      positionHash: `${node.position.x}-${node.position.y}`,
    }));
  }, [nodes]);

  const lastFingerprintRef = useRef<string>("");

  useEffect(() => {
    if (nodes.length === 0) {
      setReactFlowNodes([]);
      lastFingerprintRef.current = "";
      return;
    }

    const currentFingerprint = JSON.stringify(nodesFingerprint);

    // Only sync if fingerprint actually changed
    if (currentFingerprint === lastFingerprintRef.current) {
      return;
    }

    console.log("🔄 Syncing nodes - fingerprint changed");
    lastFingerprintRef.current = currentFingerprint;

    setReactFlowNodes((currentNodes) => {
      currentNodesRef.current = currentNodes;

      // Preserve positions for existing nodes to prevent position conflicts
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
          // Add allModels to prevent stale closures
          allModels: nodes.map((n) => n.data),
        },
      }));
    });
  }, [nodesFingerprint, stableCallbacks, nodes]);

  // Keep currentNodesRef updated
  useEffect(() => {
    currentNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  // FIX 6: Optimized edge calculation with better change detection
  const edgesFingerprint = useMemo(() => {
    if (reactFlowNodes.length === 0) return "empty";

    const connections: string[] = [];

    reactFlowNodes.forEach((node) => {
      const attributes: Attribute[] = node.data.attributes || [];
      attributes.forEach((attribute: Attribute) => {
        if (attribute.connection) {
          connections.push(
            `${node.id}:${attribute.name}->${attribute.connection.targetModelName}:${attribute.connection.targetAttributeName}`
          );
        }
      });
    });

    return connections.sort().join("|");
  }, [reactFlowNodes]);

  const edgesData = useMemo(() => {
    if (reactFlowNodes.length === 0) return [];

    console.log("🔗 Calculating edges from fingerprint:", edgesFingerprint);

    const nodeMap = new Map(reactFlowNodes.map((node) => [node.id, node]));
    const newEdges: Edge[] = [];

    reactFlowNodes.forEach((node) => {
      const attributes: Attribute[] = node.data.attributes || [];
      attributes.forEach((attribute: Attribute) => {
        if (!attribute.connection) return;

        const connection = attribute.connection;
        const sourceNode = nodeMap.get(node.id);
        const targetNode = nodeMap.get(connection.targetModelName);

        if (!sourceNode || !targetNode) {
          console.warn(
            `⚠️ Missing node for edge: ${node.id} -> ${connection.targetModelName}`
          );
          return;
        }

        try {
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
        } catch (error) {
          console.error("Error calculating handle positions:", error);
        }
      });
    });

    console.log(`🔗 Generated ${newEdges.length} edges`);
    return newEdges;
  }, [edgesFingerprint, reactFlowNodes]);

  // Update edges when they change
  useEffect(() => {
    setReactFlowEdges(edgesData);
  }, [edgesData, setReactFlowEdges]);

  // FIX 7: Enhanced onNodesChange with proper position handling
  const enhancedOnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Separate position changes from other changes
      const positionChanges = changes.filter(
        (change) => change.type === "position"
      );
      const otherChanges = changes.filter(
        (change) => change.type !== "position"
      );

      // Apply non-position changes immediately
      if (otherChanges.length > 0) {
        onNodesChange(otherChanges);
      }

      // Handle position changes with WebSocket consideration
      positionChanges.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          // Position change is finalized (not during drag)
          const node = reactFlowNodes.find((n) => n.id === change.id);
          if (node && !isUpdatingFromWebSocketRef.current) {
            console.log(
              `📍 Position finalized for ${change.id}:`,
              change.position
            );
            updateNodePosition(change.id, change.position.x, change.position.y);
          }
        }
      });

      // Apply position changes to ReactFlow
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
