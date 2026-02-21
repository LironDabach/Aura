import express, { Express } from "express";
import mongoose from "mongoose";
import postsRoute from "./routes/postsRoute";
import commentsRoute from "./routes/commentsRoute";
import likesRoute from "./routes/likesRoute";
import authRoute from "./routes/authRoute";
import dotenv from "dotenv";
import { setupSwagger } from "./swagger";
import path from "path";
import cors from "cors";


dotenv.config({ path: "../.env.development" });

const app = express();
app.use(cors());
app.use(express.json());
setupSwagger(app);

// // API routes
app.use("/api/post", postsRoute);
app.use("/api/comment", commentsRoute);
app.use("/api/like", likesRoute);
app.use("/api/auth", authRoute);

// Serve React static files from dist
const distPath = path.resolve(process.cwd(), "../client/dist");
app.use(express.static(distPath));

// 404 handler for all unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const initApp = () => {
  const pr = new Promise<Express>((resolve, reject) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      reject("DATABASE_URL is undefined");
      return;
    }
    mongoose
      .connect(dbUrl, {})
      .then(() => {
        resolve(app);
      })
      .catch((error) => {
        reject(error);
      });
    const db = mongoose.connection;
    db.on("error", (error) => console.error(error));
    db.once("open", () => console.log("Connected to Database"));
  });
  return pr;
};

export default initApp;
