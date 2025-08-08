// src/services/schemaApiService.ts
import { SchemaData } from "../SchemaVisualizer/SchemaVisualizer.types";

const API_BASE_URL = "http://localhost:8080/api/schema";

export const schemaApiService = {
  // Get complete schema data
  async getSchemaData(): Promise<SchemaData> {
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

  // Initialize sample data
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

  // Update model position
  async updateModelPosition(
    modelName: string,
    positionX: number,
    positionY: number
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/models/${modelName}/position`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ positionX, positionY }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating model position:", error);
      throw error;
    }
  },

  // Update attribute
  async updateAttribute(
    modelName: string,
    attributeId: number,
    attributeName: string,
    dataType: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/models/${modelName}/attributes/${attributeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: attributeName,
            dataType: dataType,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating attribute:", error);
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
