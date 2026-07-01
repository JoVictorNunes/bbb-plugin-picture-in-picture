import { coreElements } from './core/coreElements';

export const elements = {
  ...coreElements,

  // Action-button dropdown toggle registered by the plugin. On this BBB line the
  // client renders the plugin's dropdown option as a plain <li> WITHOUT the
  // data-test="actionDropdownButtonPlugin" attribute used by newer lines, so the
  // item is matched by its label text instead. The label toggles between
  // "Activate PiP Window" and "Deactivate PiP Window".
  pipActionButton: 'li:has-text("PiP Window")',

  // Elements rendered INSIDE the documentPictureInPicture window (behavioral).
  // The window is only opened by the plugin on a visibilitychange /
  // enterpictureinpicture trigger while media is present - see the behavioral
  // specs for how reachability is handled.
  pipRoot: '#pip-root',
  pipCameras: '.cameras',
  pipWebcams: '#plugin-pip-webcams',
};
