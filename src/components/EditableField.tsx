// src/components/EditableField.tsx - Fixed width consistency
import React, { useState, useRef, useEffect } from "react";
import { Box, Input, useToast } from "@chakra-ui/react";

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  color?: string;
  minWidth?: string;
  maxWidth?: string;
  flex?: number;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  placeholder = "",
  isEditing = false,
  onEditingChange,
  color = "white",
  minWidth = "80px",
  maxWidth,
  flex,
}) => {
  const [editValue, setEditValue] = useState(value);
  const [localIsEditing, setLocalIsEditing] = useState(isEditing);
  const inputRef = useRef<HTMLInputElement>(null);
  const textBoxRef = useRef<HTMLDivElement>(null);
  const [textBoxWidth, setTextBoxWidth] = useState<number | undefined>();
  const toast = useToast();

  const actualIsEditing = onEditingChange ? isEditing : localIsEditing;
  const setActualIsEditing = onEditingChange || setLocalIsEditing;

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (actualIsEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [actualIsEditing]);

  // Measure text box width when not editing
  useEffect(() => {
    if (!actualIsEditing && textBoxRef.current) {
      const rect = textBoxRef.current.getBoundingClientRect();
      setTextBoxWidth(rect.width);
    }
  }, [actualIsEditing, value]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node drag
    // Measure current width before switching to edit mode
    if (textBoxRef.current) {
      const rect = textBoxRef.current.getBoundingClientRect();
      setTextBoxWidth(rect.width);
    }
    setActualIsEditing(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();

    if (trimmedValue === "") {
      toast({
        title: "Error",
        description: "Field cannot be empty",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      setEditValue(value); // Reset to original value
      return;
    }

    if (trimmedValue !== value) {
      onSave(trimmedValue);
    }

    setActualIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value); // Reset to original value
    setActualIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent any parent handlers
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node drag when clicking input
  };

  const handleTextBoxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node drag when clicking text
  };

  const getFlexStyles = () => {
    if (flex) {
      return { flex: flex };
    }
    return {};
  };

  const getWidthStyles = () => {
    const styles: React.CSSProperties = {
      minWidth,
      ...getFlexStyles(),
    };

    if (maxWidth) {
      styles.maxWidth = maxWidth;
    }

    // Use measured width when editing to prevent expansion
    if (actualIsEditing && textBoxWidth) {
      styles.width = `${textBoxWidth}px`;
      styles.maxWidth = `${textBoxWidth}px`;
    }

    return styles;
  };

  if (actualIsEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={handleInputClick}
        size="sm"
        variant="filled"
        bg="rgba(255, 255, 255, 0.1)"
        color={color}
        border="1px solid #4A90E2"
        fontFamily="monospace"
        fontSize="14px"
        p={1}
        style={getWidthStyles()}
        _focus={{
          bg: "rgba(255, 255, 255, 0.15)",
          borderColor: "#4A90E2",
          boxShadow: "0 0 0 1px #4A90E2",
          outline: "none",
        }}
        _hover={{
          bg: "rgba(255, 255, 255, 0.12)",
        }}
      />
    );
  }

  return (
    <Box
      ref={textBoxRef}
      color={color}
      cursor="pointer"
      onDoubleClick={handleDoubleClick}
      onClick={handleTextBoxClick}
      p={1}
      borderRadius="sm"
      border="1px solid transparent"
      fontFamily="monospace"
      fontSize="14px"
      style={getWidthStyles()}
      _hover={{
        bg: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(74, 144, 226, 0.5)",
      }}
      transition="all 0.15s ease-in-out"
      title="Double click to edit"
      // Ensure consistent height
      minHeight="24px"
      display="flex"
      alignItems="center"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
    >
      {value || (
        <Box color="gray.500" fontStyle="italic">
          {placeholder}
        </Box>
      )}
    </Box>
  );
};
