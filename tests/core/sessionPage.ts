import {
  expect, Page, Browser, Locator,
} from '@playwright/test';
import { ELEMENT_WAIT_EXTRA_LONG_TIME, ELEMENT_WAIT_TIME } from './constants';
import * as parameters from './parameters';
import {
  createMeeting, generateSettingsData, getJoinURL, SessionSettings,
} from './helpers';
import { coreElements as e } from './coreElements';

interface PageProps {
  browser: Browser;
  page: Page;
}

export interface InitOptions {
  fullName?: string;
  createParameter?: string;
  joinParameter?: string;
  shouldCloseAudioModal?: boolean;
  skipSessionDetailsModal?: boolean;
  shouldCheckAllInitialSteps?: boolean;
}

interface InitFunctionParameters {
  isModerator: boolean;
  shouldCloseAudioModal: boolean;
  initOptions: InitOptions;
}

export interface InitParameters {
  server: string | undefined;
  secret: string | undefined;
  welcome: string;
  fullName: string;
  moderatorPW: string;
  attendeePW: string;
}

export class SessionPage {
  readonly page: Page;

  readonly browser: Browser;

  settings: SessionSettings | undefined;

  initParameters: InitParameters;

  username: string;

  meetingId: string;

  constructor({ browser, page }: PageProps) {
    this.browser = browser;
    this.page = page;
    this.username = '';
    this.meetingId = '';
    this.initParameters = { ...parameters };
  }

  async init({ isModerator, shouldCloseAudioModal, initOptions = {} }: InitFunctionParameters) {
    const {
      fullName,
      createParameter,
      joinParameter,
      skipSessionDetailsModal = true,
      shouldCheckAllInitialSteps = true,
    } = initOptions;

    if (!isModerator) this.initParameters.moderatorPW = '';
    this.username = fullName || this.initParameters.fullName;

    this.meetingId = await createMeeting(this.initParameters, createParameter);
    const joinUrl = getJoinURL({
      meetingID: this.meetingId,
      isModerator,
      joinParameter,
      skipSessionDetailsModal,
      fullName: this.username,
    });
    const response = await this.page.goto(joinUrl);
    await expect(response?.ok()).toBeTruthy();
    const hasErrorLabel = await this.checkElement(e.errorMessageLabel);
    await expect(hasErrorLabel, 'should pass the authentication and the layout element should be displayed').toBeFalsy();
    if (shouldCheckAllInitialSteps) {
      await this.page.waitForSelector('div#layout', { timeout: ELEMENT_WAIT_EXTRA_LONG_TIME });
      this.settings = await generateSettingsData(this.page);
      const autoJoinAudioModal = this.settings?.autoJoinAudioModal;
      if (shouldCloseAudioModal && autoJoinAudioModal) await this.closeAudioModal();
    }
    // overwrite for font used in CI
    await this.page.addStyleTag({
      content: `
        body {
          font-family: 'Liberation Sans', Arial, sans-serif;
        }`,
    });
  }

  async hasElement(selector: string, description: string, timeout = ELEMENT_WAIT_TIME) {
    const locator = this.getLocator(selector);
    await expect(locator, description).toBeVisible({ timeout });
  }

  async wasRemoved(selector: string, description: string, timeout = ELEMENT_WAIT_TIME) {
    const locator = this.getLocator(selector);
    await expect(locator, description).toBeHidden({ timeout });
  }

  async checkElement(selector: string, index = 0): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return this.page.evaluate(([selector, index]) => {
      if (typeof selector !== 'string') throw new Error('Selector must be a string');
      const element = document.querySelectorAll(selector);
      if (element.length > 0) {
        return element[index as number] !== undefined;
      }
      return false;
    }, [selector, index]);
  }

  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async hasText(selector: string, text: string, description: string, timeout = ELEMENT_WAIT_TIME) {
    const locator = this.getLocator(selector).first();
    await expect(locator, description).toContainText(text, { timeout });
  }

  async closeAudioModal() {
    await this.hasElement(e.audioModal, 'should display the audio modal', ELEMENT_WAIT_EXTRA_LONG_TIME);
    await this.page.click(e.closeModal);
  }

  async waitAndClick(selector: string, timeout = ELEMENT_WAIT_TIME) {
    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector, { timeout });
  }

  /**
   * Share the current user's webcam. Mirrors `Page.shareWebcam` from
   * bigbluebutton-tests/playwright/core/page.ts: the video preview modal is
   * skipped when the server settings say so, otherwise it must be confirmed.
   * Chromium is launched with --use-fake-device-for-media-stream, so the
   * "camera" is the synthetic rolling-pattern stream.
   */
  async shareWebcam(timeout = ELEMENT_WAIT_EXTRA_LONG_TIME) {
    const {
      webcamSharingEnabled,
      skipVideoPreview,
      skipVideoPreviewOnFirstJoin,
    } = this.settings || {};

    if (webcamSharingEnabled === false) {
      throw new Error('Webcam sharing is disabled on this server; cannot share a webcam.');
    }

    await this.waitAndClick(e.joinVideo);

    const shouldConfirmSharing = !(skipVideoPreview || skipVideoPreviewOnFirstJoin);
    if (shouldConfirmSharing) {
      await this.hasElement(e.webcamMirroredVideoPreview, 'should display the webcam video preview', timeout);
      await this.waitAndClick(e.startSharingWebcam);
    }

    await this.page.waitForSelector(e.webcamMirroredVideoContainer, { timeout });
    await this.page.waitForSelector(e.leaveVideo, { timeout });
    await this.wasRemoved(
      e.webcamConnecting,
      'should stop showing the webcam connecting element once connected',
      timeout,
    );
  }

  /** Send a message to the public chat, opening the chat panel if needed. */
  async sendPublicChatMessage(message: string, timeout = ELEMENT_WAIT_TIME) {
    const chatBox = this.getLocator(e.chatBox).first();
    if (!(await chatBox.isVisible())) {
      await this.waitAndClick(e.chatButton, timeout);
    }
    await chatBox.waitFor({ state: 'visible', timeout });
    await chatBox.fill(message);
    await this.waitAndClick(e.sendButton, timeout);
  }
}
