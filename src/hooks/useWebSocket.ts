// src/hooks/useWebSocket.ts - Updated with new handlers
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import {
  websocketService,
  NodePositionUpdate,
  FieldUpdate,
  TogglePrimaryKeyUpdate,
  ToggleForeignKeyUpdate,
  AddAttributeUpdate,
  DeleteAttributeUpdate,
} from "../services/websocketService";

interface UseWebSocketProps {
  onNodePositionUpdate: (data: NodePositionUpdate) => void;
  onFieldUpdate: (data: FieldUpdate) => void;
  onTogglePrimaryKey: (data: TogglePrimaryKeyUpdate) => void;
  onToggleForeignKey: (data: ToggleForeignKeyUpdate) => void;
  onAddAttribute: (data: AddAttributeUpdate) => void;
  onDeleteAttribute: (data: DeleteAttributeUpdate) => void;
}

export const useWebSocket = ({
  onNodePositionUpdate,
  onFieldUpdate,
  onTogglePrimaryKey,
  onToggleForeignKey,
  onAddAttribute,
  onDeleteAttribute,
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
      onTogglePrimaryKey,
      onToggleForeignKey,
      onAddAttribute,
      onDeleteAttribute,
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

  const sendTogglePrimaryKey = useCallback((update: TogglePrimaryKeyUpdate) => {
    if (websocketService.isConnected()) {
      websocketService.sendTogglePrimaryKey(update);
    }
  }, []);

  const sendToggleForeignKey = useCallback((update: ToggleForeignKeyUpdate) => {
    if (websocketService.isConnected()) {
      websocketService.sendToggleForeignKey(update);
    }
  }, []);

  const sendAddAttribute = useCallback((update: AddAttributeUpdate) => {
    if (websocketService.isConnected()) {
      websocketService.sendAddAttribute(update);
    }
  }, []);

  const sendDeleteAttribute = useCallback((update: DeleteAttributeUpdate) => {
    if (websocketService.isConnected()) {
      websocketService.sendDeleteAttribute(update);
    }
  }, []);

  return {
    isConnected,
    sendNodePositionUpdate,
    sendFieldUpdate,
    sendTogglePrimaryKey,
    sendToggleForeignKey,
    sendAddAttribute,
    sendDeleteAttribute,
  };
};
