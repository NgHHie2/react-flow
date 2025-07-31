import { Box, Flex } from "@chakra-ui/react";
import React from "react";
import { Handle, NodeProps, Position, useReactFlow } from "reactflow";
import { EditableField } from "../components/EditableField";

// Updated interface to match API response
interface Field {
  id?: number;
  name: string;
  type: string;
  hasConnections?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

interface ModelData {
  id?: number;
  name: string;
  isChild?: boolean;
  fields: Field[];
  onFieldUpdate?: (
    fieldId: number,
    fieldName: string,
    fieldType: string
  ) => void;
}

const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 32;

export default function ModelNode({ data, id }: NodeProps<ModelData>) {
  const { getNodes, getEdges } = useReactFlow();

  const handleFieldNameUpdate = (fieldIndex: number, newName: string) => {
    const field = data.fields[fieldIndex];
    if (field.id && data.onFieldUpdate) {
      data.onFieldUpdate(field.id, newName, field.type);
    }
  };

  const handleFieldTypeUpdate = (fieldIndex: number, newType: string) => {
    const field = data.fields[fieldIndex];
    if (field.id && data.onFieldUpdate) {
      data.onFieldUpdate(field.id, field.name, newType);
    }
  };

  const getConnectionHandlePosition = (
    field: Field,
    currentNodeId: string
  ): Position => {
    if (!field.hasConnections) return Position.Right;

    try {
      const nodes = getNodes();
      const currentNode = nodes.find((node) => node.id === currentNodeId);
      if (!currentNode) return Position.Right;

      // Tách tên model từ field (user_id → User, post_id → Post)
      const guessedModel = field.name.replace(/_id$/, "");
      const guessedModelCapitalized =
        guessedModel.charAt(0).toUpperCase() + guessedModel.slice(1);

      // Tìm node đích theo tên đoán được
      const targetNode = nodes.find(
        (node) => node.data?.name === guessedModelCapitalized
      );

      if (!targetNode) return Position.Right;

      const nodeWidth = 280;

      // So sánh cạnh gần nhất của 2 nodes
      const currentRightEdge = currentNode.position.x + nodeWidth;
      const currentLeftEdge = currentNode.position.x;
      const targetRightEdge = targetNode.position.x + nodeWidth;
      const targetLeftEdge = targetNode.position.x;

      // Nếu target hoàn toàn ở bên phải current (không overlap)
      if (targetLeftEdge >= currentRightEdge) {
        return Position.Right;
      }

      // Nếu target hoàn toàn ở bên trái current (không overlap)
      if (targetRightEdge <= currentLeftEdge) {
        return Position.Left;
      }

      // Nếu có overlap hoặc quá gần nhau - dùng center để quyết định
      const currentCenterX = currentNode.position.x + nodeWidth / 2;
      const targetCenterX = targetNode.position.x + nodeWidth / 2;

      return targetCenterX > currentCenterX ? Position.Right : Position.Left;
    } catch (error) {
      console.error("Error calculating handle position:", error);
      return Position.Right;
    }
  };

  // Phân tích incoming connections để quyết định vị trí target handle
  const analyzeTargetHandlePosition = () => {
    try {
      const nodes = getNodes();
      const edges = getEdges();
      const currentNode = nodes.find((n) => n.id === id);

      if (!currentNode) return { position: Position.Left, connectionCount: 0 };

      // Tìm tất cả edges có target là node hiện tại
      const incomingEdges = edges.filter((edge) => edge.target === id);
      const connectionCount = incomingEdges.length;

      if (connectionCount === 0) {
        return { position: Position.Left, connectionCount: 0 };
      }

      const nodeWidth = 280;
      const currentLeftEdge = currentNode.position.x;
      const currentRightEdge = currentNode.position.x + nodeWidth;

      let leftSideSources = 0;
      let rightSideSources = 0;

      // Phân loại sources theo vị trí tương đối với target
      incomingEdges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          const sourceRightEdge = sourceNode.position.x + nodeWidth;
          const sourceLeftEdge = sourceNode.position.x;

          // Source hoàn toàn ở bên trái target
          if (sourceRightEdge <= currentLeftEdge) {
            leftSideSources++;
          }
          // Source hoàn toàn ở bên phải target
          else if (sourceLeftEdge >= currentRightEdge) {
            rightSideSources++;
          }
          // Source overlap hoặc gần - dùng center để quyết định
          else {
            const sourceCenterX = sourceNode.position.x + nodeWidth / 2;
            const currentCenterX = currentNode.position.x + nodeWidth / 2;

            if (sourceCenterX < currentCenterX) {
              leftSideSources++;
            } else {
              rightSideSources++;
            }
          }
        }
      });

