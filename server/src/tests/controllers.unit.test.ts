import commentsController from "../controllers/commentsController";
import likesController from "../controllers/likesController";

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("CommentsController unit", () => {
  let originalModel: any;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    originalModel = (commentsController as any).model;
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (commentsController as any).model = originalModel;
    errorSpy.mockRestore();
  });

  test("create sends body as-is when using base create", async () => {
    const model = { create: jest.fn().mockResolvedValue({ _id: "1" }) };
    (commentsController as any).model = model;
    const req: any = { params: {}, body: { content: "x" }, user: { _id: "u1" } };
    const res = makeRes();

    await commentsController.create(req, res);

    expect(model.create).toHaveBeenCalledWith({ content: "x" });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("update returns null payload when comment does not exist", async () => {
    const model = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) };
    (commentsController as any).model = model;
    const req: any = { params: { id: "c1" }, body: {}, user: { _id: "u1" } };
    const res = makeRes();

    await commentsController.update(req, res);

    expect(res.json).toHaveBeenCalledWith(null);
  });

  test("update does not enforce owner checks on base route", async () => {
    const model = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", content: "updated" }),
    };
    (commentsController as any).model = model;
    const req: any = { params: { id: "c1" }, body: {}, user: { _id: "u1" } };
    const res = makeRes();

    await commentsController.update(req, res);

    expect(res.json).toHaveBeenCalledWith({ _id: "c1", content: "updated" });
  });

  test("update allows changing fields on base route", async () => {
    const model = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", userID: "u2" }),
    };
    (commentsController as any).model = model;
    const req: any = {
      params: { id: "c1" },
      body: { userID: "u2" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await commentsController.update(req, res);

    expect(res.json).toHaveBeenCalledWith({ _id: "c1", userID: "u2" });
  });

  test("update succeeds for comment owner", async () => {
    const model = {
      findById: jest.fn().mockResolvedValue({
        userID: { toString: () => "u1" },
        date: new Date("2024-01-01T00:00:00.000Z"),
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", content: "updated" }),
    };
    (commentsController as any).model = model;
    const req: any = {
      params: { id: "c1" },
      body: { content: "updated" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await commentsController.update(req, res);

    expect(model.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ _id: "c1", content: "updated" });
  });

  test("update returns 500 when findByIdAndUpdate throws", async () => {
    const model = { findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("db")) };
    (commentsController as any).model = model;
    const req: any = { params: { id: "c1" }, body: {}, user: { _id: "u1" } };
    const res = makeRes();

    await commentsController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't update entity");
  });

  test("del returns 500 when findByIdAndDelete throws", async () => {
    const model = { findByIdAndDelete: jest.fn().mockRejectedValue(new Error("db")) };
    (commentsController as any).model = model;
    const req: any = { params: { id: "c1" }, user: { _id: "u1" } };
    const res = makeRes();

    await commentsController.del(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't delete entity");
  });

  test("del does not enforce owner checks on base route", async () => {
    const model = {
      findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "c1" }),
    };
    (commentsController as any).model = model;
    const req: any = { params: { id: "c1" }, user: { _id: "u1" } };
    const res = makeRes();

    await commentsController.del(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("del succeeds when user is owner", async () => {
    const model = {
      findById: jest.fn().mockResolvedValue({ userID: { toString: () => "u1" } }),
      findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "c1" }),
    };
    (commentsController as any).model = model;
    const req: any = { params: { id: "c1" }, user: { _id: "u1" } };
    const res = makeRes();

    await commentsController.del(req, res);

    expect(model.findByIdAndDelete).toHaveBeenCalledWith("c1");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("getByPostId returns 500 on query failure", async () => {
    const populate = jest.fn().mockRejectedValue(new Error("db"));
    const model = { find: jest.fn().mockReturnValue({ populate }) };
    (commentsController as any).model = model;
    const req: any = { params: { postId: "p1" } };
    const res = makeRes();

    await commentsController.getByPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("updateByPostId returns 500 on model failure", async () => {
    const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
    (commentsController as any).model = model;
    const req: any = {
      params: { commentId: "c1", postId: "p1" },
      body: {},
      user: { _id: "u1" },
    };
    const res = makeRes();

    await commentsController.updateByPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error updating comment");
  });

  test("updateByPostId returns 400 when postID is changed", async () => {
    const model = {
      findById: jest.fn().mockResolvedValue({
        userID: { toString: () => "u1" },
        postID: { toString: () => "p1" },
        date: new Date("2024-01-01T00:00:00.000Z"),
      }),
    };
    (commentsController as any).model = model;
    const req: any = {
      params: { commentId: "c1", postId: "p1" },
      body: { postID: "p2" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await commentsController.updateByPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("updateByPostId succeeds for owner", async () => {
    const model = {
      findById: jest.fn().mockResolvedValue({
        userID: { toString: () => "u1" },
        postID: { toString: () => "p1" },
        date: new Date("2024-01-01T00:00:00.000Z"),
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "c1", content: "ok" }),
    };
    (commentsController as any).model = model;
    const req: any = {
      params: { commentId: "c1", postId: "p1" },
      body: { content: "ok" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await commentsController.updateByPostId(req, res);

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      "c1",
      { content: "ok" },
      { new: true },
    );
    expect(res.json).toHaveBeenCalledWith({ _id: "c1", content: "ok" });
  });

  test("delByPostId returns 500 on model failure", async () => {
    const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
    (commentsController as any).model = model;
    const req: any = {
      params: { commentId: "c1", postId: "p1" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await commentsController.delByPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error deleting comment");
  });

  test("delByPostId succeeds for owner", async () => {
    const model = {
      findById: jest.fn().mockResolvedValue({ userID: { toString: () => "u1" } }),
      findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "c1" }),
    };
    (commentsController as any).model = model;
    const req: any = {
      params: { commentId: "c1", postId: "p1" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await commentsController.delByPostId(req, res);

    expect(model.findByIdAndDelete).toHaveBeenCalledWith("c1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("LikesController unit", () => {
  let originalModel: any;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    originalModel = (likesController as any).model;
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (likesController as any).model = originalModel;
    errorSpy.mockRestore();
  });

  test("create sends body as-is when using base create", async () => {
    const model = { create: jest.fn().mockResolvedValue({ _id: "1" }) };
    (likesController as any).model = model;
    const req: any = { params: {}, body: {}, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.create(req, res);

    expect(model.create).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("del returns 404 when like does not exist", async () => {
    const model = { findByIdAndDelete: jest.fn().mockResolvedValue(null) };
    (likesController as any).model = model;
    const req: any = { params: { id: "l1" }, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.del(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("del does not enforce owner checks on base route", async () => {
    const model = {
      findByIdAndDelete: jest.fn().mockResolvedValue({ _id: "l1" }),
    };
    (likesController as any).model = model;
    const req: any = { params: { id: "l1" }, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.del(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("del returns 500 when model throws", async () => {
    const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
    (likesController as any).model = model;
    const req: any = { params: { id: "l1" }, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.del(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("update returns null payload when like does not exist", async () => {
    const model = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) };
    (likesController as any).model = model;
    const req: any = { params: { id: "l1" }, body: {}, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.update(req, res);

    expect(res.json).toHaveBeenCalledWith(null);
  });

  test("update does not enforce owner checks on base route", async () => {
    const model = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "l1" }),
    };
    (likesController as any).model = model;
    const req: any = { params: { id: "l1" }, body: {}, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.update(req, res);

    expect(res.json).toHaveBeenCalledWith({ _id: "l1" });
  });

  test("update allows changing fields on base route", async () => {
    const model = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "l1", senderID: "u2" }),
    };
    (likesController as any).model = model;
    const req: any = {
      params: { id: "l1" },
      body: { senderID: "u2" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await likesController.update(req, res);

    expect(res.json).toHaveBeenCalledWith({ _id: "l1", senderID: "u2" });
  });

  test("update succeeds for owner", async () => {
    const model = {
      findById: jest.fn().mockResolvedValue({ senderID: { toString: () => "u1" } }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: "l1" }),
    };
    (likesController as any).model = model;
    const req: any = {
      params: { id: "l1" },
      body: { senderID: "u1" },
      user: { _id: "u1" },
    };
    const res = makeRes();

    await likesController.update(req, res);

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      "l1",
      { senderID: "u1" },
      { new: true },
    );
    expect(res.json).toHaveBeenCalledWith({ _id: "l1" });
  });

  test("update returns 500 when model throws", async () => {
    const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
    (likesController as any).model = model;
    const req: any = { params: { id: "l1" }, body: {}, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("getByPostId returns 500 when query fails", async () => {
    const model = { find: jest.fn().mockRejectedValue(new Error("db")) };
    (likesController as any).model = model;
    const req: any = { params: { postID: "p1" } };
    const res = makeRes();

    await likesController.getByPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("delByPostId returns 500 when findOne fails", async () => {
    const model = { findOne: jest.fn().mockRejectedValue(new Error("db")) };
    (likesController as any).model = model;
    const req: any = { params: { postID: "p1" }, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.delByPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("delByPostId returns 404 when no like exists for user/post", async () => {
    const model = { findOne: jest.fn().mockResolvedValue(null) };
    (likesController as any).model = model;
    const req: any = { params: { postID: "p1" }, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.delByPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("delByPostId deletes and returns like", async () => {
    const like = { _id: "l1", postID: "p1", senderID: "u1" };
    const model = {
      findOne: jest.fn().mockResolvedValue(like),
      findByIdAndDelete: jest.fn().mockResolvedValue(like),
    };
    (likesController as any).model = model;
    const req: any = { params: { postID: "p1" }, user: { _id: "u1" } };
    const res = makeRes();

    await likesController.delByPostId(req, res);

    expect(model.findByIdAndDelete).toHaveBeenCalledWith("l1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(like);
  });
});
