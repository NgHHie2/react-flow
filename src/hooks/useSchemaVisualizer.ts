// src/hooks/useSchemaVisualizer.ts - Fixed drag detection
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
import {
  createNodePositionUpdate,
  createFieldUpdate,
} from "../utils/schemaUtils";

// Global variable to store functions
declare global {
  interface Window {
    sendFieldUpdate?: (update: any) => void;
    sendTogglePrimaryKey?: (update: any) => void;
    sendToggleForeignKey?: (update: any) => void;
    sendAddAttribute?: (update: any) => void;
    sendDeleteAttribute?: (update: any) => void;
  }
}

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  dragThreshold: number;
}

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

  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  // Enhanced drag state tracking
  const dragStateRef = useRef<Map<string, DragState>>(new Map());

  // WebSocket setup - use stable object reference
  const websocketHandlers = useRef({
    onNodePositionUpdate: (data: any) => {
      console.log("Received node position update:", data);
      updateNodePosition(data.nodeId, data.positionX, data.positionY);
    },
    onFieldUpdate: (data: any) => {
      console.log("Received field update:", data);
      updateField(
        data.modelName,
        data.attributeId,
        data.attributeName,
        data.attributeType
      );
    },
    onTogglePrimaryKey: (data: any) => {
      console.log("Received toggle primary key:", data);
      togglePrimaryKey(data.modelName, data.attributeId);
    },
    onToggleForeignKey: (data: any) => {
      console.log("Received toggle foreign key:", data);
      toggleForeignKey(data.modelName, data.attributeId);
    },
    onAddAttribute: (data: any) => {
      console.log("Received add attribute with real ID:", data);
      // Remove temporary attribute and add with real ID
      addAttribute(
        data.modelName,
        data.attributeName,
        data.dataType,
        data.realAttributeId
      );
    },
    onDeleteAttribute: (data: any) => {
      console.log("Received delete attribute:", data);
      deleteAttribute(data.modelName, data.attributeId);
    },
  });

  // Update WebSocket handlers when dependencies change
  useEffect(() => {
    websocketHandlers.current.onNodePositionUpdate = (data: any) => {
      console.log("Received node position update:", data);
      updateNodePosition(data.modelName, data.positionX, data.positionY);
    };
    websocketHandlers.current.onFieldUpdate = (data: any) => {
      console.log("Received field update:", data);
      updateField(
        data.modelName,
        data.attributeId,
        data.attributeName,
        data.attributeType
      );
    };
    websocketHandlers.current.onTogglePrimaryKey = (data: any) => {
      console.log("Received toggle primary key:", data);
      togglePrimaryKey(data.modelName, data.attributeId);
    };
    websocketHandlers.current.onToggleForeignKey = (data: any) => {
      console.log("Received toggle foreign key:", data);
      toggleForeignKey(data.modelName, data.attributeId);
    };
    websocketHandlers.current.onAddAttribute = (data: any) => {
      console.log("Received add attribute:", data);
      addAttribute(data.modelName, data.attributeName, data.dataType);
    };
    websocketHandlers.current.onDeleteAttribute = (data: any) => {
      console.log("Received delete attribute:", data);
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

  // Initialize WebSocket connection
  const {
    isConnected,
    sendNodePositionUpdate,
    sendFieldUpdate,
    sendTogglePrimaryKey,
    sendToggleForeignKey,
    sendAddAttribute,
    sendDeleteAttribute,
  } = useWebSocket(websocketHandlers.current);

  // Store functions globally
  useEffect(() => {
    window.sendFieldUpdate = sendFieldUpdate;
    window.sendTogglePrimaryKey = sendTogglePrimaryKey;
    window.sendToggleForeignKey = sendToggleForeignKey;
    window.sendAddAttribute = sendAddAttribute;
    window.sendDeleteAttribute = sendDeleteAttribute;

    return () => {
      delete window.sendFieldUpdate;
      delete window.sendTogglePrimaryKey;
      delete window.sendToggleForeignKey;
      delete window.sendAddAttribute;
      delete window.sendDeleteAttribute;
    };
  }, [
    sendFieldUpdate,
    sendTogglePrimaryKey,
    sendToggleForeignKey,
    sendAddAttribute,
    sendDeleteAttribute,
  ]);

  const reactFlowNodesRef = useRef(reactFlowNodes);
  useEffect(() => {
    reactFlowNodesRef.current = reactFlowNodes;
  }, [reactFlowNodes]);

  // Field update handler - memoized with current nodes
  const handleFieldUpdate = useCallback(
    (attributeId: number, attributeName: string, attributeType: string) => {
      console.log("Field update requested:", {
        attributeId,
        attributeName,
        attributeType,
      });
      const currentNodes = reactFlowNodesRef.current;
      const fieldUpdate = createFieldUpdate(
        currentNodes,
        attributeId,
        attributeName,
        attributeType
      );

      if (fieldUpdate && window.sendFieldUpdate) {
        console.log("Sending field update:", fieldUpdate);
        window.sendFieldUpdate(fieldUpdate);
      }
    },
    []
  );

  // Toggle key type handler (unified for PK/FK)
  const handleToggleKeyType = useCallback(
    (
      modelName: string,
      attributeId: number,
      keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
    ) => {
      console.log("Toggle key type requested:", {
        modelName,
        attributeId,
        keyType,
      });

      // Find modelId from current nodes
      const currentNodes = reactFlowNodesRef.current;
      const node = currentNodes.find((n) => n.id === modelName);
      if (!node) return;

      const modelId = node.data.id;

      if (keyType === "PRIMARY") {
        if (window.sendTogglePrimaryKey) {
          window.sendTogglePrimaryKey({ modelName, modelId, attributeId });
        }
      } else if (keyType === "FOREIGN") {
        if (window.sendToggleForeignKey) {
          window.sendToggleForeignKey({ modelName, modelId, attributeId });
        }
      } else {
        // NORMAL - turn off current key status
        const attribute = node.data.attributes.find(
          (attr: any) => attr.id === attributeId
        );
        if (attribute) {
          if (attribute.isPrimaryKey && window.sendTogglePrimaryKey) {
            console.log("Turning off Primary Key for", attribute.name);
            window.sendTogglePrimaryKey({ modelName, modelId, attributeId });
          } else if (attribute.isForeignKey && window.sendToggleForeignKey) {
            console.log("Turning off Foreign Key for", attribute.name);
            window.sendToggleForeignKey({ modelName, modelId, attributeId });
          }
        }
      }
    },
    []
  );

  // Add attribute handler
  const handleAddAttribute = useCallback((modelName: string) => {
    console.log("Add attribute requested:", { modelName });

    // Find modelId from current nodes
    const currentNodes = reactFlowNodesRef.current;
    const node = currentNodes.find((n) => n.id === modelName);
    if (!node) return;

    const modelId = node.data.id;

    if (window.sendAddAttribute) {
      window.sendAddAttribute({
        modelName,
        modelId,
        attributeName: "new_field",
        dataType: "VARCHAR(255)",
      });
    }
  }, []);

  // Delete attribute handler
  const handleDeleteAttribute = useCallback(
    (modelName: string, attributeId: number) => {
      console.log("Delete attribute requested:", { modelName, attributeId });

      // Find modelId from current nodes
      const currentNodes = reactFlowNodesRef.current;
      const node = currentNodes.find((n) => n.id === modelName);
      if (!node) {
        console.error("Node not found for modelName:", modelName);
        return;
      }

      const modelId = node.data.id;

      // Verify attribute exists in this model
      const attribute = node.data.attributes.find(
        (attr: any) => attr.id === attributeId
      );
      if (!attribute) {
        console.error(
          "Attribute not found:",
          attributeId,
          "in model:",
          modelName
        );
        return;
      }

      console.log(
        "Sending delete for attribute:",
        attribute.name,
        "with ID:",
        attributeId,
        "in model:",
        modelId
      );

      if (window.sendDeleteAttribute) {
        window.sendDeleteAttribute({ modelName, modelId, attributeId });
      }
    },
    []
  );

  // Calculate distance between two points
  const calculateDistance = (
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  };

  // Enhanced drag handlers with proper detection
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    console.log(
      "🎯 Drag START for node:",
      node.id,
      "at position:",
      node.position
    );

    const dragState: DragState = {
      isDragging: false,
      startPosition: { ...node.position },
      currentPosition: { ...node.position },
      dragThreshold: 5, // pixels - minimum distance to consider as drag
    };

    dragStateRef.current.set(node.id, dragState);
  }, []);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    const dragState = dragStateRef.current.get(node.id);
    if (!dragState || !dragState.startPosition) return;

    // Calculate distance moved
    const distance = calculateDistance(dragState.startPosition, node.position);

    // Update current position
    dragState.currentPosition = { ...node.position };

    // Mark as dragging if moved beyond threshold
    if (distance > dragState.dragThreshold) {
      dragState.isDragging = true;
      console.log(
        "🚀 Node",
        node.id,
        "is now being dragged, distance:",
        distance.toFixed(2)
      );
    }

    dragStateRef.current.set(node.id, dragState);
  }, []);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const dragState = dragStateRef.current.get(node.id);

      console.log("🛑 Drag STOP for node:", node.id);
      console.log("   - Start position:", dragState?.startPosition);
      console.log("   - End position:", node.position);
      console.log("   - Was dragging:", dragState?.isDragging);

      if (!dragState || !dragState.startPosition) {
        console.log("❌ No drag state found, skipping position update");
        dragStateRef.current.delete(node.id);
        return;
      }

      // Calculate total distance moved
      const totalDistance = calculateDistance(
        dragState.startPosition,
        node.position
      );
      console.log("   - Total distance moved:", totalDistance.toFixed(2), "px");

      // Only send update if actually dragged (not just clicked)
      if (dragState.isDragging && totalDistance > dragState.dragThreshold) {
        console.log("✅ Sending position update for node:", node.id);

        // Clear any existing timeout
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }

        // Send update with debounce
        dragTimeoutRef.current = setTimeout(() => {
          const update = createNodePositionUpdate(node);
          console.log("📡 Sending position update:", update);
          sendNodePositionUpdate(update);
        }, 300);
      } else {
        console.log(
          "⏭️ Skipping position update - not a real drag (distance:",
          totalDistance.toFixed(2),
          "px)"
        );
      }

      // Cleanup drag state
      dragStateRef.current.delete(node.id);
    },
    [sendNodePositionUpdate]
  );

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  // Action handlers
  const handleRefresh = useCallback(() => {
    console.log("Refreshing data...");
    fetchSchemaData();
  }, [fetchSchemaData]);

  const handleReset = useCallback(() => {
    console.log("Resetting data...");
    initializeData();
  }, [initializeData]);

  const handleInitialize = useCallback(() => {
    console.log("Initializing data...");
    initializeData();
  }, [initializeData]);

  // Initialize data on first mount
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log("Loading initial data...");
      hasInitialized.current = true;
      fetchSchemaData();
    }
  }, [fetchSchemaData]);

  // Update nodes when data changes
  useEffect(() => {
    console.log("Syncing nodes, count:", nodes.length);
    if (nodes.length > 0) {
      const nodesWithCallbacks = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onFieldUpdate: handleFieldUpdate,
          onToggleKeyType: handleToggleKeyType,
          onAddAttribute: handleAddAttribute,
          onDeleteAttribute: handleDeleteAttribute,
        },
      }));
      setReactFlowNodes(nodesWithCallbacks);
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
  ]);

  // Update edges when data changes
  useEffect(() => {
    console.log("Syncing edges, count:", edges.length);
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      // Clear all drag states
      dragStateRef.current.clear();
    };
  }, []);

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
