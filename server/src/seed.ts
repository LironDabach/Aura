import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import usersModel from "./models/usersModel";
import postsModel from "./models/postsModel";
import commentsModel from "./models/commentsModel";
import likesModel from "./models/likesModel";

dotenv.config({ path: ".env.development" });

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

const shouldDropAllSchemas = (): boolean => {
  const value = process.env.SEED_DROP_ALL_SCHEMAS ?? "false";
  return value.toLowerCase() === "true";
};

const seed = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is undefined");
  }

  await mongoose.connect(dbUrl);

  if (shouldDropAllSchemas()) {
    await mongoose.connection.dropDatabase();
    console.log("Dropped all collections because SEED_DROP_ALL_SCHEMAS=true");
  } else {
    const seededPosts = await postsModel.find(
      { title: new RegExp(`^${SEED_TAG}`) },
      { _id: 1 },
    );
    const seededPostIds = seededPosts.map((post) => post._id);
    if (seededPostIds.length > 0) {
      await commentsModel.deleteMany({ postID: { $in: seededPostIds } });
      await likesModel.deleteMany({ postID: { $in: seededPostIds } });
      await postsModel.deleteMany({ _id: { $in: seededPostIds } });
    }

    const users = await Promise.all(
      REQUIRED_USERS.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return usersModel.findOneAndUpdate(
          { username: user.username },
          {
            username: user.username,
            email: user.email,
            password: hashedPassword,
            refreshTokens: [],
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          },
        );
      }),
    );

    const userIds = users.map((user) => user!._id);

    const postsToCreate = Array.from({ length: 12 }, (_, i) => ({
      title: `${SEED_TAG} Post ${i + 1}`,
      body: `${SEED_TAG} Body for post ${i + 1}`,
      senderID: userIds[i % userIds.length],
    }));
    const createdPosts = await postsModel.insertMany(postsToCreate);

    const commentsToCreate = Array.from({ length: 20 }, (_, i) => ({
      postID: createdPosts[i % createdPosts.length]._id,
      userID: userIds[i % userIds.length],
      content: `${SEED_TAG} Comment ${i + 1}`,
    }));
    const createdComments = await commentsModel.insertMany(commentsToCreate);

    const likesToCreate = Array.from({ length: 20 }, (_, i) => ({
      postID: createdPosts[i % createdPosts.length]._id,
      senderID: userIds[(i + 1) % userIds.length],
    }));
    const createdLikes = await likesModel.insertMany(likesToCreate);

    console.log("Seed completed:");
    console.log(`users: ${users.length} (only liron_dabach and shiran_levi)`);
    console.log(`posts: ${createdPosts.length}`);
    console.log(`comments: ${createdComments.length}`);
    console.log(`likes: ${createdLikes.length}`);
  }
};

seed()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  });
