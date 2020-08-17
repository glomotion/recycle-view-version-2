import { html, css, LitElement } from "lit-element";

const dictionaryToMap = (dictionary: any): Map<number, any> => {
  return Object.entries(dictionary)
    .map(([key, val]) => ({ key, val }))
    .reduce(
      (acc, cur) => acc.set(Number(cur.key), cur.val as any),
      new Map<number, any>()
    );
};

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
    return {
      protos: { type: Array },
    };
  }

  protos = [];

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  constructor() {
    super();
    this.fetchProtos();
  }

  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  private fetchProtos() {
    fetch("https://dev.godsunchained.com/proto?format=flat")
      .then((response) => response.json())
      .then((data) => {
        const asMap = dictionaryToMap(data);
        const asArray = Array.from(asMap.entries()).map(item => ({
          id: item[0],
          ...item[1],
        }));
        this.protos = asArray;
      })
      .catch((err) => console.error(err));
  }

  protected render() {
    return html`
      <gu-recycle-view
        .collection=${this.protos}
        .recycleDom=${(firstIndex: number, listSize: number, nodePool: HTMLElement) => {
          console.log('@@@@@@@@ PARENT RECYCLE DOM FN @@@@@@@@@', firstIndex, listSize, nodePool);
        }}
      >
        <div class="moo-cow">
          <img />
          <h5></h5>
        </div>
      </gu-recycle-view>
    `;
  }
}

customElements.define("gu-app", App);
