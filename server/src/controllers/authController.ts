import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/usersModel";
import jwt from "jsonwebtoken";

const sendError = (code: number, message: string, res: Response) => {
  res.status(code).json({ message });
};

type GeneratedTokens = {
  token: string;
  refreshToken: string;
};

const generateToken = (userId: string): GeneratedTokens => {
  const secret = process.env.JWT_SECRET || "default_secret";
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set - Shutting down.");
    process.exit(1);
  }

  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "3600");
  const token = jwt.sign({ _id: userId }, secret, { expiresIn: expiresIn });

  const refreshExpiresIn = parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_IN || "1440",
  );
  const rand = Math.floor(Math.random() * 1000);
  const refreshToken = jwt.sign({ _id: userId, rand: rand }, secret, {
    expiresIn: refreshExpiresIn,
  });
  return { token, refreshToken };
};

const register = async (req: Request, res: Response) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!username || !email || !password) {
    return sendError(400, "Username, email and password are required", res);
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
    });
    const tokens = generateToken(user._id.toString());
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    res.status(201).json(tokens);
  } catch (err) {
    return sendError(500, "Internal server error", res);
  }
};

const login = async (req: Request, res: Response) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!username || !email || !password) {
    return sendError(400, "Username, email and password are required", res);
  }

  try {
    const user = await User.findOne({ username: username, email: email });
    if (!user) {
      return sendError(401, "Invalid username or email", res);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(401, "Invalid password", res);
    }

    const tokens = generateToken(user._id.toString());
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    res.status(200).json(tokens);
  } catch (err) {
    return sendError(500, "Internal server error", res);
  }
};

const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return sendError(400, "Refresh token is required", res);
  }

  try {
    const decoded = jwt.decode(refreshToken) as { _id: string };
    const user = await User.findById(decoded._id);
    if (!user) {
      return sendError(401, "Invalid refresh token", res);
    }
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken,
    );
    await user.save();
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return sendError(500, "Internal server error", res);
  }
};

const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return sendError(400, "Refresh token is required", res);
  }

  const secret = process.env.JWT_SECRET || "default_secret";

  try {
    const decoded = jwt.verify(refreshToken, secret) as { _id: string };
    const user = await User.findById(decoded._id);
    if (!user) {
      return sendError(401, "Invalid refresh token", res);
    }
    if (!user.refreshTokens.includes(refreshToken)) {
      user.refreshTokens = [];
      await user.save();
      console.log(" Probably stolen token for: ", user._id);
      return sendError(401, "Invalid refresh token", res);
    }
    const tokens = generateToken(decoded._id);

    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken,
    );
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    res.status(200).json(tokens);
  } catch (err) {
    return sendError(401, "Invalid refresh token", res);
  }
};

export default {
  register,
  login,
  logout,
  refreshToken,
};
