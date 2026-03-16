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
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const usersModel_1 = __importDefault(require("./models/usersModel"));
const postsModel_1 = __importDefault(require("./models/postsModel"));
const commentsModel_1 = __importDefault(require("./models/commentsModel"));
const likesModel_1 = __importDefault(require("./models/likesModel"));
dotenv_1.default.config({ path: "../.env.development" });
const SEED_TAG = "SEED_AURA";
const REQUIRED_USERS = [
    {
        username: "liron_dabach",
        email: "liron_dabach@aura.local",
        password: "StrongPass123!",
    },
    {
        username: "shiran_levi",
        email: "shiran_levi@aura.local",
        password: "StrongPass123!",
    },
];
const shouldDropAllSchemas = () => {
    var _a;
    const value = (_a = process.env.SEED_DROP_ALL_SCHEMAS) !== null && _a !== void 0 ? _a : "false";
    return value.toLowerCase() === "true";
};
const seed = () => __awaiter(void 0, void 0, void 0, function* () {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error("DATABASE_URL is undefined");
    }
    yield mongoose_1.default.connect(dbUrl);
    if (shouldDropAllSchemas()) {
        yield mongoose_1.default.connection.dropDatabase();
        console.log("Dropped all collections because SEED_DROP_ALL_SCHEMAS=true");
    }
    else {
        const seededPosts = yield postsModel_1.default.find({ title: new RegExp(`^${SEED_TAG}`) }, { _id: 1 });
        const seededPostIds = seededPosts.map((post) => post._id);
        if (seededPostIds.length > 0) {
            yield commentsModel_1.default.deleteMany({ postID: { $in: seededPostIds } });
            yield likesModel_1.default.deleteMany({ postID: { $in: seededPostIds } });
            yield postsModel_1.default.deleteMany({ _id: { $in: seededPostIds } });
        }
        const users = yield Promise.all(REQUIRED_USERS.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const hashedPassword = yield bcrypt_1.default.hash(user.password, 10);
            return usersModel_1.default.findOneAndUpdate({ username: user.username }, {
                username: user.username,
                email: user.email,
                password: hashedPassword,
                refreshTokens: [],
            }, {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            });
        })));
        const userIds = users.map((user) => user._id);
        const postsToCreate = Array.from({ length: 12 }, (_, i) => ({
            title: `${SEED_TAG} Post ${i + 1}`,
            body: `${SEED_TAG} Body for post ${i + 1}`,
            senderID: userIds[i % userIds.length],
            imageUrl: `https://picsum.photos/seed/aura-seed-${i + 1}/640/360`,
        }));
        const createdPosts = yield postsModel_1.default.insertMany(postsToCreate);
        const commentsToCreate = Array.from({ length: 20 }, (_, i) => ({
            postID: createdPosts[i % createdPosts.length]._id,
            userID: userIds[i % userIds.length],
            content: `${SEED_TAG} Comment ${i + 1}`,
        }));
        const createdComments = yield commentsModel_1.default.insertMany(commentsToCreate);
        const likesToCreate = Array.from({ length: 20 }, (_, i) => ({
            postID: createdPosts[i % createdPosts.length]._id,
            senderID: userIds[(i + 1) % userIds.length],
        }));
        const createdLikes = yield likesModel_1.default.insertMany(likesToCreate);
        console.log("Seed completed:");
        console.log(`users: ${users.length} (only liron_dabach and shiran_levi)`);
        console.log(`posts: ${createdPosts.length}`);
        console.log(`comments: ${createdComments.length}`);
        console.log(`likes: ${createdLikes.length}`);
    }
});
seed()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
    process.exit(0);
}))
    .catch((error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("Seed failed:", error);
    yield mongoose_1.default.connection.close();
    process.exit(1);
}));
//# sourceMappingURL=seed.js.map