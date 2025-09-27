// ForeignKeyTargetSelector.tsx - CORRECT useStore usage
import React, { useMemo } from "react";
import { useStore } from "reactflow";
import type { ReactFlowState } from "reactflow";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Text,
  Button,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDown, Link } from "lucide-react";
import { Attribute } from "../SchemaVisualizer/SchemaVisualizer.types";

interface PrimaryKeyOption {
  modelId: string;
  modelName: string;
  attributeId: string;
  attributeName: string;
}

interface ForeignKeyTargetSelectorProps {
  currentModelId: string;
  currentAttributeId: string;
  currentConnection?: {
    targetModelId: string;
    targetAttributeId: string;
  };
  onTargetSelect: (targetModelId: string, targetAttributeId: string) => void;
  onDisconnect: () => void;
  inline?: boolean;
}

export const ForeignKeyTargetSelector: React.FC<
  ForeignKeyTargetSelectorProps
> = ({
  currentModelId,
  currentAttributeId,
  currentConnection,
  onTargetSelect,
  onDisconnect,
  inline = false,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ✅ CORRECT: Access nodes from ReactFlow store
  const allNodes = useStore((state: ReactFlowState) => state.nodeInternals);

  // ✅ ALTERNATIVE: If nodeInternals doesn't work, try this:
  // const allNodes = useStore((state) => Array.from(state.nodeInternals.values()));

  const primaryKeyOptions: PrimaryKeyOption[] = useMemo(() => {
    // ✅ Convert Map to Array if needed
    const nodesArray = Array.isArray(allNodes)
      ? allNodes
      : Array.from(allNodes.values());

    if (!nodesArray || nodesArray.length === 0) {
      console.warn("⚠️ No nodes in ReactFlow store");
      return [];
    }

    const options: PrimaryKeyOption[] = [];

    nodesArray.forEach((node) => {
      const model = node.data;

      if (!model?.attributes || !Array.isArray(model.attributes)) {
        console.warn(`⚠️ Invalid node data:`, node);
        return;
      }

      model.attributes.forEach((attr: Attribute) => {
        if (attr?.isPrimaryKey === true) {
          options.push({
            modelId: model.id,
            modelName: model.name,
            attributeId: attr.id,
            attributeName: attr.name,
          });
        }
      });
    });

    return options;
  }, [allNodes]); // Simple dependency

  const getCurrentTargetDisplay = () => {
    if (!currentConnection) return "Select target...";

    const nodesArray = Array.isArray(allNodes)
      ? allNodes
      : Array.from(allNodes.values());

    const targetNode = nodesArray.find(
      (node) => node.data.id === currentConnection.targetModelId
    );
    const targetAttribute = targetNode?.data.attributes?.find(
      (a: any) => a.id === currentConnection.targetAttributeId
    );

    if (targetNode?.data && targetAttribute) {
      return `${targetNode.data.name}.${targetAttribute.name}`;
    }

    return `${currentConnection.targetModelId}.${currentConnection.targetAttributeId}`;
  };

  const handleTargetSelect = (option: PrimaryKeyOption) => {
    console.log("🔗 Selecting:", `${option.modelName}.${option.attributeName}`);
    onTargetSelect(option.modelId, option.attributeId);
    if (!inline) onClose();
  };

  const handleDisconnect = () => {
    console.log("🔓 Disconnecting FK");
    onDisconnect();
    if (!inline) onClose();
  };

  // Rest of the component remains the same...
  if (inline) {
    return (
      <VStack spacing={2} align="stretch" w="100%">
        <Text fontWeight="bold" color="gray.200" fontSize="sm">
          Foreign Key Target ({primaryKeyOptions.length} available)
        </Text>

        <Divider borderColor="gray.600" />

        {primaryKeyOptions.length === 0 ? (
          <Text color="gray.400" fontSize="sm" textAlign="center" py={2}>
            No primary keys available
          </Text>
        ) : (
          <VStack
            spacing={1}
            align="stretch"
            maxHeight="180px"
            overflowY="auto"
          >
            {primaryKeyOptions.map((option) => (
              <Button
                key={`${option.modelId}-${option.attributeId}`}
                size="sm"
                variant="ghost"
                justifyContent="flex-start"
                fontSize="sm"
                color="white"
                _hover={{ bg: "blue.600", color: "white" }}
                onClick={() => handleTargetSelect(option)}
                isActive={
                  currentConnection?.targetModelId === option.modelId &&
                  currentConnection?.targetAttributeId === option.attributeId
                }
                _active={{ bg: "blue.500", color: "white" }}
              >
                🔑 {option.modelName}.{option.attributeName}
              </Button>
            ))}
          </VStack>
        )}

        {currentConnection && (
          <>
            <Divider borderColor="gray.600" />
            <Button
              size="sm"
              variant="ghost"
              justifyContent="flex-start"
              fontSize="sm"
              color="red.300"
              _hover={{ bg: "red.600", color: "white" }}
              onClick={handleDisconnect}
            >
              🗑️ Remove connection
            </Button>
          </>
        )}
      </VStack>
    );
  }

  // Popover mode
  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="right"
    >
      <PopoverTrigger>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Link size={12} />}
          rightIcon={<ChevronDown size={12} />}
          fontSize="sm"
          minWidth="140px"
          justifyContent="space-between"
          color={currentConnection ? "blue.300" : "gray.400"}
          _hover={{ bg: "rgba(74, 144, 226, 0.1)", color: "blue.200" }}
        >
          <Text noOfLines={1} fontSize="sm">
            {getCurrentTargetDisplay()}
          </Text>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg="gray.800"
        borderColor="gray.600"
        color="white"
        fontSize="sm"
        minWidth="220px"
      >
        <PopoverBody p={3}>
          <VStack spacing={2} align="stretch">
            <Text fontWeight="bold" color="blue.300" fontSize="sm">
              Select Primary Key ({primaryKeyOptions.length} available)
            </Text>

            <Divider borderColor="gray.600" />

            {primaryKeyOptions.length === 0 ? (
              <Text color="gray.400" fontSize="sm" textAlign="center" py={2}>
                No primary keys available
              </Text>
            ) : (
              <VStack spacing={1} align="stretch">
                {primaryKeyOptions.map((option) => (
                  <Button
                    key={`${option.modelId}-${option.attributeId}`}
                    size="sm"
                    variant="ghost"
                    justifyContent="flex-start"
                    fontSize="sm"
                    color="white"
                    _hover={{ bg: "gray.600" }}
                    onClick={() => handleTargetSelect(option)}
                    isActive={
                      currentConnection?.targetModelId === option.modelId &&
                      currentConnection?.targetAttributeId ===
                        option.attributeId
                    }
                  >
                    🔑 {option.modelName}.{option.attributeName}
                  </Button>
                ))}
              </VStack>
            )}

            {currentConnection && (
              <>
                <Divider borderColor="gray.600" />
                <Button
                  size="sm"
                  variant="ghost"
                  justifyContent="flex-start"
                  fontSize="sm"
                  color="red.300"
                  _hover={{ bg: "red.600" }}
                  onClick={handleDisconnect}
                >
                  🗑️ Remove connection
                </Button>
              </>
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
