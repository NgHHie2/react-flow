import { Box, Flex } from "@chakra-ui/react";
import React from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { Model } from "./SchemaVisualizer.types";

export default function ModelNode({ data }: NodeProps<Model>) {
  return (
    <Box borderRadius="8px" minWidth="250px">
      {data.isChild && (
        <Handle id={data.name} position={Position.Top} type="target" />
      )}
      <Box p={1} textAlign="center" borderRadius="8px 8px 0 0" bg="#3d5787">
        <Box fontWeight={"bold"} color="white">
          <pre>{data.name}</pre>
        </Box>
      </Box>
      {data.fields.map(({ type, name, hasConnections }, index) => (
        <Flex
          key={name}
          _even={{ bg: "#282828" }}
          _odd={{ bg: "#232323" }}
          justifyContent={"space-between"}
          p={1}
          color="white"
        >
          <Box>
            <pre>{name}</pre>
          </Box>
          <Box>
            <pre>{type}</pre>
          </Box>
          {hasConnections && (
            <Handle
              position={Position.Right}
              id={`${data.name}-${name}`}
              type="source"
              style={{ top: 32 + 16 + 32 * index }}
            />
          )}
        </Flex>
      ))}
    </Box>
  );
}
