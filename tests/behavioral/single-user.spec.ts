/**
 * Behavioural tests - single user (moderator / presenter only).
 *
 * The Picture-in-Picture plugin exposes a single action-button dropdown toggle
 * that flips an "active" flag, updates its own label/icon and persists the flag
 * to localStorage under 'pip-plugin-active'. These tests drive that toggle from
 * the client DOM (where it lives), which is fully reachable by Playwright.
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  test, expect, BrowserContext, Browser, APIRequestContext, TestInfo,
} from '@playwright/test';
import { checkPluginAvailability } from '../core/fixtures/pluginBeforeAll';
import { ELEMENT_WAIT_LONGER_TIME } from '../core/constants';
import { elements as e } from '../elements';
import { SessionPage as ModPage } from '../core/sessionPage';
import { Plugin } from '../core/plugin';
import { encodeCustomParams } from '../core/helpers';

const PLUGIN_NAME = 'picture-in-picture';
const ENV_VAR_NAME = 'PICTURE_IN_PICTURE_PLUGIN_URL';
const STORAGE_KEY = 'pip-plugin-active';

let pluginUrl: string | undefined = process.env[ENV_VAR_NAME];
const setPluginUrl = (url: string) => { pluginUrl = url; };
const getPluginUrl = () => pluginUrl;

/** Open the actions dropdown if the PiP toggle item is not already visible. */
async function openActionsDropdown(modPage: ModPage) {
  const item = modPage.page.locator(e.pipActionButton).first();
  if (!(await item.isVisible())) {
    await modPage.page.click(e.actions);
    await item.waitFor({ state: 'visible', timeout: ELEMENT_WAIT_LONGER_TIME });
  }
  return item;
}

const readActiveFlag = (modPage: ModPage) => modPage.page.evaluate(
  (key) => localStorage.getItem(key),
  STORAGE_KEY,
);

const ISOLATED = process.env.TEST_MEETINGS === 'isolated';

// ── Tests ─────────────────────────────────────────────────────────────────────
test.describe('Picture-in-Picture Plugin - Behavioural (single user)', () => {
  test.describe.configure({ mode: ISOLATED ? 'default' : 'serial' });

  let modPage: ModPage;
  let sharedContext: BrowserContext;

  async function setupMeeting(browser: Browser, request: APIRequestContext, testInfo: TestInfo) {
    await checkPluginAvailability({
      pluginName: PLUGIN_NAME,
      envVarName: ENV_VAR_NAME,
      setPluginUrl,
      getPluginUrl,
    })({ request }, testInfo);

    const resolvedUrl = getPluginUrl();
    if (!resolvedUrl) return;

    const createParameter = encodeCustomParams(
      `pluginManifests=${JSON.stringify([{ url: resolvedUrl }])}`,
    );
    sharedContext = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write', 'camera', 'microphone'],
      viewport: { width: 1280, height: 720 },
    });
    const page = await sharedContext.newPage();
    const plugin = new Plugin({ browser, context: sharedContext });
    await plugin.initModPage(page, { createParameter });
    modPage = plugin.modPage;
  }

  if (ISOLATED) {
    test.beforeEach(async ({ browser, request }, testInfo) => {
      await setupMeeting(browser, request, testInfo);
    });
    test.afterEach(async () => {
      await sharedContext?.close();
    });
  } else {
    test.beforeAll(async ({ browser, request }, testInfo) => {
      await setupMeeting(browser, request, testInfo);
    });
    test.afterAll(async () => {
      await sharedContext?.close();
    });
    test.afterEach(async () => {
      if (modPage && await modPage.page.locator(e.pipActionButton).first().isVisible()) {
        await modPage.page.keyboard.press('Escape');
      }
    });
  }

  test('should default to the active state ("Deactivate PiP Window") on a fresh session', async (): Promise<void> => {
    await modPage.page.waitForSelector(e.whiteboard, { timeout: ELEMENT_WAIT_LONGER_TIME });
    const item = await openActionsDropdown(modPage);
    const label = (await item.textContent())?.trim();
    // With no stored flag the plugin defaults active=true, so the toggle offers
    // to DEACTIVATE. (Runs first in serial mode, before any toggle mutates it.)
    expect(label, 'fresh session should show the "Deactivate PiP Window" label').toBe('Deactivate PiP Window');
  });

  test('should toggle the label and persist the flag to localStorage when clicked', async (): Promise<void> => {
    await modPage.page.waitForSelector(e.whiteboard, { timeout: ELEMENT_WAIT_LONGER_TIME });
    const item = await openActionsDropdown(modPage);
    const before = (await item.textContent())?.trim();
    expect(before, 'toggle item should carry a PiP Window label').toMatch(/(Activate|Deactivate) PiP Window/);

    // First toggle.
    await item.click();
    const itemAfter = await openActionsDropdown(modPage);
    const after = (await itemAfter.textContent())?.trim();
    expect(after, 'label should switch to the opposite action after a click').not.toBe(before);
    expect(after, 'label should still be a PiP Window action').toMatch(/(Activate|Deactivate) PiP Window/);

    // The persisted flag must agree with the shown label: "Deactivate" => active.
    const flagAfter = await readActiveFlag(modPage);
    const expectedFlag = after === 'Deactivate PiP Window' ? 'true' : 'false';
    expect(flagAfter, 'localStorage flag should mirror the toggled state').toBe(expectedFlag);

    // Second toggle restores the original label and flag.
    await itemAfter.click();
    const itemRestored = await openActionsDropdown(modPage);
    const restored = (await itemRestored.textContent())?.trim();
    expect(restored, 'a second click should restore the original label').toBe(before);
    const flagRestored = await readActiveFlag(modPage);
    expect(flagRestored, 'localStorage flag should mirror the restored state').toBe(
      restored === 'Deactivate PiP Window' ? 'true' : 'false',
    );
  });

  // The plugin renders its camera/screenshare/slide grid INSIDE a
  // documentPictureInPicture window. That window is only opened by the plugin on
  // a `visibilitychange` (tab hidden) or a `enterpictureinpicture` mediaSession
  // action - and requestWindow() requires transient user activation. Neither
  // trigger is reliably reproducible from headless Playwright: dispatching
  // visibilitychange does not set document.hidden, and there is no API to fire
  // the mediaSession action with activation. Empirically the plugin's populated
  // PiP window (#pip-root > .cameras) is therefore never reachable through a
  // Playwright-driven path, even though a manually requested Document PiP window
  // IS surfaced as a second context page. Skipped rather than asserted as a false
  // pass; drive it manually to verify the in-window grid.
  test.skip('should render the camera grid inside the PiP window', async () => {
    // Intentionally empty - see the comment above for why this is skipped.
  });
});
