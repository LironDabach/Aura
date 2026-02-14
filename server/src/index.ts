import express, { Express } from "express";
import mongoose from "mongoose";
import postsRoute from "./routes/postsRoute";
import commentsRoute from "./routes/commentsRoute";
import likesRoute from "./routes/likesRoute";
import authRoute from "./routes/authRoute";
import dotenv from "dotenv";
import { setupSwagger } from "./swagger";
import path from "path";


dotenv.config({ path: ".env.dev" });

const app = express();
app.use(express.json());
setupSwagger(app);

// // API routes
app.use("/post", postsRoute);
app.use("/comment", commentsRoute);
app.use("/like", likesRoute);
app.use("/auth", authRoute);

// Serve React static files from dist
const distPath = path.join(__dirname, "../client/dist");
app.use(express.static(distPath));

// SPA fallback: route all unmatched requests to index.html (for React Router)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
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
