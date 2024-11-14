
import express from "express";
import cors from "cors";
import { connectToDatabase } from "./database";
import { itemRouter } from "./routes/item.routes";
import { storeRouter } from "./routes/store.routes";
import { authRouter } from "./routes/auth.routes";
import swaggerUi from 'swagger-ui-express';
import { setupSwagger } from './config/swagger';

require("dotenv").config();

const ATLAS_URI = process.env['ATLAS_URI'];

if (!ATLAS_URI) {
  console.error(
    "No ATLAS_URI environment variable has been defined in config.env"
  );
  process.exit(1);
}

connectToDatabase(ATLAS_URI)
  .then(() => {
    const app = express();
    
    if (process.env.NODE_ENV === 'development') {
      setupSwagger(app);
    }
    app.use(cors());
    app.use("/items", itemRouter);
    app.use("/stores", storeRouter);
    app.use("/auth", authRouter);

    // start the Express server
    app.listen(5200, () => {
      console.log(`Server running at http://localhost:5200...`);
    });
  })
  .catch((error) => console.error(error));