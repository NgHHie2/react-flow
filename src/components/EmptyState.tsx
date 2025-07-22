// src/components/EmptyState.tsx
import React from "react";
import { Box, Button, VStack } from "@chakra-ui/react";

interface EmptyStateProps {
  onInitialize: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onInitialize }) => {
  return (
    <Box
      height="100vh"
      width="100vw"
      bg="#1C1c1c"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={4}>
        <Box color="white" fontSize="lg" textAlign="center">
          No schema data found. Would you like to initialize sample data?
        </Box>
        <Button colorScheme="green" onClick={onInitialize}>
          Initialize Sample Data
        </Button>
      </VStack>
    </Box>
  );
};
