import BaseController from "../controllers/baseController";

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("BaseController unit", () => {
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  test("getById returns 404 when entity does not exist", async () => {
    const model = { findById: jest.fn().mockResolvedValue(null) };
    const controller = new BaseController(model);
    const req: any = { params: { id: "x" } };
    const res = makeRes();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Error: Not found");
  });

  test("getAll returns filtered results when query exists", async () => {
    const model = { find: jest.fn().mockResolvedValue([{ _id: "1" }]) };
    const controller = new BaseController(model);
    const req: any = { query: { a: "1" } };
    const res = makeRes();

    await controller.getAll(req, res);

    expect(model.find).toHaveBeenCalledWith({ a: "1" });
    expect(res.json).toHaveBeenCalledWith([{ _id: "1" }]);
  });

  test("getAll calls find() when query is undefined", async () => {
    const model = { find: jest.fn().mockResolvedValue([{ _id: "1" }]) };
    const controller = new BaseController(model);
    const req: any = { query: undefined };
    const res = makeRes();

    await controller.getAll(req, res);

    expect(model.find).toHaveBeenCalledWith();
  });

  test("getAll returns 500 on query error", async () => {
    const model = { find: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { query: { a: "1" } };
    const res = makeRes();

    await controller.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't retrieve entities");
  });

  test("getById returns 500 when model throws", async () => {
    const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { params: { id: "x" } };
    const res = makeRes();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't retrieve Entity by ID");
  });

  test("create uses postId from params when provided", async () => {
    const model = { create: jest.fn().mockResolvedValue({ _id: "1" }) };
    const controller = new BaseController(model);
    const req: any = { params: { postId: "p1" }, body: { a: 1 } };
    const res = makeRes();

    await controller.create(req, res);

    expect(model.create).toHaveBeenCalledWith({ a: 1, postID: "p1" });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("create returns 500 on model error", async () => {
    const model = { create: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { params: {}, body: {} };
    const res = makeRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't create entity");
  });

  test("del returns 404 when entity is missing", async () => {
    const model = { findByIdAndDelete: jest.fn().mockResolvedValue(null) };
    const controller = new BaseController(model);
    const req: any = { params: { id: "x" } };
    const res = makeRes();

    await controller.del(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Entity not found");
  });

  test("del returns 500 when delete throws", async () => {
    const model = { findByIdAndDelete: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { params: { id: "x" } };
    const res = makeRes();

    await controller.del(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't delete entity");
  });

  test("update returns 500 when model throws", async () => {
    const model = { findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { params: { id: "x" }, body: { name: "n" } };
    const res = makeRes();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't update entity");
  });
});
