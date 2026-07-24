/**
 * Playwright 浏览器单例管理
 */

import { chromium, type Browser, type BrowserContext } from "playwright";

let browser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;
const MAX_WAIT_MS = 30000;
const CREATE_CONTEXT_TIMEOUT_MS = 15000;

async function doLaunch(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    timeout: 30000,
  });
}

export async function getBrowser(): Promise<Browser> {
  // 快速路径：已连接
  if (browser && browser.isConnected()) return browser;

  // 如果 browser 存在但已断开，先清理再重新启动
  if (browser && !browser.isConnected()) {
    try {
      await browser.close();
    } catch {
      // ignore
    }
    browser = null;
  }

  // 如果正在启动，等待完成
  if (launchPromise) {
    const start = Date.now();
    while (launchPromise) {
      if (Date.now() - start > MAX_WAIT_MS) {
        throw new Error("浏览器启动超时");
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    if (browser && browser.isConnected()) return browser;
  }

  // 加锁启动
  launchPromise = doLaunch();
  try {
    browser = await launchPromise;
    return browser;
  } catch (e) {
    browser = null;
    throw e;
  } finally {
    launchPromise = null;
  }
}

export async function createContext(): Promise<BrowserContext> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`createContext 超时（${CREATE_CONTEXT_TIMEOUT_MS}ms）`)),
      CREATE_CONTEXT_TIMEOUT_MS,
    ),
  );

  try {
    return await Promise.race([doCreateContextWithRetry(), timeoutPromise]);
  } catch (e) {
    if (e instanceof Error && e.message.includes("超时")) {
      throw e;
    }
    throw e;
  }
}

async function doCreateContextWithRetry(): Promise<BrowserContext> {
  try {
    const b = await getBrowser();
    return await b.newContext({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 2,
    });
  } catch (firstError) {
    // 浏览器可能已崩溃，关闭旧实例并重试一次
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
      browser = null;
    }
    const b = await getBrowser();
    return await b.newContext({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 2,
    });
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close();
    } catch {
      // ignore
    }
    browser = null;
  }
}

async function gracefulClose() {
  if (browser) {
    try {
      await browser.close();
    } catch {
      // ignore
    }
    browser = null;
  }
}

process.on("SIGINT", gracefulClose);
process.on("SIGTERM", gracefulClose);
