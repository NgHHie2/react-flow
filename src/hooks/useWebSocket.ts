// src/hooks/useWebSocket.ts
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import {
  websocketService,
  NodePositionUpdate,
  FieldUpdate,
} from "../services/websocketService";

interface UseWebSocketProps {
  onNodePositionUpdate: (data: NodePositionUpdate) => void;
  onFieldUpdate: (data: FieldUpdate) => void;
}

export const useWebSocket = ({
  onNodePositionUpdate,
  onFieldUpdate,
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const toast = useToast();

  const handleWebSocketError = useCallback(
    (error: string) => {
      toast({
        title: "WebSocket Error",
        description: error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    [toast]
  );

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    toast({
      title: "Connected",
      description: "Real-time synchronization enabled",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Real-time synchronization disabled",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  useEffect(() => {
    websocketService.connect({
      onNodePositionUpdate,
      onFieldUpdate,
      onError: handleWebSocketError,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
    });

    return () => {
      websocketService.disconnect();
    };
  }, []); // Empty dependency array - handlers are stable

  const sendNodePositionUpdate = useCallback((update: NodePositionUpdate) => {
    if (websocketService.isConnected()) {
      websocketService.sendNodePositionUpdate(update);
    }
  }, []);

  const sendFieldUpdate = useCallback((update: FieldUpdate) => {
    if (websocketService.isConnected()) {
      websocketService.sendFieldUpdate(update);
    }
  }, []);

  return {
    isConnected,
    sendNodePositionUpdate,
    sendFieldUpdate,
  };
};
