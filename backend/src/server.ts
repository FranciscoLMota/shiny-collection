
import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import pokemonRoutes from "./routes/pokemon.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import huntRoutes from "./routes/hunt.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time"
    );

    res.json({
      status: "ok",
      message: "Shiny Phenotype Observation Network API is running",
      database: "connected",
      time: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      message: "API is running but database is unavailable",
      database: "disconnected",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Shiny Phenotype Observation Network API running on port ${PORT}`);
});


// Routes
app.use("/api/pokemon", pokemonRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/hunts", huntRoutes);