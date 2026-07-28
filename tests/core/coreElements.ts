export const coreElements = {
  audioModal: 'div[data-test="audioModal"]',
  closeModal: 'button[data-test="closeModal"]',
  errorMessageLabel: 'span[id="error-message"]',
  whiteboard: 'div[data-testid="canvas"]',
  actions: 'button[data-test="actionsButton"]',

  // Webcam sharing - mirrors bigbluebutton-tests/playwright/core/elements.ts
  joinVideo: 'button[data-test="joinVideo"]',
  leaveVideo: 'button[data-test="leaveVideo"]',
  startSharingWebcam: 'button[data-test="startSharingWebcam"]',
  webcamMirroredVideoPreview: 'video[data-test="mirroredVideoPreview"]',
  webcamMirroredVideoContainer: 'video[data-test="mirroredVideoContainer"]',
  webcamConnecting: 'div[data-test="webcamConnecting"]',
  webcamVideoItem: 'div[data-test="webcamVideoItem"]',

  // Public chat
  chatButton: 'button[data-test="chatButton"]',
  chatBox: 'textarea[id="message-input"]',
  sendButton: 'button[data-test="sendMessageButton"]',
};
