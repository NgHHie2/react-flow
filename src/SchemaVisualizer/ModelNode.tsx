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
  const { getNodes } = useReactFlow();
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
      const guessedModel = field.name.replace(/_id$/, ""); // user_id → user
      const guessedModelCapitalized =
        guessedModel.charAt(0).toUpperCase() + guessedModel.slice(1); // user → User

      // Tìm node đích theo tên đoán được
      const targetNode = nodes.find(
        (node) => node.data?.name === guessedModelCapitalized
      );

      if (!targetNode) return Position.Right;

      const currentCenterX =
        currentNode.position.x + (currentNode.width ?? 250) / 2;
      const targetCenterX =
        targetNode.position.x + (targetNode.width ?? 250) / 2;

      return targetCenterX > currentCenterX ? Position.Right : Position.Left;
    } catch (error) {
      console.error("Error calculating handle position:", error);
      return Position.Right;
    }
  };

  const getTargetHandlePosition = (): {
    position: Position;
    offsetStyle: any;
  } => {
    try {
      const nodes = getNodes();
      const currentNode = nodes.find((n) => n.id === id);
      if (!currentNode)
        return { position: Position.Left, offsetStyle: { left: "-4px" } };

      // Tìm node cha đang kết nối tới current node (giả định theo tên hoặc logic tùy hệ thống)
      const parentNode = nodes.find((node) =>
        node.data?.fields?.some(
          (f: { name: string }) => f.name === `${data.name.toLowerCase()}_id` // ví dụ như "comment_id"
        )
      );

      if (!parentNode)
        return { position: Position.Left, offsetStyle: { left: "-4px" } };

      const currentX = currentNode.position.x + (currentNode.width ?? 250) / 2;
      const parentX = parentNode.position.x + (parentNode.width ?? 250) / 2;

      if (parentX < currentX) {
        return { position: Position.Left, offsetStyle: { left: "-4px" } };
      } else {
        return { position: Position.Right, offsetStyle: { right: "-4px" } };
      }
    } catch (e) {
      return { position: Position.Left, offsetStyle: { left: "-4px" } };
    }
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
        if (isPK) console.log(field);
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
            {field.isPrimaryKey &&
              data.isChild &&
              (() => {
                const { position, offsetStyle } = getTargetHandlePosition();
                return (
                  <Handle
                    id={data.name}
                    position={position}
                    type="target"
                    style={{
                      background: "white",
                      width: "8px",
                      height: "8px",
                      border: "2px solid white",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      ...offsetStyle,
                    }}
                  />
                );
              })()}
          </Box>
        );
      })}

      {/* Bottom border */}
      <Box height="2px" bg="#4A5568" borderRadius="0 0 8px 8px" />
    </Box>
  );
}
