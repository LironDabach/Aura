"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const postsController_1 = __importDefault(require("../controllers/postsController"));
const router = express_1.default.Router();
router.get("/", postsController_1.default.getAll.bind(postsController_1.default));
router.get("/:id", postsController_1.default.getById.bind(postsController_1.default));
router.get("/user/:userId", postsController_1.default.getByUserId.bind(postsController_1.default));
router.post("/", authMiddleware_1.authenticate, postsController_1.default.create.bind(postsController_1.default));
router.put("/:id", authMiddleware_1.authenticate, postsController_1.default.update.bind(postsController_1.default));
router.delete("/:id", authMiddleware_1.authenticate, postsController_1.default.del.bind(postsController_1.default));
exports.default = router;
//# sourceMappingURL=postsRoute.js.map