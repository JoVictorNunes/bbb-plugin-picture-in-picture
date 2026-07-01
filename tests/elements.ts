import { coreElements } from './core/coreElements';

export const elements = {
  ...coreElements,

  // Action-button dropdown item injected by the client for the plugin.
  // The Picture-in-Picture plugin registers a single toggle option whose label
  // switches between "Activate PiP Window" and "Deactivate PiP Window".
  pipActionButton: 'li[data-test="actionDropdownButtonPlugin"]',

  // Elements rendered INSIDE the documentPictureInPicture window (behavioral).
  // Reaching this window from Playwright is browser/headless dependent - see the
  // behavioral specs for how availability is probed before asserting on them.
  pipRoot: '#pip-root',
  pipCameras: '.cameras',
  pipWebcams: '#plugin-pip-webcams',
};
