// src/hooks/useDragHandlers.ts - Improved drag handling logic
import { useCallback, useRef, useEffect } from "react";
import { Node } from "reactflow";
import { createNodePositionUpdate } from "../utils/schemaUtils";

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  dragThreshold: number;
  lastUpdateTime: number;
}

interface UseDragHandlersProps {
  sendNodePositionUpdate: any;
}

export const useDragHandlers = ({
  sendNodePositionUpdate,
}: UseDragHandlersProps) => {
  const dragStateRef = useRef<Map<string, DragState>>(new Map());
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
      return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
      );
    },
    []
  );

  // FIX 1: Improved drag start with better state tracking
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
      dragThreshold: 3, // Reduced threshold for better responsiveness
      lastUpdateTime: Date.now(),
    };

    dragStateRef.current.set(node.id, dragState);

    // Clear any pending updates for this node
    pendingUpdatesRef.current.delete(node.id);
  }, []);

  // FIX 2: Throttled drag handling to prevent excessive updates
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const dragState = dragStateRef.current.get(node.id);
      if (!dragState || !dragState.startPosition) return;

      const now = Date.now();
      const distance = calculateDistance(
        dragState.startPosition,
        node.position
      );

      dragState.currentPosition = { ...node.position };

      // Mark as dragging if moved beyond threshold
      if (distance > dragState.dragThreshold) {
        dragState.isDragging = true;
      }

      // Throttle updates - only update every 50ms during drag
      if (now - dragState.lastUpdateTime > 50) {
        dragState.lastUpdateTime = now;
        pendingUpdatesRef.current.set(node.id, { ...node.position });
      }

      dragStateRef.current.set(node.id, dragState);
    },
    [calculateDistance]
  );

  // FIX 3: Improved drag stop with debounced WebSocket update
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const dragState = dragStateRef.current.get(node.id);

      console.log(
        "🛑 Drag STOP for node:",
        node.id,
        "at position:",
        node.position
      );

      if (!dragState || !dragState.startPosition) {
        dragStateRef.current.delete(node.id);
        return;
      }

      const totalDistance = calculateDistance(
        dragState.startPosition,
        node.position
      );

      // Only send update if actually dragged beyond threshold
      if (dragState.isDragging && totalDistance > dragState.dragThreshold) {
        console.log(`📤 Preparing to send position update for ${node.id}`);

        // Clear any existing timeout for this node
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }

        // Store the final position
        pendingUpdatesRef.current.set(node.id, { ...node.position });

        // Debounced update - wait 200ms to ensure drag is complete
        dragTimeoutRef.current = setTimeout(() => {
          const finalPosition = pendingUpdatesRef.current.get(node.id);
          if (finalPosition) {
            console.log(
              `📤 Sending position update for ${node.id}:`,
              finalPosition
            );

            // Create and send the update
            const update = createNodePositionUpdate({
              ...node,
              position: finalPosition,
            });

            sendNodePositionUpdate(update);

            // Clean up
            pendingUpdatesRef.current.delete(node.id);
          }
        }, 200);
      } else {
        console.log(`⏸️ Drag too small for ${node.id}, not sending update`);
      }

      // Clean up drag state
      dragStateRef.current.delete(node.id);
    },
    [calculateDistance, sendNodePositionUpdate]
  );

  // FIX 4: Better cleanup handling
  useEffect(() => {
    return () => {
      // Clean up all timeouts and states
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      dragStateRef.current.clear();
      pendingUpdatesRef.current.clear();
    };
  }, []);

  // FIX 5: Add utility function to force send pending updates (useful for cleanup)
  const flushPendingUpdates = useCallback(() => {
    console.log("🔄 Flushing pending drag updates");

    pendingUpdatesRef.current.forEach((position, nodeId) => {
      const update = createNodePositionUpdate({
        id: nodeId,
        position: position,
        data: {}, // Minimal data for update
      } as Node);

      sendNodePositionUpdate(update);
    });

    pendingUpdatesRef.current.clear();
  }, [sendNodePositionUpdate]);

  return {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    flushPendingUpdates, // Export for potential use in cleanup
  };
};
