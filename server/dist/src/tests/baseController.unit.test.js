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
const baseController_1 = __importDefault(require("../controllers/baseController"));
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};
describe("BaseController unit", () => {
    let errorSpy;
    let logSpy;
    beforeEach(() => {
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    });
    afterEach(() => {
        errorSpy.mockRestore();
        logSpy.mockRestore();
    });
    test("getById returns 404 when entity does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findById: jest.fn().mockResolvedValue(null) };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "x" } };
        const res = makeRes();
        yield controller.getById(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith("Error: Not found");
    }));
    test("getAll returns filtered results when query exists", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { find: jest.fn().mockResolvedValue([{ _id: "1" }]) };
        const controller = new baseController_1.default(model);
        const req = { query: { a: "1" } };
        const res = makeRes();
        yield controller.getAll(req, res);
        expect(model.find).toHaveBeenCalledWith({ a: "1" });
        expect(res.json).toHaveBeenCalledWith([{ _id: "1" }]);
    }));
    test("getAll calls find() when query is undefined", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { find: jest.fn().mockResolvedValue([{ _id: "1" }]) };
        const controller = new baseController_1.default(model);
        const req = { query: undefined };
        const res = makeRes();
        yield controller.getAll(req, res);
        expect(model.find).toHaveBeenCalledWith();
    }));
    test("getAll returns 500 on query error", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { find: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { query: { a: "1" } };
        const res = makeRes();
        yield controller.getAll(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't retrieve entities");
    }));
    test("getById returns 500 when model throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "x" } };
        const res = makeRes();
        yield controller.getById(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't retrieve Entity by ID");
    }));
    test("create uses postId from params when provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { create: jest.fn().mockResolvedValue({ _id: "1" }) };
        const controller = new baseController_1.default(model);
        const req = { params: { postId: "p1" }, body: { a: 1 } };
        const res = makeRes();
        yield controller.create(req, res);
        expect(model.create).toHaveBeenCalledWith({ a: 1, postID: "p1" });
        expect(res.status).toHaveBeenCalledWith(201);
    }));
    test("create returns 500 on model error", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { create: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { params: {}, body: {} };
        const res = makeRes();
        yield controller.create(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't create entity");
    }));
    test("del returns 404 when entity is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndDelete: jest.fn().mockResolvedValue(null) };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "x" } };
        const res = makeRes();
        yield controller.del(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith("Entity not found");
    }));
    test("del returns 500 when delete throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndDelete: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "x" } };
        const res = makeRes();
        yield controller.del(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't delete entity");
    }));
    test("update returns 500 when model throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "x" }, body: { name: "n" } };
        const res = makeRes();
        yield controller.update(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't update entity");
    }));
});
//# sourceMappingURL=baseController.unit.test.js.map