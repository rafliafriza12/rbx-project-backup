import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

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
    });

    // Format product name: replace spaces with hyphens
    const formattedProductName = productName.replace(/\s+/g, "-");
    const gamepassUrl = `https://www.roblox.com/game-pass/${productId}/${formattedProductName}`;

    console.log("🌐 Gamepass URL:", gamepassUrl);

    // Launch browser in headless mode (background)
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

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

    console.log("🔐 Cookie set successfully");

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
        (xpath) => {
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
      await page.evaluate((xpath) => {
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
        (xpath) => {
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

      await page.evaluate((xpath) => {
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

      // Take screenshot for debugging
      const screenshotPath =
        `/tmp/roblox-purchase-error-${Date.now()}.png` as const;
      await page.screenshot({ path: screenshotPath as `${string}.png` });
      console.log("📸 Screenshot saved to:", screenshotPath);

      return NextResponse.json(
        {
          success: false,
          message: `Failed to click buttons: ${clickError.message}`,
          screenshot: screenshotPath,
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
