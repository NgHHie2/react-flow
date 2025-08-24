// src/components/ControlPanel.tsx
import React from "react";
import { Box, Button, VStack, HStack, Badge } from "@chakra-ui/react";

interface ControlPanelProps {
  isConnected: boolean;
  loading: boolean;
  onRefresh: () => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isConnected,
  loading,
  onRefresh,
  onReset,
}) => {
  return (
    <Box position="absolute" top={4} right={4} zIndex={1000}>
      <VStack spacing={2} align="flex-end">
        {/* Connection Status */}
        {/* <Badge
          colorScheme={isConnected ? "green" : "red"}
          variant="solid"
          px={3}
          py={1}
        >
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </Badge> */}

        {/* Control Buttons */}
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={onRefresh}
            isLoading={loading}
          >
            Refresh
          </Button>
          {/* <Button
            size="sm"
            colorScheme="green"
            onClick={onReset}
            isLoading={loading}
          >
            Reset Data
          </Button> */}
        </HStack>
      </VStack>
    </Box>
  );
};
