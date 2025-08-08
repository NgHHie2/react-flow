// src/components/ModelFooter.tsx
import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Model } from "../SchemaVisualizer/SchemaVisualizer.types";

interface ModelFooterProps {
  model: Model;
}

export const ModelFooter: React.FC<ModelFooterProps> = ({ model }) => {
  const attributeCount = model.attributes.length;
  const primaryKeys = model.attributes.filter(
    (attr) => attr.isPrimaryKey
  ).length;
  const foreignKeys = model.attributes.filter(
    (attr) => attr.isForeignKey
  ).length;
  const indexes = model.attributes.filter((attr) => attr.hasIndex).length;

  return (
    <Box>
      {/* Statistics Bar */}
      <Flex
        bg="rgba(0,0,0,0.1)"
        px={2}
        py={1}
        fontSize="10px"
        color="rgba(255,255,255,0.7)"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>{attributeCount} fields</Box>
        {primaryKeys > 0 && <Box>🔑 {primaryKeys}</Box>}
        {foreignKeys > 0 && <Box>🔗 {foreignKeys}</Box>}
        {indexes > 0 && <Box>📊 {indexes}</Box>}
      </Flex>

      {/* Bottom border */}
      <Box
        height="2px"
        bg={model.borderColor || "#4A5568"}
        borderRadius="0 0 8px 8px"
      />
    </Box>
  );
};
