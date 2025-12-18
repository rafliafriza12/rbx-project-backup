import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Vercel serverless function config
export const maxDuration = 60; // Max 60 seconds for Pro plan, 10 for Hobby
export const dynamic = "force-dynamic";

// Check if running in Vercel/serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Get browser executable path
async function getBrowser() {
  if (isServerless) {
    // Vercel/Serverless: use @sparticuz/chromium
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // Local development: use system Chrome/Chromium
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ].filter(Boolean);

    let executablePath = possiblePaths[0];

    // Find first existing path
    for (const path of possiblePaths) {
      if (path) {
        try {
          const fs = await import("fs");
          if (fs.existsSync(path)) {
            executablePath = path;
            break;
          }
        } catch {
          // Continue to next path
        }
      }
    }

    return puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--single-process",
      ],
    });
  }
}

export async function POST(req: NextRequest) {
  let browser;
  try {
    const { robloxCookie, productId, productName } = await req.json();

    if (!robloxCookie || !productId || !productName) {
      return NextResponse.json(
        {
          success: false,
          message: "robloxCookie, productId, productName wajib diisi",
        },
        { status: 400 }
      );
    }

    console.log("🎯 Attempting to purchase gamepass with Puppeteer:", {
      productId,
      productName,
      cookie: robloxCookie ? "[PRESENT]" : "[MISSING]",
      isServerless,
    });

    // Format product name: replace spaces with hyphens
    const formattedProductName = productName.replace(/\s+/g, "-");
    const gamepassUrl = `https://www.roblox.com/game-pass/${productId}/${formattedProductName}`;

    console.log("🌐 Gamepass URL:", gamepassUrl);

    // Launch browser using helper function
    browser = await getBrowser();
    console.log("🚀 Browser launched successfully");

    const page = await browser.newPage();

    // Set cookie before navigation
    await page.setCookie({
      name: ".ROBLOSECURITY",
      value: robloxCookie,
      domain: ".roblox.com",
      path: "/",
      httpOnly: true,
      secure: true,
    });

    console.log("🔐 Cookie seadmin/dashboardt successfully");

    // Navigate to gamepass page
    await page.goto(gamepassUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("📄 Page loaded, looking for Buy button...");

    // Wait for and click the main Buy button using XPath
    const buyButtonXPath =
      "/html/body/div[3]/main/div[2]/div[1]/div[2]/div[3]/div[1]/div[2]/button";

    try {
      // Wait for button to appear
      await page.waitForFunction(
        (xpath: string) => {
          const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          return result.singleNodeValue !== null;
        },
        { timeout: 10000 },
        buyButtonXPath
      );

      // Click using evaluate
      await page.evaluate((xpath: string) => {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const button = result.singleNodeValue as HTMLElement;
        if (button) button.click();
      }, buyButtonXPath);

      console.log("🖱️ Clicked Buy button...");

      // Wait for confirmation modal
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("⏳ Waiting for confirmation modal...");

      // Click Buy Now button in modal
      const buyNowButtonXPath =
        "/html/body/div[13]/div/div/div/div/div[2]/div[2]/a[1]";

      await page.waitForFunction(
        (xpath: string) => {
          const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          return result.singleNodeValue !== null;
        },
        { timeout: 10000 },
        buyNowButtonXPath
      );

      await page.evaluate((xpath: string) => {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const button = result.singleNodeValue as HTMLElement;
        if (button) button.click();
      }, buyNowButtonXPath);

      console.log("✅ Clicked Buy Now button...");

      // Wait for purchase to complete
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("🎉 Purchase completed successfully!");

      return NextResponse.json({
        success: true,
        message: "Gamepass purchased successfully using Puppeteer",
      });
    } catch (clickError: any) {
      console.error("❌ Error during click operation:", clickError.message);

      return NextResponse.json(
        {
          success: false,
          message: `Failed to click buttons: ${clickError.message}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error in buy-pass API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  } finally {
    // Always close browser
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }
  }
}
