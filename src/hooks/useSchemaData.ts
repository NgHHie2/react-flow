// src/hooks/useSchemaData.ts
import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { Node, Edge } from "reactflow";
import {
  schemaApiService,
  SchemaVisualizerResponse,
  ModelDto,
  ConnectionDto,
} from "../services/schemaApiService";

// Convert API data to ReactFlow format
const convertToReactFlowData = (
  data: SchemaVisualizerResponse,
  onFieldUpdate: any
) => {
  const nodes: Node[] = data.models.map((model: ModelDto) => ({
    id: model.name,
    position: { x: model.positionX, y: model.positionY },
    data: {
      id: model.id,
      name: model.name,
      isChild: model.isChild,
      fields: model.fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        hasConnections: field.hasConnections,
        isPrimaryKey: field.isPrimaryKey,
      })),
      onFieldUpdate,
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
        stroke: "#b1b1b7",
      },
    };
  });

  return { nodes, edges };
};

export const useSchemaData = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchSchemaData = useCallback(async (onFieldUpdateCallback?: any) => {
    try {
      setLoading(true);
      setError(null);
      const data = await schemaApiService.getSchemaData();
      const reactFlowData = convertToReactFlowData(data, onFieldUpdateCallback);

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
  }, []);

  const initializeData = useCallback(
    async (onFieldUpdateCallback?: any) => {
      try {
        setLoading(true);
        await schemaApiService.initializeSampleData();
        await fetchSchemaData(onFieldUpdateCallback);
        toast({
          title: "Success",
          description: "Sample data initialized successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize data"
        );
      }
    },
    [fetchSchemaData, toast]
  );

  const updateNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, position: { x, y } } : node
        )
      );
    },
    []
  );

  const updateField = useCallback(
    (
      modelName: string,
      fieldId: number,
      fieldName: string,
      fieldType: string
    ) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === modelName
            ? {
                ...node,
                data: {
                  ...node.data,
                  fields: node.data.fields.map((field: any) =>
                    field.id === fieldId
                      ? { ...field, name: fieldName, type: fieldType }
                      : field
                  ),
                },
              }
            : node
        )
      );
    },
    []
  );

  return {
    nodes,
    edges,
    loading,
    error,
    setNodes,
    setEdges,
    fetchSchemaData,
    initializeData,
    updateNodePosition,
    updateField,
  };
};
