// src/components/ForeignKeyTargetSelector.tsx - Completely rewritten
import React, { useMemo } from "react";
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
import { Attribute, Model } from "../SchemaVisualizer/SchemaVisualizer.types";

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
  allModels: Model[];
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
  allModels,
  onTargetSelect,
  onDisconnect,
  inline = false,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ✅ Tính toán Primary Key options một cách đơn giản và trực tiếp
  const primaryKeyOptions: PrimaryKeyOption[] = useMemo(() => {
    const timestamp = Date.now();
    console.log(
      "🔄 [ForeignKeyTargetSelector] Computing PK options at",
      timestamp
    );
    console.log(
      "📦 [ForeignKeyTargetSelector] Received allModels:",
      allModels?.map((m) => ({
        id: m.id,
        name: m.name,
        attributeCount: m.attributes?.length,
      }))
    );

    if (!Array.isArray(allModels) || allModels.length === 0) {
      console.warn("⚠️ [ForeignKeyTargetSelector] No valid allModels provided");
      return [];
    }

    const options: PrimaryKeyOption[] = [];

    allModels.forEach((model) => {
      if (!model?.attributes || !Array.isArray(model.attributes)) {
        console.warn(`⚠️ [ForeignKeyTargetSelector] Invalid model:`, model);
        return;
      }

      model.attributes.forEach((attr) => {
        if (attr?.isPrimaryKey === true) {
          console.log(
            `✅ [ForeignKeyTargetSelector] Found PK: ${model.name}.${attr.name}`
          );
          options.push({
            modelId: model.id,
            modelName: model.name,
            attributeId: attr.id,
            attributeName: attr.name,
          });
        }
      });
    });

    console.log(
      "🎯 [ForeignKeyTargetSelector] Final PK options:",
      options.map((opt) => `${opt.modelName}.${opt.attributeName}`)
    );

    return options;
  }, [allModels]); // Chỉ depend vào allModels

  // ✅ Handlers đơn giản
  const handleTargetSelect = (option: PrimaryKeyOption) => {
    console.log(
      "🔗 [ForeignKeyTargetSelector] Selecting:",
      `${option.modelName}.${option.attributeName}`
    );
    onTargetSelect(option.modelId, option.attributeId);
    if (!inline) onClose();
  };

  const handleDisconnect = () => {
    console.log("🔓 [ForeignKeyTargetSelector] Disconnecting FK");
    onDisconnect();
    if (!inline) onClose();
  };

  // ✅ Hiển thị tên connection hiện tại
  const getCurrentTargetDisplay = () => {
    if (!currentConnection) return "Select target...";

    // Tìm model và attribute thực tế để hiển thị tên đúng
    const targetModel = allModels.find(
      (m) => m.id === currentConnection.targetModelId
    );
    const targetAttribute = targetModel?.attributes?.find(
      (a) => a.id === currentConnection.targetAttributeId
    );

    if (targetModel && targetAttribute) {
      return `${targetModel.name}.${targetAttribute.name}`;
    }

    // Fallback nếu không tìm thấy
    return `${currentConnection.targetModelId}.${currentConnection.targetAttributeId}`;
  };

  // ✅ Component logging
  console.log("🔄 [ForeignKeyTargetSelector] Render:", {
    currentModelId,
    currentAttributeId,
    allModelsCount: allModels?.length,
    allModelsNames: allModels?.map((m) => m.name),
    pkOptionsCount: primaryKeyOptions.length,
    currentConnection,
    inline,
  });

  // ✅ Inline mode
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
                _active={{
                  bg: "blue.500",
                  color: "white",
                }}
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

  // ✅ Popover mode
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
          _hover={{
            bg: "rgba(74, 144, 226, 0.1)",
            color: "blue.200",
          }}
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
