// src/components/ModelHeader.tsx
import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Model } from "../SchemaVisualizer/SchemaVisualizer.types";

interface ModelHeaderProps {
  model: Model;
}

const HEADER_HEIGHT = 40;

export const ModelHeader: React.FC<ModelHeaderProps> = ({ model }) => {
  const getModelTypeIcon = (modelType: string) => {
    switch (modelType) {
      case "TABLE":
        return "🗃️";
      case "VIEW":
        return "👁️";
      case "PROCEDURE":
        return "⚙️";
      default:
        return "📋";
    }
  };

  const getModelTypeColor = (modelType: string) => {
    switch (modelType) {
      case "TABLE":
        return "#3d5787";
      case "VIEW":
        return "#4A90E2";
      case "PROCEDURE":
        return "#38A169";
      default:
        return "#3d5787";
    }
  };

  return (
    <Box
      p={3}
      textAlign="center"
      borderRadius="8px 8px 0 0"
      bg={model.backgroundColor || getModelTypeColor(model.modelType)}
      height={`${HEADER_HEIGHT}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderBottom={`2px solid ${model.borderColor || "#4A5568"}`}
      style={{
        borderWidth: model.borderWidth || 2,
        borderRadius: model.borderRadius || 8,
      }}
    >
      <Flex alignItems="center" gap={2}>
        {/* Model Type Icon */}
        <Box fontSize="12px" opacity={0.8}>
          {getModelTypeIcon(model.modelType)}
        </Box>

        {/* Model Name */}
        <Box
          fontWeight="bold"
          color="white"
          fontSize="14px"
          textShadow="0 1px 2px rgba(0,0,0,0.3)"
        >
          {model.name}
        </Box>

        {/* Model Type Text */}
        <Box
          fontSize="10px"
          color="rgba(255,255,255,0.7)"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          {model.modelType}
        </Box>
      </Flex>
    </Box>
  );
};
