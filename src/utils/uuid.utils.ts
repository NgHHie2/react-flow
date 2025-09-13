export const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const generateModelId = (): string => {
  return generateUUID();
};

export const generateAttributeId = (): string => {
  return generateUUID();
};

export const generateConnectionId = (): string => {
  return generateUUID();
};
