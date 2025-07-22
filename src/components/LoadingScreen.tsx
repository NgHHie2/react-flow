// src/components/LoadingScreen.tsx
import React from 'react';
import { Box, Spinner, VStack } from '@chakra-ui/react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading schema data..." 
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
      <VStack spacing={4}>
        <Spinner size="xl" color="white" thickness="4px" />
        <Box color="white" fontSize="lg">
          {message}
        </Box>
      </VStack>
    </Box>
  );
};