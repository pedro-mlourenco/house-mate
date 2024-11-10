import { UserRole } from "./user";

export const itemSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["name", "category", "quantity", "unit", "storageLocation", "price", "barcodes", "store"],
        additionalProperties: false,
        properties: {
            _id: {},
            name: {
                bsonType: "string",
                description: "'name' is required and must be a string",
            },
            category: {
                bsonType: "string",
                description: "'category' is required and must be a string",
                enum: ["Dairy", "Vegetables", "Fruits", "Meat", "Grains", "Snacks", "Drinks", "Other"],
            },
            quantity: {
                bsonType: "int",
                description: "'quantity' is required and must be a positive integer",
                minimum: 1,
            },
            unit: {
                bsonType: "string",
                description: "'unit' is required and must be one of the predefined units",
                enum: ["pcs", "kg", "g", "liters", "ml", "pack", "bottle", "can", "box", "other"],
            },
            expiryDate: {
                bsonType: "date",
                description: "'expiryDate' is optional but must be a valid date if provided",
            },
            storageLocation: {
                bsonType: "string",
                description: "'storageLocation' is required and must be one of 'Fridge', 'Pantry', or 'Freezer'",
                enum: ["Fridge", "Pantry", "Freezer"],
            },
            price: {
                bsonType: "double",
                description: "'price' is required and must be a number",
            },
            barcodes: {
                bsonType: "array",
                description: "'barcodes' is required and must be an array of objects containing barcode information",
                items: {
                    bsonType: "object",
                    required: ["code"],
                    properties: {
                        code: {
                            bsonType: "string",
                            description: "'code' is required and must be a string",
                        },
                        store: {
                            bsonType: "objectId",
                            description: "'store' is optional but must reference a valid store",
                        },
                    },
                },
            },
            store: {
                bsonType: "objectId",
                description: "'store' is required and must reference a valid store",
            },
            datePurchased: {
                bsonType: "date",
                description: "'datePurchased' is optional but must be a valid date if provided",
            },
        },
    },
};

// JSON Schema for the Store collection
export const storeSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["name", "location"],
        additionalProperties: false,
        properties: {
            _id: {},
            name: {
                bsonType: "string",
                description: "'name' is required and must be a string",
            },
            location: {
                bsonType: "string",
                description: "'location' is required and must be a string",
            },
            contactNumber: {
                bsonType: "string",
                description: "'contactNumber' is optional but must be a string if provided",
            },
            website: {
                bsonType: "string",
                description: "'website' is optional but must be a string if provided",
            },
        },
    },
};

// JSON Schema for the User collection
export const userSchema = {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "name", "role", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        password: {
          bsonType: "string",
          minLength: 6
        },
        name: {
          bsonType: "string"
        },
        role: {
            enum: [UserRole.USER, UserRole.ADMIN],
            default: UserRole.USER
          },
        createdAt: {
          bsonType: "date"
        }
      }
    }
  };
