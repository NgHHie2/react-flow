// src/hooks/useWebSocket.ts - Updated with FK handlers
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { websocketService } from "../services/websocketService";
import {
  NodePositionUpdate,
  FieldUpdate,
  TogglePrimaryKeyUpdate,
  ToggleForeignKeyUpdate,
  AddAttributeUpdate,
  DeleteAttributeUpdate,
  ForeignKeyConnectionUpdate,
  ForeignKeyDisconnectUpdate,
} from "../types/websocket.types";

interface UseWebSocketProps {
  onNodePositionUpdate: (data: NodePositionUpdate) => void;
  onFieldUpdate: (data: FieldUpdate) => void;
  onTogglePrimaryKey: (data: TogglePrimaryKeyUpdate) => void;
  onToggleForeignKey: (data: ToggleForeignKeyUpdate) => void;
  onAddAttribute: (data: AddAttributeUpdate) => void;
  onDeleteAttribute: (data: DeleteAttributeUpdate) => void;
  onForeignKeyConnect: (data: ForeignKeyConnectionUpdate) => void;
  onForeignKeyDisconnect: (data: ForeignKeyDisconnectUpdate) => void;
}

export const useWebSocket = ({
  onNodePositionUpdate,
  onFieldUpdate,
  onTogglePrimaryKey,
  onToggleForeignKey,
  onAddAttribute,
  onDeleteAttribute,
  onForeignKeyConnect,
  onForeignKeyDisconnect,
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
      onNodePositionUpdate: (data) => {
        console.log("📍 Received position update from other client:", data);
        onNodePositionUpdate(data);
      },
      onFieldUpdate: (data) => {
        console.log("✏️ Received field update from other client:", data);
        onFieldUpdate(data);
      },
      onTogglePrimaryKey: (data) => {
        console.log("🔑 Received primary key toggle from other client:", data);
        onTogglePrimaryKey(data);
      },
      onToggleForeignKey: (data) => {
        console.log("🔗 Received foreign key toggle from other client:", data);
        onToggleForeignKey(data);
      },
      onAddAttribute: (data) => {
        console.log("➕ Received add attribute from other client:", data);
        onAddAttribute(data);
      },
      onDeleteAttribute: (data) => {
        console.log("➖ Received delete attribute from other client:", data);
        onDeleteAttribute(data);
      },
      onForeignKeyConnect: (data) => {
        console.log("🔗 Received FK connect from other client:", data);
        onForeignKeyConnect(data);
      },
      onForeignKeyDisconnect: (data) => {
        console.log("🔓 Received FK disconnect from other client:", data);
        onForeignKeyDisconnect(data);
      },
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
      console.log(
        "📤 Sending position update (will be filtered for this client):",
        update
      );
      websocketService.sendNodePositionUpdate(update);
    }
  }, []);

  const sendFieldUpdate = useCallback((update: FieldUpdate) => {
    if (websocketService.isConnected()) {
      console.log(
        "📤 Sending field update (will be filtered for this client):",
        update
      );
      websocketService.sendFieldUpdate(update);
    }
  }, []);

  const sendTogglePrimaryKey = useCallback((update: TogglePrimaryKeyUpdate) => {
    if (websocketService.isConnected()) {
      console.log(
        "📤 Sending toggle primary key (will be filtered for this client):",
        update
      );
      websocketService.sendTogglePrimaryKey(update);
    }
  }, []);

  const sendToggleForeignKey = useCallback((update: ToggleForeignKeyUpdate) => {
    if (websocketService.isConnected()) {
      console.log(
        "📤 Sending toggle foreign key (will be filtered for this client):",
        update
      );
      websocketService.sendToggleForeignKey(update);
    }
  }, []);

  const sendAddAttribute = useCallback((update: AddAttributeUpdate) => {
    if (websocketService.isConnected()) {
      console.log(
        "📤 Sending add attribute (will be filtered for this client):",
        update
      );
      websocketService.sendAddAttribute(update);
    }
  }, []);

  const sendDeleteAttribute = useCallback((update: DeleteAttributeUpdate) => {
    if (websocketService.isConnected()) {
      console.log(
        "📤 Sending delete attribute (will be filtered for this client):",
        update
      );
      websocketService.sendDeleteAttribute(update);
    }
  }, []);

  const sendForeignKeyConnect = useCallback(
    (update: ForeignKeyConnectionUpdate) => {
      if (websocketService.isConnected()) {
        console.log(
          "📤 Sending FK connect (will be filtered for this client):",
          update
        );
        websocketService.sendForeignKeyConnect(update);
      }
    },
    []
  );

  const sendForeignKeyDisconnect = useCallback(
    (update: ForeignKeyDisconnectUpdate) => {
      if (websocketService.isConnected()) {
        console.log(
          "📤 Sending FK disconnect (will be filtered for this client):",
          update
        );
        websocketService.sendForeignKeyDisconnect(update);
      }
    },
    []
  );

  return {
    isConnected,
    sendNodePositionUpdate,
    sendFieldUpdate,
    sendTogglePrimaryKey,
    sendToggleForeignKey,
    sendAddAttribute,
    sendDeleteAttribute,
    sendForeignKeyConnect,
    sendForeignKeyDisconnect,
  };
};
