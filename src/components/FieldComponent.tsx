// src/components/FieldComponent.tsx - Improved toggle logic
import React, { useState } from "react";
import { Box, Flex, IconButton, Tooltip } from "@chakra-ui/react";
import { Handle, Position } from "reactflow";
import { EditableField } from "./EditableField";
import { Attribute } from "../SchemaVisualizer/SchemaVisualizer.types";
import { X } from "lucide-react";

interface FieldComponentProps {
  attribute: Attribute;
  modelName: string;
  fieldIndex: number;
  onFieldNameUpdate: (fieldIndex: number, newName: string) => void;
  onFieldTypeUpdate: (fieldIndex: number, newType: string) => void;
  onToggleKeyType: (
    fieldIndex: number,
    newKeyType: "NORMAL" | "PRIMARY" | "FOREIGN"
  ) => void;
  onDeleteAttribute: (attributeId: number) => void;
}

const ROW_HEIGHT = 32;

type KeyType = "NORMAL" | "PRIMARY" | "FOREIGN";

export const FieldComponent: React.FC<FieldComponentProps> = ({
  attribute,
  modelName,
  fieldIndex,
  onFieldNameUpdate,
  onFieldTypeUpdate,
  onToggleKeyType,
  onDeleteAttribute,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPK = attribute.isPrimaryKey;
  const isFK = attribute.isForeignKey;
  const hasConnection = !!attribute.connection;

  // Tạo unique handle IDs
  const sourceHandleId = `${modelName}-${attribute.name}-source`;
  const targetHandleId = `${modelName}-${attribute.name}-target`;

  // Determine current key type
  const getCurrentKeyType = (): KeyType => {
    if (isPK) return "PRIMARY";
    if (isFK) return "FOREIGN";
    return "NORMAL";
  };

  // Get next key type in cycle: NORMAL -> PRIMARY -> FOREIGN -> NORMAL
  const getNextKeyType = (current: KeyType): KeyType => {
    switch (current) {
      case "NORMAL":
        return "PRIMARY";
      case "PRIMARY":
        return "FOREIGN";
      case "FOREIGN":
        return "NORMAL";
      default:
        return "NORMAL";
    }
  };

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

  // Get tooltip text
  const getTooltipText = () => {
    const currentType = getCurrentKeyType();
    const nextType = getNextKeyType(currentType);

    switch (nextType) {
      case "PRIMARY":
        return "Click to set as Primary Key";
      case "FOREIGN":
        return "Click to set as Foreign Key";
      case "NORMAL":
        return "Click to remove key status";
      default:
        return "Click to toggle key type";
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(attribute);
    onDeleteAttribute(attribute.id);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentType = getCurrentKeyType();
    const nextType = getNextKeyType(currentType);

    console.log(
      `Toggling key type for ${attribute.name}: ${currentType} -> ${nextType}`
    );
    onToggleKeyType(fieldIndex, nextType);
  };

  return (
    <Box
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex
        bg="#2A2A2A"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        color="white"
        height={`${ROW_HEIGHT}px`}
        borderBottom="1px solid #4A5568"
        _hover={{ bg: "#4A5568" }}
        position="relative"
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

        {/* Field Icon */}
        <Box width="20px" mr={2} ml={2} display="flex" justifyContent="center">
          {getFieldIcon() && (
            <Tooltip label={getTooltipText()} fontSize="xs">
              <Box
                color={getFieldColor()}
                fontSize="12px"
                cursor="pointer"
                onClick={handleIconClick}
                _hover={{ opacity: 0.7, transform: "scale(1.1)" }}
                transition="all 0.2s ease-in-out"
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="16px"
                height="16px"
              >
                {getFieldIcon()}
              </Box>
            </Tooltip>
          )}
          {!getFieldIcon() && (
            <Tooltip label={getTooltipText()} fontSize="xs">
              <Box
                width="12px"
                height="12px"
                border="1px dashed #666"
                borderRadius="2px"
                cursor="pointer"
                onClick={handleIconClick}
                _hover={{
                  borderColor: "#4A90E2",
                  backgroundColor: "rgba(74, 144, 226, 0.1)",
                }}
                transition="all 0.2s ease-in-out"
              />
            </Tooltip>
          )}
        </Box>

        {/* Field Name - Fixed width */}
        <Box width="120px" mr={2}>
          <EditableField
            value={attribute.name}
            onSave={(newName) => onFieldNameUpdate(fieldIndex, newName)}
            placeholder="field_name"
            color={getFieldColor()}
            minWidth="100px"
            maxWidth="120px"
          />
        </Box>

        {/* Field Type - Fixed width */}
        <Box width="100px" mr={2}>
          <EditableField
            value={attribute.dataType}
            onSave={(newType) => onFieldTypeUpdate(fieldIndex, newType)}
            placeholder="type"
            color="#B8B8B8"
            minWidth="80px"
            maxWidth="100px"
          />
        </Box>

        {/* Delete Button - Show on hover */}
        {isHovered && (
          <Box position="absolute" right="2px" top="2px" zIndex={10}>
            <Tooltip label="Delete attribute" fontSize="xs">
              <IconButton
                aria-label="Delete attribute"
                icon={<X size={12} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={handleDeleteClick}
                minWidth="16px"
                height="16px"
                p={0}
                _hover={{ bg: "red.600" }}
              />
            </Tooltip>
          </Box>
        )}

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

      {/* Key Type Indicator Bar */}
      {(isPK || isFK) && (
        <Box
          position="absolute"
          left="0"
          top="0"
          width="3px"
          height="100%"
          bg={isPK ? "#FFD700" : "#87CEEB"}
          borderRadius="0 2px 2px 0"
        />
      )}
    </Box>
  );
};
