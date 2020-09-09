import { css, unsafeCSS } from 'lit-element';

// This function simply takes a JS string,
// and turns it into a valid css dom property
export const asCssProp = (property: string) => {
  return css`${unsafeCSS(property)}`;
}

export const drawHexShapePolygonMask = (leftCornerWidth: any, rightCornerWidth: any) => `
  clip-path: polygon(
    ${leftCornerWidth}px 0%,
    calc(100% - ${rightCornerWidth}px) 0%,
    100% 50%,
    calc(100% - ${rightCornerWidth}px) 100%,
    ${leftCornerWidth}px 100%,
    0% 50%
  );
  -webkit-clip-path: polygon(
    ${leftCornerWidth}px 0%,
    calc(100% - ${rightCornerWidth}px) 0%,
    100% 50%,
    calc(100% - ${rightCornerWidth}px) 100%,
    ${leftCornerWidth}px 100%,
    0% 50%
  );
`;

export const drawBottomHexShapePolygonMask = (middleBottomCornerWidth: any) => `
  clip-path: polygon(
    0% 0%,
    100% 0%,
    100% calc(100% - ${middleBottomCornerWidth}),
    50% 100%,
    0% calc(100% - ${middleBottomCornerWidth}),
    0% 0%
  );
  -webkit-clip-path: polygon(
    0% 0%,
    100% 0%,
    100% calc(100% - ${middleBottomCornerWidth}),
    50% 100%,
    0% calc(100% - ${middleBottomCornerWidth}),
    0% 0%
  );
`;

export const setBoxSizing = (boxSizing: 'content-box' | 'border-box' = 'border-box') => `
  :host,
  :host *,
  :host *::before,
  :host *::after {
    box-sizing: ${boxSizing};
  }
`;
