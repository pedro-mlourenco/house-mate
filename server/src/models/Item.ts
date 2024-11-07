import * as mongodb from "mongodb";

// Define the interface for an individual barcode
interface Barcode {
    barcode: string;
    expiryDate?: Date;
    price: number;
    datePurchased?: Date;
    store?: mongodb.ObjectId;
}

// Define the interface for the Item schema
export interface Item {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    storageLocation: "Fridge" | "Pantry" | "Freezer";
    barcodes: Barcode[];
}