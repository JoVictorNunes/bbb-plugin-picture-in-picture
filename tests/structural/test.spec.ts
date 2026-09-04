/**
 * Structural tests - verify the Picture-in-Picture plugin registers its
 * action-button dropdown toggle with the correct label.
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  test, BrowserContext, Browser, APIRequestContext, TestInfo,
} from '@playwright/test';
import { checkPluginAvailability } from '../core/fixtures/pluginBeforeAll';
import { ELEMENT_WAIT_LONGER_TIME } from '../core/constants';
import { elements as e } from '../elements';
import { SessionPage as ModPage } from '../core/sessionPage';
import { Plugin } from '../core/plugin';
import { encodeCustomParams } from '../core/helpers';

const PLUGIN_NAME = 'picture-in-picture';
const ENV_VAR_NAME = 'PICTURE_IN_PICTURE_PLUGIN_URL';

let pluginUrl: string | undefined = process.env[ENV_VAR_NAME];
const setPluginUrl = (url: string) => { pluginUrl = url; };
const getPluginUrl = () => pluginUrl;

/** Open the actions dropdown if it isn't already showing the PiP toggle item. */
async function openActionsDropdown(modPage: ModPage) {
  const item = modPage.page.locator(e.pipActionButton).first();
  if (!(await item.isVisible())) {
    await modPage.page.click(e.actions);
    await item.waitFor({ state: 'visible', timeout: ELEMENT_WAIT_LONGER_TIME });
  }
  return item;
}

const ISOLATED = process.env.TEST_MEETINGS === 'isolated';

// ── Tests ─────────────────────────────────────────────────────────────────────
test.describe('Picture-in-Picture Plugin - Structural', () => {
  test.describe.configure({ mode: ISOLATED ? 'default' : 'serial' });

  let modPage: ModPage;
  let sharedContext: BrowserContext;

  async function setupMeeting(browser: Browser, request: APIRequestContext, testInfo: TestInfo) {
    await checkPluginAvailability({
      pluginName: PLUGIN_NAME,
      setPluginUrl,
      getPluginUrl,
    })({ request }, testInfo);

    const createParameter = encodeCustomParams(
      `pluginManifests=${JSON.stringify([{ url: getPluginUrl() }])}`,
    );
    sharedContext = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write', 'camera', 'microphone'],
      viewport: { width: 1280, height: 720 },
    });
    const page = await sharedContext.newPage();
    const plugin = new Plugin({ browser });
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
      // Leave the dropdown closed for the next test.
      if (modPage && await modPage.page.locator(e.pipActionButton).first().isVisible()) {
        await modPage.page.keyboard.press('Escape');
      }
    });
  }

  test('should register the PiP toggle item in the actions dropdown', async (): Promise<void> => {
    await modPage.page.waitForSelector(e.whiteboard, { timeout: ELEMENT_WAIT_LONGER_TIME });
    await modPage.page.click(e.actions);
    await modPage.hasElement(
      e.pipActionButton,
      'should display the Picture-in-Picture toggle item in the actions dropdown',
      ELEMENT_WAIT_LONGER_TIME,
    );
  });

  test('should label the toggle item with "PiP Window"', async (): Promise<void> => {
    await modPage.page.waitForSelector(e.whiteboard, { timeout: ELEMENT_WAIT_LONGER_TIME });
    await openActionsDropdown(modPage);
    await modPage.hasText(
      e.pipActionButton,
      'PiP Window',
      'the toggle item label should mention "PiP Window"',
    );
  });
});
