import express from "express";
import { buildUploadedFileUrl, uploadSingle } from "../middleware/uploadMiddleware";

const router = express.Router();

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags:
 *       - Uploads
 *     summary: Upload a file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Optional username to include in filename.
 *               file:
 *                 type: string
 *                 format: binary
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Uploaded file URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Missing file
 */
router.post("/", uploadSingle, function (req: any, res: any) {
  const fileName = req.file?.filename;
  if (!fileName) {
    return res.status(400).send({ message: "Missing file" });
  }
  const url = buildUploadedFileUrl(req, fileName);
  console.log("router.post(/file: " + url);
  res.status(200).send({ url: url });
});

export = router;
