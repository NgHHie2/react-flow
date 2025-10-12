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
import { generateAttributeId, generateModelId } from "../utils/uuid.utils";

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
  const isUpdatingFromWebSocketRef = useRef(false); // FIX 1: Add WebSocket update flag

  // WebSocket handlers
  const websocketHandlers = useWebSocketHandlers({
    updateNodePosition,
    updateFieldName,
    updateFieldType,
    addAttribute,
    deleteAttribute,
    addModel,
    updateModelName,
    deleteModel,
    setReactFlowNodes,
    setIsUpdatingFromWebSocket,
  });

  // WebSocket connection
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
  } = useWebSocket(websocketHandlers.current);

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
    if (!schemaInfo) return;
    console.log("kho hieu: ", reactFlowNodes);
    const newModelId = generateModelId();
    const positionX = Math.random() * 400 + 100;
    const positionY = Math.random() * 300 + 100;

    console.log("🆕 Adding new model:", { newModelId, positionX, positionY });

    setReactFlowNodes((currentNodes: any) => {
      // ⭐ Lấy callbacks từ node hiện có để copy sang node mới
      const existingNodeWithCallbacks = currentNodes[0]; // Lấy callback từ node đầu tiên
      const callbacks = existingNodeWithCallbacks
        ? {
            onFieldNameUpdate: existingNodeWithCallbacks.data.onFieldNameUpdate,
            onFieldTypeUpdate: existingNodeWithCallbacks.data.onFieldTypeUpdate,
            onToggleKeyType: existingNodeWithCallbacks.data.onToggleKeyType,
            onAddAttribute: existingNodeWithCallbacks.data.onAddAttribute,
            onDeleteAttribute: existingNodeWithCallbacks.data.onDeleteAttribute,
            onForeignKeyTargetSelect:
              existingNodeWithCallbacks.data.onForeignKeyTargetSelect,
            onForeignKeyDisconnect:
              existingNodeWithCallbacks.data.onForeignKeyDisconnect,
            onModelNameUpdate: existingNodeWithCallbacks.data.onModelNameUpdate,
            onDeleteModel: existingNodeWithCallbacks.data.onDeleteModel,
          }
        : {};

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
          // ⭐ Thêm callbacks ngay lập tức
          ...callbacks,
        },
        type: "model",
      };

      console.log("newnode: ", newNode);

      const updatedNodes = [...currentNodes, newNode];

      return updatedNodes;
    });

    // KHÔNG cập nhật UI ngay, chỉ gửi WebSocket và chờ response
    if (isConnected) {
      sendAddModel({
        modelId: newModelId,
        positionX,
        positionY,
        databaseDiagramId: schemaInfo.id,
      });

      console.log("📤 Sent add model request, waiting for backend response...");
    }
  }, [schemaInfo, isConnected]);

  // FIX 3: Improved model name update handler
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

      // ⭐ Update local UI immediately
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((currentNode: any) => {
          if (currentNode.id === modelId) {
            return {
              ...currentNode,
              data: {
                ...currentNode.data,
                name: trimmedNewName,
                lastNameUpdate: Date.now(),
              },
            };
          }
          return {
            ...currentNode,
            data: {
              ...currentNode.data,
              lastUpdate: Date.now(), // Force dependency change
            },
          };
        });
      });
      console.log("hiep dep trai: ", currentNodesRef);

      // ⭐ Gửi WebSocket để sync với other clients
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
      console.log("hiep dep trai");
      if (!node) {
        console.warn(`⚠️ Node not found for delete: ${modelId}`);
        return;
      }

      // Check connections trước khi xóa
      const hasConnections =
        node.data.attributes?.some((attr: any) => attr.connection) ||
        reactFlowNodes.some(
          (otherNode: any) =>
            otherNode.id !== modelId &&
            otherNode.data.attributes?.some(
              (attr: any) => attr.connection?.targetModelId === modelId
            )
        );

      // if (hasConnections) {
      //   console.warn("❌ Cannot delete model with connections:", modelName);
      //   return;
      // }

      console.log(`🗑️ Deleting model: ${modelId}`);
      setReactFlowNodes((prevNodes: any[]) => {
        const afterFilter = prevNodes.filter((node) => node.id !== modelId);

        return afterFilter;
      });

      // Gửi WebSocket với cả modelName và modelId

      sendDeleteModel({
        modelId: modelId,
      });
    },
    [reactFlowNodes, sendDeleteModel, isConnected]
  );
  useEffect(() => {
    // console.log("🌟 reactFlowNodes hiện tại:", reactFlowNodes);
  }, [reactFlowNodes]);

  // FIX 4: Ultra-stable callbacks with proper memoization
  const stableCallbacks = useMemo(
    () => ({
      onFieldNameUpdate: handleFieldNameUpdate,
      onFieldTypeUpdate: handleFieldTypeUpdate,
      onToggleKeyType: handleToggleKeyType, // Signature: (modelName, attributeId, keyType)
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
    initializeData(stableCallbacks); // ✅ Pass callbacks
  }, [initializeData, stableCallbacks]);

  const handleReset = useCallback(() => {
    initializeData(stableCallbacks); // ✅ Pass callbacks
  }, [initializeData, stableCallbacks]);

  const handleRefresh = useCallback(() => {
    fetchSchemaData(stableCallbacks); // ✅ Pass callbacks
  }, [fetchSchemaData, stableCallbacks]);

  // Initialize data on first mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // ✅ THAY ĐỔI: Pass stableCallbacks khi fetch initial data
      fetchSchemaData(stableCallbacks);
    }
  }, [fetchSchemaData, stableCallbacks]);

  // FIX 5: Smarter node synchronization with change detection
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

      // ✅ CRITICAL FIX: Create new nodes array with proper reactFlowNodes reference
      const newNodes = nodes.map((node) => ({
        ...node,
        position: positionMap.get(node.id) || node.position,
        data: {
          ...node.data,
          ...stableCallbacks,
        },
      }));

      // ✅ CRITICAL: Update reactFlowNodes reference for ALL nodes after creating array
      newNodes.forEach((node) => {
        node.data.reactFlowNodes = newNodes; // Self-reference to the new array
      });

      console.log("🔧 Updated reactFlowNodes references:", {
        nodesCount: newNodes.length,
        firstNodeHasReactFlowNodes: !!newNodes[0]?.data?.reactFlowNodes,
        reactFlowNodesCount: newNodes[0]?.data?.reactFlowNodes?.length,
      });

      return newNodes;
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
            `${node.id}:${attribute.id}->${attribute.connection.targetModelId}:${attribute.connection.targetAttributeId}`
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
            // pathOptions: {
            //   borderRadius: 30,
            //   offset: 50,
            // },
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
          // FIX: Use the new state instead of ref
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
    [onNodesChange, reactFlowNodes, updateNodePosition, isUpdatingFromWebSocket] // Add dependency
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