      // Quyết định vị trí target handle dựa trên phân bố sources
      let position = Position.Left; // Default

      if (rightSideSources > leftSideSources) {
        position = Position.Right;
      } else if (leftSideSources > rightSideSources) {
        position = Position.Left;
      } else {
        // Nếu bằng nhau, ưu tiên bên trái
        position = Position.Left;
      }

      return { position, connectionCount };
    } catch (error) {
      console.error("Error analyzing target handle position:", error);
      return { position: Position.Left, connectionCount: 0 };
    }
  };

  // Tạo target handle thông minh
  const renderTargetHandle = () => {
    if (!data.isChild) return null;

    const primaryKeyField = data.fields.find((f) => f.isPrimaryKey);
    if (!primaryKeyField) return null;

    const { position, connectionCount } = analyzeTargetHandlePosition();
    const isRight = position === Position.Right;

    // Visual indicator cho số lượng connections
    const handleColor = "white"; // Xanh nếu có nhiều connections

    return (
      <Handle
        id={data.name}
        position={position}
        type="target"
        style={{
          background: handleColor,
          width: "8px",
          height: "8px",
          border: `2px solid ${handleColor}`,
          borderRadius: "50%",
          position: "absolute",
          top: "50%",
          [isRight ? "right" : "left"]: "-4px",
          transform: "translateY(-50%)",
        }}
      />
    );
  };

  return (
    <Box borderRadius="8px" minWidth="280px" maxWidth="350px">
      {/* Model Header */}
      <Box
        p={3}
        textAlign="center"
        borderRadius="8px 8px 0 0"
        bg={"#3d5787"}
        height={`${HEADER_HEIGHT}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderBottom="2px solid #4A5568"
      >
        <Box fontWeight="bold" color="white" fontSize="14px">
          {data.name}
        </Box>
      </Box>

      {/* Model Fields */}
      {data.fields.map((field, index) => {
        const isPK = field.isPrimaryKey;
        const isFK = field.hasConnections || field.name.endsWith("_id");

        return (
          <Box key={`${field.name}-${index}`} position="relative">
            <Flex
              bg={"#2A2A2A"}
              justifyContent="space-between"
              alignItems="center"
              p={2}
              color="white"
              height={`${ROW_HEIGHT}px`}
              borderBottom="1px solid #4A5568"
              _hover={{ bg: "#4A5568" }}
            >
              {/* Field Icon & Name */}
              <Flex flex="1" alignItems="center" pr={2}>
                {/* Primary Key Icon */}
                <Box width="12px" mr={1}>
                  {isPK ? (
                    <Box color="#FFD700" fontSize="8px" title="Primary Key">
                      🔑
                    </Box>
                  ) : isFK ? (
                    <Box color="#87CEEB" fontSize="8px" title="Foreign Key">
                      🔗
                    </Box>
                  ) : null}
                </Box>

                <EditableField
                  value={field.name}
                  onSave={(newName) => handleFieldNameUpdate(index, newName)}
                  placeholder="field_name"
                  color={isPK ? "#FFD700" : isFK ? "#87CEEB" : "white"}
                  minWidth="80px"
                />
              </Flex>

              {/* Field Type */}
              <Box flex="1" textAlign="right">
                <EditableField
                  value={field.type}
                  onSave={(newType) => handleFieldTypeUpdate(index, newType)}
                  placeholder="type"
                  color="#B8B8B8"
                  minWidth="80px"
                />
              </Box>
            </Flex>

            {/* Connection Handle for Foreign Keys */}
            {field.hasConnections && (
              <Handle
                position={getConnectionHandlePosition(field, id)}
                id={`${data.name}-${field.name}`}
                type="source"
                style={{
                  position: "absolute",
                  [getConnectionHandlePosition(field, id) === Position.Right
                    ? "right"
                    : "left"]: "-4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "white",
                  width: "8px",
                  height: "8px",
                  border: "2px solid white",
                  borderRadius: "50%",
                }}
              />
            )}

            {/* Target Handle cho Primary Key - chỉ render một lần cho field đầu tiên là PK */}
            {field.isPrimaryKey &&
              index === data.fields.findIndex((f) => f.isPrimaryKey) &&
              renderTargetHandle()}
          </Box>
        );
      })}

      {/* Bottom border */}
      <Box height="2px" bg="#4A5568" borderRadius="0 0 8px 8px" />
    </Box>
  );
}
