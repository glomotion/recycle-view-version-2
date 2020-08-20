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
        this.protos = Array.from(asMap.entries()).map((item) => ({
          id: item[0],
          ...item[1],
        }));
      })
      .catch((err) => console.error(err));
  }

  protected render() {
    return html`
      <gu-recycle-view
        .collection=${this.protos}
        .itemStyles=${css`
          .moo-cow,
          .moo-cow *,
          .moo-cow *::before,
          .moo-cow *::after {
            box-sizing: border-box;
          }
          .moo-cow {
            display: block;
          }
          .moo-cow > img {
            display: block;
            width: 100%;
          }
          .moo-cow > h5 {
            background: gold;
          }
        `}
        .itemTemplate=${html`
          <div class="moo-cow">
            <img />
            <h5></h5>
          </div>
        `}
        .recycleDom=${(
          firstIndex: number,
          listSize: number,
          nodePoolContainer: HTMLElement
        ) => {
          // console.log(
          //   "@@@@@@@@@@ PARENT RECYCLE DOM @@@@@@@",
          //   firstIndex,
          //   listSize,
          //   nodePoolContainer
          // );
          for (let index = 0; index < listSize; index++) {
            const newItem = this.protos[index + firstIndex];
            const itemDom = nodePoolContainer.children[index];
            const img = itemDom.querySelector("img");
            const title = itemDom.querySelector("h5");
            title.innerHTML = newItem.name;
            img.src = `https://card.godsunchained.com/?id=${newItem.id}&w=256&q=4`;
          }
        }}
      >
      </gu-recycle-view>
    `;
  }
}

customElements.define("gu-app", App);
