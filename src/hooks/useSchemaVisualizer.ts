// src/hooks/useSchemaVisualizer.ts - Updated with new WebSocket filtering
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

  // WebSocket setup with handlers that ONLY receive updates from OTHER clients
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
        // This is the response with real ID
        addAttribute(
          data.modelName,
          data.attributeName,
          data.dataType,
          data.realAttributeId
        );
      } else {
        // This is the initial message
        addAttribute(data.modelName, data.attributeName, data.dataType);
      }
    },
    onDeleteAttribute: (data: any) => {
      console.log("➖ Received delete attribute from OTHER client:", data);
      deleteAttribute(data.modelName, data.attributeId);
    },
  });

  // Update WebSocket handlers when dependencies change
  useEffect(() => {
    websocketHandlers.current.onNodePositionUpdate = (data: any) => {
      console.log("📍 Processing position update from OTHER client:", data);
      updateNodePosition(data.modelName, data.positionX, data.positionY);
    };
    websocketHandlers.current.onFieldUpdate = (data: any) => {
      console.log("✏️ Processing field update from OTHER client:", data);
      updateField(
        data.modelName,
        data.attributeId,
        data.attributeName,
        data.attributeType
      );
    };
    websocketHandlers.current.onTogglePrimaryKey = (data: any) => {
      console.log("🔑 Processing primary key toggle from OTHER client:", data);
      togglePrimaryKey(data.modelName, data.attributeId);
    };
    websocketHandlers.current.onToggleForeignKey = (data: any) => {
      console.log("🔗 Processing foreign key toggle from OTHER client:", data);
      toggleForeignKey(data.modelName, data.attributeId);
    };
    websocketHandlers.current.onAddAttribute = (data: any) => {
      console.log("➕ Processing add attribute from OTHER client:", data);
      addAttribute(data.modelName, data.attributeName, data.dataType);
    };
    websocketHandlers.current.onDeleteAttribute = (data: any) => {
      console.log("➖ Processing delete attribute from OTHER client:", data);
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

  // Initialize WebSocket connection with filtering enabled by default
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

  // Field update handler - will NOT receive updates from this client
  const handleFieldUpdate = useCallback(
    (attributeId: number, attributeName: string, attributeType: string) => {
      console.log(
        "📤 Sending field update (will be filtered for this client):",
        {
          attributeId,
          attributeName,
          attributeType,
        }
      );
      const currentNodes = reactFlowNodesRef.current;
      const fieldUpdate = createFieldUpdate(
        currentNodes,
        attributeId,
        attributeName,
        attributeType
      );

      if (fieldUpdate && window.sendFieldUpdate) {
        window.sendFieldUpdate(fieldUpdate);
      }
    },
    []
  );

  // Toggle key type handler - will NOT receive updates from this client
  const handleToggleKeyType = useCallback(
    (
      modelName: string,
      attributeId: number,
      keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
    ) => {
      console.log(
        "📤 Sending toggle key type (will be filtered for this client):",
        {
          modelName,
          attributeId,
          keyType,
        }
      );

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
            window.sendTogglePrimaryKey({ modelName, modelId, attributeId });
          } else if (attribute.isForeignKey && window.sendToggleForeignKey) {
            window.sendToggleForeignKey({ modelName, modelId, attributeId });
          }
        }
      }
    },
    []
  );

  // Add attribute handler - will NOT receive updates from this client
  const handleAddAttribute = useCallback((modelName: string) => {
    console.log(
      "📤 Sending add attribute (will be filtered for this client):",
      { modelName }
    );

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

  // Delete attribute handler - will NOT receive updates from this client
  const handleDeleteAttribute = useCallback(
    (modelName: string, attributeId: number) => {
      console.log(
        "📤 Sending delete attribute (will be filtered for this client):",
        { modelName, attributeId }
      );

      const currentNodes = reactFlowNodesRef.current;
      const node = currentNodes.find((n) => n.id === modelName);
      if (!node) {
        console.error("Node not found for modelName:", modelName);
        return;
      }

      const modelId = node.data.id;
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

  // Drag handlers with proper detection
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
      dragThreshold: 5,
    };

    dragStateRef.current.set(node.id, dragState);
  }, []);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    const dragState = dragStateRef.current.get(node.id);
    if (!dragState || !dragState.startPosition) return;

    const distance = calculateDistance(dragState.startPosition, node.position);
    dragState.currentPosition = { ...node.position };

    if (distance > dragState.dragThreshold) {
      dragState.isDragging = true;
    }

    dragStateRef.current.set(node.id, dragState);
  }, []);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const dragState = dragStateRef.current.get(node.id);

      console.log("🛑 Drag STOP for node:", node.id);

      if (!dragState || !dragState.startPosition) {
        dragStateRef.current.delete(node.id);
        return;
      }

      const totalDistance = calculateDistance(
        dragState.startPosition,
        node.position
      );

      // Only send update if actually dragged (and this will be filtered for this client)
      if (dragState.isDragging && totalDistance > dragState.dragThreshold) {
        console.log(
          "📤 Sending position update (will be filtered for this client)"
        );

        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }

        dragTimeoutRef.current = setTimeout(() => {
          const update = createNodePositionUpdate(node);
          sendNodePositionUpdate(update);
        }, 300);
      }

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
    console.log("🔄 Syncing edges, count:", edges.length);
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
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
