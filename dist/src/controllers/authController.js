"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const usersModel_1 = __importDefault(require("../models/usersModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendError = (code, message, res) => {
    res.status(code).json({ message });
};
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET || "default_secret";
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set - Shutting down.");
        process.exit(1);
    }
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "3600");
    const token = jsonwebtoken_1.default.sign({ _id: userId }, secret, { expiresIn: expiresIn });
    const refreshExpiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || "1440");
    const rand = Math.floor(Math.random() * 1000);
    const refreshToken = jsonwebtoken_1.default.sign({ _id: userId, rand: rand }, secret, {
        expiresIn: refreshExpiresIn,
    });
    return { token, refreshToken };
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (!username || !email || !password) {
        return sendError(400, "Username, email and password are required", res);
    }
    try {
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        const user = yield usersModel_1.default.create({
            username: username,
            email: email,
            password: hashedPassword,
        });
        const tokens = generateToken(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        yield user.save();
        res.status(201).json(tokens);
    }
    catch (err) {
        return sendError(500, "Internal server error", res);
    }
});
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (!username || !email || !password) {
        return sendError(400, "Username, email and password are required", res);
    }
    try {
        const user = yield usersModel_1.default.findOne({ username: username, email: email });
        if (!user) {
            return sendError(401, "Invalid username or email", res);
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return sendError(401, "Invalid password", res);
        }
        const tokens = generateToken(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json(tokens);
    }
    catch (err) {
        return sendError(500, "Internal server error", res);
    }
});
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return sendError(400, "Refresh token is required", res);
    }
    try {
        const decoded = jsonwebtoken_1.default.decode(refreshToken);
        const user = yield usersModel_1.default.findById(decoded._id);
        if (!user) {
            return sendError(401, "Invalid refresh token", res);
        }
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        yield user.save();
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (err) {
        return sendError(500, "Internal server error", res);
    }
});
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return sendError(400, "Refresh token is required", res);
    }
    const secret = process.env.JWT_SECRET || "default_secret";
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, secret);
        const user = yield usersModel_1.default.findById(decoded._id);
        if (!user) {
            return sendError(401, "Invalid refresh token", res);
        }
        if (!user.refreshTokens.includes(refreshToken)) {
            user.refreshTokens = [];
            yield user.save();
            console.log(" Probably stolen token for: ", user._id);
            return sendError(401, "Invalid refresh token", res);
        }
        const tokens = generateToken(decoded._id);
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        user.refreshTokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json(tokens);
    }
    catch (err) {
        return sendError(401, "Invalid refresh token", res);
    }
});
exports.default = {
    register,
    login,
    logout,
    refreshToken,
};
//# sourceMappingURL=authController.js.map