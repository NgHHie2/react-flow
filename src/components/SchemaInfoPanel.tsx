// src/components/SchemaInfoPanel.tsx
import React from "react";
import { Box, Flex, Text, Badge } from "@chakra-ui/react";
import { SchemaData } from "../SchemaVisualizer/SchemaVisualizer.types";

interface SchemaInfoPanelProps {
  schemaInfo: SchemaData;
  nodesCount: number;
  edgesCount: number;
}

export const SchemaInfoPanel: React.FC<SchemaInfoPanelProps> = ({
  schemaInfo,
  nodesCount,
  edgesCount,
}) => {
  return (
    <Box
      position="absolute"
      top={4}
      left={4}
      zIndex={1000}
      bg="rgba(0,0,0,0.8)"
      color="white"
      p={3}
      borderRadius="md"
      fontSize="sm"
      maxWidth="400px"
    >
      <Flex direction="column" gap={2}>
        <Flex alignItems="center" gap={2}>
          <Text fontWeight="bold" fontSize="md">
            {schemaInfo.name}
          </Text>
          <Badge colorScheme="blue" variant="solid" fontSize="xs">
            {schemaInfo.databaseType} {schemaInfo.version}
          </Badge>
        </Flex>

        <Text color="gray.300" fontSize="xs">
          {schemaInfo.description}
        </Text>

        <Flex gap={2} fontSize="xs" color="gray.400">
          <Text>{nodesCount} models</Text>
          <Text>•</Text>
          <Text>{edgesCount} connections</Text>
          {schemaInfo.charset && (
            <>
              <Text>•</Text>
              <Text>{schemaInfo.charset}</Text>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};
