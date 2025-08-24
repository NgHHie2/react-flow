// src/components/ModelFooter.tsx
import React from "react";
import { Box, Flex, IconButton, Tooltip } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { Model } from "../SchemaVisualizer/SchemaVisualizer.types";

interface ModelFooterProps {
  model: Model;
  onAddAttribute: () => void;
}

export const ModelFooter: React.FC<ModelFooterProps> = ({
  model,
  onAddAttribute,
}) => {
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
      {/* Statistics Bar with Add Button */}
      <Flex
        bg="#3d5787"
        px={2}
        py={1}
        fontSize="10px"
        color="rgba(255,255,255,0.7)"
        justifyContent="space-between"
        alignItems="center"
        borderRadius="0 0 6px 6px"
        position="relative"
      >
        {/* Left side - Statistics */}
        <Flex alignItems="center" gap={2}>
          <Box>{attributeCount} fields</Box>
          {primaryKeys > 0 && <Box>🔑 {primaryKeys}</Box>}
          {foreignKeys > 0 && <Box>🔗 {foreignKeys}</Box>}
          {indexes > 0 && <Box>📊 {indexes}</Box>}
        </Flex>

        {/* Right side - Add Button */}
        <Tooltip label="Add new attribute" fontSize="xs">
          <IconButton
            aria-label="Add attribute"
            icon={<Plus size={12} />}
            size="xs"
            variant="ghost"
            colorScheme="green"
            onClick={onAddAttribute}
            minWidth="16px"
            height="16px"
            p={0}
            color="rgba(255,255,255,0.7)"
            _hover={{
              bg: "green.600",
              color: "white",
            }}
            _active={{
              bg: "green.700",
            }}
          />
        </Tooltip>
      </Flex>
    </Box>
  );
};
