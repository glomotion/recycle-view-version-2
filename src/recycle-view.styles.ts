import { css } from 'lit-element';

import { asCssProp } from './style.helpers';

const scrollBarWidth = '10px';

export const styles = css`
  :host,
  :host *,
  :host *::before,
  :host *::after {
    box-sizing: border-box;
  }

  :host {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .overflowArea {
    height: 100%;
    overflow: auto;
    scrollbar-width: thin;
  }

  .overflowArea::-webkit-scrollbar {
    width: ${asCssProp(scrollBarWidth)};
    height: ${asCssProp(scrollBarWidth)};
  }

  .blockScrollBar {
    position: absolute;
    top: 0;
    right: 0;
    width: ${asCssProp(scrollBarWidth)};
    height: 100%;
  }

  #itemTemplate {
    opacity: 0;
    z-index: -1;
    position: absolute;
    bottom: 0;
    right: 0;
  }

  .list {
    margin-top: var(--paddingTop);
    margin-bottom: var(--paddingBottom);
    min-height: var(--minHeight);
    padding-left: 10px;
    position: relative;
  }

  .nodePool {
    display: flex;
    flex-wrap: wrap;
  }

  .sentinel {
    width: 100%;
    height: 100px;
    position: absolute;
    left: 0;
  }

  .topSentinel {
    top: 0;
    height: 10px;
    background: gold;
  }

  .bottomSentinel {
    bottom: 0;
    background: red;
  }

  .list__item {
    width: calc((100% / var(--columnCount)) - 10px);
    margin: 0 10px 10px 0;
    text-align: center;
  }

  .list__item--empty {
    background: transparent;
    border: 2px dashed #eee;
  }
`;
