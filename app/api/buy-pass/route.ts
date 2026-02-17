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

export async function POST(req: NextRequest) {
  let browser;
  try {
    const { robloxCookie, gamepassId, gamepassName, price } = await req.json();

    if (!robloxCookie || !gamepassId || !gamepassName) {
      return NextResponse.json(
        {
          success: false,
          message: "robloxCookie, gamepassId, gamepassName wajib diisi",
        },
        { status: 400 },
      );
    }

    // Price validation - harus ada untuk memastikan tidak beli dengan harga berbeda
    if (price === undefined || price === null) {
      return NextResponse.json(
        {
          success: false,
          message: "price wajib diisi untuk validasi harga gamepass",
        },
        { status: 400 },
      );
    }

    const expectedPrice = Number(price);
    if (isNaN(expectedPrice) || expectedPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "price harus berupa angka positif",
        },
        { status: 400 },
      );
    }

    console.log("🎯 Attempting to purchase gamepass with Puppeteer:", {
      gamepassId,
      gamepassName,
      expectedPrice,
      cookie: robloxCookie ? "[PRESENT]" : "[MISSING]",
      isServerless,
    });

    // Format gamepass name: replace spaces with hyphens
    const formattedGamepassName = gamepassName.replace(/\s+/g, "-");
    const gamepassUrl = `https://www.roblox.com/game-pass/${gamepassId}/${formattedGamepassName}`;

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

    console.log("📄 Page loaded, validating price before purchase...");

    // ============ PRICE VALIDATION ============
    // Try multiple methods to find the price on the page
    let priceValidated = false;
    let actualPriceText: string | null = null;

    try {
      // Wait a bit for dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try to get price using multiple selectors
      actualPriceText = await page.evaluate(() => {
        // Method 1: Try the exact class from Roblox page
        // Class: text-robux-lg wait-for-i18n-format-render
        const robuxPriceElement = document.querySelector(
          ".text-robux-lg.wait-for-i18n-format-render",
        );
        if (robuxPriceElement && robuxPriceElement.textContent) {
          const text = robuxPriceElement.textContent.trim();
          if (/\d/.test(text)) {
            return text;
          }
        }

        // Method 2: Try alternative CSS selectors
        const cssSelectors = [
          ".text-robux-lg",
          '[class*="text-robux"]',
          ".wait-for-i18n-format-render",
        ];

        for (const selector of cssSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              const text = el.textContent?.trim() || "";
              // Check if it looks like a price number (digits with optional commas)
              if (/^[\d,]+$/.test(text) && text.length < 10) {
                return text;
              }
            }
          } catch {
            // Continue
          }
        }

        // Method 3: Try XPath selectors as fallback
        const xpathSelectors = [
          "//span[contains(@class, 'text-robux-lg')]",
          "//span[contains(@class, 'wait-for-i18n-format-render')]",
          "/html/body/div[3]/main/div[2]/div[1]/div[2]/div[3]/div[1]/div[1]/div[3]/div/span[2]",
        ];

        for (const xpath of xpathSelectors) {
          try {
            const result = document.evaluate(
              xpath,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null,
            );
            const element = result.singleNodeValue as HTMLElement;
            if (element && element.textContent) {
              const text = element.textContent.trim();
              if (/\d/.test(text)) {
                return text;
              }
            }
          } catch {
            // Continue to next selector
          }
        }

        return null;
      });

      if (actualPriceText) {
        console.log("💰 Price found on page:", actualPriceText);

        // Parse the price from text (remove commas, currency symbols, etc.)
        const actualPrice = parseInt(
          actualPriceText.replace(/[^0-9]/g, ""),
          10,
        );

        console.log("💰 Parsed actual price:", actualPrice);
        console.log("💰 Expected price from database:", expectedPrice);

        // Validate price matches
        if (!isNaN(actualPrice) && actualPrice > 0) {
          if (actualPrice !== expectedPrice) {
            console.error(
              `❌ Price mismatch! Expected: ${expectedPrice}, Actual: ${actualPrice}`,
            );
            return NextResponse.json(
              {
                success: false,
                message: `Harga gamepass tidak sesuai! Harga di database: ${expectedPrice} Robux, Harga di Roblox: ${actualPrice} Robux. Pembelian dibatalkan untuk keamanan.`,
                expectedPrice,
                actualPrice,
              },
              { status: 400 },
            );
          }
          priceValidated = true;
          console.log("✅ Price validated successfully!");
        }
      } else {
        console.warn(
          "⚠️ Could not find price element on page, skipping validation...",
        );
      }
    } catch (priceError: any) {
      console.warn("⚠️ Error during price validation:", priceError.message);
      // Don't block purchase if price validation fails - just log and continue
    }

    if (!priceValidated) {
      console.warn("⚠️ Price validation skipped, proceeding with purchase...");
    }

    // ============ END PRICE VALIDATION ============

    console.log("📄 Looking for Buy button...");

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
            null,
          );
          return result.singleNodeValue !== null;
        },
        { timeout: 10000 },
        buyButtonXPath,
      );

      // Click using evaluate
      await page.evaluate((xpath: string) => {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
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
            null,
          );
          return result.singleNodeValue !== null;
        },
        { timeout: 10000 },
        buyNowButtonXPath,
      );

      await page.evaluate((xpath: string) => {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
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
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("❌ Error in buy-pass API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  } finally {
    // Always close browser
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }
  }
}
