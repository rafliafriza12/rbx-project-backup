import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export interface OrderData {
  userId?: string;
  amount: number;
  orderId: string;
  productType: string;
  productDetails: any;
}

export async function processOrderAndUpdateSpending(
  request: NextRequest,
  orderData: OrderData
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;

    if (token) {
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.userId);

        if (user) {
          // Update user's spending
          user.spendedMoney += orderData.amount;
          await user.save();

          return {
            success: true,
            user: {
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              countryCode: user.countryCode,
              accessRole: user.accessRole,
              memberRole: user.memberRole,
              spendedMoney: user.spendedMoney,
              isVerified: user.isVerified,
            },
          };
        }
      }
    }

    // If no valid user found, still process order but don't update spending
    return { success: true };
  } catch (error: any) {
    console.error("Process order error:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserSpendingStats(userId: string) {
  try {
    await dbConnect();

    const user = await User.findById(userId).select(
      "spendedMoney memberRole accessRole"
    );

    if (!user) {
      return null;
    }

    return {
      totalSpent: user.spendedMoney,
      memberRole: user.memberRole,
      accessRole: user.accessRole,
    };
  } catch (error) {
    console.error("Get spending stats error:", error);
    return null;
  }
}
