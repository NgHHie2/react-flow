// src/SchemaVisualizer/ModelNode.tsx - Heavily optimized version
import React, { memo, useMemo, useCallback } from "react";
import { Box } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import { Model, Attribute } from "./SchemaVisualizer.types";
import { ModelHeader } from "../components/ModelHeader";
import { ModelFooter } from "../components/ModelFooter";
import { FieldComponent } from "../components/FieldComponent";

interface ModelNodeData extends Model {
  getAllModels?: () => Model[];
  allModels?: Model[];
  onFieldUpdate?: (
    fieldId: number,
    fieldName: string,
    fieldType: string
  ) => void;
  onToggleKeyType?: (
    modelName: string,
    attributeId: number,
    keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
  ) => void;
  onAddAttribute?: (modelName: string) => void;
  onDeleteAttribute?: (modelName: string, attributeId: number) => void;
  onForeignKeyTargetSelect?: (
    attributeId: number,
    targetModelName: string,
    targetAttributeName: string,
    targetAttributeId: number
  ) => void;
  onForeignKeyDisconnect?: (attributeId: number) => void;
  onModelNameUpdate?: (oldName: string, newName: string) => void;
  onDeleteModel?: (modelName: string) => void;
  // Add update tracking fields
  lastUpdate?: number;
  lastFieldUpdate?: number;
  lastKeyUpdate?: number;
  lastNameUpdate?: number;
  lastConnectionUpdate?: number;
}

