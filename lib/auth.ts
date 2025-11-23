import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authenticateToken = async (request: NextRequest): Promise<any> => {
  await connectDB();
  
  const token = request.cookies.get("token")?.value;
  
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    throw new Error("Unauthorized: Invalid token");
  }
  
  const user = await User.findById(decoded.userId).select("-password");
  
  if (!user) {
    throw new Error("Unauthorized: User not found");
  }
  
  return user;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{8,15}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};
