// src/components/FieldComponent.tsx - Complete version with handle click FK selector
import React, { useEffect, useRef, useState } from "react";
import { Box, Flex, IconButton, Tooltip, Button } from "@chakra-ui/react";
import { Handle, Position } from "reactflow";
import { EditableField } from "./EditableField";
import { ForeignKeyTargetSelector } from "./ForeignKeyTargetSelector";
import { Attribute, Model } from "../SchemaVisualizer/SchemaVisualizer.types";
import { X } from "lucide-react";

interface FieldComponentProps {
  attribute: Attribute;
  modelName: string;
  fieldIndex: number;
  allModels: Model[];
  onFieldNameUpdate: (fieldIndex: number, newName: string) => void;
  onFieldTypeUpdate: (fieldIndex: number, newType: string) => void;
  onToggleKeyType: (
    modelName: string,
    fieldIndex: number,
    newKeyType: "NORMAL" | "PRIMARY" | "FOREIGN"
  ) => void;
  onDeleteAttribute: (attributeId: number) => void;
  onForeignKeyTargetSelect: (
    attributeId: number,
    targetModelName: string,
    targetAttributeName: string,
    targetAttributeId: number
  ) => void;
  onForeignKeyDisconnect: (attributeId: number) => void;
}

const ROW_HEIGHT = 32;

type KeyType = "NORMAL" | "PRIMARY" | "FOREIGN";

export const FieldComponent: React.FC<FieldComponentProps> = ({
  attribute,
  modelName,
  fieldIndex,
  allModels,
  onFieldNameUpdate,
  onFieldTypeUpdate,
  onToggleKeyType,
  onDeleteAttribute,
  onForeignKeyTargetSelect,
  onForeignKeyDisconnect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFKSelector, setShowFKSelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowFKSelector(false);
      }
    };

    if (showFKSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFKSelector]);
  const isPK = attribute.isPrimaryKey;
  const isFK = attribute.isForeignKey;
  const hasConnection = !!attribute.connection;

  // Determine current key type
  const getCurrentKeyType = (): KeyType => {
    if (attribute.isPrimaryKey) return "PRIMARY";
    if (attribute.isForeignKey) return "FOREIGN";
    return "NORMAL";
  };

  // Get next key type in cycle: NORMAL -> PRIMARY -> FOREIGN -> NORMAL
  const getNextKeyType = (current: KeyType): KeyType => {
    console.log("🔄 Current key type:", current);
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
    onDeleteAttribute(attribute.id);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentType = getCurrentKeyType();
    const nextType = getNextKeyType(currentType);

    console.log(`🔄 Toggle ${attribute.name}:`, {
      attributeId: attribute.id,
      currentType,
      nextType,
      currentPK: isPK,
      currentFK: isFK,
    });

    // ⭐ QUAN TRỌNG: Gọi với attributeId thay vì fieldIndex
    onToggleKeyType(modelName, attribute.id, nextType);
  };

  // Handle click on handles - show FK selector for FK fields
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn context menu mặc định
    e.stopPropagation();

    // Chỉ hiện FK selector nếu field này là FK
    if (isFK && !isPK) {
      setShowFKSelector(!showFKSelector);
    }
  };

  const handleFKSelectorClose = () => {
    setShowFKSelector(false);
  };

  const handleForeignKeyTargetSelectLocal = (
    targetModelName: string,
    targetAttributeName: string,
    targetAttributeId: number
  ) => {
    onForeignKeyTargetSelect(
      attribute.id,
      targetModelName,
      targetAttributeName,
      targetAttributeId
    );
    setShowFKSelector(false); // Đóng selector sau khi chọn
  };

  const handleForeignKeyDisconnectLocal = () => {
    onForeignKeyDisconnect(attribute.id);
    setShowFKSelector(false); // Đóng selector sau khi disconnect
  };

  const createHandles = () => {
    const baseStyle = {
      width: "8px",
      height: "8px",
      border: "2px solid white",
      borderRadius: "50%",
      opacity: 0.6,
    };

    const activeStyle = {
      ...baseStyle,
      opacity: hasConnection ? 1 : isFK && !isPK ? 0.8 : 0.6,
      backgroundColor: hasConnection
        ? "#1770d6ff"
        : isFK && !isPK
        ? "#87CEEB"
        : "#6B7280", // FK color khi chưa connect
    };

    const pkStyle = {
      ...baseStyle,
      opacity: isPK ? 1 : 0.6,
      backgroundColor: isPK ? "#FFD700" : "#6B7280",
    };

    const baseHandleId = `${modelName}-${attribute.name}`;

    return (
      <>
        {/* Left Handles */}
        <Handle
          id={`${baseHandleId}-left`}
          position={Position.Left}
          type="source"
          style={{
            ...activeStyle,
            position: "absolute",
            left: "-5px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        />
        <Handle
          id={`${baseHandleId}-left-target`}
          position={Position.Left}
          type="target"
          style={{
            ...pkStyle,
            position: "absolute",
            left: "-5px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        />

        {/* Right Handles */}
        <Handle
          id={`${baseHandleId}-right`}
          position={Position.Right}
          type="source"
          style={{
            ...activeStyle,
            position: "absolute",
            right: "-5px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        />
        <Handle
          id={`${baseHandleId}-right-target`}
          position={Position.Right}
          type="target"
          style={{
            ...pkStyle,
            position: "absolute",
            right: "-5px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        />
      </>
    );
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
        {createHandles()}

        {/* Field Icon */}
        <Box width="20px" mr={2} ml={2} display="flex" justifyContent="center">
          {getFieldIcon() && (
            <Tooltip label={getTooltipText()} fontSize="xs">
              <Box
                color={getFieldColor()}
                fontSize="12px"
                cursor="pointer"
                onClick={handleIconClick} // Left click - toggle key type
                onContextMenu={isFK && !isPK ? handleRightClick : undefined} // Right click - FK selector
                _hover={{ opacity: 0.7, transform: "scale(1.1)" }}
                transition="all 0.2s ease-in-out"
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="16px"
                height="16px"
                title={
                  isFK && !isPK
                    ? "Left click: toggle type | Right click: FK selector"
                    : getTooltipText()
                }
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

        {/* Field Name */}
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

        {/* Field Type */}
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
                _hover={{ bg: "red.300" }}
              />
            </Tooltip>
          </Box>
        )}

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
      </Flex>

      {/* FK Selector Popup - hiện khi showFKSelector = true */}
      {showFKSelector && isFK && !isPK && (
        <Box
          ref={dropdownRef}
          position="absolute"
          top="100%"
          left="0"
          zIndex={1000}
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          p={2}
          minWidth="200px"
          boxShadow="lg"
        >
          <ForeignKeyTargetSelector
            currentModelName={modelName}
            currentAttributeId={attribute.id}
            currentConnection={
              attribute.connection
                ? {
                    targetModelName: attribute.connection.targetModelName,
                    targetAttributeName:
                      attribute.connection.targetAttributeName,
                  }
                : undefined
            }
            allModels={allModels || []}
            onTargetSelect={handleForeignKeyTargetSelectLocal}
            onDisconnect={handleForeignKeyDisconnectLocal}
            inline={true}
          />

          {/* Close button */}
          <Button
            size="xs"
            position="absolute"
            top="2px"
            right="2px"
            variant="ghost"
            onClick={handleFKSelectorClose}
          >
            ✕
          </Button>
        </Box>
      )}
    </Box>
  );
};
