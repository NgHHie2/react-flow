// src/SchemaVisualizer/SchemaVisualizer.tsx - Fixed drag handling
import React from "react";
import { Box } from "@chakra-ui/react";

// Components
import { LoadingScreen } from "../components/LoadingScreen";
import { ErrorScreen } from "../components/ErrorScreen";
import { EmptyState } from "../components/EmptyState";
import { ControlPanel } from "../components/ControlPanel";
import { SchemaInfoPanel } from "../components/SchemaInfoPanel";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { ReactFlowCanvas } from "../components/ReactFlowCanvas";

// Hooks
import { useSchemaVisualizer } from "../hooks/useSchemaVisualizer";

export const SchemaVisualizer = () => {
  const {
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
  } = useSchemaVisualizer();

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
        onRetry={handleRefresh}
        onInitialize={handleInitialize}
      />
    );
  }

  // Render empty state
  if (reactFlowNodes.length === 0) {
    console.log("Rendering empty state");
    return <EmptyState onInitialize={handleInitialize} />;
  }

  // Render main schema visualizer
  return (
    <Box height="100vh" width="100vw" bg="#1C1c1c" position="relative">
      {/* Schema Info Panel */}
      {/* {schemaInfo && (
        <SchemaInfoPanel
          schemaInfo={schemaInfo}
          nodesCount={reactFlowNodes.length}
          edgesCount={reactFlowEdges.length}
        />
      )} */}

      {/* Control Panel */}
      <ControlPanel
        isConnected={isConnected}
        loading={loading}
        onRefresh={handleRefresh}
        onReset={handleReset}
      />

      {/* Connection Status */}
      {/* <ConnectionStatus isConnected={isConnected} /> */}

      {/* ReactFlow Canvas with Enhanced Drag Handling */}
      <ReactFlowCanvas
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        schemaInfo={schemaInfo}
      />
    </Box>
  );
};
