import { html, css, LitElement } from 'lit-element';

export class App extends LitElement {
  static get styles() {
    return css`
      :host {
        width: 100%;
        height: 100%;
      }

      .list {
        overflow: scroll;
        list-style-type: none;
        padding: 0;
      }

      .tile {
        background-color: grey;
        margin: 10px 0;
        height: 150px;
        width: 100%;
      }
    `;
  }

  static get properties() {
    return {};
  }

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  firstUpdated() {

  } 


  private init() {

  }

  render() {
    return html`
     
    `;
  }
}

customElements.define('gu-app', App);
