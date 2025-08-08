// src/components/ConnectionInfo.tsx
import React from "react";
import { Box, Text, Badge, VStack, HStack } from "@chakra-ui/react";
import { Connection } from "../SchemaVisualizer/SchemaVisualizer.types";

interface ConnectionInfoProps {
  connection: Connection;
  sourceModel: string;
  sourceField: string;
}

export const ConnectionInfo: React.FC<ConnectionInfoProps> = ({
  connection,
  sourceModel,
  sourceField,
}) => {
  const getConnectionTypeBadge = (type: string) => {
    switch (type) {
      case "ONE_TO_ONE":
        return (
          <Badge colorScheme="purple" size="sm">
            1:1
          </Badge>
        );
      case "ONE_TO_MANY":
        return (
          <Badge colorScheme="blue" size="sm">
            1:N
          </Badge>
        );
      case "MANY_TO_ONE":
        return (
          <Badge colorScheme="green" size="sm">
            N:1
          </Badge>
        );
      case "MANY_TO_MANY":
        return (
          <Badge colorScheme="orange" size="sm">
            N:N
          </Badge>
        );
      default:
        return (
          <Badge colorScheme="gray" size="sm">
            {type}
          </Badge>
        );
    }
  };

  return (
    <VStack
      align="start"
      spacing={2}
      p={3}
      bg="rgba(0,0,0,0.9)"
      borderRadius="md"
      border="1px solid"
      borderColor={connection.strokeColor}
      color="white"
      fontSize="xs"
      minWidth="200px"
    >
      {/* Connection Type */}
      <HStack justify="space-between" width="100%">
        <Text fontWeight="bold">Connection Type:</Text>
        {getConnectionTypeBadge(connection.connectionType)}
      </HStack>

      {/* Source and Target */}
      <VStack align="start" spacing={1} width="100%">
        <HStack justify="space-between" width="100%">
          <Text color="gray.300">From:</Text>
          <Text fontWeight="bold" color={connection.strokeColor}>
            {sourceModel}.{sourceField}
          </Text>
        </HStack>
        <HStack justify="space-between" width="100%">
          <Text color="gray.300">To:</Text>
          <Text fontWeight="bold" color={connection.strokeColor}>
            {connection.targetModelName}.{connection.targetAttributeName}
          </Text>
        </HStack>
      </VStack>

      {/* Foreign Key Name */}
      <HStack justify="space-between" width="100%">
        <Text color="gray.300">FK Name:</Text>
        <Text fontFamily="monospace" fontSize="xs">
          {connection.foreignKeyName}
        </Text>
      </HStack>

      {/* Constraints */}
      {(connection.onUpdate || connection.onDelete) && (
        <VStack align="start" spacing={1} width="100%">
          <Text color="gray.300" fontWeight="bold">
            Constraints:
          </Text>
          {connection.onUpdate && (
            <HStack justify="space-between" width="100%">
              <Text color="gray.400">ON UPDATE:</Text>
              <Badge colorScheme="yellow" size="xs">
                {connection.onUpdate}
              </Badge>
            </HStack>
          )}
          {connection.onDelete && (
            <HStack justify="space-between" width="100%">
              <Text color="gray.400">ON DELETE:</Text>
              <Badge colorScheme="red" size="xs">
                {connection.onDelete}
              </Badge>
            </HStack>
          )}
        </VStack>
      )}

      {/* Additional Properties */}
      <HStack justify="space-between" width="100%">
        <Text color="gray.300">Enforced:</Text>
        <Badge colorScheme={connection.isEnforced ? "green" : "red"} size="xs">
          {connection.isEnforced ? "Yes" : "No"}
        </Badge>
      </HStack>

      <HStack justify="space-between" width="100%">
        <Text color="gray.300">Animated:</Text>
        <Badge colorScheme={connection.isAnimated ? "blue" : "gray"} size="xs">
          {connection.isAnimated ? "Yes" : "No"}
        </Badge>
      </HStack>
    </VStack>
  );
};
