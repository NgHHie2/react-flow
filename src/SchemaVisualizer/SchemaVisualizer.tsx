// src/SchemaVisualizer/SchemaVisualizer.tsx - Updated với WebSocket listener
import React from "react";
import { Box } from "@chakra-ui/react";

// Components
import { LoadingScreen } from "../components/LoadingScreen";
import { ControlPanel } from "../components/ControlPanel";
import { SchemaInfoPanel } from "../components/SchemaInfoPanel";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { ReactFlowCanvas } from "../components/ReactFlowCanvas";
import { AddModelButton } from "../components/AddModelButton";

// Hooks
import { useSchemaVisualizer } from "../hooks/useSchemaVisualizer";
import { useWebSocketListener } from "../hooks/useWebSocketListener";

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

    // Action handlers
    handleDeleteModel,
    handleAddModel,
    handleRefresh,
    handleReset,
    handleInitialize,

    // WebSocket handlers (để pass cho listener)
    websocketHandlers,
  } = useSchemaVisualizer();

  // ⭐ Setup WebSocket listener ở đây thay vì trong useSchemaVisualizer
  const { isConnected } = useWebSocketListener({
    handlers: websocketHandlers,
    enabled: true,
  });

  // Render loading state
  if (loading) {
    console.log("Rendering loading screen");
    return <LoadingScreen message="Loading schema data..." />;
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

      <AddModelButton isConnected={isConnected} onAddModel={handleAddModel} />

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
