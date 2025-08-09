// src/hooks/useSchemaData.ts
import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { Node, Edge } from "reactflow";
import { schemaApiService } from "../services/schemaApiService";
import { convertToReactFlowData } from "../utils/schemaUtils";
import { SchemaData } from "../SchemaVisualizer/SchemaVisualizer.types";

export const useSchemaData = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<SchemaData | null>(null);
  const toast = useToast();

  const fetchSchemaData = useCallback(async (onFieldUpdateCallback?: any) => {
    try {
      setLoading(true);
      setError(null);

      const data = await schemaApiService.getSchemaData();
      setSchemaInfo(data);

      const reactFlowData = convertToReactFlowData(data, onFieldUpdateCallback);

      console.log("Converted ReactFlow data:", reactFlowData);
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
    async (nodeId: string, x: number, y: number) => {
      // Update local state immediately for smooth UX
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, position: { x, y } } : node
        )
      );
    },
    []
  );

  const updateField = useCallback(
    async (
      modelName: string,
      fieldId: number,
      fieldName: string,
      fieldType: string
    ) => {
      // Update local state immediately
      setNodes((nds) =>
        nds.map((node) =>
          node.id === modelName
            ? {
                ...node,
                data: {
                  ...node.data,
                  attributes: node.data.attributes.map((attr: any) =>
                    attr.id === fieldId
                      ? { ...attr, name: fieldName, dataType: fieldType }
                      : attr
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
    schemaInfo,
    setNodes,
    setEdges,
    fetchSchemaData,
    initializeData,
    updateNodePosition,
    updateField,
  };
};
