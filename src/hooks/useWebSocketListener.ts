// src/hooks/useWebSocketListener.ts
import { useEffect, useRef } from "react";
import { websocketService } from "../services/websocketService";
import { MessageHandler } from "../types/websocket.types";
import { useWebSocketContext } from "../contexts/WebSocketContext";

interface UseWebSocketListenerProps {
  handlers: MessageHandler;
  enabled?: boolean;
}

export const useWebSocketListener = ({
  handlers,
  enabled = true,
}: UseWebSocketListenerProps) => {
  const { isConnected, setIsConnected, setSessionId } = useWebSocketContext();

  // ✅ FIX: Store handlers in ref to prevent dependency changes
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
    websocketService.connect(enhancedHandlers);

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up WebSocket listener");
      websocketService.disconnect();
    };
  }, [enabled, setIsConnected, setSessionId]); // ✅ Remove 'handlers' from deps

  return {
    isConnected,
  };
};
