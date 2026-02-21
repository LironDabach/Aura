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
const mongoose_1 = __importDefault(require("mongoose"));
const authController_1 = __importDefault(require("../controllers/authController"));
const index_1 = __importDefault(require("../index"));
const usersModel_1 = __importDefault(require("../models/usersModel"));
const google_auth_library_1 = require("google-auth-library");
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
describe("AuthController unit", () => {
    let originalClientId;
    beforeEach(() => {
        originalClientId = process.env.GOOGLE_CLIENT_ID;
        process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
        jest.spyOn(console, "error").mockImplementation(() => { });
    });
    afterEach(() => {
        if (originalClientId === undefined) {
            delete process.env.GOOGLE_CLIENT_ID;
        }
        else {
            process.env.GOOGLE_CLIENT_ID = originalClientId;
        }
        jest.restoreAllMocks();
    });
    test("register rejects invalid username format", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = {
            body: { username: "bad username!", email: "a@b.com", password: "Pass123!" },
        };
        const res = makeRes();
        yield authController_1.default.register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Username can only contain English letters, numbers, dots, underscores, and hyphens",
        }));
    }));
    test("login rejects local login for Google-only user", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.spyOn(usersModel_1.default, "findOne").mockResolvedValue({
            _id: new mongoose_1.default.Types.ObjectId(),
            username: "google_user",
            password: undefined,
            refreshTokens: [],
            save: jest.fn(),
        });
        const req = { body: { username: "google_user", password: "x" } };
        const res = makeRes();
        yield authController_1.default.login(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Please use Google to sign in" }));
    }));
    test("googleLogin requires credential", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = { body: {} };
        const res = makeRes();
        yield authController_1.default.googleLogin(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    }));
    test("googleLogin fails when GOOGLE_CLIENT_ID is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        delete process.env.GOOGLE_CLIENT_ID;
        const req = { body: { credential: "token" } };
        const res = makeRes();
        yield authController_1.default.googleLogin(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    }));
    test("googleLogin handles provider failure", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.GOOGLE_CLIENT_ID = "client-id";
        const verifyIdToken = jest
            .spyOn(google_auth_library_1.OAuth2Client.prototype, "verifyIdToken")
            .mockImplementation(() => Promise.reject(new Error("google down")));
        const req = { body: { credential: "token" } };
        const res = makeRes();
        yield authController_1.default.googleLogin(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        verifyIdToken.mockRestore();
    }));
    test("googleLogin returns 401 when token payload is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.GOOGLE_CLIENT_ID = "client-id";
        const verifyIdToken = jest
            .spyOn(google_auth_library_1.OAuth2Client.prototype, "verifyIdToken")
            .mockResolvedValue({
            getPayload: () => null,
        });
        const req = { body: { credential: "token" } };
        const res = makeRes();
        yield authController_1.default.googleLogin(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        verifyIdToken.mockRestore();
    }));
    test("googleLogin returns 400 when payload email is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.GOOGLE_CLIENT_ID = "client-id";
        const verifyIdToken = jest
            .spyOn(google_auth_library_1.OAuth2Client.prototype, "verifyIdToken")
            .mockResolvedValue({
            getPayload: () => ({ sub: "google-sub", name: "No Email" }),
        });
        const req = { body: { credential: "token" } };
        const res = makeRes();
        yield authController_1.default.googleLogin(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        verifyIdToken.mockRestore();
    }));
    test("googleLogin updates existing user without googleId", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.GOOGLE_CLIENT_ID = "client-id";
        const verifyIdToken = jest
            .spyOn(google_auth_library_1.OAuth2Client.prototype, "verifyIdToken")
            .mockResolvedValue({
            getPayload: () => ({
                sub: "google-sub",
                email: "user@example.com",
                name: "User Name",
                picture: "pic",
            }),
        });
        const save = jest.fn().mockResolvedValue(undefined);
        const existingUser = {
            _id: new mongoose_1.default.Types.ObjectId(),
            username: "username",
            email: "user@example.com",
            profilePicture: undefined,
            googleId: undefined,
            refreshTokens: [],
            save,
        };
        jest.spyOn(usersModel_1.default, "findOne").mockResolvedValue(existingUser);
        const req = { body: { credential: "token" } };
        const res = makeRes();
        yield authController_1.default.googleLogin(req, res);
        expect(existingUser.googleId).toBe("google-sub");
        expect(existingUser.profilePicture).toBe("pic");
        expect(save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        verifyIdToken.mockRestore();
    }));
    test("googleLogin creates user and resolves username collisions", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.GOOGLE_CLIENT_ID = "client-id";
        const verifyIdToken = jest
            .spyOn(google_auth_library_1.OAuth2Client.prototype, "verifyIdToken")
            .mockResolvedValue({
            getPayload: () => ({
                sub: "google-new",
                email: "new.user@example.com",
                name: "New User",
                picture: "pic2",
            }),
        });
        const createdUser = {
            _id: new mongoose_1.default.Types.ObjectId(),
            username: "newuser1",
            email: "new.user@example.com",
            profilePicture: "pic2",
            googleId: "google-new",
            refreshTokens: [],
            save: jest.fn().mockResolvedValue(undefined),
        };
        const findOneSpy = jest
            .spyOn(usersModel_1.default, "findOne")
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ _id: new mongoose_1.default.Types.ObjectId() })
            .mockResolvedValueOnce(null);
        const createSpy = jest.spyOn(usersModel_1.default, "create").mockResolvedValue(createdUser);
        const req = { body: { credential: "token" } };
        const res = makeRes();
        yield authController_1.default.googleLogin(req, res);
        expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ username: "newuser1" }));
        expect(createdUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        verifyIdToken.mockRestore();
        findOneSpy.mockRestore();
        createSpy.mockRestore();
    }));
});
describe("initApp unit", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test("rejects when DATABASE_URL is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const old = process.env.DATABASE_URL;
        delete process.env.DATABASE_URL;
        yield expect((0, index_1.default)()).rejects.toBe("DATABASE_URL is undefined");
        if (old !== undefined)
            process.env.DATABASE_URL = old;
    }));
    test("wraps mongoose connection errors with timeout message", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.DATABASE_URL = "mongodb://localhost:27017/aura";
        process.env.MONGO_CONNECT_TIMEOUT_MS = "1234";
        const connectSpy = jest
            .spyOn(mongoose_1.default, "connect")
            .mockRejectedValueOnce(new Error("boom"));
        yield expect((0, index_1.default)()).rejects.toThrow("Failed to connect to MongoDB within 1234ms");
        connectSpy.mockRestore();
    }));
});
//# sourceMappingURL=auth_index.unit.test.js.map