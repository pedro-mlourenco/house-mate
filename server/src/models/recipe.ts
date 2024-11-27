import * as mongodb from "mongodb";

export interface RecipeIngredient {
    itemObjId: mongodb.ObjectId;  // Reference to Item
    quantity: number;
    unit: string;
    notes?: string;
}

export interface Step {
    stepNumber: number;
    description: string;
    duration?: number;  // in minutes
}

export interface Recipe {
    name: string;
    description?: string;
    servings: number;
    prepTime: number;  // in minutes
    cookTime: number;  // in minutes
    ingredients: RecipeIngredient[];
    steps: Step[];
    category?: string[];  // e.g., ["Italian", "Vegetarian"]
    difficulty: "Easy" | "Medium" | "Hard";
    createdAt: Date;
    updatedAt: Date;
    imageUrl?: string;
    rating?: number;  // 1-5
    notes?: string;
}