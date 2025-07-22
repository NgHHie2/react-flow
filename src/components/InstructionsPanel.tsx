// src/components/InstructionsPanel.tsx
import React from "react";
import { Box, VStack } from "@chakra-ui/react";

export const InstructionsPanel: React.FC = () => {
  return (
    <Box
      position="absolute"
      top={4}
      left={4}
      zIndex={1000}
      bg="rgba(0,0,0,0.7)"
      color="white"
      p={3}
      borderRadius="md"
      fontSize="sm"
      maxWidth="300px"
    >
      <VStack align="flex-start" spacing={1}>
        <Box fontWeight="bold">Controls:</Box>
        <Box>• Drag nodes to move them</Box>
        <Box>• Double-click fields to edit</Box>
        <Box>• Changes sync in real-time</Box>
      </VStack>
    </Box>
  );
};
