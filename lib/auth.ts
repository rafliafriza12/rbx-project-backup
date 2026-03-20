import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
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
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string, accessRole?: string): string => {
  return jwt.sign({ userId, accessRole: accessRole || "user" }, JWT_SECRET, {
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

/**
 * Require admin role - verifies token AND checks admin role.
 * Returns the admin user if valid, or throws an error.
 * Use this in all /api/admin/* routes.
 */
export const requireAdmin = async (request: NextRequest): Promise<any> => {
  await connectDB();

  const token = request.cookies.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized: Token tidak ditemukan");
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error("Unauthorized: Token tidak valid");
  }

  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    throw new Error("Unauthorized: User tidak ditemukan");
  }

  if (user.accessRole !== "admin") {
    throw new Error("Forbidden: Akses ditolak. Hanya admin yang diizinkan.");
  }

  return user;
};

/**
 * Validate x-internal-secret API key from request headers.
 * Returns true if valid, false otherwise.
 */
export const validateApiKey = (request: NextRequest): boolean => {
  const internalSecret = request.headers.get("x-internal-secret");
  return internalSecret === process.env.INTERNAL_API_SECRET;
};

/**
 * Require valid API key. Returns 401 response if invalid.
 * Use this at the TOP of every route handler.
 */
export const requireApiKey = (request: NextRequest): NextResponse | null => {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing API key" },
      { status: 401 },
    );
  }
  return null; // API key valid, continue
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
