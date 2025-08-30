// src/components/AddModelButton.tsx
import React from "react";
import { Box, Button, Tooltip } from "@chakra-ui/react";
import { Plus } from "lucide-react";

interface AddModelButtonProps {
  onAddModel: () => void;
  isConnected: boolean;
}

export const AddModelButton: React.FC<AddModelButtonProps> = ({
  onAddModel,
  isConnected,
}) => {
  return (
    <Box position="absolute" bottom={4} left={4} zIndex={1000}>
      <Tooltip
        label={isConnected ? "Add new table" : "Connect to add tables"}
        fontSize="sm"
      >
        <Button
          leftIcon={<Plus size={16} />}
          colorScheme="green"
          size="md"
          onClick={onAddModel}
          isDisabled={!isConnected}
          _disabled={{
            opacity: 0.5,
            cursor: "not-allowed",
          }}
        >
          Add Table
        </Button>
      </Tooltip>
    </Box>
  );
};
