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

  // Sort attributes by order
  const sortedAttributes = [...data.attributes].sort(
    (a, b) => a.attributeOrder - b.attributeOrder
  );

  return (
    <Box
      borderRadius={`${data.borderRadius || 8}px`}
      minWidth={`${data.width || 280}px`}
      maxWidth={`${data.width + 50 || 350}px`}
      bg={data.backgroundColor || "#f1f5f9"}
      border={`${data.borderWidth || 2}px solid ${
        data.borderColor || "#e2e8f0"
      }`}
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      _hover={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition="all 0.2s ease-in-out"
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
          />
        ))}
      </Box>

      {/* Model Footer */}
      <ModelFooter model={data} />
    </Box>
  );
}
