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
const google_auth_library_1 = require("google-auth-library");
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
    // Allow common username characters while still rejecting spaces/special symbols.
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        return sendError(400, "Username can only contain English letters, numbers, dots, underscores, and hyphens", res);
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
        res.status(201).json(Object.assign(Object.assign({}, tokens), { user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            } }));
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            if (field === "email") {
                return sendError(400, "Email already exists", res);
            }
            return sendError(400, "Username already exists", res);
        }
        return sendError(500, "Internal server error", res);
    }
});
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
        return sendError(400, "Username and password are required", res);
    }
    try {
        const user = yield usersModel_1.default.findOne({ username: username });
        if (!user) {
            return sendError(401, "Invalid username or password", res);
        }
        // Check if user has a password (Google users might not have one)
        if (!user.password) {
            return sendError(401, "Please use Google to sign in", res);
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return sendError(401, "Invalid username or password", res);
        }
        const tokens = generateToken(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json(Object.assign(Object.assign({}, tokens), { user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            } }));
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
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { credential } = req.body;
    if (!credential) {
        return sendError(400, "Google credential is required", res);
    }
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
        console.error("GOOGLE_CLIENT_ID is not set");
        return sendError(500, "Google authentication not configured", res);
    }
    try {
        const client = new google_auth_library_1.OAuth2Client(googleClientId);
        const ticket = yield client.verifyIdToken({
            idToken: credential,
            audience: googleClientId,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return sendError(401, "Invalid Google token", res);
        }
        const { sub: googleId, email, name, picture } = payload;
        if (!email) {
            return sendError(400, "Email not provided by Google", res);
        }
        // Find existing user by googleId or email
        let user = yield usersModel_1.default.findOne({ $or: [{ googleId }, { email }] });
        if (user) {
            // Update googleId if user exists but doesn't have it (registered with email before)
            if (!user.googleId) {
                user.googleId = googleId;
                if (picture)
                    user.profilePicture = picture;
                yield user.save();
            }
        }
        else {
            // Create new user
            const username = (name === null || name === void 0 ? void 0 : name.replace(/\s+/g, "").toLowerCase()) || email.split("@")[0];
            // Ensure unique username
            let uniqueUsername = username;
            let counter = 1;
            while (yield usersModel_1.default.findOne({ username: uniqueUsername })) {
                uniqueUsername = `${username}${counter}`;
                counter++;
            }
            user = yield usersModel_1.default.create({
                username: uniqueUsername,
                email,
                googleId,
                profilePicture: picture,
            });
        }
        const tokens = generateToken(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json(Object.assign(Object.assign({}, tokens), { user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            } }));
    }
    catch (err) {
        console.error("Google login error:", err);
        return sendError(401, "Google authentication failed", res);
    }
});
exports.default = {
    register,
    login,
    logout,
    refreshToken,
    googleLogin,
};
//# sourceMappingURL=authController.js.map