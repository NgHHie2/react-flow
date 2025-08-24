// src/components/ReactFlowCanvas.tsx - Fixed drag detection
import React from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import ModelNode from "../SchemaVisualizer/ModelNode";
import { SchemaData } from "../SchemaVisualizer/SchemaVisualizer.types";

const modelTypes = {
  model: ModelNode,
};

interface ReactFlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStart?: (event: React.MouseEvent, node: Node) => void;
  onNodeDrag?: (event: React.MouseEvent, node: Node) => void;
  onNodeDragStop: (event: React.MouseEvent, node: Node) => void;
  schemaInfo?: SchemaData | null;
}

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  schemaInfo,
}) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
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
      // Prevent node selection on click to avoid visual jumps
      nodesFocusable={false}
      defaultViewport={{
        x: schemaInfo?.panX || 0,
        y: schemaInfo?.panY || 0,
        zoom: schemaInfo?.zoomLevel || 1,
      }}
    >
      <Background
        color="#333"
        variant={BackgroundVariant.Lines}
        size={1}
        gap={20}
      />

      {/* <Controls
        showZoom={true}
        showFitView={true}
        showInteractive={true}
        position="bottom-left"
      />

      <MiniMap
        nodeColor={(node) => {
          const model = node.data;
          return model.backgroundColor || "#3d5787";
        }}
        nodeStrokeWidth={2}
        nodeBorderRadius={8}
        zoomable
        pannable
        position="bottom-right"
        style={{
          backgroundColor: "rgba(0,0,0,0.8)",
          border: "1px solid #4A5568",
        }}
      /> */}
    </ReactFlow>
  );
};
