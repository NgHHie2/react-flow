// src/hooks/useWebSocketListener.ts
import { useEffect } from "react";
import { websocketService } from "../services/websocketService";
import { MessageHandler } from "../types/websocket.types";
import { useWebSocketContext } from "../contexts/WebSocketContext";

interface UseWebSocketListenerProps {
  handlers: MessageHandler;
  enabled?: boolean;
}

/**
 * Hook để lắng nghe WebSocket messages
 * Được sử dụng trong SchemaVisualizer component
 */
export const useWebSocketListener = ({
  handlers,
  enabled = true,
}: UseWebSocketListenerProps) => {
  const { isConnected, setIsConnected, setSessionId } = useWebSocketContext();

  useEffect(() => {
    if (!enabled) return;

    console.log("🎧 Setting up WebSocket listener...");

    // Thêm handlers cho connection state
    const enhancedHandlers: MessageHandler = {
      ...handlers,
      onConnect: () => {
        const sessionId = websocketService.getSessionId();
        console.log("✅ WebSocket connected, sessionId:", sessionId);
        setIsConnected(true);
        setSessionId(sessionId);
        handlers.onConnect?.();
      },
      onDisconnect: () => {
        console.log("❌ WebSocket disconnected");
        setIsConnected(false);
        setSessionId(null);
        handlers.onDisconnect?.();
      },
      onError: (error: string) => {
        console.error("💥 WebSocket error:", error);
        handlers.onError?.(error);
      },
    };

    // Kết nối với handlers
    websocketService.connect(enhancedHandlers);

    // Cleanup khi unmount
    return () => {
      console.log("🧹 Cleaning up WebSocket listener");
      websocketService.disconnect();
    };
  }, [enabled, handlers, setIsConnected, setSessionId]);

  return {
    isConnected,
  };
};