const ModelNodeComponent: React.FC<NodeProps<ModelNodeData>> = ({
  data,
  id,
}) => {
  // ✅ Memoize sorted attributes with stable sorting
  const sortedAttributes = useMemo(() => {
    if (!data.attributes || !Array.isArray(data.attributes)) return [];

    return [...data.attributes].sort((a, b) => {
      // Primary sort by order, secondary by name for stability
      const orderDiff = (a.attributeOrder || 0) - (b.attributeOrder || 0);
      return orderDiff !== 0 ? orderDiff : a.name.localeCompare(b.name);
    });
  }, [data.attributes]);

  // ✅ Memoize all models with better dependency tracking
  const allModels = useMemo(() => {
    if (data.getAllModels) {
      return data.getAllModels();
    }
    return data.allModels || [];
  }, [data.getAllModels, data.allModels, data.lastConnectionUpdate]);

  // ✅ Ultra-stable handlers with proper dependencies
  const handleFieldNameUpdate = useCallback(
    (fieldIndex: number, newName: string) => {
      const attribute = sortedAttributes[fieldIndex];
      if (!attribute?.id || !data.onFieldUpdate) return;

      // Only call if name actually changed
      if (attribute.name !== newName) {
        console.log(`🔧 Field name update: ${attribute.name} -> ${newName}`);
        data.onFieldUpdate(attribute.id, newName, attribute.dataType);
      }
    },
    [sortedAttributes, data.onFieldUpdate]
  );

  const handleFieldTypeUpdate = useCallback(
    (fieldIndex: number, newType: string) => {
      const attribute = sortedAttributes[fieldIndex];
      if (!attribute?.id || !data.onFieldUpdate) return;

      // Only call if type actually changed
      if (attribute.dataType !== newType) {
        console.log(
          `🔧 Field type update: ${attribute.dataType} -> ${newType}`
        );
        data.onFieldUpdate(attribute.id, attribute.name, newType);
      }
    },
    [sortedAttributes, data.onFieldUpdate]
  );

  const handleToggleKeyType = useCallback(
    (
      modelName: string,
      fieldIndex: number,
      keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
    ) => {
      const attribute = sortedAttributes[fieldIndex];
      if (!attribute?.id || !data.onToggleKeyType) return;

      // Check if this actually changes the key type
      const currentType = attribute.isPrimaryKey
        ? "PRIMARY"
        : attribute.isForeignKey
        ? "FOREIGN"
        : "NORMAL";

      if (currentType !== keyType) {
        console.log(`🔑 Key type toggle: ${currentType} -> ${keyType}`);
        data.onToggleKeyType(data.name, attribute.id, keyType);
      }
    },
    [sortedAttributes, data.onToggleKeyType, data.name]
  );

  const handleAddAttribute = useCallback(() => {
    if (data.onAddAttribute) {
      console.log(`➕ Adding attribute to ${data.name}`);
      data.onAddAttribute(data.name);
    }
  }, [data.onAddAttribute, data.name]);

  const handleDeleteAttribute = useCallback(
    (attributeId: number) => {
      if (data.onDeleteAttribute) {
        console.log(`➖ Deleting attribute ${attributeId} from ${data.name}`);
        data.onDeleteAttribute(data.name, attributeId);
      }
    },
    [data.onDeleteAttribute, data.name]
  );

  const handleForeignKeyTargetSelect = useCallback(
    (
      attributeId: number,
      targetModelName: string,
      targetAttributeName: string,
      targetAttributeId: number
    ) => {
      if (data.onForeignKeyTargetSelect) {
        console.log(
          `🔗 FK select: ${attributeId} -> ${targetModelName}.${targetAttributeName}`
        );
        data.onForeignKeyTargetSelect(
          attributeId,
          targetModelName,
          targetAttributeName,
          targetAttributeId
        );
      }
    },
    [data.onForeignKeyTargetSelect]
  );

  const handleForeignKeyDisconnect = useCallback(
    (attributeId: number) => {
      if (data.onForeignKeyDisconnect) {
        console.log(`🔓 FK disconnect: ${attributeId}`);
        data.onForeignKeyDisconnect(attributeId);
      }
    },
    [data.onForeignKeyDisconnect]
  );

  const handleModelNameUpdate = useCallback(
    (newName: string) => {
      console.log("🏷️ ModelNode - handleModelNameUpdate called:", {
        oldName: data.name,
        newName,
        hasHandler: !!data.onModelNameUpdate,
      });

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
        data.onModelNameUpdate(data.name, trimmedName);
      }
    },
    [data.onModelNameUpdate, data.name]
  );
  const handleDeleteModel = useCallback(() => {
    if (!data.onDeleteModel) return;

    // More thorough connection checking
    const hasOutgoingConnections = data.attributes?.some(
      (attr) => attr.connection
    );
    const hasIncomingConnections = allModels.some((model) =>
      model.attributes?.some(
        (attr) => attr.connection?.targetModelName === data.name
      )
    );

    if (hasOutgoingConnections || hasIncomingConnections) {
      console.warn(`❌ Cannot delete ${data.name}: has connections`);
      return;
    }

    console.log(`🗑️ Deleting model: ${data.name}`);
    console.log(data);
    data.onDeleteModel(data.name);
  }, [data.onDeleteModel, data.attributes, data.name, allModels]);

  // ✅ Smarter can delete logic
  const canDelete = useMemo(() => {
    if (!data.attributes) return false;

    // Can delete if:
    // 1. Only has 1 attribute (the default id field)
    // 2. No outgoing connections
    // 3. No incoming connections from other models
    const hasConnections = data.attributes.some((attr) => attr.connection);
    const isReferenced = allModels.some((model) =>
      model.attributes?.some(
        (attr) => attr.connection?.targetModelName === data.name
      )
    );

    return data.attributes.length <= 1 && !hasConnections && !isReferenced;
  }, [data.attributes, data.name, allModels]);

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
        canDelete={canDelete}
      />

      {/* Model Attributes/Fields */}
      <Box>
        {sortedAttributes.map((attribute, index) => (
          <FieldComponent
            key={attributeKeys[index]} // Use generated stable key
            attribute={attribute}
            modelName={data.name}
            fieldIndex={index}
            allModels={allModels}
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
      <ModelFooter model={data} onAddAttribute={handleAddAttribute} />
    </Box>
  );
};

// ✅ Enhanced memo with detailed comparison
const ModelNode = memo(ModelNodeComponent, (prevProps, nextProps) => {
  const prevData = prevProps.data;
  const nextData = nextProps.data;

  // Basic property changes
  if (
    prevData.name !== nextData.name ||
    prevData.attributes?.length !== nextData.attributes?.length ||
    prevData.id !== nextData.id
  ) {
    console.log(`🔄 Re-render ${prevData.name}: basic properties changed`);
    return false;
  }

  // Update tracking fields
  if (
    prevData.lastUpdate !== nextData.lastUpdate ||
    prevData.lastFieldUpdate !== nextData.lastFieldUpdate ||
    prevData.lastKeyUpdate !== nextData.lastKeyUpdate ||
    prevData.lastNameUpdate !== nextData.lastNameUpdate ||
    prevData.lastConnectionUpdate !== nextData.lastConnectionUpdate
  ) {
    console.log(`🔄 Re-render ${prevData.name}: update tracking changed`);
    return false;
  }

  // Deep attribute comparison (only if lengths match)
  if (prevData.attributes && nextData.attributes) {
    const attributesChanged = prevData.attributes.some((attr, index) => {
      const nextAttr = nextData.attributes?.[index];
      if (!nextAttr) return true;

      return (
        attr.id !== nextAttr.id ||
        attr.name !== nextAttr.name ||
        attr.dataType !== nextAttr.dataType ||
        attr.isPrimaryKey !== nextAttr.isPrimaryKey ||
        attr.isForeignKey !== nextAttr.isForeignKey ||
        JSON.stringify(attr.connection) !== JSON.stringify(nextAttr.connection)
      );
    });

    if (attributesChanged) {
      console.log(`🔄 Re-render ${prevData.name}: attributes changed`);
      return false;
    }
  }

  // If we get here, no meaningful changes detected
  console.log(`⏸️ Skip re-render ${prevData.name}: no changes`);
  return true; // Skip re-render
});

ModelNode.displayName = "ModelNode";

export default ModelNode;
