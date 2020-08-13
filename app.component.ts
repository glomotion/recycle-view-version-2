import { html, css, LitElement } from 'lit-element';
import Stats from 'stats.js';

function numDomNodes(node) {
  if (!node.children || node.children.length == 0) {
    return 0;
  }

  const childrenCount = Array.from(node.children).map(numDomNodes);
  const newCount = node.children.length 
    + 
    childrenCount.reduce((p, c) => p + c, 0);
  console.log('!!!!!!', node);
  return newCount;
}

export class App extends LitElement {
  static get styles() {
    return css`
      :host {
        width: 100%;
        height: 100%;
        display: flex;
      }

      gu-recycle-view {
        width: 80%;
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
