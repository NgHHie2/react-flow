// src/components/ForeignKeyTargetSelector.tsx - Fixed
import React, { useState, useEffect } from "react";
import {
  Box,
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
import { Model } from "../SchemaVisualizer/SchemaVisualizer.types";

interface PrimaryKeyOption {
  modelName: string;
  attributeName: string;
  attributeId: number;
}

interface ForeignKeyTargetSelectorProps {
  currentModelName: string;
  currentAttributeId: number;
  currentConnection?: {
    targetModelName: string;
    targetAttributeName: string;
  };
  allModels: Model[];
  onTargetSelect: (
    targetModelName: string,
    targetAttributeName: string,
    targetAttributeId: number
  ) => void;
  onDisconnect: () => void;
}

export const ForeignKeyTargetSelector: React.FC<
  ForeignKeyTargetSelectorProps
> = ({
  currentModelName,
  currentAttributeId,
  currentConnection,
  allModels,
  onTargetSelect,
  onDisconnect,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [primaryKeyOptions, setPrimaryKeyOptions] = useState<
    PrimaryKeyOption[]
  >([]);

  // Collect all primary keys from all models except current model
  useEffect(() => {
    const options: PrimaryKeyOption[] = [];

    // Check if allModels exists and is array
    if (!allModels || !Array.isArray(allModels)) {
      console.warn(
        "ForeignKeyTargetSelector - allModels not available:",
        allModels
      );
      setPrimaryKeyOptions([]);
      return;
    }

    console.log(
      "🔍 ForeignKeyTargetSelector - Processing models:",
      allModels.length
    );

    allModels.forEach((model) => {
      // Check if this is a valid model object with required properties
      if (
        !model ||
        !model.name ||
        !model.attributes ||
        !Array.isArray(model.attributes)
      ) {
        console.warn("🔍 Invalid model structure:", model);
        return;
      }

      // Skip current model
      if (model.name === currentModelName) {
        console.log(`🔍 Skipping current model: ${model.name}`);
        return;
      }

      console.log(
        `🔍 Processing model: ${model.name} with ${model.attributes.length} attributes`
      );

      model.attributes.forEach((attr, index) => {
        if (!attr || typeof attr.isPrimaryKey !== "boolean") {
          console.warn(`🔍 Invalid attribute at index ${index}:`, attr);
          return;
        }

        if (attr.isPrimaryKey) {
          console.log(
            `✅ Found PK: ${model.name}.${attr.name} (id: ${attr.id})`
          );
          options.push({
            modelName: model.name,
            attributeName: attr.name,
            attributeId: attr.id,
          });
        }
      });
    });

    console.log("🎯 Final PK options:", options);
    setPrimaryKeyOptions(options);
  }, [allModels, currentModelName]);

  const handleTargetSelect = (option: PrimaryKeyOption) => {
    console.log("🔗 Selecting FK target:", option);
    onTargetSelect(option.modelName, option.attributeName, option.attributeId);
    onClose();
  };

  const handleDisconnect = () => {
    console.log("🔓 Disconnecting FK");
    onDisconnect();
    onClose();
  };

  const getCurrentTargetText = () => {
    if (currentConnection) {
      return `${currentConnection.targetModelName}.${currentConnection.targetAttributeName}`;
    }
    return "Select target...";
  };

  if (primaryKeyOptions.length === 0) {
    return (
      <Box
        fontSize="xs"
        color="orange.300"
        p={1}
        textAlign="center"
        fontStyle="italic"
      >
        No primary keys available
      </Box>
    );
  }

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="right"
    >
      <PopoverTrigger>
        <Button
          size="xs"
          variant="ghost"
          leftIcon={<Link size={10} />}
          rightIcon={<ChevronDown size={10} />}
          fontSize="xs"
          height="20px"
          minWidth="120px"
          justifyContent="space-between"
          color={currentConnection ? "blue.300" : "gray.400"}
          _hover={{
            bg: "rgba(74, 144, 226, 0.1)",
            color: "blue.200",
          }}
        >
          <Text noOfLines={1} fontSize="xs">
            {getCurrentTargetText()}
          </Text>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg="gray.800"
        borderColor="gray.600"
        color="white"
        fontSize="xs"
        minWidth="200px"
      >
        <PopoverBody p={2}>
          <VStack spacing={1} align="stretch">
            <Text fontWeight="bold" color="blue.300" fontSize="xs">
              Select Primary Key Target:
            </Text>

            <Divider borderColor="gray.600" />

            {primaryKeyOptions.map((option) => (
              <Button
                key={`${option.modelName}-${option.attributeId}`}
                size="xs"
                variant="ghost"
                height="24px"
                justifyContent="flex-start"
                fontSize="xs"
                color="white"
                _hover={{ bg: "blue.600" }}
                onClick={() => handleTargetSelect(option)}
                isActive={
                  currentConnection?.targetModelName === option.modelName &&
                  currentConnection?.targetAttributeName ===
                    option.attributeName
                }
              >
                <Text noOfLines={1}>
                  🔑 {option.modelName}.{option.attributeName}
                </Text>
              </Button>
            ))}

            {currentConnection && (
              <>
                <Divider borderColor="gray.600" />
                <Button
                  size="xs"
                  variant="ghost"
                  height="24px"
                  justifyContent="flex-start"
                  fontSize="xs"
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
