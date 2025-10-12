// src/SchemaVisualizer/ModelNode.tsx - Heavily optimized version
import React, { memo, useMemo, useCallback } from "react";
import { Box } from "@chakra-ui/react";
import { NodeProps, Node as ReactFlowNode } from "reactflow";
import { Model, Attribute } from "./SchemaVisualizer.types";
import { ModelHeader } from "../components/ModelHeader";
import { ModelFooter } from "../components/ModelFooter";
import { FieldComponent } from "../components/FieldComponent";

interface ModelNodeData extends Model {
  onFieldNameUpdate?: (fieldId: string, fieldName: string) => void;
  onFieldTypeUpdate?: (fieldId: string, fieldType: string) => void;
  onToggleKeyType?: (
    modelId: string,
    attributeId: string,
    keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
  ) => void;
  onAddAttribute?: (modelId: string) => void;
  onDeleteAttribute?: (modelId: string, attributeId: string) => void;
  onForeignKeyTargetSelect?: (
    attributeId: string,
    targetModelId: string,
    targetAttributeId: string
  ) => void;
  onForeignKeyDisconnect?: (attributeId: string) => void;
  onModelNameUpdate?: (
    modelId: string,
    oldName: string,
    newName: string
  ) => void;
  onDeleteModel?: (modelId: string) => void;
  // Add update tracking fields
  lastUpdate?: number;
  lastFieldUpdate?: number;
  lastKeyUpdate?: number;
  lastNameUpdate?: number;
  lastConnectionUpdate?: number;
}

