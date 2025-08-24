// src/SchemaVisualizer/ModelNode.tsx
import React from "react";
import { Box } from "@chakra-ui/react";
import { NodeProps } from "reactflow";
import { Model, Attribute } from "./SchemaVisualizer.types";
import { ModelHeader } from "../components/ModelHeader";
import { ModelFooter } from "../components/ModelFooter";
import { FieldComponent } from "../components/FieldComponent";

interface ModelNodeData extends Model {
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
}

export default function ModelNode({ data, id }: NodeProps<ModelNodeData>) {
  const handleFieldNameUpdate = (fieldIndex: number, newName: string) => {
    const attribute = data.attributes[fieldIndex];
    if (attribute.id && data.onFieldUpdate) {
      data.onFieldUpdate(attribute.id, newName, attribute.dataType);
    }
  };

  const handleFieldTypeUpdate = (fieldIndex: number, newType: string) => {
    const attribute = data.attributes[fieldIndex];
    if (attribute.id && data.onFieldUpdate) {
      data.onFieldUpdate(attribute.id, attribute.name, newType);
    }
  };

  const handleToggleKeyType = (
    fieldIndex: number,
    keyType: "NORMAL" | "PRIMARY" | "FOREIGN"
  ) => {
    const attribute = data.attributes[fieldIndex];
    if (data.onToggleKeyType) {
      data.onToggleKeyType(data.name, attribute.id, keyType);
    }
  };

  const handleAddAttribute = () => {
    if (data.onAddAttribute) {
      data.onAddAttribute(data.name);
    }
  };

  const handleDeleteAttribute = (attributeId: number) => {
    if (data.onDeleteAttribute) {
      data.onDeleteAttribute(data.name, attributeId);
    }
  };

  // Sort attributes by order
  const sortedAttributes = [...data.attributes].sort(
    (a, b) => a.attributeOrder - b.attributeOrder
  );

  return (
    <Box
      borderRadius="8px"
      width="280px" // Fixed width
      minWidth="280px"
      maxWidth="280px"
      bg={"#f1f5f9"}
      border={"2px solid #e2e8f0"}
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      _hover={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition="all 0.2s ease-in-out"
      overflow="visible"
    >
      {/* Model Header */}
      <ModelHeader model={data} />

      {/* Model Attributes/Fields */}
      <Box>
        {sortedAttributes.map((attribute, index) => (
          <FieldComponent
            key={`${attribute.id}-${attribute.name}-${index}`}
            attribute={attribute}
            modelName={data.name}
            fieldIndex={index}
            onFieldNameUpdate={handleFieldNameUpdate}
            onFieldTypeUpdate={handleFieldTypeUpdate}
            onToggleKeyType={handleToggleKeyType}
            onDeleteAttribute={handleDeleteAttribute}
          />
        ))}
      </Box>

      {/* Model Footer */}
      <ModelFooter model={data} onAddAttribute={handleAddAttribute} />
    </Box>
  );
}
