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
const commentsController_1 = __importDefault(require("../controllers/commentsController"));
const likesController_1 = __importDefault(require("../controllers/likesController"));
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};
describe("CommentsController unit", () => {
    let originalModel;
    let errorSpy;
    beforeEach(() => {
        originalModel = commentsController_1.default.model;
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    });
    afterEach(() => {
        commentsController_1.default.model = originalModel;
        errorSpy.mockRestore();
    });
    test("create sends body as-is when using base create", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { create: jest.fn().mockResolvedValue({ _id: "1" }) };
        commentsController_1.default.model = model;
        const req = { params: {}, body: { content: "x" }, user: { _id: "u1" } };
        const res = makeRes();
        yield commentsController_1.default.create(req, res);
        expect(model.create).toHaveBeenCalledWith({ content: "x" });
        expect(res.status).toHaveBeenCalledWith(201);
    }));
    test("update returns null payload when comment does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) };
        commentsController_1.default.model = model;
        const req = { params: { id: "c1" }, body: {}, user: { _id: "u1" } };
        const res = makeRes();
        yield commentsController_1.default.update(req, res);
        expect(res.json).toHaveBeenCalledWith(null);
    }));
    test("update does not enforce owner checks on base route", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", content: "updated" }),
        };
        commentsController_1.default.model = model;
        const req = { params: { id: "c1" }, body: {}, user: { _id: "u1" } };
        const res = makeRes();
        yield commentsController_1.default.update(req, res);
        expect(res.json).toHaveBeenCalledWith({ _id: "c1", content: "updated" });
    }));
    test("update allows changing fields on base route", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", userID: "u2" }),
        };
        commentsController_1.default.model = model;
        const req = {
            params: { id: "c1" },
            body: { userID: "u2" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield commentsController_1.default.update(req, res);
        expect(res.json).toHaveBeenCalledWith({ _id: "c1", userID: "u2" });
    }));
    test("update succeeds for comment owner", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findById: jest.fn().mockResolvedValue({
                userID: { toString: () => "u1" },
                date: new Date("2024-01-01T00:00:00.000Z"),
            }),
            findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", content: "updated" }),
        };
        commentsController_1.default.model = model;
        const req = {
            params: { id: "c1" },
            body: { content: "updated" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield commentsController_1.default.update(req, res);
        expect(model.findByIdAndUpdate).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ _id: "c1", content: "updated" });
    }));
    test("update returns 500 when findByIdAndUpdate throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("db")) };
        commentsController_1.default.model = model;
        const req = { params: { id: "c1" }, body: {}, user: { _id: "u1" } };
        const res = makeRes();
        yield commentsController_1.default.update(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't update entity");
    }));
    test("del returns 500 when findByIdAndDelete throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndDelete: jest.fn().mockRejectedValue(new Error("db")) };
        commentsController_1.default.model = model;
        const req = { params: { id: "c1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield commentsController_1.default.del(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't delete entity");
    }));
    test("del does not enforce owner checks on base route", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "c1" }),
        };
        commentsController_1.default.model = model;
        const req = { params: { id: "c1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield commentsController_1.default.del(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    }));
    test("del succeeds when user is owner", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findById: jest.fn().mockResolvedValue({ userID: { toString: () => "u1" } }),
            findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "c1" }),
        };
        commentsController_1.default.model = model;
        const req = { params: { id: "c1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield commentsController_1.default.del(req, res);
        expect(model.findByIdAndDelete).toHaveBeenCalledWith("c1");
        expect(res.status).toHaveBeenCalledWith(200);
    }));
    test("getByPostId returns 500 on query failure", () => __awaiter(void 0, void 0, void 0, function* () {
        const populate = jest.fn().mockRejectedValue(new Error("db"));
        const model = { find: jest.fn().mockReturnValue({ populate }) };
        commentsController_1.default.model = model;
        const req = { params: { postId: "p1" } };
        const res = makeRes();
        yield commentsController_1.default.getByPostId(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    }));
    test("updateByPostId returns 500 on model failure", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
        commentsController_1.default.model = model;
        const req = {
            params: { commentId: "c1", postId: "p1" },
            body: {},
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield commentsController_1.default.updateByPostId(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error updating comment");
    }));
    test("updateByPostId returns 400 when postID is changed", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findById: jest.fn().mockResolvedValue({
                userID: { toString: () => "u1" },
                postID: { toString: () => "p1" },
                date: new Date("2024-01-01T00:00:00.000Z"),
            }),
        };
        commentsController_1.default.model = model;
        const req = {
            params: { commentId: "c1", postId: "p1" },
            body: { postID: "p2" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield commentsController_1.default.updateByPostId(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    }));
    test("updateByPostId succeeds for owner", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findById: jest.fn().mockResolvedValue({
                userID: { toString: () => "u1" },
                postID: { toString: () => "p1" },
                date: new Date("2024-01-01T00:00:00.000Z"),
            }),
            findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", content: "ok" }),
        };
        commentsController_1.default.model = model;
        const req = {
            params: { commentId: "c1", postId: "p1" },
            body: { content: "ok" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield commentsController_1.default.updateByPostId(req, res);
        expect(model.findByIdAndUpdate).toHaveBeenCalledWith("c1", { content: "ok" }, { new: true });
        expect(res.json).toHaveBeenCalledWith({ _id: "c1", content: "ok" });
    }));
    test("delByPostId returns 500 on model failure", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
        commentsController_1.default.model = model;
        const req = {
            params: { commentId: "c1", postId: "p1" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield commentsController_1.default.delByPostId(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error deleting comment");
    }));
    test("delByPostId succeeds for owner", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findById: jest.fn().mockResolvedValue({ userID: { toString: () => "u1" } }),
            findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "c1" }),
        };
        commentsController_1.default.model = model;
        const req = {
            params: { commentId: "c1", postId: "p1" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield commentsController_1.default.delByPostId(req, res);
        expect(model.findByIdAndDelete).toHaveBeenCalledWith("c1");
        expect(res.status).toHaveBeenCalledWith(200);
    }));
});
describe("LikesController unit", () => {
    let originalModel;
    let errorSpy;
    beforeEach(() => {
        originalModel = likesController_1.default.model;
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    });
    afterEach(() => {
        likesController_1.default.model = originalModel;
        errorSpy.mockRestore();
    });
    test("create sends body as-is when using base create", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { create: jest.fn().mockResolvedValue({ _id: "1" }) };
        likesController_1.default.model = model;
        const req = { params: {}, body: {}, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.create(req, res);
        expect(model.create).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(201);
    }));
    test("del returns 404 when like does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndDelete: jest.fn().mockResolvedValue(null) };
        likesController_1.default.model = model;
        const req = { params: { id: "l1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.del(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    }));
    test("del does not enforce owner checks on base route", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "l1" }),
        };
        likesController_1.default.model = model;
        const req = { params: { id: "l1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.del(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    }));
    test("del returns 500 when model throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
        likesController_1.default.model = model;
        const req = { params: { id: "l1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.del(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    }));
    test("update returns null payload when like does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) };
        likesController_1.default.model = model;
        const req = { params: { id: "l1" }, body: {}, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.update(req, res);
        expect(res.json).toHaveBeenCalledWith(null);
    }));
    test("update does not enforce owner checks on base route", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "l1" }),
        };
        likesController_1.default.model = model;
        const req = { params: { id: "l1" }, body: {}, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.update(req, res);
        expect(res.json).toHaveBeenCalledWith({ _id: "l1" });
    }));
    test("update allows changing fields on base route", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "l1", senderID: "u2" }),
        };
        likesController_1.default.model = model;
        const req = {
            params: { id: "l1" },
            body: { senderID: "u2" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield likesController_1.default.update(req, res);
        expect(res.json).toHaveBeenCalledWith({ _id: "l1", senderID: "u2" });
    }));
    test("update succeeds for owner", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findById: jest.fn().mockResolvedValue({ senderID: { toString: () => "u1" } }),
            findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "l1" }),
        };
        likesController_1.default.model = model;
        const req = {
            params: { id: "l1" },
            body: { senderID: "u1" },
            user: { _id: "u1" },
        };
        const res = makeRes();
        yield likesController_1.default.update(req, res);
        expect(model.findByIdAndUpdate).toHaveBeenCalledWith("l1", { senderID: "u1" }, { new: true });
        expect(res.json).toHaveBeenCalledWith({ _id: "l1" });
    }));
    test("update returns 500 when model throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
        likesController_1.default.model = model;
        const req = { params: { id: "l1" }, body: {}, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.update(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    }));
    test("getByPostId returns 500 when query fails", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { find: jest.fn().mockRejectedValue(new Error("db")) };
        likesController_1.default.model = model;
        const req = { params: { postID: "p1" } };
        const res = makeRes();
        yield likesController_1.default.getByPostId(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    }));
    test("delByPostId returns 500 when findOne fails", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findOne: jest.fn().mockRejectedValue(new Error("db")) };
        likesController_1.default.model = model;
        const req = { params: { postID: "p1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.delByPostId(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    }));
    test("delByPostId returns 404 when no like exists for user/post", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findOne: jest.fn().mockResolvedValue(null) };
        likesController_1.default.model = model;
        const req = { params: { postID: "p1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.delByPostId(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    }));
    test("delByPostId deletes and returns like", () => __awaiter(void 0, void 0, void 0, function* () {
        const like = { _id: "l1", postID: "p1", senderID: "u1" };
        const model = {
            findOne: jest.fn().mockResolvedValue(like),
            findByIdAndDelete: jest.fn().mockResolvedValue(like),
        };
        likesController_1.default.model = model;
        const req = { params: { postID: "p1" }, user: { _id: "u1" } };
        const res = makeRes();
        yield likesController_1.default.delByPostId(req, res);
        expect(model.findByIdAndDelete).toHaveBeenCalledWith("l1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(like);
    }));
});
//# sourceMappingURL=controllers.unit.test.js.map