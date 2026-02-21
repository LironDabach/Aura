"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // Not required for Google OAuth users
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // Allows multiple null values
    },
    profilePicture: {
        type: String,
        required: false,
    },
    refreshTokens: {
        type: [String],
        default: [],
    },
});
exports.default = mongoose_1.default.model("user", userSchema);
//# sourceMappingURL=usersModel.js.map