// src/hooks/useDragHandlers.ts - Drag handling logic
import { useCallback, useRef, useEffect } from "react";
import { Node } from "reactflow";
import { createNodePositionUpdate } from "../utils/schemaUtils";

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  dragThreshold: number;
}

interface UseDragHandlersProps {
  sendNodePositionUpdate: any;
}

export const useDragHandlers = ({
  sendNodePositionUpdate,
}: UseDragHandlersProps) => {
  const dragStateRef = useRef<Map<string, DragState>>(new Map());
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
      return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
      );
    },
    []
  );

  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    console.log(
      "🎯 Drag START for node:",
      node.id,
      "at position:",
      node.position
    );

    const dragState: DragState = {
      isDragging: false,
      startPosition: { ...node.position },
      currentPosition: { ...node.position },
      dragThreshold: 5,
    };

    dragStateRef.current.set(node.id, dragState);
  }, []);

  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const dragState = dragStateRef.current.get(node.id);
      if (!dragState || !dragState.startPosition) return;

      const distance = calculateDistance(
        dragState.startPosition,
        node.position
      );
      dragState.currentPosition = { ...node.position };

      if (distance > dragState.dragThreshold) {
        dragState.isDragging = true;
      }

      dragStateRef.current.set(node.id, dragState);
    },
    [calculateDistance]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const dragState = dragStateRef.current.get(node.id);

      console.log("🛑 Drag STOP for node:", node.id);

      if (!dragState || !dragState.startPosition) {
        dragStateRef.current.delete(node.id);
        return;
      }

      const totalDistance = calculateDistance(
        dragState.startPosition,
        node.position
      );

      // Only send update if actually dragged
      if (dragState.isDragging && totalDistance > dragState.dragThreshold) {
        console.log("📤 Sending position update");

        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }

        dragTimeoutRef.current = setTimeout(() => {
          const update = createNodePositionUpdate(node);
          sendNodePositionUpdate(update);
        }, 300);
      }

      dragStateRef.current.delete(node.id);
    },
    [calculateDistance, sendNodePositionUpdate]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      dragStateRef.current.clear();
    };
  }, []);

  return {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  };
};
