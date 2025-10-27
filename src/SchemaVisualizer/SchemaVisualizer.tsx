// src/SchemaVisualizer/SchemaVisualizer.tsx
import React from "react";
import { Box } from "@chakra-ui/react";

import { LoadingScreen } from "../components/LoadingScreen";
import { ControlPanel } from "../components/ControlPanel";
import { ReactFlowCanvas } from "../components/ReactFlowCanvas";
import { AddModelButton } from "../components/AddModelButton";

import { useSchemaVisualizer } from "../hooks/useSchemaVisualizer";
// ❌ Xóa import useWebSocketListener

export const SchemaVisualizer = () => {
  const {
    // Data state
    loading,
    error,
    schemaInfo,
    isConnected, // ✅ Nhận isConnected từ useSchemaVisualizer

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
    handleReset,
    handleInitialize,
  } = useSchemaVisualizer();

  // ❌ Xóa phần này - không gọi useWebSocketListener nữa
  // const { isConnected } = useWebSocketListener({
  //   handlers: websocketHandlers,
  //   enabled: true,
  // });

  if (loading) {
    console.log("Rendering loading screen");
    return <LoadingScreen message="Loading schema data..." />;
  }

  return (
    <Box height="100vh" width="100vw" bg="#1C1c1c" position="relative">
      <AddModelButton isConnected={isConnected} onAddModel={handleAddModel} />

      <ControlPanel
        isConnected={isConnected}
        loading={loading}
        onReset={handleReset}
      />

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
