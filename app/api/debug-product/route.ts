import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  await dbConnect();
  const products = await Product.find({ category: "robux_instant" }).lean();
  return NextResponse.json(products);
}
