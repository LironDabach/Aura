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
Object.defineProperty(exports, "__esModule", { value: true });
class BaseController {
    constructor(model) {
        this.model = model;
    }
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => setTimeout(() => resolve(), 200));
            try {
                if (req.query) {
                    const filterData = yield this.model.find(req.query);
                    return res.json(filterData);
                }
                else {
                    const data = yield this.model.find();
                    res.json(data);
                }
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't retrieve entities");
            }
        });
    }
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            console.log("Get by ID: " + id);
            try {
                const data = yield this.model.findById(id);
                if (!data) {
                    return res.status(404).send("Error: Not found");
                }
                else {
                    res.json(data);
                }
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't retrieve Entity by ID");
            }
        });
    }
    // get by post id for comments and likes
    getByPostId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.postId;
            try {
                const data = yield this.model.find({ postID: postId });
                res.json(data);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't retrieve entities by post ID");
            }
        });
    }
    //create by post id for comments and likes
    createByPostId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.postId;
            req.body.postID = postId; // Associate with the post ID from URL
            const postData = req.body;
            console.log(postData);
            try {
                const data = yield this.model.create(postData);
                res.status(201).json(data);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't create entity");
            }
        });
    }
    // delete by post id for comments and likes
    delByPostId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.postId;
            try {
                const deletedData = yield this.model.deleteMany({ postID: postId });
                if (deletedData.deletedCount === 0) {
                    res.status(404).send("Entity not found for the post");
                    return;
                }
                res.status(200).json(deletedData);
                console.log("delete data -----" + deletedData);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't delete entities for the post");
            }
        });
    }
    // Override create to handle postID for comments and likes
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.postId;
            if (postId) {
                req.body.postID = postId; // Associate with the post ID from URL
            }
            const postData = req.body;
            console.log(postData);
            try {
                const data = yield this.model.create(postData);
                res.status(201).json(data);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't create entity");
            }
        });
    }
    del(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            try {
                const deletedData = yield this.model.findByIdAndDelete(id);
                if (!deletedData) {
                    res.status(404).send("Entity not found");
                    return;
                }
                res.status(200).json(deletedData);
                console.log("delete data -----" + deletedData);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't delete entity");
            }
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const updatedData = req.body;
            try {
                const data = yield this.model.findByIdAndUpdate(id, updatedData, {
                    new: true,
                });
                res.json(data);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't update entity");
            }
        });
    }
}
exports.default = BaseController;
//# sourceMappingURL=baseController.js.map