// Mock file to bypass Next.js Turbopack strict ESM export resolution
// for @tensorflow-models/face-landmarks-detection which improperly imports
// named exports from @mediapipe/face_mesh (a purely CommonJS library).
// Since we use the 'tfjs' runtime, the actual mediapipe library logic isn't strictly needed here.

export class FaceMesh {
  constructor() {}
  onResults() {}
  initialize() { return Promise.resolve(); }
  close() {}
  send() { return Promise.resolve(); }
}

export const VERSION = "0.4.1633559619";
