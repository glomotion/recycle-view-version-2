import { html, css, LitElement } from 'lit-element';

export class App extends LitElement {
  static get styles() {
    return css`
      :host {
        width: 100%;
        height: 100%;
        display: flex;
      }

      gu-recycle-view {
        width: 100%;
        height: 80%;
        margin: auto;
      }
    `;
  }

  static get properties() {
    return {};
  }

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  protected firstUpdated() {
  } 

  protected render() {
    return html`
      <gu-recycle-view></gu-recycle-view>
    `;
  }
}

customElements.define('gu-app', App);
