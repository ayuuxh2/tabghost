import type { BrowserContext } from "playwright";

/**
 * Automation actions run against a live session's BrowserContext. These are the
 * verbs agents use to drive a sub-profile. The first (or a matching) page is
 * targeted; a new page is opened if none exist.
 */

export type Action =
  | { action: "navigate"; url: string; waitUntil?: "load" | "domcontentloaded" | "networkidle" }
  | { action: "click"; selector: string; timeout?: number }
  | { action: "fill"; selector: string; value: string; timeout?: number }
  | { action: "type"; selector: string; value: string; delay?: number }
  | { action: "text"; selector?: string }
  | { action: "html"; selector?: string }
  | { action: "screenshot"; fullPage?: boolean }
  | { action: "waitFor"; selector: string; timeout?: number }
  | { action: "eval"; expression: string }
  | { action: "cookies" }
  | { action: "pages" };

async function firstPage(context: BrowserContext) {
  const pages = context.pages();
  if (pages.length > 0) return pages[0];
  return await context.newPage();
}

export async function runAction(context: BrowserContext, body: Action): Promise<unknown> {
  const page = await firstPage(context);

  switch (body.action) {
    case "navigate": {
      await page.goto(body.url, { waitUntil: body.waitUntil ?? "domcontentloaded" });
      return { url: page.url(), title: await page.title() };
    }
    case "click": {
      await page.click(body.selector, { timeout: body.timeout ?? 15000 });
      return { clicked: body.selector };
    }
    case "fill": {
      await page.fill(body.selector, body.value, { timeout: body.timeout ?? 15000 });
      return { filled: body.selector };
    }
    case "type": {
      await page.type(body.selector, body.value, { delay: body.delay ?? 20 });
      return { typed: body.selector };
    }
    case "text": {
      if (body.selector) return { text: await page.textContent(body.selector) };
      return { text: await page.evaluate(() => document.body.innerText) };
    }
    case "html": {
      if (body.selector) return { html: await page.innerHTML(body.selector) };
      return { html: await page.content() };
    }
    case "screenshot": {
      const buf = await page.screenshot({ fullPage: body.fullPage ?? false });
      return { screenshot: `data:image/png;base64,${buf.toString("base64")}` };
    }
    case "waitFor": {
      await page.waitForSelector(body.selector, { timeout: body.timeout ?? 15000 });
      return { ready: body.selector };
    }
    case "eval": {
      const value = await page.evaluate((expr) => {
        // eslint-disable-next-line no-eval
        return eval(expr);
      }, body.expression);
      return { value };
    }
    case "cookies": {
      return { cookies: await context.cookies() };
    }
    case "pages": {
      return { pages: context.pages().map((p) => ({ url: p.url() })) };
    }
    default: {
      throw new Error(`unknown action: ${(body as { action: string }).action}`);
    }
  }
}
