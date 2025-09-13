// src/components/ForeignKeyTargetSelector.tsx - Complete fixed version
import React, { useState, useEffect, useMemo } from "react";
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
  attributeId: string;
}

interface ForeignKeyTargetSelectorProps {
  currentModelName: string;
  currentAttributeId: string;
  currentConnection?: {
    targetModelName: string;
    targetAttributeName: string;
  };
  allModels: Model[];
  onTargetSelect: (
    targetModelName: string,
    targetAttributeName: string,
    targetAttributeId: string
  ) => void;
  onDisconnect: () => void;
  inline?: boolean;
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
  inline = false,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [primaryKeyOptions, setPrimaryKeyOptions] = useState<
    PrimaryKeyOption[]
  >([]);

  // Tạo key duy nhất từ PK data để detect thay đổi
  const pkDataKey: string = useMemo(() => {
    if (!allModels) return "no-models";

    const pkData = allModels
      .map(
        (model) =>
          model.attributes
            ?.filter((attr: any) => attr.isPrimaryKey)
            ?.map((attr: any) => `${model.name}.${attr.name}.${attr.id}`)
            ?.join("|") || ""
      )
      .filter(Boolean)
      .join("::");

    console.log("🔑 PK Data Key:", pkData);
    return pkData;
  }, [allModels]);

  // Collect all primary keys from all models
  useEffect(() => {
    console.log("🔍 ForeignKeyTargetSelector - DEBUGGING allModels:", {
      allModels,
      isArray: Array.isArray(allModels),
      length: allModels?.length,
      firstModel: allModels?.[0],
    });

    const options: PrimaryKeyOption[] = [];

    if (!allModels || !Array.isArray(allModels)) {
      console.warn(
        "ForeignKeyTargetSelector - allModels not available:",
        allModels
      );
      setPrimaryKeyOptions([]);
      return;
    }

    console.log(
      "🔍 ForeignKeyTargetSelector - Recalculating PKs, key:",
      pkDataKey
    );

    allModels.forEach((model, modelIndex) => {
      console.log(`🔍 Model ${modelIndex}:`, {
        model,
        hasName: !!model?.name,
        hasAttributes: !!model?.attributes,
        attributesLength: model?.attributes?.length,
        isAttributesArray: Array.isArray(model?.attributes),
      });

      if (
        !model ||
        !model.name ||
        !model.attributes ||
        !Array.isArray(model.attributes)
      ) {
        console.warn("🔍 Invalid model structure:", model);
        return;
      }

      console.log(
        `🔍 Processing model: ${model.name} with ${model.attributes.length} attributes`
      );

      model.attributes.forEach((attr: any, index: number) => {
        console.log(`  🔍 Attribute ${index}:`, {
          attr,
          name: attr?.name,
          isPrimaryKey: attr?.isPrimaryKey,
          id: attr?.id,
        });

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
  }, [pkDataKey, allModels]); // Depend on pkDataKey and allModels

  const handleTargetSelect = (option: PrimaryKeyOption) => {
    console.log("🔗 Selecting FK target:", option);
    onTargetSelect(option.modelName, option.attributeName, option.attributeId);
  };

  const handleDisconnect = () => {
    console.log("🔓 Disconnecting FK");
    onDisconnect();
  };

  const getCurrentTargetText = () => {
    if (currentConnection) {
      return `${currentConnection.targetModelName}.${currentConnection.targetAttributeName}`;
    }
    return "Select target...";
  };

  if (inline) {
    // Inline mode - không dùng Popover, render trực tiếp
    return (
      <VStack spacing={1} align="stretch">
        <Text fontWeight="bold" color="gray.200" fontSize="xs">
          Select Primary Key Target ({primaryKeyOptions.length}):
        </Text>

        <Divider borderColor="gray.600" />

        {primaryKeyOptions.length === 0 ? (
          <Text color="gray.400" fontSize="xs">
            No primary keys available
          </Text>
        ) : (
          <VStack
            spacing={1}
            align="stretch"
            maxHeight="200px"
            overflowY="auto"
          >
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
                _active={{
                  bg: "rgba(74, 144, 226, 0.2)", // Thay đổi này - từ mặc định sang màu xanh nhạt
                  color: "blue.200", // Thêm dòng này
                  borderColor: "blue.400", // Thêm dòng này
                }}
              >
                <Text noOfLines={1}>
                  🔑 {option.modelName}.{option.attributeName}
                </Text>
              </Button>
            ))}
          </VStack>
        )}

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
              Select Primary Key Target ({primaryKeyOptions.length}):
            </Text>

            <Divider borderColor="gray.600" />

            {primaryKeyOptions.length === 0 ? (
              <Text color="gray.400" fontSize="xs">
                No primary keys available
              </Text>
            ) : (
              primaryKeyOptions.map((option) => (
                <Button
                  key={`${option.modelName}-${option.attributeId}`}
                  size="xs"
                  variant="ghost"
                  height="24px"
                  justifyContent="flex-start"
                  fontSize="xs"
                  color="white"
                  _hover={{ bg: "gray.600" }}
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
              ))
            )}

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
