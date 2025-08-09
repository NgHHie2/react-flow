// src/hooks/useSchemaVisualizer.ts
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

// Global variable to store field update function
declare global {
  interface Window {
    sendFieldUpdate?: (update: any) => void;
  }
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
  } = useSchemaData();

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  // WebSocket setup - use stable object reference
  const websocketHandlers = useRef({
    onNodePositionUpdate: (data: any) => {
      console.log("Received node position update:", data);
      updateNodePosition(data.nodeId, data.positionX, data.positionY);
    },
    onFieldUpdate: (data: any) => {
      console.log("Received field update:", data);
      updateField(data.modelName, data.fieldId, data.fieldName, data.fieldType);
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
      updateField(data.modelName, data.fieldId, data.fieldName, data.fieldType);
    };
  }, [updateNodePosition, updateField]);

  // Initialize WebSocket connection
  const { isConnected, sendNodePositionUpdate, sendFieldUpdate } = useWebSocket(
    websocketHandlers.current
  );

  // Store sendFieldUpdate globally
  useEffect(() => {
    window.sendFieldUpdate = sendFieldUpdate;
    return () => {
      delete window.sendFieldUpdate;
    };
  }, [sendFieldUpdate]);

  // Field update handler - memoized with current nodes
  const handleFieldUpdate = useCallback(
    (fieldId: number, fieldName: string, fieldType: string) => {
      console.log("Field update requested:", { fieldId, fieldName, fieldType });
      const currentNodes = reactFlowNodes;
      const fieldUpdate = createFieldUpdate(
        currentNodes,
        fieldId,
        fieldName,
        fieldType
      );
      if (fieldUpdate && window.sendFieldUpdate) {
        console.log("Sending field update:", fieldUpdate);
        window.sendFieldUpdate(fieldUpdate);
      }
    },
    []
  );

  // Handle node drag
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log("Node dragged:", node.id, "to position:", node.position);

      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }

      dragTimeoutRef.current = setTimeout(() => {
        const update = createNodePositionUpdate(node);
        console.log("Sending position update:", update);
        sendNodePositionUpdate(update);
      }, 300);
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
        },
      }));
      setReactFlowNodes(nodesWithCallbacks);
    } else {
      setReactFlowNodes([]);
    }
  }, [nodes, setReactFlowNodes]);

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
    onNodeDragStop,

    // WebSocket state
    isConnected,

    // Action handlers
    handleRefresh,
    handleReset,
    handleInitialize,
  };
};
