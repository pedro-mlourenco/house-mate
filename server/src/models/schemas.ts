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

  // JSON Schema for Token Blacklist collection
export const tokenSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["token", "expiresAt"],
        additionalProperties: false,
        properties: {
            _id: {},
            token: {
                bsonType: "string",
                description: "'token' is required and must be a string"
            },
            expiresAt: {
                bsonType: "date",
                description: "'expiresAt' is required and must be a date"
            }
        }
    }
};

// JSON Schema for Recipe collection
export const recipeSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["name", "servings", "prepTime", "cookTime", "ingredients", "steps", "difficulty", "createdAt", "updatedAt", "createdBy"],
        additionalProperties: false,
        properties: {
            _id: {},
            name: {
                bsonType: "string",
                description: "'name' is required and must be a string"
            },
            description: {
                bsonType: "string",
                description: "'description' is optional but must be a string if provided"
            },
            servings: {
                bsonType: "int",
                minimum: 1,
                description: "'servings' is required and must be a positive integer"
            },
            prepTime: {
                bsonType: "int",
                minimum: 0,
                description: "'prepTime' is required and must be a non-negative integer"
            },
            cookTime: {
                bsonType: "int",
                minimum: 0,
                description: "'cookTime' is required and must be a non-negative integer"
            },
            ingredients: {
                bsonType: "array",
                minItems: 1,
                items: {
                    bsonType: "object",
                    required: ["item", "quantity", "unit"],
                    properties: {
                        item: {
                            bsonType: "objectId",
                            description: "'item' must reference an existing Item"
                        },
                        quantity: {
                            bsonType: "double",
                            minimum: 0,
                            description: "'quantity' must be a positive number"
                        },
                        unit: {
                            bsonType: "string",
                            description: "'unit' is required and must be a string"
                        },
                        notes: {
                            bsonType: "string",
                            description: "'notes' is optional but must be a string if provided"
                        }
                    }
                }
            },
            steps: {
                bsonType: "array",
                minItems: 1,
                items: {
                    bsonType: "object",
                    required: ["stepNumber", "description"],
                    properties: {
                        stepNumber: {
                            bsonType: "int",
                            minimum: 1,
                            description: "'stepNumber' must be a positive integer"
                        },
                        description: {
                            bsonType: "string",
                            description: "'description' is required and must be a string"
                        },
                        duration: {
                            bsonType: "int",
                            minimum: 0,
                            description: "'duration' is optional but must be a non-negative integer if provided"
                        }
                    }
                }
            },
            category: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                },
                description: "'category' is optional but must be an array of strings if provided"
            },
            difficulty: {
                enum: ["Easy", "Medium", "Hard"],
                description: "'difficulty' must be one of: Easy, Medium, Hard"
            },
            createdAt: {
                bsonType: "date",
                description: "'createdAt' is required and must be a date"
            },
            updatedAt: {
                bsonType: "date",
                description: "'updatedAt' is required and must be a date"
            },
            imageUrl: {
                bsonType: "string",
                description: "'imageUrl' is optional but must be a string if provided"
            },
            rating: {
                bsonType: "int",
                minimum: 1,
                maximum: 5,
                description: "'rating' is optional but must be an integer between 1 and 5 if provided"
            },
            notes: {
                bsonType: "string",
                description: "'notes' is optional but must be a string if provided"
            },
            createdBy: {
                bsonType: "objectId",
                description: "'createdBy' must reference the creating user"
            }
        }
    }
};