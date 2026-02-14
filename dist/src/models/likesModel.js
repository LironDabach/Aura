"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const likeSchema = new mongoose_1.default.Schema({
    postID: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "post",
        required: true,
    },
    senderID: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
exports.default = mongoose_1.default.model("like", likeSchema);
//# sourceMappingURL=likesModel.js.map