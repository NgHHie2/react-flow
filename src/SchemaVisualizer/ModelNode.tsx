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

const HEADER_HEIGHT = 40; // Height của header
const ROW_HEIGHT = 32; // Height của mỗi row field

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

  // Function để tìm target node và quyết định handle position
  const getHandlePosition = (fieldType: string, currentNodeId: string) => {
    try {
      const nodes = getNodes();
      const currentNode = nodes.find((node) => node.id === currentNodeId);

      if (!currentNode) return Position.Right;

      // Tìm target node dựa trên field type
      // Giả sử field type chứa tên model (ví dụ: "User", "Comment[]")
      const cleanFieldType = fieldType.replace(/\[\]$/, ""); // Bỏ [] nếu có
      const targetNode = nodes.find(
        (node) =>
          node.id === cleanFieldType || node.data?.name === cleanFieldType
      );

      if (!targetNode) return Position.Right;

      // Tính toán vị trí giữa của current node
      const currentCenterX =
        currentNode.position.x + (currentNode.width || 250) / 2;

      // Tính toán vị trí giữa của target node
      const targetCenterX =
        targetNode.position.x + (targetNode.width || 250) / 2;

      // Nếu target ở bên phải current node thì handle ở Right, ngược lại thì Left
      return targetCenterX > currentCenterX ? Position.Right : Position.Left;
    } catch (error) {
      console.error("Error calculating handle position:", error);
      return Position.Right; // Default fallback
    }
  };

  return (
    <Box borderRadius="8px" minWidth="250px">
      {data.isChild && (
        <Handle
          id={data.name}
          position={Position.Top}
          type="target"
          style={{
            background: "transparent",
            width: "8px",
            height: "8px",
            border: "2px solid white",
          }}
        />
      )}

      {/* Model Header */}
      <Box
        p={2}
        textAlign="center"
        borderRadius="8px 8px 0 0"
        bg="#3d5787"
        height={`${HEADER_HEIGHT}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box fontWeight={"bold"} color="white">
          <pre>{data.name}</pre>
        </Box>
      </Box>

      {/* Model Fields */}
      {data.fields.map((field, index) => {
        // Tính position chính xác cho Handle
        const handleTop = HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2;

        // Quyết định handle position dựa trên target location
        const handlePosition = field.hasConnections
          ? getHandlePosition(field.type, id || data.name)
          : Position.Right;

        return (
          <Box key={`${field.name}-${index}`} position="relative">
            <Flex
              _even={{ bg: "#282828" }}
              _odd={{ bg: "#232323" }}
              justifyContent={"space-between"}
              alignItems="center"
              p={2}
              color="white"
              height={`${ROW_HEIGHT}px`}
            >
              {/* Field Name */}
              <Box flex="1" pr={2}>
                <EditableField
                  value={field.name}
                  onSave={(newName) => handleFieldNameUpdate(index, newName)}
                  placeholder="field_name"
                  color="white"
                  minWidth="60px"
                />
              </Box>

              {/* Field Type */}
              <Box flex="1">
                <EditableField
                  value={field.type}
                  onSave={(newType) => handleFieldTypeUpdate(index, newType)}
                  placeholder="type"
                  color="white"
                  minWidth="60px"
                />
              </Box>
            </Flex>

            {/* Connection Handle - positioned dynamically */}
            {field.hasConnections && (
              <Handle
                position={handlePosition}
                id={`${data.name}-${field.name}`}
                type="source"
                style={{
                  position: "absolute",
                  [handlePosition === Position.Right ? "right" : "left"]:
                    "-4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "transparent",
                  width: "8px",
                  height: "8px",
                  border: "2px solid white",
                  borderRadius: "50%",
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
