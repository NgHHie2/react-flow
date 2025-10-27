// src/components/FieldComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import { Box, Flex, IconButton, Tooltip, Button } from "@chakra-ui/react";
import { Handle, Position } from "reactflow";
import { EditableField } from "./EditableField";
import { ForeignKeyTargetSelector } from "./ForeignKeyTargetSelector";
import { Attribute, Model } from "../SchemaVisualizer/SchemaVisualizer.types";
import { X } from "lucide-react";

interface FieldComponentProps {
  attribute: Attribute;
  model: Model;
  fieldIndex: number;
  onFieldNameUpdate: (fieldIndex: number, newName: string) => void;
  onFieldTypeUpdate: (fieldIndex: number, newType: string) => void;
  onToggleKeyType: (
    modelId: string,
    attributeId: string,
    newKeyType: "NORMAL" | "PRIMARY" | "FOREIGN"
  ) => void;
  onDeleteAttribute: (attributeId: string) => void;
  onForeignKeyTargetSelect: (
    attributeId: string,
    targetModelId: string,
    targetAttributeId: string
  ) => void;
  onForeignKeyDisconnect: (attributeId: string) => void;
}

const ROW_HEIGHT = 32;
type KeyType = "NORMAL" | "PRIMARY" | "FOREIGN";

export const FieldComponent: React.FC<FieldComponentProps> = ({
  attribute,
  model,
  fieldIndex,
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

  // ✅ Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        console.log("🔒 Closing FK selector due to outside click");
        setShowFKSelector(false);
      }
    };

    if (showFKSelector) {
      document.addEventListener("pointerdown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [showFKSelector]);

  const isPK = attribute.isPrimaryKey;
  const isFK = attribute.isForeignKey;
  // const hasConnection = !!attribute.connection;

  const getCurrentKeyType = (): KeyType => {
    if (attribute.isPrimaryKey) return "PRIMARY";
    if (attribute.isForeignKey) return "FOREIGN";
    return "NORMAL";
  };

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

  const getFieldColor = () => {
    if (isPK) return "#FFD700";
    if (isFK) return "#87CEEB";
    return "white";
  };

  const getFieldIcon = () => {
    if (isPK) return "🔑";
    if (isFK) return "🔗";
    return null;
  };

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
    onToggleKeyType(model.id, attribute.id, nextType);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Chỉ cho phép mở FK selector nếu là Foreign Key thuần túy (không phải PK)
    if (isFK && !isPK) {
      const newState = !showFKSelector;
      setShowFKSelector(newState);
    }
  };

  const handleFKSelectorClose = () => {
    console.log("🔒 Manually closing FK selector");
    setShowFKSelector(false);
  };

  const handleForeignKeyTargetSelectLocal = (
    targetModelId: string,
    targetAttributeId: string
  ) => {
    console.log("🔗 FK target selected:", { targetModelId, targetAttributeId });
    onForeignKeyTargetSelect(attribute.id, targetModelId, targetAttributeId);
    setShowFKSelector(false);
  };

  const handleForeignKeyDisconnectLocal = () => {
    console.log("🔓 FK disconnected");
    onForeignKeyDisconnect(attribute.id);
    setShowFKSelector(false);
  };

  // ✅ Create handles
  const createHandles = () => {
    const baseStyle = {
      width: "8px",
      height: "8px",
      border: "1px solid",
      borderRadius: "50%",
      opacity: 0.6,
    };

    const pkStyle = {
      ...baseStyle,
      opacity: 1,
      backgroundColor: isPK
        ? "#FFD700" // vàng nếu là Primary Key
        : isFK
        ? "#1770d6ff" // xanh nếu là Foreign Key
        : "#FFFFFFFF", // mặc định
    };

    const baseHandleId = `${model.id}-${attribute.id}`;

    return (
      <>
        {/* Left Handles */}
        <Handle
          id={`${baseHandleId}-left`}
          position={Position.Left}
          type="source"
          style={{
            ...pkStyle,
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
            ...pkStyle,
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
                // color={getFieldColor()}
                fontSize="12px"
                cursor="pointer"
                onClick={handleIconClick}
                onContextMenu={isFK && !isPK ? handleRightClick : undefined}
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

        {/* Delete Button */}
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
                minWidth="14px"
                height="14px"
                p={0}
                _hover={{ bg: "red.300" }}
              />
            </Tooltip>
          </Box>
        )}
      </Flex>

      {/* FK Selector Popup */}
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
            key={`fk-selector-${model.id}-${attribute.id}-${Date.now()}`} // ✅ Always fresh mount
            currentModelId={model.id}
            currentAttributeId={attribute.id}
            currentConnection={
              attribute.connection
                ? {
                    targetModelId: attribute.connection.targetModelId,
                    targetAttributeId: attribute.connection.targetAttributeId,
                  }
                : undefined
            }
            onTargetSelect={handleForeignKeyTargetSelectLocal}
            onDisconnect={handleForeignKeyDisconnectLocal}
            inline={true}
          />

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
