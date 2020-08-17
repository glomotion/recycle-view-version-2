import { html, css, LitElement, property } from "lit-element";

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
    overflow: auto;
    font-family: "Open Sans", sans-serif;
  }

  .itemTemplate {
    opacity: 0;
    position: absolute;
    top: 0; left: 0;
    width: 0px;
    height: 0px;
  }

  .list {
    padding-top: var(--paddingTop);
    padding-bottom: var(--paddingBottom);
    margin: 0;
    padding-left: 10px;
  }

  .nodePool {
    display: flex;
    flex-wrap: wrap;
  }

  .sentinel {
    width: 100%;
    height: 2px;
  }

  .list__item {
    width: calc(33.33% - 10px);
    background-color: #f5f5f5;
    color: grey;
    margin: 0 10px 10px 0;
    padding: 10px;
    text-align: center;
  }

  .list__item--empty {
    background: transparent;
    border: 2px dashed #eee;
  }
`;
