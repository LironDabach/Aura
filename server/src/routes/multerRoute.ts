import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

const base =
  "http://" + process.env.DOMAIN_BASE + ":" + process.env.PORT + "/api/upload/";

const now = new Date();

const formattedDate =
  String(now.getDate()).padStart(2, "0") +
  "_" +
  String(now.getMonth() + 1).padStart(2, "0") +
  "_" +
  now.getFullYear();

const uploadsDir = "public/uploads/";
fs.mkdirSync(path.resolve(process.cwd(), uploadsDir), { recursive: true });

const sanitizeBaseName = (name: string): string => {
  const sanitized = name
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || "file";
};

const sanitizeUsername = (username: string): string =>
  username.replace(/[^a-zA-Z0-9_-]/g, "__");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const lastDotIndex = file.originalname.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0 && lastDotIndex < file.originalname.length - 1;
    const rawBaseName = hasExtension
      ? file.originalname.slice(0, lastDotIndex)
      : file.originalname;
    const ext = hasExtension ? file.originalname.slice(lastDotIndex + 1) : "";

    const sanitizedOriginalName = sanitizeBaseName(rawBaseName);
    const username =
      typeof req.body?.username === "string" ? req.body.username : "";
    const sanitizedUsername = sanitizeUsername(username);

    const nameParts = [];
    if (sanitizedUsername) {
      nameParts.push(sanitizedUsername);
    }
    nameParts.push(sanitizedOriginalName, formattedDate);

    const fileName = nameParts.join("-") + (ext ? `.${ext}` : "");
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage });

router.post("/", upload.single("file"), function (req: any, res: any) {
  const parts = req.file.path.split("/");
  const url = base + parts[parts.length - 1];
  console.log("router.post(/file: " + url);
  res.status(200).send({ url: url });
});

export = router;
