"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = express_1.default.Router();
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
router.post("/", uploadMiddleware_1.uploadSingle, function (req, res) {
    var _a;
    const fileName = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
    if (!fileName) {
        return res.status(400).send({ message: "Missing file" });
    }
    const url = (0, uploadMiddleware_1.buildUploadedFileUrl)(req, fileName);
    console.log("router.post(/file: " + url);
    res.status(200).send({ url: url });
});
module.exports = router;
//# sourceMappingURL=multerRoute.js.map