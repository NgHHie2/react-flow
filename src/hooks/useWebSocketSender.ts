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

  const sendNodePositionUpdate = useCallback(
    (update: NodePositionUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send node position update: not connected");
        return;
      }
      websocketService.sendNodePositionUpdate(update);
    },
    [isConnected]
  );

  const sendFieldNameUpdate = useCallback(
    (update: FieldNameUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send field name update: not connected");
        return;
      }
      websocketService.sendFieldNameUpdate(update);
    },
    [isConnected]
  );

  const sendFieldTypeUpdate = useCallback(
    (update: FieldTypeUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send field type update: not connected");
        return;
      }
      websocketService.sendFieldTypeUpdate(update);
    },
    [isConnected]
  );

  const sendToggleKeyType = useCallback(
    (update: ToggleKeyTypeUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send toggle key type: not connected");
        return;
      }
      websocketService.sendToggleKeyType(update);
    },
    [isConnected]
  );

  const sendAddAttribute = useCallback(
    (update: AddAttributeUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send add attribute: not connected");
        return;
      }
      websocketService.sendAddAttribute(update);
    },
    [isConnected]
  );

  const sendDeleteAttribute = useCallback(
    (update: DeleteAttributeUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send delete attribute: not connected");
        return;
      }
      websocketService.sendDeleteAttribute(update);
    },
    [isConnected]
  );

  const sendForeignKeyConnect = useCallback(
    (update: ForeignKeyConnectionUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send foreign key connect: not connected");
        return;
      }
      websocketService.sendForeignKeyConnect(update);
    },
    [isConnected]
  );

  const sendForeignKeyDisconnect = useCallback(
    (update: ForeignKeyDisconnectUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send foreign key disconnect: not connected");
        return;
      }
      websocketService.sendForeignKeyDisconnect(update);
    },
    [isConnected]
  );

  const sendAddModel = useCallback(
    (update: AddModelUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send add model: not connected");
        return;
      }
      websocketService.sendAddModel(update);
    },
    [isConnected]
  );

  const sendUpdateModelName = useCallback(
    (update: UpdateModelNameUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send update model name: not connected");
        return;
      }
      websocketService.sendUpdateModelName(update);
    },
    [isConnected]
  );

  const sendDeleteModel = useCallback(
    (update: DeleteModelUpdate) => {
      if (!isConnected) {
        console.warn("⚠️ Cannot send delete model: not connected");
        return;
      }
      websocketService.sendDeleteModel(update);
    },
    [isConnected]
  );

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
