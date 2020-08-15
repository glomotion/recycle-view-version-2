import { html, css, LitElement } from "lit-element";

declare const Object: any;

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
      rand: { type: String },
    };
  }

  private protos: any[] = [];
  private rand = 0;

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  constructor() {
    super();
    this.fetchProtos();
  }

  protected firstUpdated() {
    setInterval(() => {
      this.rand = Math.random();
      console.log("!!!!!!!!!!!!", this.rand);
    }, 1000);
  }

  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  private fetchProtos() {
    fetch("https://dev.godsunchained.com/proto?format=flat")
      .then((response) => response.json())
      .then((data) => {
        const asMap = dictionaryToMap(data);
        const asArray = Array.from(asMap.entries());
        this.protos = asArray;
      })
      .catch((err) => console.error(err));
  }

  protected render() {
    return html`
      <gu-recycle-view
        .random=${this.rand}
        .itemsCollection=${this.protos}
      ></gu-recycle-view>
    `;
  }
}

customElements.define("gu-app", App);
