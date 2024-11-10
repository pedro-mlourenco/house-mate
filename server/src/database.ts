import * as mongodb from "mongodb";
import { Item } from "./models/item";  // Assuming you have defined the Item interface
import { Store } from "./models/store"; // Assuming you have defined the Store interface
import { User } from "./models/user";

export const collections: {
    items?: mongodb.Collection<Item>;
    stores?: mongodb.Collection<Store>;
    users?: mongodb.Collection<User>;
} = {};

export async function connectToDatabase(uri: string) {
    const client = new mongodb.MongoClient(uri);
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("meanStackExample");

        // Apply schema validation for items and stores collections
        await applySchemaValidation(db);

        // Set up the collections with schema validation
        collections.items = db.collection<Item>("items");
        collections.stores = db.collection<Store>("stores");

        console.log("Collections are set up and schema validation is applied");

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Apply schema validation to ensure that Item documents follow the correct structure
async function applySchemaValidation(db: mongodb.Db) {
    // JSON Schema for the Item collection
    const itemJsonSchema = {
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
    const storeJsonSchema = {
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
    const userSchema = {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["email", "password", "name", "createdAt"],
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
              createdAt: {
                bsonType: "date"
              }
            }
          }
        }
      };
    
    // Apply JSON schema validation to the users collection
    await db.command({
        collMod: "users",
        validator: userSchema
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("users", { validator: userSchema });
        }
    });
    // Apply JSON schema validation to the items collection
    await db.command({
        collMod: "items",
        validator: itemJsonSchema
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("items", { validator: itemJsonSchema });
        }
    });

    // Apply JSON schema validation to the stores collection
    await db.command({
        collMod: "stores",
        validator: storeJsonSchema
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("stores", { validator: storeJsonSchema });
        }
    });
}