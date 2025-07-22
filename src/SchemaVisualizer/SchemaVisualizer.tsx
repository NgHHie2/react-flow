// src/SchemaVisualizer/SchemaVisualizer.tsx
import React, { useCallback, useRef, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Box, useToast, Text } from "@chakra-ui/react";

// Components
import ModelNode from "./ModelNode";
import { LoadingScreen } from "../components/LoadingScreen";
import { ErrorScreen } from "../components/ErrorScreen";
import { EmptyState } from "../components/EmptyState";
import { ControlPanel } from "../components/ControlPanel";
import { InstructionsPanel } from "../components/InstructionsPanel";

// Hooks
import { useSchemaData } from "../hooks/useSchemaData";
import { useWebSocket } from "../hooks/useWebSocket";

// Utils
import {
  createNodePositionUpdate,
  createFieldUpdate,
} from "../utils/schemaUtils";

const modelTypes = {
  model: ModelNode,
};

export const SchemaVisualizer = () => {
  const {
    nodes,
    edges,
    loading,
    error,
    fetchSchemaData,
    initializeData,
    updateNodePosition,
    updateField,
  } = useSchemaData();

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  const toast = useToast();
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable field update handler
  const handleFieldUpdate = useCallback(
    (fieldId: number, fieldName: string, fieldType: string) => {
      console.log("Field update requested:", { fieldId, fieldName, fieldType });
      const fieldUpdate = createFieldUpdate(
        reactFlowNodes,
        fieldId,
        fieldName,
        fieldType
      );
      if (fieldUpdate) {
        console.log("Sending field update:", fieldUpdate);
        sendFieldUpdate(fieldUpdate);
      }
    },
    [reactFlowNodes]
  );

  // WebSocket handlers
  const handleNodePositionUpdate = useCallback(
    (data: any) => {
      console.log("Received node position update:", data);
      updateNodePosition(data.modelName, data.positionX, data.positionY);
      // toast({
      //   title: "Position Updated",
      //   description: `${data.modelName} moved by another user`,
      //   status: "info",
      //   duration: 2000,
      //   isClosable: true,
      // });
    },
    [updateNodePosition, toast]
  );

  const handleFieldUpdateFromWS = useCallback(
    (data: any) => {
      console.log("Received field update:", data);
      updateField(data.modelName, data.fieldId, data.fieldName, data.fieldType);
    },
    [updateField, toast]
  );

  const { isConnected, sendNodePositionUpdate, sendFieldUpdate } = useWebSocket(
    {
      onNodePositionUpdate: handleNodePositionUpdate,
      onFieldUpdate: handleFieldUpdateFromWS,
    }
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

  // Stable callback refs
  const stableHandlers = useMemo(
    () => ({
      onRefresh: () => {
        console.log("Refreshing data...");
        fetchSchemaData(handleFieldUpdate);
      },
      onReset: () => {
        console.log("Resetting data...");
        initializeData(handleFieldUpdate);
      },
      onRetry: () => {
        console.log("Retrying data fetch...");
        fetchSchemaData(handleFieldUpdate);
      },
      onInitialize: () => {
        console.log("Initializing data...");
        initializeData(handleFieldUpdate);
      },
      onInitializeFromEmpty: () => {
        console.log("Initializing from empty state...");
        initializeData(handleFieldUpdate);
      },
    }),
    [fetchSchemaData, initializeData, handleFieldUpdate]
  );

  // Load initial data only once
  useEffect(() => {
    console.log("Loading initial data...");
    fetchSchemaData(handleFieldUpdate);
  }, []); // Empty dependency array - only run once

  // Sync nodes and edges when data changes
  useEffect(() => {
    console.log("Syncing nodes with callbacks, nodes count:", nodes.length);
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
  }, [nodes]); // Only depend on nodes, handleFieldUpdate is stable

  useEffect(() => {
    console.log("Syncing edges, edges count:", edges.length);
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

  // Debug logs
  useEffect(() => {
    console.log("SchemaVisualizer State:", {
      loading,
      error,
      nodesCount: nodes.length,
      edgesCount: edges.length,
      reactFlowNodesCount: reactFlowNodes.length,
      reactFlowEdgesCount: reactFlowEdges.length,
    });
  }, [
    loading,
    error,
    nodes.length,
    edges.length,
    reactFlowNodes.length,
    reactFlowEdges.length,
  ]);

  // Debug render info
  console.log("Rendering SchemaVisualizer:", {
    loading,
    error: !!error,
    nodesLength: reactFlowNodes.length,
    edgesLength: reactFlowEdges.length,
    isConnected,
  });

  // Render loading state
  if (loading) {
    console.log("Rendering loading screen");
    return <LoadingScreen message="Loading schema data..." />;
  }

  // Render error state
  if (error) {
    console.log("Rendering error screen:", error);
    return (
      <ErrorScreen
        error={error}
        onRetry={stableHandlers.onRetry}
        onInitialize={stableHandlers.onInitialize}
      />
    );
  }

  // Render empty state
  if (reactFlowNodes.length === 0) {
    console.log("Rendering empty state");
    return <EmptyState onInitialize={stableHandlers.onInitializeFromEmpty} />;
  }

  // Render main schema visualizer
  console.log("Rendering main ReactFlow with", reactFlowNodes.length, "nodes");
  return (
    <Box height="100vh" width="100vw" bg="#1C1c1c" position="relative">
      <ControlPanel
        isConnected={isConnected}
        loading={loading}
        onRefresh={stableHandlers.onRefresh}
        onReset={stableHandlers.onReset}
      />

      {/* <InstructionsPanel /> */}

      {/* Debug info */}
      <Box
        position="absolute"
        top={4}
        left={4}
        zIndex={1000}
        bg="rgba(0,0,0,0.8)"
        color="white"
        p={2}
        borderRadius="md"
        fontSize="xs"
      >
        <Text>
          Debug: Nodes: {reactFlowNodes.length}, Edges: {reactFlowEdges.length},
          WS: {isConnected ? "Connected" : "Disconnected"}
        </Text>
      </Box>

      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={modelTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
      >
        <Background color="#222" variant={BackgroundVariant.Lines} />
        <Controls />
        <MiniMap nodeColor="#3d5787" nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </Box>
  );
};
