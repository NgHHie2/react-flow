// src/components/ConnectionStatus.tsx
import React from "react";
import { Box, Badge } from "@chakra-ui/react";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
}) => {
  return (
    <Box position="absolute" top={4} right={200} zIndex={1000}>
      <Badge
        colorScheme={isConnected ? "green" : "red"}
        variant="solid"
        px={3}
        py={1}
      >
        {isConnected ? "🟢 Real-time Sync" : "🔴 Offline Mode"}
      </Badge>
    </Box>
  );
};
