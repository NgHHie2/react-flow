// src/hooks/useSchemaVisualizer.ts - Updated với WebSocket sender
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
import { useWebSocketSender } from "./useWebSocketSender";
import { useWebSocketHandlers } from "./useWebSocketHandlers";
import { useNodeHandlers } from "./useNodeHandlers";
import { useDragHandlers } from "./useDragHandlers";
import { calculateOptimalHandlePositions } from "../utils/handlePositioning";
import { Attribute } from "../SchemaVisualizer/SchemaVisualizer.types";
import { generateAttributeId, generateModelId } from "../utils/uuid.utils";
import { useWebSocketListener } from "./useWebSocketListener";
import { getVietnamTime } from "../utils";
import { useParams } from "react-router-dom";

export const useSchemaVisualizer = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const {
    nodes,
    edges,
    loading,
    error,
    schemaInfo,
    fetchSchemaData,
    initializeData,
    updateNodePosition,
    updateFieldName,
    updateFieldType,
    addAttribute,
    deleteAttribute,
    addModel,
    updateModelName,
    deleteModel,
  } = useSchemaData();

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);
  const [isUpdatingFromWebSocket, setIsUpdatingFromWebSocket] = useState(false);

  const reactFlowNodesRef = useRef<Node[]>([]);
  useEffect(() => {
    reactFlowNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  const hasInitialized = useRef(false);
  const currentNodesRef = useRef<any[]>([]);

  // ⭐ WebSocket sender (cho việc gửi messages) - đọc từ global state
  const {
    isConnected,
    sendNodePositionUpdate,
    sendFieldNameUpdate,
    sendFieldTypeUpdate,
    sendToggleKeyType,
    sendAddAttribute,
    sendDeleteAttribute,
    sendForeignKeyConnect,
    sendForeignKeyDisconnect,
    sendAddModel,
    sendUpdateModelName,
    sendDeleteModel,
  } = useWebSocketSender();

  // Node action handlers
  const {
    handleFieldNameUpdate,
    handleFieldTypeUpdate,
    handleToggleKeyType,
    handleAddAttribute,
    handleDeleteAttribute,
    handleForeignKeyTargetSelect,
    handleForeignKeyDisconnect,
  } = useNodeHandlers({
    setReactFlowNodes,
    sendFieldNameUpdate,
    sendFieldTypeUpdate,
    sendToggleKeyType,
    sendAddAttribute,
    sendDeleteAttribute,
    sendForeignKeyConnect,
    sendForeignKeyDisconnect,
    reactFlowNodes,
  });

  // Drag handlers
  const { onNodeDragStart, onNodeDrag, onNodeDragStop, onNodeClick } =
    useDragHandlers({
      sendNodePositionUpdate,
      setReactFlowNodes,
    });

  // ReactFlow connection handler
  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  // Model operation handlers
  const handleAddModel = useCallback(() => {
    if (!schemaInfo) return;
    console.log("Adding model, current nodes:", reactFlowNodes);
    const newModelId = generateModelId();
    const positionX = Math.random() * 400 + 100;
    const positionY = Math.random() * 300 + 100;

    console.log("🆕 Adding new model:", { newModelId, positionX, positionY });

    setReactFlowNodes((currentNodes: any) => {
      // Lấy callbacks từ node hiện có để copy sang node mới
      const callbacks = {
        onFieldNameUpdate: handleFieldNameUpdate,
        onFieldTypeUpdate: handleFieldTypeUpdate,
        onToggleKeyType: handleToggleKeyType,
        onAddAttribute: handleAddAttribute,
        onDeleteAttribute: handleDeleteAttribute,
        onForeignKeyTargetSelect: handleForeignKeyTargetSelect,
        onForeignKeyDisconnect: handleForeignKeyDisconnect,
        onModelNameUpdate: handleModelNameUpdate,
        onDeleteModel: handleDeleteModel,
      };
      console.log("🔧 Copying callbacks to new node:", {
        hasCallbacks: Object.keys(callbacks).length > 0,
        hasOnDeleteModel: !!callbacks.onDeleteModel,
      });

      const newNode = {
        id: newModelId,
        position: { x: positionX, y: positionY },
        data: {
          id: newModelId,
          name: "Model",
          modelType: "TABLE",
          width: 280,
          height: 200,
          backgroundColor: "#f1f5f9",
          borderColor: "#e2e8f0",
          borderWidth: 2,
          borderRadius: 8,
          attributes: [],
          zindex: 10,
          ...callbacks,
        },
        type: "model",
      };

      console.log("New node created:", newNode);
      return [...currentNodes, newNode];
    });

    // Gửi WebSocket để sync với backend và các clients khác
    if (isConnected) {
      sendAddModel({
        modelId: newModelId,
        positionX,
        positionY,
        databaseDiagramId: schemaInfo.id,
      });
      console.log("📤 Sent add model request, waiting for backend response...");
    }
  }, [
    schemaInfo,
    isConnected,
    reactFlowNodes,
    sendAddModel,
    setReactFlowNodes,
  ]);

  const handleModelNameUpdate = useCallback(
    (modelId: string, oldName: string, newName: string) => {
      console.log("🏷️ handleModelNameUpdate called:", { modelId, newName });

      if (oldName === newName || !newName.trim()) {
        console.warn("⚠️ Model name update skipped:", {
          oldName,
          newName,
          trimmed: newName.trim(),
        });
        return;
      }

      const trimmedNewName = newName.trim();

      // Update local UI immediately
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((currentNode: any) => {
          if (currentNode.id === modelId) {
            return {
              ...currentNode,
              data: {
                ...currentNode.data,
                name: trimmedNewName,
                nameUpdatedAt: getVietnamTime(),
              },
            };
          }
          return {
            ...currentNode,
            data: {
              ...currentNode.data,
              lastUpdate: Date.now(),
            },
          };
        });
      });

      // Gửi WebSocket để sync với other clients
      if (isConnected) {
        console.log("📤 Sending model name update via WebSocket");
        sendUpdateModelName({
          modelId: modelId,
          oldModelName: oldName,
          newModelName: trimmedNewName,
        });
      } else {
        console.warn("⚠️ Not connected, cannot send WebSocket update");
      }
    },
    [setReactFlowNodes, sendUpdateModelName, isConnected]
  );

  const handleDeleteModel = useCallback(
    (modelId: string) => {
      const node = reactFlowNodesRef.current.find((n: any) => n.id === modelId);

      if (!node) {
        console.warn(`⚠️ Node not found for delete: ${modelId}`);
        return;
      }

      console.log(`🗑️ Deleting model: ${modelId}`);
      setReactFlowNodes((prevNodes: any[]) => {
        return prevNodes.filter((node) => node.id !== modelId);
      });

      // Gửi WebSocket
      if (isConnected) {
        sendDeleteModel({
          modelId: modelId,
        });
      }
    },
    [reactFlowNodes, sendDeleteModel, isConnected, setReactFlowNodes]
  );

  // Stable callbacks with proper memoization
  const stableCallbacks = useMemo(
    () => ({
      onFieldNameUpdate: handleFieldNameUpdate,
      onFieldTypeUpdate: handleFieldTypeUpdate,
      onToggleKeyType: handleToggleKeyType,
      onAddAttribute: handleAddAttribute,
      onDeleteAttribute: handleDeleteAttribute,
      onForeignKeyTargetSelect: handleForeignKeyTargetSelect,
      onForeignKeyDisconnect: handleForeignKeyDisconnect,
      onModelNameUpdate: handleModelNameUpdate,
      onDeleteModel: handleDeleteModel,
    }),
    [
      handleFieldNameUpdate,
      handleFieldTypeUpdate,
      handleToggleKeyType,
      handleAddAttribute,
      handleDeleteAttribute,
      handleForeignKeyTargetSelect,
      handleForeignKeyDisconnect,
      handleModelNameUpdate,
      handleDeleteModel,
    ]
  );

  // Basic action handlers
  const handleInitialize = useCallback(() => {
    initializeData(stableCallbacks);
  }, [initializeData, stableCallbacks]);

  const handleReset = useCallback(() => {
    initializeData(stableCallbacks);
  }, [initializeData, stableCallbacks]);

  // Initialize data on first mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchSchemaData(stableCallbacks);
    }
  }, [fetchSchemaData, stableCallbacks]);

  // Node synchronization with change detection
  const nodesFingerprint = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      name: node.id,
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
  const prevNodesLengthRef = useRef<number>(-1);

  useEffect(() => {
    if (nodes.length === 0) {
      if (prevNodesLengthRef.current !== 0) {
        setReactFlowNodes([]);
        lastFingerprintRef.current = "";
        prevNodesLengthRef.current = 0;
      }
      return;
    }

    prevNodesLengthRef.current = nodes.length;
    const currentFingerprint = JSON.stringify(nodesFingerprint);

    // Only sync if fingerprint actually changed
    if (currentFingerprint === lastFingerprintRef.current) {
      return;
    }

    console.log("🔄 Syncing nodes - fingerprint changed");
    lastFingerprintRef.current = currentFingerprint;

    setReactFlowNodes((currentNodes) => {
      currentNodesRef.current = currentNodes;

      // Preserve positions for existing nodes
      const positionMap = new Map();
      currentNodes.forEach((node) => {
        positionMap.set(node.id, node.position);
      });

      const newNodes = nodes.map((node) => ({
        ...node,
        position: positionMap.get(node.id) || node.position,
        data: {
          ...node.data,
          ...stableCallbacks,
        },
      }));

      // Update reactFlowNodes references for ALL nodes
      newNodes.forEach((node) => {
        node.data.reactFlowNodes = newNodes;
      });

      return newNodes;
    });
  }, [nodesFingerprint, stableCallbacks, nodes]);

  // Keep currentNodesRef updated
  useEffect(() => {
    currentNodesRef.current = reactFlowNodes;
    console.log("list node: ", reactFlowNodes);
  }, [reactFlowNodes]);

  useEffect(() => {
    if (reactFlowNodes.length === 0) return;

    console.log("🔄 Connection state changed, re-injecting callbacks");
    setReactFlowNodes((currentNodes) => {
      return currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          ...stableCallbacks,
          lastCallbackUpdate: Date.now(),
        },
      }));
    });
  }, [isConnected]);

  // Optimized edge calculation
  const edgesFingerprint = useMemo(() => {
    if (reactFlowNodes.length === 0) return "empty";

    const connections: string[] = [];

    reactFlowNodes.forEach((node) => {
      const attributes: Attribute[] = node.data.attributes || [];
      attributes.forEach((attribute: Attribute) => {
        if (attribute.connection) {
          connections.push(
            `${node.id}:${attribute.id}->${attribute.connection.targetModelId}:${attribute.connection.targetAttributeId}`
          );
        }
      });
    });

    return connections.sort().join("|");
  }, [reactFlowNodes]);

  const edgesData = useMemo(() => {
    if (reactFlowNodes.length === 0) return [];

    // console.log("🔗 Calculating edges from fingerprint:", edgesFingerprint);

    const nodeMap = new Map(reactFlowNodes.map((node) => [node.id, node]));
    const newEdges: Edge[] = [];

    reactFlowNodes.forEach((node) => {
      const attributes: Attribute[] = node.data.attributes || [];
      attributes.forEach((attribute: Attribute) => {
        if (!attribute.connection) return;

        const connection = attribute.connection;
        const sourceNode = nodeMap.get(node.id);
        const targetNode = nodeMap.get(connection.targetModelId);

        if (!sourceNode || !targetNode) {
          console.warn(
            `⚠️ Missing node for edge: ${node.id} -> ${connection.targetModelId}`
          );
          return;
        }

        try {
          const handlePositions = calculateOptimalHandlePositions(
            sourceNode,
            targetNode,
            attribute.id,
            connection.targetAttributeId
          );

          const edgeId = `${node.id}-${attribute.id}-${connection.targetModelId}`;

          newEdges.push({
            id: edgeId,
            source: node.id,
            target: connection.targetModelId,
            sourceHandle: handlePositions.sourceHandleId,
            targetHandle: handlePositions.targetHandleId,
            animated: connection.isAnimated || true,
            type: "step",
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

  // Enhanced onNodesChange with proper position handling
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
          const node = reactFlowNodes.find((n) => n.id === change.id);
          if (node && !isUpdatingFromWebSocket) {
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
    [onNodesChange, reactFlowNodes, updateNodePosition, isUpdatingFromWebSocket]
  );

  // ⭐ WebSocket handlers (cho việc nhận messages)
  const websocketHandlers = useWebSocketHandlers({
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
  });

  // ✅ Gọi useWebSocketListener ở đây
  useWebSocketListener({
    handlers: websocketHandlers,
    enabled: true,
    diagramId: diagramId,
  });

  return {
    // Data state
    loading,
    error,
    schemaInfo,
    isConnected,

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
    onNodeClick,

    // Action handlers
    handleReset,
    handleInitialize,
    handleAddModel,
    handleModelNameUpdate,
    handleDeleteModel,
  };
};
