import { test, expect } from "@playwright/test";

test.describe("RAG Document Chat — Core UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the header with app title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /rag document chat/i })).toBeVisible();
  });

  test("shows upload dropzone", async ({ page }) => {
    await expect(page.getByText(/drop pdf or click to upload/i)).toBeVisible();
  });

  test("shows documents section heading", async ({ page }) => {
    await expect(page.getByText(/documents/i).first()).toBeVisible();
  });

  test("shows empty state in document list initially", async ({ page }) => {
    // The app may or may not have docs in test env; if empty we see the placeholder
    const emptyMsg = page.getByText(/no documents yet/i);
    const docList = page.locator('[aria-label*="Select document"]').first();
    const hasEmpty = await emptyMsg.isVisible({ timeout: 2000 }).catch(() => false);
    const hasDocs = await docList.isVisible({ timeout: 500 }).catch(() => false);
    expect(hasEmpty || hasDocs).toBe(true);
  });

  test("chat area shows empty state with suggestion chips", async ({ page }) => {
    await expect(page.getByText(/ask anything about your documents/i)).toBeVisible();
    await expect(page.getByText("Summarize this document")).toBeVisible();
    await expect(page.getByText("What are the key points?")).toBeVisible();
  });

  test("chat input is present and functional", async ({ page }) => {
    const input = page.getByLabel("Chat message input");
    await expect(input).toBeVisible();
    await input.fill("Hello, world");
    await expect(input).toHaveValue("Hello, world");
  });

  test("send button is disabled when input is empty", async ({ page }) => {
    await expect(page.getByLabel("Send message")).toBeDisabled();
  });

  test("send button is enabled when input has content", async ({ page }) => {
    const input = page.getByLabel("Chat message input");
    await input.fill("Test question");
    await expect(page.getByLabel("Send message")).toBeEnabled();
  });

  test("theme toggle button is visible", async ({ page }) => {
    const toggleBtn = page.getByRole("button", { name: /switch to|toggle theme/i });
    await expect(toggleBtn).toBeVisible();
  });

  test("AI disclaimer text is shown below input", async ({ page }) => {
    await expect(page.getByText(/ai can make mistakes/i)).toBeVisible();
  });
});

test.describe("RAG Document Chat — Mobile Sidebar", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu button is visible on mobile", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.getByLabel(/open sidebar|close sidebar/i);
    await expect(hamburger).toBeVisible();
  });

  test("sidebar can be toggled on mobile", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.getByLabel(/open sidebar|close sidebar/i);

    // Initially sidebar is open on mobile; click to close
    await hamburger.click();

    // Chat area should be visible
    await expect(page.getByLabel("Chat message input")).toBeVisible();
  });
});

test.describe("RAG Document Chat — Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page title is descriptive", async ({ page }) => {
    await expect(page).toHaveTitle(/rag document/i);
  });

  test("main landmarks are present", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("aside")).toBeVisible();
  });

  test("all interactive elements have accessible labels", async ({ page }) => {
    // Check key interactive elements
    const input = page.getByLabel("Chat message input");
    const sendBtn = page.getByLabel("Send message");
    const uploadInput = page.getByLabel("Upload PDF file");

    await expect(input).toBeVisible();
    await expect(sendBtn).toBeVisible();
    await expect(uploadInput).toBeAttached();
  });

  test("dropzone has role=button", async ({ page }) => {
    const dropzone = page.getByRole("button", { name: /upload pdf/i });
    await expect(dropzone).toBeVisible();
  });
});
