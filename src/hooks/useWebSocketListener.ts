// src/hooks/useWebSocketListener.ts
import { useEffect, useRef } from "react";
import { websocketService } from "../services/websocketService";
import { MessageHandler } from "../types/websocket.types";
import { useWebSocketContext } from "../contexts/WebSocketContext";
import { useNavigate } from "react-router-dom";

interface UseWebSocketListenerProps {
  handlers: MessageHandler;
  enabled?: boolean;
  diagramId: string;
}

export const useWebSocketListener = ({
  handlers,
  enabled = true,
  diagramId,
}: UseWebSocketListenerProps) => {
  const { isConnected, setIsConnected, setSessionId } = useWebSocketContext();
  const navigate = useNavigate();
  const handlersRef = useRef<MessageHandler>(handlers);

  // Update ref when handlers change, but don't trigger effect
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;

    console.log("🎧 Setting up WebSocket listener...");

    // Use stable enhanced handlers
    const enhancedHandlers: MessageHandler = {
      onConnect: () => {
        const sessionId = websocketService.getSessionId();
        console.log("✅ WebSocket connected, sessionId:", sessionId);
        setIsConnected(true);
        setSessionId(sessionId);
        handlersRef.current.onConnect?.();
      },
      onDisconnect: () => {
        console.log("❌ WebSocket disconnected");
        setIsConnected(false);
        setSessionId(null);
        handlersRef.current.onDisconnect?.();
      },
      onError: (error: string) => {
        console.error("💥 WebSocket error:", error);

        // ⭐ Handle diagram not found error
        if (
          error.includes("DIAGRAM_NOT_FOUND") ||
          error.includes("does not exist") ||
          error.includes("Không tìm thấy diagram")
        ) {
          console.error(
            `❌ Diagram ${diagramId} not found, redirecting to home...`
          );

          // Show error toast/alert
          alert(
            `Diagram ${diagramId} không tồn tại hoặc bạn không có quyền truy cập`
          );

          // Redirect to diagram 1 or home
          navigate("/", { replace: true });
        }

        handlersRef.current.onError?.(error);
      },
      // ✅ Pass through other handlers using ref
      onNodePositionUpdate: (data) =>
        handlersRef.current.onNodePositionUpdate?.(data),
      onFieldNameUpdate: (data) =>
        handlersRef.current.onFieldNameUpdate?.(data),
      onFieldTypeUpdate: (data) =>
        handlersRef.current.onFieldTypeUpdate?.(data),
      onToggleKeyType: (data) => handlersRef.current.onToggleKeyType?.(data),
      onAddAttribute: (data) => handlersRef.current.onAddAttribute?.(data),
      onDeleteAttribute: (data) =>
        handlersRef.current.onDeleteAttribute?.(data),
      onForeignKeyConnect: (data) =>
        handlersRef.current.onForeignKeyConnect?.(data),
      onForeignKeyDisconnect: (data) =>
        handlersRef.current.onForeignKeyDisconnect?.(data),
      onAddModel: (data) => handlersRef.current.onAddModel?.(data),
      onUpdateModelName: (data) =>
        handlersRef.current.onUpdateModelName?.(data),
      onDeleteModel: (data) => handlersRef.current.onDeleteModel?.(data),
    };

    // Connect with stable handlers
    websocketService.connect(enhancedHandlers, diagramId);

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up WebSocket listener");
      websocketService.disconnect();
    };
  }, [enabled, diagramId, setIsConnected, setSessionId]); // ✅ Remove 'handlers' from deps

  useEffect(() => {
    if (isConnected && diagramId) {
      const currentDiagramId = websocketService.getDiagramId();
      if (currentDiagramId && currentDiagramId !== diagramId) {
        console.log(`🔄 Switching to diagram ${diagramId}`);
        websocketService.switchDiagram(diagramId);
      }
    }
  }, [diagramId, isConnected]);

  return {
    isConnected,
    currentDiagramId: diagramId,
  };
};
