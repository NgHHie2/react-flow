// Cập nhật ModelHeader.tsx
import React, { useState } from "react";
import { Box, Flex, IconButton, Tooltip } from "@chakra-ui/react";
import { X } from "lucide-react";
import { EditableField } from "./EditableField";
import { Model } from "../SchemaVisualizer/SchemaVisualizer.types";

interface ModelHeaderProps {
  model: Model;
  onModelNameUpdate?: (newName: string) => void;
  onDeleteModel?: () => void;
  canDelete?: boolean;
}

const HEADER_HEIGHT = 40;

export const ModelHeader: React.FC<ModelHeaderProps> = ({
  model,
  onModelNameUpdate,
  onDeleteModel,
  canDelete = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Thêm dòng này

  const handleNameUpdate = (newName: string) => {
    if (onModelNameUpdate) {
      onModelNameUpdate(newName);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteModel) {
      onDeleteModel();
    }
  };

  return (
    <Box
      p={3}
      textAlign="center"
      borderRadius="8px 8px 0 0"
      bg="#3d5787"
      height={`${HEADER_HEIGHT}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex alignItems="center" gap={2} width="100%">
        {/* Editable Model Name */}
        <Box flex={1}>
          <EditableField
            value={model.name}
            onSave={handleNameUpdate}
            placeholder="Table Name"
            color="white"
            minWidth="100px"
            maxWidth="200px"
            isEditing={isEditing} // Thêm dòng này
            onEditingChange={setIsEditing}
          />
        </Box>

        {/* Model Type Text */}
        <Box
          fontSize="10px"
          color="rgba(255,255,255,0.7)"
          textTransform="uppercase"
          letterSpacing="0.5px"
          minWidth="35px"
        >
          {model.modelType}
        </Box>
      </Flex>

      {/* Delete Button - Show on hover */}

      <Box position="absolute" right="4px" top="4px" zIndex={10}>
        <Tooltip label="Delete table" fontSize="xs">
          <IconButton
            aria-label="Delete table"
            icon={<X size={12} />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={handleDelete}
            minWidth="16px"
            height="16px"
            p={0}
            _hover={{ bg: "red.400" }}
          />
        </Tooltip>
      </Box>
    </Box>
  );
};
