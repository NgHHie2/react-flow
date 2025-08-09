// src/services/mockSchemaApiService.ts
import { SchemaData } from "../SchemaVisualizer/SchemaVisualizer.types";

// Mock data - 100% match với type definitions
const mockSchemaData: SchemaData = {
  id: 1,
  name: "Energy Usage System",
  description: "Sample energy usage system database schema",
  databaseType: "MYSQL",
  version: "8.0",
  charset: "utf8mb4",
  collation: "utf8mb4_unicode_ci",
  isPublic: false,
  isTemplate: true,
  models: [
    {
      id: 2,
      name: "User",
      modelType: "TABLE",
      attributes: [
        {
          name: "id",
          dataType: "BIGINT(20)",
          isPrimaryKey: true,
          id: 0,
          isNullable: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "username",
          dataType: "VARCHAR(255)",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "email",
          dataType: "VARCHAR(255)",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "password",
          dataType: "VARCHAR(255)",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "full_name",
          dataType: "VARCHAR(255)",
          isNullable: true,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "created_at",
          dataType: "TIMESTAMP",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "updated_at",
          dataType: "TIMESTAMP",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
      ],
      nodeId: "",
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0,
      backgroundColor: "",
      borderColor: "",
      borderWidth: 0,
      borderRadius: 0,
      zindex: 0,
    },
    {
      id: 3,
      name: "Device",
      modelType: "TABLE",
      attributes: [
        {
          name: "id",
          dataType: "BIGINT(20)",
          isPrimaryKey: true,
          id: 0,
          isNullable: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "user_id",
          dataType: "BIGINT(20)",
          isNullable: false,
          isForeignKey: true,
          connection: {
            targetModelName: "User",
            targetAttributeName: "id",
            id: 0,
            connectionType: "",
            foreignKeyName: "",
            strokeColor: "",
            strokeWidth: 2,
            isAnimated: false,
            targetArrowType: "",
          },
          id: 0,
          isPrimaryKey: false,
          attributeOrder: 0,
        },
        {
          name: "name",
          dataType: "VARCHAR(255)",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "device_type",
          dataType: "VARCHAR(50)",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "serial_number",
          dataType: "VARCHAR(100)",
          isNullable: true,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "created_at",
          dataType: "TIMESTAMP",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "updated_at",
          dataType: "TIMESTAMP",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
      ],
      nodeId: "",
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0,
      backgroundColor: "",
      borderColor: "",
      borderWidth: 0,
      borderRadius: 0,
      zindex: 0,
    },
    {
      id: 4,
      name: "Reading",
      modelType: "TABLE",
      attributes: [
        {
          name: "id",
          dataType: "BIGINT(20)",
          isPrimaryKey: true,
          id: 0,
          isNullable: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "device_id",
          dataType: "BIGINT(20)",
          isNullable: false,
          isForeignKey: true,
          connection: {
            targetModelName: "Device",
            targetAttributeName: "id",
            id: 0,
            connectionType: "",
            foreignKeyName: "",
            strokeColor: "",
            strokeWidth: 2,
            isAnimated: false,
            targetArrowType: "",
          },
          id: 0,
          isPrimaryKey: false,
          attributeOrder: 0,
        },
        {
          name: "reading_value",
          dataType: "DECIMAL(10, 2)",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
        {
          name: "timestamp",
          dataType: "TIMESTAMP",
          isNullable: false,
          id: 0,
          isPrimaryKey: false,
          isForeignKey: false,
          attributeOrder: 0,
        },
      ],
      nodeId: "",
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0,
      backgroundColor: "",
      borderColor: "",
      borderWidth: 0,
      borderRadius: 0,
      zindex: 0,
    },
  ],
  zoomLevel: 0,
  panX: 0,
  panY: 0,
};
// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockSchemaApiService = {
  // Get complete schema data
  async getSchemaData(): Promise<SchemaData> {
    await delay(800); // Realistic delay
    console.log("🔄 MockAPI: Returning schema data");
    return Promise.resolve({ ...mockSchemaData });
  },

  // Initialize sample data
  async initializeSampleData(): Promise<string> {
    await delay(500);
    console.log("🔄 MockAPI: Sample data initialized");
    return Promise.resolve("Mock sample data initialized successfully");
  },

  // Update model position
  async updateModelPosition(
    modelName: string,
    positionX: number,
    positionY: number
  ): Promise<void> {
    await delay(200);

    // Update mock data in memory
    const model = mockSchemaData.models.find((m) => m.name === modelName);
    if (model) {
      model.positionX = positionX;
      model.positionY = positionY;
      console.log(
        `🔄 MockAPI: Updated ${modelName} position to (${positionX}, ${positionY})`
      );
    } else {
      console.warn(`⚠️ MockAPI: Model ${modelName} not found`);
    }

    return Promise.resolve();
  },

  // Update attribute
  async updateAttribute(
    modelName: string,
    attributeId: number,
    attributeName: string,
    dataType: string
  ): Promise<void> {
    await delay(300);

    // Update mock data in memory
    const model = mockSchemaData.models.find((m) => m.name === modelName);
    if (model) {
      const attribute = model.attributes.find(
        (attr) => attr.id === attributeId
      );
      if (attribute) {
        attribute.name = attributeName;
        attribute.dataType = dataType;
        console.log(
          `🔄 MockAPI: Updated attribute ${attributeId} in ${modelName} to ${attributeName}:${dataType}`
        );
      } else {
        console.warn(
          `⚠️ MockAPI: Attribute ${attributeId} not found in ${modelName}`
        );
      }
    } else {
      console.warn(`⚠️ MockAPI: Model ${modelName} not found`);
    }

    return Promise.resolve();
  },

  // Health check
  async healthCheck(): Promise<string> {
    await delay(100);
    console.log("✅ MockAPI: Health check passed");
    return Promise.resolve("Mock service is healthy and ready");
  },

  // Get specific model
  async getModel(modelName: string) {
    await delay(200);
    const model = mockSchemaData.models.find((m) => m.name === modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    console.log(`🔄 MockAPI: Retrieved model ${modelName}`);
    return Promise.resolve(model);
  },

  // Get schema statistics
  async getSchemaStats() {
    await delay(150);
    const stats = {
      totalModels: mockSchemaData.models.length,
      totalAttributes: mockSchemaData.models.reduce(
        (sum, model) => sum + model.attributes.length,
        0
      ),
      totalConnections: mockSchemaData.models.reduce(
        (sum, model) =>
          sum + model.attributes.filter((attr) => !!attr.connection).length,
        0
      ),
      primaryKeys: mockSchemaData.models.reduce(
        (sum, model) =>
          sum + model.attributes.filter((attr) => attr.isPrimaryKey).length,
        0
      ),
      foreignKeys: mockSchemaData.models.reduce(
        (sum, model) =>
          sum + model.attributes.filter((attr) => attr.isForeignKey).length,
        0
      ),
    };
    console.log("📊 MockAPI: Retrieved schema statistics", stats);
    return Promise.resolve(stats);
  },
};
