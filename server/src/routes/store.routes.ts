import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";

export const storeRouter = express.Router();
storeRouter.use(express.json());

storeRouter.get("/", async (_req, res) => {
    try {
        const stores = await collections?.stores?.find({}).toArray();
        res.status(200).send(stores);
    } catch (error) {
        res.status(500).send(error instanceof Error ? error.message : "Server error getting Stores");
    }
});

storeRouter.get("/:id", async (req, res) => {
    try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const store = await collections?.stores?.findOne(query);

        if (store) {
            res.status(200).send(store);
        } else {
            res.status(404).send(`Failed to find Store: ID ${id}`);
        }
    } catch (error) {
        res.status(404).send(`Failed to find Store: ID ${req?.params?.id}`);
    }
});

storeRouter.post("/", async (req, res) => {
    try {
        const store = req.body;
        const result = await collections?.stores?.insertOne(store);

        if (result?.acknowledged) {
            res.status(201).send(`Created new Store: ID ${result.insertedId}.`);
        } else {
            res.status(500).send("Failed to create new Store.");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
});

storeRouter.put("/:id", async (req, res) => {
    try {
        const id = req?.params?.id;
        const store = req.body;
        const query = { _id: new ObjectId(id) };
        const result = await collections?.stores?.updateOne(query, { $set: store });

        if (result && result.matchedCount) {
            res.status(200).send(`Updated Item: ID ${id}.`);
        } else if (!result?.matchedCount) {
            res.status(404).send(`Failed to find Store: ID ${id}`);
        } else {
            res.status(304).send(`Failed to update Store: ID ${id}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

storeRouter.delete("/:id", async (req, res) => {
    try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await collections?.stores?.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Removed a Store: ID ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove a Store: ID ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Failed to find a Store: ID ${id}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});