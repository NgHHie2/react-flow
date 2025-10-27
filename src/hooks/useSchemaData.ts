// src/hooks/useSchemaData.ts - Fixed version
import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { Node, Edge, useNodesState } from "reactflow";
import { schemaApiService } from "../services/schemaApiService";
import { convertToReactFlowData } from "../utils/schemaUtils";
import { SchemaData } from "../SchemaVisualizer/SchemaVisualizer.types";
import { generateAttributeId } from "../utils/uuid.utils";
import { getVietnamTime } from "../utils";
import { useParams } from "react-router-dom";

export const useSchemaData = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  console.log(diagramId);
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<SchemaData | null>(null);
  const toast = useToast();

  const fetchSchemaData = useCallback(async (callbacks?: any) => {
    try {
      setLoading(true);
      setError(null);

      const data = await schemaApiService.getSchemaData(diagramId);
      setSchemaInfo(data);

      // ✅ THAY ĐỔI: Pass callbacks object instead of single onFieldUpdateCallback
      const reactFlowData = convertToReactFlowData(data, callbacks);

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
    async (callbacks?: any) => {
      try {
        setLoading(true);
        await schemaApiService.initializeSampleData();
        await fetchSchemaData(callbacks); // ✅ Pass callbacks
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

  // FIX 1: Improved drag position update - force re-render
  const updateNodePosition = useCallback(
    async (nodeId: string, x: number, y: number) => {
      console.log(`🎯 Updating position for ${nodeId}: (${x}, ${y})`);

      // Update local state immediately
      setReactFlowNodes((prevNodes) => {
        return prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                position: { x, y },
                data: {
                  ...node.data,
                  positionUpdatedAt: getVietnamTime(),
                },
              }
            : node
        );
      });
    },
    []
  );

  // FIX 2: Improved field update with better state management
  const updateFieldName = useCallback(
    async (modelId: string, attributeId: string, attributeName: string) => {
      console.log(
        `🔧 Updating field name ${attributeId} in ${modelId}: ${attributeName}`
      );

      // Update local state immediately with minimal re-render
      setReactFlowNodes((currentNodes: any) => {
        console.log(currentNodes);
        return currentNodes.map((node: any) => {
          console.log("tuine: ", node);
          const hasAttribute = node.data.attributes.some(
            (attr: any) => attr.id === attributeId
          );
          if (!hasAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === attributeId) {
              console.log("tui nè");
              return {
                ...attr,
                name: attributeName,
                nameUpdatedAt: getVietnamTime(),
              };
            }
            return attr;
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        });
      });
    },
    []
  );
  const updateFieldType = useCallback(
    async (modelId: string, attributeId: string, attributeType: string) => {
      console.log(
        `🔧 Updating field type ${attributeId} in ${modelId}: ${attributeType}`
      );

      // Update local state immediately with minimal re-render
      setReactFlowNodes((currentNodes: any) => {
        return currentNodes.map((node: any) => {
          console.log("tuine: ", node);
          const hasAttribute = node.data.attributes.some(
            (attr: any) => attr.id === attributeId
          );
          if (!hasAttribute) return node;

          const updatedAttributes = node.data.attributes.map((attr: any) => {
            if (attr.id === attributeId) {
              console.log("tui nè");
              return {
                ...attr,
                dataType: attributeType,
                typeUpdatedAt: getVietnamTime(),
              };
            }
            return attr;
          });

          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        });
      });
    },
    []
  );

  const addAttribute = useCallback(
    async (modelId: string, attributeName: string, dataType: string) => {
      // Generate UUID for new attribute
      const newAttributeId = generateAttributeId();

      const newAttribute = {
        id: newAttributeId,
        name: attributeName,
        dataType: dataType,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        attributeOrder: 0,
      };

      // Immediately add to UI
      setReactFlowNodes((nds) =>
        nds.map((node) =>
          node.id === modelId
            ? {
                ...node,
                data: {
                  ...node.data,
                  attributes: [...node.data.attributes, newAttribute],
                },
              }
            : node
        )
      );

      toast({
        title: "Attribute Added",
        description: `Added ${attributeName} to ${modelId}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      return newAttributeId; // Return the generated ID
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
    async (
      modelId: string,
      positionX: number,
      positionY: number,
      modelData: any // Full model data với real ID từ backend
    ) => {
      console.log("✅ Adding model with real data:", modelData);

      setNodes((nds) => [
        ...nds,
        {
          id: modelId,
          position: { x: positionX, y: positionY },
          data: modelData, // Sử dụng data thật từ backend
          type: "model",
        },
      ]);

      toast({
        title: "Table Added",
        description: `Added new table: ${modelId}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [setNodes, toast]
  );

  // FIX 4: Completely rewritten model name update
  const updateModelName = useCallback(
    async (oldName: string, newName: string) => {
      console.log(`📝 Updating model name: ${oldName} -> ${newName}`);

      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) => {
          // Update the target node's name
          if (node.id === oldName) {
            return {
              ...node,
              id: newName, // Change node ID
              data: {
                ...node.data,
                name: newName,
                nodeId: newName,
                nameUpdatedAt: getVietnamTime(), // Force re-render
              },
            };
          }

          // Update any foreign key connections that reference the old name
          const hasConnectionsToUpdate = node.data.attributes?.some(
            (attr: any) => attr.connection?.targetModelName === oldName
          );

          if (hasConnectionsToUpdate) {
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
                        targetModelName: newName, // Update FK reference
                      },
                    };
                  }
                  return attr;
                }),
                lastConnectionUpdate: Date.now(), // Force re-render
              },
            };
          }

          return node;
        });

        console.log(`✅ Model name updated in nodes: ${oldName} -> ${newName}`);
        return updatedNodes;
      });

      // Update edges separately
      setEdges((prevEdges) =>
        prevEdges.map((edge) => {
          let updatedEdge = { ...edge };

          if (edge.source === oldName) {
            updatedEdge.source = newName;
            console.log(`📌 Updated edge source: ${oldName} -> ${newName}`);
          }

          if (edge.target === oldName) {
            updatedEdge.target = newName;
            console.log(`📌 Updated edge target: ${oldName} -> ${newName}`);
          }

          return updatedEdge;
        })
      );

      console.log(`✅ Model name fully updated: ${oldName} -> ${newName}`);
    },
    [setNodes, setEdges]
  );

  const deleteModel = useCallback(
    async (modelName: string) => {
      console.log("🗑️ deleteModel called:", modelName);

      setNodes((nds) => {
        const filtered = nds.filter((node) => node.id !== modelName);
        return filtered;
      });

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
    updateFieldName,
    updateFieldType,
    addAttribute,
    deleteAttribute,
    addModel,
    updateModelName,
    deleteModel,
  };
};
