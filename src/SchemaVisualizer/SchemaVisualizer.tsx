import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  VStack,
  HStack,
} from "@chakra-ui/react";
import ModelNode from "./ModelNode";
import {
  schemaApiService,
  SchemaVisualizerResponse,
  ModelDto,
  ConnectionDto,
} from "../services/schemaApiService";

const modelTypes = {
  model: ModelNode,
};

// Convert API data to ReactFlow format
const convertToReactFlowData = (data: SchemaVisualizerResponse) => {
  const nodes: Node[] = data.models.map((model: ModelDto) => ({
    id: model.name,
    position: { x: model.positionX, y: model.positionY },
    data: {
      name: model.name,
      isChild: model.isChild,
      fields: model.fields.map((field) => ({
        name: field.name,
        type: field.type,
        hasConnections: field.hasConnections,
      })),
    },
    type: "model",
  }));

  const edges: Edge[] = data.connections.map((connection: ConnectionDto) => {
    const sourceId = `${connection.source}-${connection.name}`;
    return {
      id: sourceId,
      source: connection.source,
      target: connection.target,
      sourceHandle: sourceId,
      targetHandle: connection.target,
      animated: connection.isAnimated,
      style: {
        stroke: connection.edgeColor || "#b1b1b7",
      },
    };
  });

  return { nodes, edges };
};

export const SchemaVisualizer = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const fetchSchemaData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schemaApiService.getSchemaData();
      const reactFlowData = convertToReactFlowData(data);
      setNodes(reactFlowData.nodes);
      setEdges(reactFlowData.edges);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching schema data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeData = async () => {
    try {
      setLoading(true);
      await schemaApiService.initializeSampleData();
      // Reload data after initialization
      await fetchSchemaData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize data"
      );
    }
  };

  // Handle node position changes (optional: save to backend)
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("Node dragged:", node.id, "to position:", node.position);
    // TODO: Implement API call to save position to backend
    // updateNodePosition(node.id, node.position.x, node.position.y);
  }, []);

  useEffect(() => {
    fetchSchemaData();
  }, []);

  if (loading) {
    return (
      <Box
        height="100vh"
        width="100vw"
        bg="#1C1c1c"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="white" thickness="4px" />
          <Box color="white" fontSize="lg">
            Loading schema data...
          </Box>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        height="100vh"
        width="100vw"
        bg="#1C1c1c"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4} maxWidth="500px">
          <Alert status="error">
            <AlertIcon />
            Error loading schema data: {error}
          </Alert>
          <HStack spacing={4}>
            <Button colorScheme="blue" onClick={fetchSchemaData}>
              Retry
            </Button>
            <Button colorScheme="green" onClick={handleInitializeData}>
              Initialize Sample Data
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  if (nodes.length === 0) {
    return (
      <Box
        height="100vh"
        width="100vw"
        bg="#1C1c1c"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Box color="white" fontSize="lg" textAlign="center">
            No schema data found. Would you like to initialize sample data?
          </Box>
          <Button colorScheme="green" onClick={handleInitializeData}>
            Initialize Sample Data
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box height="100vh" width="100vw" bg="#1C1c1c" position="relative">
      {/* Control buttons */}
      <Box position="absolute" top={4} right={4} zIndex={1000}>
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={fetchSchemaData}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            onClick={handleInitializeData}
            isLoading={loading}
          >
            Reset Data
          </Button>
        </HStack>
      </Box>

      <ReactFlow
        nodes={nodes}
        edges={edges}
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
