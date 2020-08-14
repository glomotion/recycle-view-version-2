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

  .list {
    padding-top: var(--paddingTop);
    padding-bottom: var(--paddingBottom);
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    padding-left: 10px;
  }

  .sentinel {
    width: 100%;
    height: 2px;
  }

  .list__tile {
    width: calc(33.33% - 10px);
    background-color: #f5f5f5;
    color: grey;
    margin: 0 10px 10px 0;
    padding: 10px;
    text-align: center;
  }

  .list__tile--empty {
    background: transparent;
    border: 2px dashed #eee;
  }

  .list__tile__title {
  }

  .list__tile__img {
    display: block;
    margin: 0 auto;
    width: 100%;
    height: 200px;
    object-fit: cover;
    opacity: 0;
  }
`;
