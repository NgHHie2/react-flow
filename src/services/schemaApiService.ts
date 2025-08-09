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
