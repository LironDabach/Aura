"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({
            message: "Unauthorized: missing or invalid Authorization header",
        });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: missing token" });
    }
    const secret = process.env.JWT_SECRET || "default_secret";
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = { _id: decoded._id };
        next();
    }
    catch (err) {
        return res
            .status(401)
            .json({ message: "Unauthorized: invalid or expired token" });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=authMiddleware.js.map