export const ModelNode: React.FC<NodeProps<ModelNodeData>> = ({ data, id }) => {
  // ✅ Memoize sorted attributes with stable sorting
  const sortedAttributes = useMemo(() => {
    if (!data.attributes || !Array.isArray(data.attributes)) return [];

    // ✅ Không sort, giữ nguyên thứ tự từ array
    return data.attributes;
  }, [data.attributes]);

  // ✅ Ultra-stable handlers with proper dependencies
  const handleFieldNameUpdate = useCallback(
    (fieldIndex: number, newName: string) => {
      const attribute = sortedAttributes[fieldIndex];
      if (!attribute?.id || !data.onFieldNameUpdate) return;

      // Only call if name actually changed
      if (attribute.name !== newName) {
        console.log(`🔧 Field name update: ${attribute.name} -> ${newName}`);
        data.onFieldNameUpdate(attribute.id, newName);
      }
    },
    [sortedAttributes, data.onFieldNameUpdate]
  );

  const handleFieldTypeUpdate = useCallback(
    (fieldIndex: number, newType: string) => {
      const attribute = sortedAttributes[fieldIndex];
      if (!attribute?.id || !data.onFieldTypeUpdate) return;

      // Only call if type actually changed
      if (attribute.dataType !== newType) {
        console.log(
          `🔧 Field type update: ${attribute.dataType} -> ${newType}`
        );
        data.onFieldTypeUpdate(attribute.id, newType);
      }
    },
    [sortedAttributes, data.onFieldTypeUpdate]
  );

  // src/SchemaVisualizer/ModelNode.tsx - Fixed handleToggleKeyType
  // Replace the handleToggleKeyType function in ModelNode.tsx with this:

  const handleToggleKeyType = useCallback(
    (
      modelId: string,
      attributeId: string, // ✅ FIXED: Now accepts attributeId instead of fieldIndex
      keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
    ) => {
      // ✅ Find attribute by ID instead of index
      const attribute = sortedAttributes.find(
        (attr) => attr.id === attributeId
      );

      if (!attribute || !data.onToggleKeyType) {
        console.warn("❌ Attribute not found or handler missing:", {
          attributeId,
          hasHandler: !!data.onToggleKeyType,
        });
        return;
      }

      // Check if this actually changes the key type
      const currentType = attribute.isPrimaryKey
        ? "PRIMARY"
        : attribute.isForeignKey
        ? "FOREIGN"
        : "NORMAL";

      if (currentType !== keyType) {
        console.log(`🔑 Key type toggle: ${currentType} -> ${keyType}`, {
          modelId: data.id,
          attributeId: attribute.id,
          attributeName: attribute.name,
        });
        data.onToggleKeyType(data.id, attribute.id, keyType);
      }
    },
    [sortedAttributes, data.onToggleKeyType, data.id]
  );

  const handleAddAttribute = useCallback((modelId: string) => {
    if (data.onAddAttribute) {
      data.onAddAttribute(modelId);
    }
  }, []);

  const handleDeleteAttribute = useCallback((attributeId: string) => {
    if (data.onDeleteAttribute) {
      console.log(`➖ Deleting attribute ${attributeId} from ${data.name}`);
      data.onDeleteAttribute(data.id, attributeId);
    }
  }, []);

  const handleForeignKeyTargetSelect = useCallback(
    (attributeId: string, targetModelId: string, targetAttributeId: string) => {
      if (data.onForeignKeyTargetSelect) {
        console.log(
          `🔗 FK select: ${attributeId} -> ${targetModelId}.${targetAttributeId}`
        );
        data.onForeignKeyTargetSelect(
          attributeId,
          targetModelId,
          targetAttributeId
        );
      }
    },
    [data.onForeignKeyTargetSelect]
  );

  const handleForeignKeyDisconnect = useCallback(
    (attributeId: string) => {
      if (data.onForeignKeyDisconnect) {
        console.log(`🔓 FK disconnect: ${attributeId}`);
        data.onForeignKeyDisconnect(attributeId);
      }
    },
    [data.onForeignKeyDisconnect]
  );

  const handleModelNameUpdate = useCallback(
    (newName: string) => {
      if (!data.onModelNameUpdate || !newName.trim()) {
        console.warn("⚠️ Model name update failed:", {
          hasHandler: !!data.onModelNameUpdate,
          newName,
          trimmed: newName.trim(),
        });
        return;
      }

      const trimmedName = newName.trim();
      if (trimmedName !== data.name) {
        console.log(`📝 Model name update: ${data.name} -> ${trimmedName}`);
        data.onModelNameUpdate(data.id, data.name, trimmedName);
      }
    },
    [data.onModelNameUpdate, data.name]
  );
  const handleDeleteModel = useCallback(() => {
    if (!data.onDeleteModel) return;

    data.onDeleteModel(data.id);
  }, [data.onDeleteModel, data.attributes, data.name]);

  // ✅ Generate unique keys for attributes to prevent re-rendering issues
  const attributeKeys = useMemo(() => {
    return sortedAttributes.map(
      (attr, index) =>
        `${attr.id}-${attr.name}-${attr.dataType}-${attr.isPrimaryKey}-${attr.isForeignKey}-${index}`
    );
  }, [sortedAttributes]);

  return (
    <Box
      borderRadius="8px"
      width="280px"
      minWidth="280px"
      maxWidth="280px"
      bg="#f1f5f9"
      border="2px solid #e2e8f0"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      _hover={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition="all 0.2s ease-in-out"
      overflow="visible"
    >
      {/* Model Header */}
      <ModelHeader
        model={data}
        onModelNameUpdate={handleModelNameUpdate}
        onDeleteModel={handleDeleteModel}
        canDelete={true}
      />

      {/* Model Attributes/Fields */}
      <Box>
        {sortedAttributes.map((attribute, index) => (
          <FieldComponent
            key={attributeKeys[index]} // Use generated stable key
            attribute={attribute}
            model={data}
            fieldIndex={index}
            onFieldNameUpdate={handleFieldNameUpdate}
            onFieldTypeUpdate={handleFieldTypeUpdate}
            onToggleKeyType={handleToggleKeyType}
            onDeleteAttribute={handleDeleteAttribute}
            onForeignKeyTargetSelect={handleForeignKeyTargetSelect}
            onForeignKeyDisconnect={handleForeignKeyDisconnect}
          />
        ))}
      </Box>

      {/* Model Footer */}
      <ModelFooter
        model={data}
        onAddAttribute={() => handleAddAttribute(data.id)}
      />
    </Box>
  );
};

// ✅ Enhanced memo with detailed comparison
// const ModelNode = memo(ModelNodeComponent, (prevProps, nextProps) => {
//   const prevData = prevProps.data;
//   const nextData = nextProps.data;

//   // Basic property changes
//   if (
//     prevData.name !== nextData.name ||
//     prevData.attributes?.length !== nextData.attributes?.length ||
//     prevData.id !== nextData.id
//   ) {
//     console.log(`🔄 Re-render ${prevData.name}: basic properties changed`);
//     return false;
//   }

//   // Update tracking fields
//   if (
//     prevData.lastUpdate !== nextData.lastUpdate ||
//     prevData.lastFieldUpdate !== nextData.lastFieldUpdate ||
//     prevData.lastKeyUpdate !== nextData.lastKeyUpdate ||
//     prevData.lastNameUpdate !== nextData.lastNameUpdate ||
//     prevData.lastConnectionUpdate !== nextData.lastConnectionUpdate
//   ) {
//     console.log(`🔄 Re-render ${prevData.name}: update tracking changed`);
//     return false;
//   }

//   // Deep attribute comparison (only if lengths match)
//   if (prevData.attributes && nextData.attributes) {
//     const attributesChanged = prevData.attributes.some((attr, index) => {
//       const nextAttr = nextData.attributes?.[index];
//       if (!nextAttr) return true;

//       return (
//         attr.id !== nextAttr.id ||
//         attr.name !== nextAttr.name ||
//         attr.dataType !== nextAttr.dataType ||
//         attr.isPrimaryKey !== nextAttr.isPrimaryKey ||
//         attr.isForeignKey !== nextAttr.isForeignKey ||
//         JSON.stringify(attr.connection) !== JSON.stringify(nextAttr.connection)
//       );
//     });

//     if (attributesChanged) {
//       console.log(`🔄 Re-render ${prevData.name}: attributes changed`);
//       return false;
//     }
//   }

//   // If we get here, no meaningful changes detected
//   console.log(`⏸️ Skip re-render ${prevData.name}: no changes`);
//   return true; // Skip re-render
// });

// ModelNode.displayName = "ModelNode";
