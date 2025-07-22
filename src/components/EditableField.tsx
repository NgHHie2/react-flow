// src/components/EditableField.tsx
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
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  placeholder = "",
  isEditing = false,
  onEditingChange,
  color = "white",
  minWidth = "80px",
}) => {
  const [editValue, setEditValue] = useState(value);
  const [localIsEditing, setLocalIsEditing] = useState(isEditing);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleDoubleClick = () => {
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

  if (actualIsEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        size="sm"
        variant="filled"
        bg="rgba(255, 255, 255, 0.1)"
        color={color}
        border="1px solid #4A90E2"
        minWidth={minWidth}
        fontFamily="monospace"
        fontSize="sm"
        _focus={{
          bg: "rgba(255, 255, 255, 0.15)",
          borderColor: "#4A90E2",
          boxShadow: "0 0 0 1px #4A90E2",
        }}
      />
    );
  }

  return (
    <Box
      color={color}
      cursor="pointer"
      onDoubleClick={handleDoubleClick}
      minWidth={minWidth}
      p={1}
      borderRadius="sm"
      border="1px solid transparent"
      _hover={{
        bg: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(74, 144, 226, 0.5)",
      }}
      transition="all 0.15s ease-in-out"
      title="Double click to edit"
    >
      <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "14px" }}>
        {value || placeholder}
      </pre>
    </Box>
  );
};
