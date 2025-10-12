// src/hooks/useWebSocketSender.ts
import { useCallback } from "react";
import { websocketService } from "../services/websocketService";
import { useWebSocketContext } from "../contexts/WebSocketContext";
import {
  NodePositionUpdate,
  FieldNameUpdate,
  FieldTypeUpdate,
  ToggleKeyTypeUpdate,
  AddAttributeUpdate,
  DeleteAttributeUpdate,
  ForeignKeyConnectionUpdate,
  ForeignKeyDisconnectUpdate,
  AddModelUpdate,
  UpdateModelNameUpdate,
  DeleteModelUpdate,
} from "../types/websocket.types";

/**
 * Hook để gửi WebSocket messages
 * Sử dụng global state để check connection
 */
export const useWebSocketSender = () => {
  const { isConnected } = useWebSocketContext();

  const sendNodePositionUpdate = useCallback((update: NodePositionUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send node position update: not connected");
      return;
    }
    websocketService.sendNodePositionUpdate(update);
  }, []);

  const sendFieldNameUpdate = useCallback((update: FieldNameUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send field name update: not connected");
      return;
    }
    websocketService.sendFieldNameUpdate(update);
  }, []);

  const sendFieldTypeUpdate = useCallback((update: FieldTypeUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send field type update: not connected");
      return;
    }
    websocketService.sendFieldTypeUpdate(update);
  }, []);

  const sendToggleKeyType = useCallback((update: ToggleKeyTypeUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send toggle key type: not connected");
      return;
    }
    websocketService.sendToggleKeyType(update);
  }, []);

  const sendAddAttribute = useCallback((update: AddAttributeUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send add attribute: not connected");
      return;
    }
    websocketService.sendAddAttribute(update);
  }, []);

  const sendDeleteAttribute = useCallback((update: DeleteAttributeUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send delete attribute: not connected");
      return;
    }
    websocketService.sendDeleteAttribute(update);
  }, []);

  const sendForeignKeyConnect = useCallback(
    (update: ForeignKeyConnectionUpdate) => {
      if (!websocketService.isConnected()) {
        console.warn("⚠️ Cannot send foreign key connect: not connected");
        return;
      }
      websocketService.sendForeignKeyConnect(update);
    },
    []
  );

  const sendForeignKeyDisconnect = useCallback(
    (update: ForeignKeyDisconnectUpdate) => {
      if (!websocketService.isConnected()) {
        console.warn("⚠️ Cannot send foreign key disconnect: not connected");
        return;
      }
      websocketService.sendForeignKeyDisconnect(update);
    },
    []
  );

  const sendAddModel = useCallback((update: AddModelUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send add model: not connected");
      return;
    }
    websocketService.sendAddModel(update);
  }, []);

  const sendUpdateModelName = useCallback((update: UpdateModelNameUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send update model name: not connected");
      return;
    }
    websocketService.sendUpdateModelName(update);
  }, []);

  const sendDeleteModel = useCallback((update: DeleteModelUpdate) => {
    if (!websocketService.isConnected()) {
      console.warn("⚠️ Cannot send delete model: not connected");
      return;
    }
    websocketService.sendDeleteModel(update);
  }, []);

  return {
    isConnected,
    sendNodePositionUpdate,
    sendFieldNameUpdate,
    sendFieldTypeUpdate,
    sendToggleKeyType,
    sendAddAttribute,
    sendDeleteAttribute,
    sendForeignKeyConnect,
    sendForeignKeyDisconnect,
    sendAddModel,
    sendUpdateModelName,
    sendDeleteModel,
  };
};
