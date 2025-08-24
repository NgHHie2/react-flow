import { Node, Edge, Position, MarkerType } from "reactflow";
import { useState, useMemo } from "react";

export interface HandlePositions {
  sourceHandle: Position;
  targetHandle: Position;
  sourceHandleId: string;
  targetHandleId: string;
}

export const calculateOptimalHandlePositions = (
  sourceNode: Node,
  targetNode: Node,
  sourceFieldName: string,
  targetFieldName: string,
  previousSide?: "left" | "right"
): HandlePositions & { currentSide: "left" | "right" } => {
  // Tính toán vị trí các mép của node
  const sourceLeft = sourceNode.position.x;
  const sourceRight = sourceNode.position.x + (sourceNode.width || 280);
  const targetLeft = targetNode.position.x;
  const targetRight = targetNode.position.x + (targetNode.width || 280);

  // Mặc định ban đầu: cùng bên phải (chỉ khi lần đầu tiên)
  let sourceHandle = Position.Right;
  let targetHandle = Position.Right;
  let currentSide: "left" | "right" = previousSide || "right";

  // Trường hợp 1: Source nằm hoàn toàn bên trái target
  if (sourceRight < targetLeft) {
    sourceHandle = Position.Right;
    targetHandle = Position.Left;
    currentSide = "right";
  }
  // Trường hợp 2: Source nằm hoàn toàn bên phải target
  else if (sourceLeft > targetRight) {
    sourceHandle = Position.Left;
    targetHandle = Position.Right;
    currentSide = "left";
  }
  // Trường hợp 3: Các node chồng lên nhau - GIỮ NGUYÊN previousSide
  else {
    if (currentSide === "left") {
      sourceHandle = Position.Left;
      targetHandle = Position.Left;
    } else {
      sourceHandle = Position.Right;
      targetHandle = Position.Right;
    }
  }

  // Tạo handle IDs khớp với FieldComponent
  const getHandleId = (
    nodeId: string,
    fieldName: string,
    position: Position,
    type: "source" | "target"
  ) => {
    const positionStr =
      position === Position.Left
        ? "left"
        : position === Position.Right
        ? "right"
        : position === Position.Top
        ? "top"
        : "bottom";

    const baseId = `${nodeId}-${fieldName}-${positionStr}`;
    const finalId = type === "target" ? `${baseId}-target` : baseId;

    return finalId;
  };

  return {
    sourceHandle,
    targetHandle,
    sourceHandleId: getHandleId(
      sourceNode.id,
      sourceFieldName,
      sourceHandle,
      "source"
    ),
    targetHandleId: getHandleId(
      targetNode.id,
      targetFieldName,
      targetHandle,
      "target"
    ),
    currentSide,
  };
};

// Hook để tự động cập nhật edge handles với memory của previous side
export const useAutoHandlePositioning = (nodes: Node[], edges: Edge[]) => {
  // Load initial state từ localStorage
  const [connectionSides, setConnectionSides] = useState<
    Map<string, "left" | "right">
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("schema-handle-positions");
        if (saved) {
          const parsed = JSON.parse(saved);
          return new Map(Object.entries(parsed));
        }
      } catch (error) {
        console.warn(
          "Failed to load handle positions from localStorage:",
          error
        );
      }
    }
    return new Map();
  });

  return useMemo(() => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const newConnectionSides = new Map(connectionSides);

    const updatedEdges = edges.map((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) {
        return edge;
      }

      const connectionKey = `${edge.source}-${edge.target}-${
        edge.sourceHandle || "default"
      }`;
      const previousSide = connectionSides.get(connectionKey);

      // Extract field names
      const sourceFieldName = edge.sourceHandle?.split("-")[1] || "field";
      const targetFieldName = edge.targetHandle?.split("-")[1] || "field";

      const result = calculateOptimalHandlePositions(
        sourceNode,
        targetNode,
        sourceFieldName,
        targetFieldName,
        previousSide
      );

      // Debug log để xem previousSide có được sử dụng không
      if (previousSide) {
        console.log(
          `🔄 Using previousSide for ${connectionKey}:`,
          previousSide,
          "→",
          result.currentSide
        );
      }

      // Cập nhật current side cho lần tính toán tiếp theo
      newConnectionSides.set(connectionKey, result.currentSide);

      return {
        ...edge,
        sourceHandle: result.sourceHandleId,
        targetHandle: result.targetHandleId,
        currentSide: result.currentSide,
      };
    });

    // Save to localStorage và update state nếu có thay đổi
    if (!mapsAreEqual(connectionSides, newConnectionSides)) {
      setConnectionSides(newConnectionSides);

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          const toSave = Object.fromEntries(newConnectionSides);
          localStorage.setItem(
            "schema-handle-positions",
            JSON.stringify(toSave)
          );
        } catch (error) {
          console.warn(
            "Failed to save handle positions to localStorage:",
            error
          );
        }
      }
    }

    return updatedEdges;
  }, [nodes, edges, connectionSides]);
};

// Helper function để so sánh Map
const mapsAreEqual = (
  map1: Map<string, string>,
  map2: Map<string, string>
): boolean => {
  if (map1.size !== map2.size) return false;
  for (const [key, value] of map1) {
    if (map2.get(key) !== value) return false;
  }
  return true;
};

// Function để tạo ReactFlow Edge với handle positions
export const createReactFlowEdge = (
  connection: any,
  handlePositions: HandlePositions
): Edge => {
  return {
    id: `edge-${connection.id}`,
    source: connection.sourceModelId,
    target: connection.targetModelId,
    sourceHandle: handlePositions.sourceHandleId,
    targetHandle: handlePositions.targetHandleId,
    animated: true,
    style: {
      strokeWidth: "2px",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    type: "smoothstep",
  };
};
