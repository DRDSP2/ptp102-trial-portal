import '@testing-library/jest-dom';

// Radix UI primitives rely on a few DOM APIs that jsdom does not implement.
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (typeof Element !== 'undefined' && !Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Mock DOMMatrix for pdfjs-dist. The full DOMMatrix surface is large; pdfjs only
// constructs instances and reads a handful of properties, so a stub that matches
// the shape via cast is sufficient for tests.
if (typeof globalThis.DOMMatrix === 'undefined') {
  class DOMMatrixStub {
    constructor() {}
    static fromMatrix() { return new DOMMatrixStub(); }
    static fromFloat32Array() { return new DOMMatrixStub(); }
    static fromFloat64Array() { return new DOMMatrixStub(); }
  }
  globalThis.DOMMatrix = DOMMatrixStub as unknown as typeof DOMMatrix;
}
