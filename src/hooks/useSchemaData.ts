// src/hooks/useSchemaData.ts - Fixed version with proper model name updates
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

      console.log(`✅ Position updated locally for ${nodeId}: (${x}, ${y})`);
    },
    []
  );

  const updateField = useCallback(
    async (
      modelName: string,
      attributeId: number,
      attributeName: string,
      attributeType: string
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
                    attr.id === attributeId
                      ? {
                          ...attr,
                          name: attributeName,
                          dataType: attributeType,
                        }
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

  const togglePrimaryKey = useCallback(
    async (modelName: string, attributeId: number) => {
      // Update local state immediately
      setNodes((nds) =>
        nds.map((node) =>
          node.id === modelName
            ? {
                ...node,
                data: {
                  ...node.data,
                  attributes: node.data.attributes.map((attr: any) =>
                    attr.id === attributeId
                      ? {
                          ...attr,
                          isPrimaryKey: !attr.isPrimaryKey,
                          // If setting as PK, remove FK status and connection
                          isForeignKey: !attr.isPrimaryKey
                            ? false
                            : attr.isForeignKey,
                          connection: !attr.isPrimaryKey
                            ? undefined
                            : attr.connection,
                        }
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

  const toggleForeignKey = useCallback(
    async (modelName: string, attributeId: number) => {
      // Update local state immediately
      setNodes((nds) =>
        nds.map((node) =>
          node.id === modelName
            ? {
                ...node,
                data: {
                  ...node.data,
                  attributes: node.data.attributes.map((attr: any) =>
                    attr.id === attributeId
                      ? {
                          ...attr,
                          isForeignKey: !attr.isForeignKey,
                          // If setting as FK, remove PK status
                          isPrimaryKey: !attr.isForeignKey
                            ? false
                            : attr.isPrimaryKey,
                        }
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

  const addAttribute = useCallback(
    async (
      modelName: string,
      attributeName: string,
      dataType: string,
      realAttributeId?: number
    ) => {
      if (realAttributeId) {
        // This is a sync update from backend with real ID
        // Remove the temporary attribute and add the real one
        setNodes((nds) =>
          nds.map((node) =>
            node.id === modelName
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    attributes: [
                      // Keep all non-temporary attributes
                      ...node.data.attributes.filter(
                        (attr: any) => !attr.isTemporary
                      ),
                      // Add the real attribute
                      {
                        id: realAttributeId,
                        name: attributeName,
                        dataType: dataType,
                        isNullable: true,
                        isPrimaryKey: false,
                        isForeignKey: false,
                        attributeOrder: node.data.attributes.length - 1, // Replace temp position
                      },
                    ],
                  },
                }
              : node
          )
        );

        console.log(
          "✅ Replaced temporary attribute with real ID:",
          realAttributeId
        );
      } else {
        // This is initial optimistic update with temp ID
        const tempId = Date.now();
        setNodes((nds) =>
          nds.map((node) =>
            node.id === modelName
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    attributes: [
                      ...node.data.attributes,
                      {
                        id: tempId, // Temporary ID
                        name: attributeName,
                        dataType: dataType,
                        isNullable: true,
                        isPrimaryKey: false,
                        isForeignKey: false,
                        attributeOrder: node.data.attributes.length,
                        isTemporary: true, // Mark as temporary
                      },
                    ],
                  },
                }
              : node
          )
        );

        console.log("⏳ Added temporary attribute with ID:", tempId);

        toast({
          title: "Attribute Added",
          description: `Added ${attributeName} to ${modelName}`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    },
    [toast]
  );

  const deleteAttribute = useCallback(
    async (modelName: string, attributeId: number) => {
      // Update local state immediately
      setNodes((nds) =>
        nds.map((node) =>
          node.id === modelName
            ? {
                ...node,
                data: {
                  ...node.data,
                  attributes: node.data.attributes.filter(
                    (attr: any) => attr.id !== attributeId
                  ),
                },
              }
            : node
        )
      );

      toast({
        title: "Attribute Deleted",
        description: `Removed attribute from ${modelName}`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    },
    [toast]
  );

  const addModel = useCallback(
    async (modelName: string, positionX: number, positionY: number) => {
      const tempId = Date.now();
      const tempModel = {
        id: tempId,
        nodeId: modelName,
        name: modelName,
        modelType: "TABLE",
        positionX,
        positionY,
        width: 280,
        height: 200,
        backgroundColor: "#f1f5f9",
        borderColor: "#e2e8f0",
        borderWidth: 2,
        borderRadius: 8,
        attributes: [
          {
            id: tempId + 1,
            name: "id",
            dataType: "BIGINT",
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            attributeOrder: 0,
            isTemporary: true,
          },
        ],
        zindex: 1,
        isTemporary: true,
      };

      setNodes((nds) => [
        ...nds,
        {
          id: modelName,
          position: { x: positionX, y: positionY },
          data: tempModel,
          type: "model",
        },
      ]);

      toast({
        title: "Table Added",
        description: `Added new table: ${modelName}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [setNodes, toast]
  );

  // ✅ FIXED: Properly update model name and all connections
  const updateModelName = useCallback(
    async (oldName: string, newName: string) => {
      console.log(`📝 Updating model name: ${oldName} -> ${newName}`);

      // Update the node itself
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === oldName) {
            // Update the node with the new name
            return {
              ...node,
              id: newName,
              data: {
                ...node.data,
                name: newName,
                nodeId: newName,
              },
            };
          }

          // Update any connections that reference the old name
          if (
            node.data.attributes?.some(
              (attr: any) => attr.connection?.targetModelName === oldName
            )
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                attributes: node.data.attributes.map((attr: any) => {
                  if (attr.connection?.targetModelName === oldName) {
                    return {
                      ...attr,
                      connection: {
                        ...attr.connection,
                        targetModelName: newName,
                      },
                    };
                  }
                  return attr;
                }),
              },
            };
          }

          return node;
        })
      );

      // Update edges that reference this model
      setEdges((eds) =>
        eds.map((edge) => {
          let updatedEdge = { ...edge };
          if (edge.source === oldName) {
            updatedEdge.source = newName;
          }
          if (edge.target === oldName) {
            updatedEdge.target = newName;
          }
          return updatedEdge;
        })
      );

      console.log(`✅ Model name updated: ${oldName} -> ${newName}`);
    },
    [setNodes, setEdges]
  );

  const deleteModel = useCallback(
    async (modelName: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== modelName));
      setEdges((eds) =>
        eds.filter(
          (edge) => edge.source !== modelName && edge.target !== modelName
        )
      );

      toast({
        title: "Table Deleted",
        description: `Deleted table: ${modelName}`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    },
    [setNodes, setEdges, toast]
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
    togglePrimaryKey,
    toggleForeignKey,
    addAttribute,
    deleteAttribute,
    addModel,
    updateModelName,
    deleteModel,
  };
};
