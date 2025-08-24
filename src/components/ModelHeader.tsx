// src/components/ModelHeader.tsx
import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Model } from "../SchemaVisualizer/SchemaVisualizer.types";

interface ModelHeaderProps {
  model: Model;
}

const HEADER_HEIGHT = 40;

export const ModelHeader: React.FC<ModelHeaderProps> = ({ model }) => {
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
    >
      <Flex alignItems="center" gap={2}>
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
