// src/components/FieldComponent.tsx
import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Handle, Position } from "reactflow";
import { EditableField } from "./EditableField";
import { Attribute } from "../SchemaVisualizer/SchemaVisualizer.types";

interface FieldComponentProps {
  attribute: Attribute;
  modelName: string;
  fieldIndex: number;
  onFieldNameUpdate: (fieldIndex: number, newName: string) => void;
  onFieldTypeUpdate: (fieldIndex: number, newType: string) => void;
}

const ROW_HEIGHT = 32;

export const FieldComponent: React.FC<FieldComponentProps> = ({
  attribute,
  modelName,
  fieldIndex,
  onFieldNameUpdate,
  onFieldTypeUpdate,
}) => {
  const isPK = attribute.isPrimaryKey;
  const isFK = attribute.isForeignKey;
  const hasConnection = !!attribute.connection;

  // Tạo unique handle IDs
  const sourceHandleId = `${modelName}-${attribute.name}-source`;
  const targetHandleId = `${modelName}-${attribute.name}-target`;

  // Determine field color based on type
  const getFieldColor = () => {
    if (isPK) return "#FFD700"; // Gold for Primary Key
    if (isFK) return "#87CEEB"; // Sky blue for Foreign Key
    return "white"; // Default
  };

  // Get field icon
  const getFieldIcon = () => {
    if (isPK) return "🔑"; // Key icon for Primary Key
    if (isFK) return "🔗"; // Link icon for Foreign Key
    return null;
  };

  return (
    <Box position="relative">
      <Flex
        bg="#2A2A2A"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        color="white"
        height={`${ROW_HEIGHT}px`}
        borderBottom="1px solid #4A5568"
        _hover={{ bg: "#4A5568" }}
      >
        {/* Left Handle - Always visible for connections going out */}
        <Handle
          id={sourceHandleId}
          position={Position.Left}
          type="source"
          style={{
            position: "absolute",
            left: "-6px",
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: hasConnection ? "#4A90E2" : "#6B7280",
            width: "8px",
            height: "8px",
            border: "2px solid white",
            borderRadius: "50%",
            opacity: hasConnection ? 1 : 0.6,
          }}
        />

        {/* Field Icon & Name */}
        <Flex flex="1" alignItems="center" pr={2} ml={2}>
          {/* Field Type Icon */}
          <Box width="12px" mr={2}>
            {getFieldIcon() && (
              <Box
                color={getFieldColor()}
                fontSize="10px"
                title={isPK ? "Primary Key" : isFK ? "Foreign Key" : ""}
              >
                {getFieldIcon()}
              </Box>
            )}
          </Box>

          {/* Field Name */}
          <EditableField
            value={attribute.name}
            onSave={(newName) => onFieldNameUpdate(fieldIndex, newName)}
            placeholder="field_name"
            color={getFieldColor()}
            minWidth="80px"
          />
        </Flex>

        {/* Field Type */}
        <Box flex="1" textAlign="right" mr={2}>
          <EditableField
            value={attribute.dataType}
            onSave={(newType) => onFieldTypeUpdate(fieldIndex, newType)}
            placeholder="type"
            color="#B8B8B8"
            minWidth="80px"
          />
        </Box>

        {/* Right Handle - Always visible for connections coming in */}
        <Handle
          id={targetHandleId}
          position={Position.Right}
          type="target"
          style={{
            position: "absolute",
            right: "-6px",
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: isPK ? "#FFD700" : "#6B7280",
            width: "8px",
            height: "8px",
            border: "2px solid white",
            borderRadius: "50%",
            opacity: isPK ? 1 : 0.6,
          }}
        />
      </Flex>

      {/* Connection indicator */}
      {hasConnection && (
        <Box
          position="absolute"
          right="12px"
          top="2px"
          width="6px"
          height="6px"
          bg={attribute.connection?.strokeColor || "#4A90E2"}
          borderRadius="50%"
          title={`Connected to ${attribute.connection?.targetModelName}.${attribute.connection?.targetAttributeName}`}
        />
      )}
    </Box>
  );
};
