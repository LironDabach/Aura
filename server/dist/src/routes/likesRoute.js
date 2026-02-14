"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const likesController_1 = __importDefault(require("../controllers/likesController"));
const router = express_1.default.Router();
//get all likes for a post
router.get("/post/:postID", likesController_1.default.getByPostId.bind(likesController_1.default));
//post a like for a post
router.post("/post/:postID", authMiddleware_1.authenticate, likesController_1.default.createByPostId.bind(likesController_1.default));
//delete a like for a post
router.delete("/post/:postID", authMiddleware_1.authenticate, likesController_1.default.delByPostId.bind(likesController_1.default));
exports.default = router;
//# sourceMappingURL=likesRoute.js.map