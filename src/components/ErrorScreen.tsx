// src/components/ErrorScreen.tsx
import React from "react";
import {
  Box,
  Alert,
  AlertIcon,
  Button,
  VStack,
  HStack,
} from "@chakra-ui/react";

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
  onInitialize: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  onRetry,
  onInitialize,
}) => {
  return (
    <Box
      height="100vh"
      width="100vw"
      bg="#1C1c1c"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={4} maxWidth="500px">
        <Alert status="error">
          <AlertIcon />
          Error loading schema data: {error}
        </Alert>
        <HStack spacing={4}>
          <Button colorScheme="blue" onClick={onRetry}>
            Retry
          </Button>
          <Button colorScheme="green" onClick={onInitialize}>
            Initialize Sample Data
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
