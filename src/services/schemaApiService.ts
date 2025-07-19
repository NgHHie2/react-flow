// src/services/schemaApiService.ts
export interface FieldDto {
  id: number;
  name: string;
  type: string;
  hasConnections: boolean;
  fieldOrder: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

export interface ModelDto {
  id: number;
  name: string;
  positionX: number;
  positionY: number;
  isChild: boolean;
  backgroundColor: string;
  fields: FieldDto[];
}

export interface ConnectionDto {
  id: number;
  name: string;
  connectionType: string;
  isAnimated: boolean;
  edgeColor: string;
  source: string;
  target: string;
}

export interface SchemaVisualizerResponse {
  models: ModelDto[];
  connections: ConnectionDto[];
}

const API_BASE_URL = "http://localhost:8080/api/schema";

export const schemaApiService = {
  // Lấy toàn bộ dữ liệu schema
  async getSchemaData(): Promise<SchemaVisualizerResponse> {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching schema data:", error);
      throw error;
    }
  },

  // Khởi tạo sample data
  async initializeSampleData(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/initialize`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error initializing sample data:", error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error checking health:", error);
      throw error;
    }
  },
};
