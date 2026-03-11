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
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const userProjection = "-password -refreshTokens";
const toSafeUserObject = (user) => {
    const userObj = (user === null || user === void 0 ? void 0 : user.toObject) ? user.toObject() : Object.assign({}, user);
    delete userObj.password;
    delete userObj.refreshTokens;
    return userObj;
};
const allowedFields = ["username", "email", "password", "profilePicture", "removeProfilePicture"];
const hasOnlyAllowedFields = (body) => Object.keys(body || {}).every((key) => allowedFields.includes(key));
const sanitizeUserPayload = (body) => {
    const allowed = allowedFields;
    const payload = {};
    for (const key of allowed) {
        if (body[key] !== undefined) {
            payload[key] = body[key];
        }
    }
    return payload;
};
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
class UsersController {
    getAll(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield usersModel_1.default.find({}, userProjection);
                return res.json(users);
            }
            catch (err) {
                console.error(err);
                return res.status(500).send("Error: Can't retrieve users");
            }
        });
    }
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield usersModel_1.default.findById(req.params.id, userProjection);
                if (!user) {
                    return res.status(404).send("Error: User not found");
                }
                return res.json(user);
            }
            catch (err) {
                console.error(err);
                return res.status(500).send("Error: Can't retrieve user by ID");
            }
        });
    }
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!hasOnlyAllowedFields(req.body)) {
                    return res.status(400).send("Error: Invalid fields in request");
                }
                const payload = sanitizeUserPayload(req.body);
                if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) {
                    payload.profilePicture = (0, uploadMiddleware_1.buildUploadedFileUrl)(req, req.file.filename);
                }
                if (!payload.username || !payload.email || !payload.password) {
                    return res.status(400).send("Error: username, email and password are required");
                }
                if (!isValidEmail(payload.email)) {
                    return res.status(400).send("Error: invalid email");
                }
                const salt = yield bcrypt_1.default.genSalt(10);
                payload.password = yield bcrypt_1.default.hash(payload.password, salt);
                const created = yield usersModel_1.default.create(payload);
                return res.status(201).json(toSafeUserObject(created));
            }
            catch (err) {
                console.error(err);
                if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
                    return res.status(400).send("Error: username or email already exists");
                }
                return res.status(500).send("Error: Can't create user");
            }
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const userId = req.params.id;
            try {
                const user = yield usersModel_1.default.findById(userId);
                if (!user) {
                    return res.status(404).send("Error: User not found");
                }
                if (!req.user || req.user._id !== userId) {
                    return res.status(403).send("Forbidden: Not the user owner");
                }
                const oldProfilePicture = user.profilePicture;
                if (!hasOnlyAllowedFields(req.body)) {
                    return res.status(400).send("Error: Invalid fields in request");
                }
                const payload = sanitizeUserPayload(req.body);
                // Handle remove profile picture request
                const shouldRemovePic = req.body.removeProfilePicture === "true" || req.body.removeProfilePicture === true;
                delete payload.removeProfilePicture;
                if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) {
                    payload.profilePicture = (0, uploadMiddleware_1.buildUploadedFileUrl)(req, req.file.filename);
                }
                else if (shouldRemovePic) {
                    // Will unset profilePicture below
                }
                if (payload.email && !isValidEmail(payload.email)) {
                    return res.status(400).send("Error: invalid email");
                }
                if (payload.password) {
                    const salt = yield bcrypt_1.default.genSalt(10);
                    payload.password = yield bcrypt_1.default.hash(payload.password, salt);
                }
                let updated;
                if (shouldRemovePic && !((_b = req.file) === null || _b === void 0 ? void 0 : _b.filename)) {
                    // Remove profile picture: unset field and apply other updates
                    updated = yield usersModel_1.default.findByIdAndUpdate(userId, Object.assign(Object.assign({}, payload), { $unset: { profilePicture: 1 } }), { new: true });
                }
                else {
                    updated = yield usersModel_1.default.findByIdAndUpdate(userId, payload, {
                        new: true,
                    });
                }
                if (!updated) {
                    return res.status(404).send("Error: User not found");
                }
                // Clean up old profile picture file
                if (oldProfilePicture &&
                    (shouldRemovePic || (((_c = req.file) === null || _c === void 0 ? void 0 : _c.filename) && oldProfilePicture !== updated.profilePicture))) {
                    yield (0, uploadMiddleware_1.deleteUploadedFileByUrl)(oldProfilePicture);
                }
                return res.json(toSafeUserObject(updated));
            }
            catch (err) {
                console.error(err);
                if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
                    return res.status(400).send("Error: username or email already exists");
                }
                return res.status(500).send("Error: Can't update user");
            }
        });
    }
    del(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.params.id;
            try {
                const user = yield usersModel_1.default.findById(userId);
                if (!user) {
                    return res.status(404).send("Error: User not found");
                }
                if (!req.user || req.user._id !== userId) {
                    return res.status(403).send("Forbidden: Not the user owner");
                }
                const deleted = yield usersModel_1.default.findByIdAndDelete(userId);
                if (!deleted) {
                    return res.status(404).send("Error: User not found");
                }
                yield (0, uploadMiddleware_1.deleteUploadedFileByUrl)(deleted.profilePicture);
                return res.status(200).json(toSafeUserObject(deleted));
            }
            catch (err) {
                console.error(err);
                return res.status(500).send("Error: Can't delete user");
            }
        });
    }
}
exports.default = new UsersController();
//# sourceMappingURL=usersController.js.map