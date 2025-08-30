// src/SchemaVisualizer/ModelNode.tsx - Optimized version
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
}

const ModelNodeComponent: React.FC<NodeProps<ModelNodeData>> = ({
  data,
  id,
}) => {
  // ✅ Memoize sorted attributes to prevent re-sorting
  const sortedAttributes = useMemo(() => {
    return [...data.attributes].sort(
      (a, b) => a.attributeOrder - b.attributeOrder
    );
  }, [data.attributes]);

  // ✅ Memoize all models to prevent re-calculation
  const allModels = useMemo(() => {
    if (data.getAllModels) {
      return data.getAllModels();
    }
    return data.allModels || [];
  }, [data.getAllModels, data.allModels]);

  // ✅ Stable handlers with useCallback
  const handleFieldNameUpdate = useCallback(
    (fieldIndex: number, newName: string) => {
      const attribute = sortedAttributes[fieldIndex];
      if (attribute.id && data.onFieldUpdate) {
        data.onFieldUpdate(attribute.id, newName, attribute.dataType);
      }
    },
    [sortedAttributes, data.onFieldUpdate]
  );

  const handleFieldTypeUpdate = useCallback(
    (fieldIndex: number, newType: string) => {
      const attribute = sortedAttributes[fieldIndex];
      if (attribute.id && data.onFieldUpdate) {
        data.onFieldUpdate(attribute.id, attribute.name, newType);
      }
    },
    [sortedAttributes, data.onFieldUpdate]
  );

  const handleToggleKeyType = useCallback(
    (fieldIndex: number, keyType: "NORMAL" | "PRIMARY" | "FOREIGN") => {
      const attribute = sortedAttributes[fieldIndex];
      if (data.onToggleKeyType) {
        data.onToggleKeyType(data.name, attribute.id, keyType);
      }
    },
    [sortedAttributes, data.onToggleKeyType, data.name]
  );

  const handleAddAttribute = useCallback(() => {
    if (data.onAddAttribute) {
      data.onAddAttribute(data.name);
    }
  }, [data.onAddAttribute, data.name]);

  const handleDeleteAttribute = useCallback(
    (attributeId: number) => {
      if (data.onDeleteAttribute) {
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
        data.onForeignKeyDisconnect(attributeId);
      }
    },
    [data.onForeignKeyDisconnect]
  );

  const handleModelNameUpdate = useCallback(
    (newName: string) => {
      if (data.onModelNameUpdate && newName !== data.name) {
        data.onModelNameUpdate(data.name, newName);
      }
    },
    [data.onModelNameUpdate, data.name]
  );

  const handleDeleteModel = useCallback(() => {
    if (!data.onDeleteModel) return;

    const hasConnections = data.attributes.some((attr) => attr.connection);
    const isReferenced = allModels.some((model) =>
      model.attributes.some(
        (attr) => attr.connection?.targetModelName === data.name
      )
    );

    if (hasConnections || isReferenced) {
      console.warn("Cannot delete table with connections");
      return;
    }

    data.onDeleteModel(data.name);
  }, [data.onDeleteModel, data.attributes, data.name, allModels]);

  // ✅ Memoize can delete condition
  const canDelete = useMemo(() => {
    return data.attributes.length === 1; // Only allow deletion if only has id field
  }, [data.attributes.length]);

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
            key={`${attribute.id}-${attribute.name}`} // ✅ Stable key
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

// ✅ Memoize the component but allow important updates
const ModelNode = memo(ModelNodeComponent, (prevProps, nextProps) => {
  const prevData = prevProps.data;
  const nextData = nextProps.data;

  // Always re-render if basic properties changed
  if (
    prevData.name !== nextData.name ||
    prevData.attributes.length !== nextData.attributes.length
  ) {
    return false;
  }

  // Check if any attribute changed in meaningful way
  const attributesChanged = prevData.attributes.some((attr, index) => {
    const nextAttr = nextData.attributes[index];
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

  // Only re-render if attributes actually changed
  return !attributesChanged;
});

export default ModelNode;
