import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { requireAdmin, requireApiKey } from "@/lib/auth";

// Sensitive fields that should NEVER be exposed in GET response
const SENSITIVE_FIELDS = [
  "midtransServerKey",
  "midtransClientKey",
  "duitkuMerchantCode",
  "duitkuApiKey",
  "duitkuCallbackUrl",
  "duitkuReturnUrl",
  "emailPassword",
  "emailUser",
  "robuxApiKey",
  "gamepassApiKey",
  "discordWebhookUrl",
  "telegramBotToken",
  "telegramChatId",
  "webhookUrl",
];

// Mask a sensitive string (show first 4 chars + ***)
function maskValue(val: string): string {
  if (!val || val.length <= 4) return "****";
  return val.substring(0, 4) + "****" + val.substring(val.length - 2);
}

// GET - Retrieve settings (Admin only - sensitive fields masked)
export async function GET(request: NextRequest) {
  try {
    const apiKeyError = requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    // Auth check - hanya admin
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const settings = await Settings.getSiteSettings();
    const settingsObj = settings.toObject();

    // Mask sensitive fields
    for (const field of SENSITIVE_FIELDS) {
      if (settingsObj[field]) {
        settingsObj[field] = maskValue(settingsObj[field]);
      }
    }

    return NextResponse.json({
      message: "Settings berhasil diambil",
      settings: settingsObj,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Gagal mengambil settings" },
      { status: 500 },
    );
  }
}

// PUT - Update settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const apiKeyError = requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    // Auth check - hanya admin
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const body = await request.json();

    // Get existing settings or create new one
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Update fields - skip masked values (don't overwrite with "****")
    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined) {
        // Don't overwrite sensitive fields with masked values
        if (
          SENSITIVE_FIELDS.includes(key) &&
          typeof body[key] === "string" &&
          body[key].includes("****")
        ) {
          return; // Skip - user didn't change this field
        }
        settings[key] = body[key];
      }
    });

    await settings.save();

    // Mask response
    const settingsObj = settings.toObject();
    for (const field of SENSITIVE_FIELDS) {
      if (settingsObj[field]) {
        settingsObj[field] = maskValue(settingsObj[field]);
      }
    }

    return NextResponse.json({
      message: "Settings berhasil diupdate",
      settings: settingsObj,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate settings" },
      { status: 500 },
    );
  }
}

// POST - Reset settings to default (Admin only)
export async function POST(request: NextRequest) {
  try {
    const apiKeyError = requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    // Auth check - hanya admin
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    // Delete existing settings
    await Settings.deleteMany({});

    // Create new default settings
    const settings = await Settings.create({});

    const settingsObj = settings.toObject();
    for (const field of SENSITIVE_FIELDS) {
      if (settingsObj[field]) {
        settingsObj[field] = maskValue(settingsObj[field]);
      }
    }

    return NextResponse.json({
      message: "Settings berhasil direset ke default",
      settings: settingsObj,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    return NextResponse.json(
      { error: "Gagal mereset settings" },
      { status: 500 },
    );
  }
}
