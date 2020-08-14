import { html, css, LitElement, property } from "lit-element";

import { styles } from "./recycle-view.styles";

/* DEMO HELPER FUNCTIONS:
  ----------------------------------------------------------------------- */
const getRandomCatImg = () => {
  const randomNum = () => {
    return Math.floor(Math.random() * 100000);
  };
  const url = "https://source.unsplash.com/collection/139386/200x200/?sig=";
  return url + randomNum();
};

const initCollection = (numberOfItems) => {
  const collection = [];
  for (let i = 0; i < numberOfItems; i++) {
    collection.push({
      catCounter: i,
      title: `Cat image: ${i}`,
      imgSrc: getRandomCatImg(),
    });
  }
  return collection;
};

const getOuterHeight = (el) => {
  const computedStyles = window.getComputedStyle(el);
  const marginTop = parseInt(computedStyles.getPropertyValue("margin-top"));
  const marginBottom = parseInt(
    computedStyles.getPropertyValue("margin-bottom")
  );
  return el.offsetHeight + marginTop + marginBottom;
};

/* THE RE-CYCLE VIEW COMPONENT:
  ----------------------------------------------------------------------- */

export class RecycleView extends LitElement {
  @property({ type: Array }) itemsCollection: [];
  @property({ type: Number }) random: number;
  @property({ type: String }) layoutMode: string;

  static get styles() {
    return styles;
  }

  private topSentinelPreviousY = 0;
  private bottomSentinelPreviousY = 0;
  private listSize = 0;
  private collection: any[];
  private currentFirstIndex = 0;
  private observer: any;
  private paddingTop = 0;
  private paddingBottom = 0;
  private atListEnd = false;

  private state = {
    topSentinelPreviousY: 0,
    bottomSentinelPreviousY: 0,
    paddingBottom: 0,
    paddingTop: 0,
    atListEnd: false,
    currentFirstIndex: 0,
  };

  private get collectionSize() {
    return !!this.collection ? this.collection.length : 0;
  }

  private get listIncrement() {
    return 15;
  }

  private get paddingIncrement() {
    return 5;
  }

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  constructor() {
    super();
    this.collection = initCollection(55);
    this.listSize = 27;
  }

  protected firstUpdated() {
    this.initIntersectionObserver();
  }

  protected updated(changes: any) {
    super.updated(changes);
    console.log("changes!!", changes);
    if (changes.has("itemsCollection")) {
      console.log("$$$$$$$$$$$", this.itemsCollection);
    }
  }

  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */

  private recycleDom(firstIndex) {
    for (let i = 0; i < this.listSize; i++) {
      const newItem = this.collection[i + firstIndex];
      const tile = this.shadowRoot.querySelector(
        ".list__tile--" + i
      ) as HTMLElement;
      const img = tile.querySelector(".list__tile__img");
      const title = tile.querySelector(".list__tile__title");
      if (newItem) {
        tile.setAttribute("data-current-tile-id", newItem.catCounter);
        title.innerHTML = newItem.title;
        tile.classList.remove("list__tile--empty");
        img.setAttribute("src", newItem.imgSrc);
      } else {
        this.atListEnd = true;
        tile.classList.add("list__tile--empty");
        tile.removeAttribute("data-current-tile-id");
        title.innerHTML = "";
        img.setAttribute("src", "");
      }
    }
  }

  private updatePadding(scrollingDownwards = true) {
    const container = this.shadowRoot.querySelector(".list") as HTMLElement;
    const firstItem = container.querySelector(".list__tile");
    const paddingOffset = getOuterHeight(firstItem) * this.paddingIncrement;

    if (scrollingDownwards) {
      this.paddingTop += paddingOffset;
      this.paddingBottom =
        this.paddingBottom === 0 ? 0 : this.paddingBottom - paddingOffset;
    } else {
      this.paddingTop =
        this.paddingTop === 0 ? 0 : this.paddingTop - paddingOffset;
      this.paddingBottom += paddingOffset;
    }
    this.style.setProperty("--paddingTop", `${this.paddingTop}px`);
    this.style.setProperty("--paddingBottom", `${this.paddingBottom}px`);
  }

  private calculateNewFirstIndex(scrollingDownwards = true) {
    let firstIndex;

    if (scrollingDownwards) {
      firstIndex = this.currentFirstIndex + this.listIncrement;
    } else {
      firstIndex = this.currentFirstIndex - this.listIncrement;
    }

    if (firstIndex < 0) {
      firstIndex = 0;
    }

    return firstIndex;
  }

  private topSentinelCallback(entry) {
    this.atListEnd = false;

    // Stop users from going off the page (in terms of the results set total)
    if (this.currentFirstIndex === 0) {
      this.style.setProperty("--paddingBottom", "0px");
      this.style.setProperty("--paddingTop", "0px");
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;
    const shouldChangePage =
      currentY > this.topSentinelPreviousY &&
      isIntersecting &&
      this.currentFirstIndex !== 0;

    // check if user is actually Scrolling up
    if (shouldChangePage) {
      const firstIndex = this.calculateNewFirstIndex(false);
      this.updatePadding(false);
      this.recycleDom(firstIndex);
      this.currentFirstIndex = firstIndex;
    }

    // Store current offset, for the next time:
    this.topSentinelPreviousY = currentY;
  }

  private bottomSentinelCallback(entry) {
    const currentY = entry.boundingClientRect.top;

    if (
      this.atListEnd ||
      this.currentFirstIndex === this.collectionSize - this.listSize
    ) {
      this.bottomSentinelPreviousY = currentY;
      return false;
    }

    const isIntersecting = entry.isIntersecting;
    const shouldChangePage =
      currentY < this.bottomSentinelPreviousY && isIntersecting;

    // check if user is actually Scrolling down
    if (shouldChangePage) {
      const firstIndex = this.calculateNewFirstIndex(true);
      this.updatePadding(true);
      this.recycleDom(firstIndex);
      this.currentFirstIndex = firstIndex;
    }

    // Store current offset, for the next time:
    this.bottomSentinelPreviousY = currentY;
  }

  private initIntersectionObserver() {
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const { target } = entry;
        if (target.classList.contains("topSentinel")) {
          this.topSentinelCallback(entry);
        } else if (target.classList.contains("bottomSentinel")) {
          this.bottomSentinelCallback(entry);
        }
      });
    };

    this.observer = new IntersectionObserver(handleIntersection, {
      root: this,
    });
    this.observer.observe(this.shadowRoot.querySelector(".topSentinel"));
    this.observer.observe(this.shadowRoot.querySelector(".bottomSentinel"));
  }

  render() {
    const { collection, listSize, random } = this;
    const list = new Array(listSize).fill({});

    return html`
      <div>${random}</div>
      <div class="list">
        <div class="sentinel topSentinel"></div>
        ${list.map((_, i) => {
          const tile = collection[i];
          return html`
            <div
              class="list__tile list__tile--${i}"
              data-current-tile-id=${tile.catCounter}
            >
              <div class="list__tile__title">${tile.title}</div>
              <img class="list__tile__img" src=${tile.imgSrc} alt="moo" />
            </div>
          `;
        })}
        <div class="sentinel bottomSentinel"></div>
      </div>
    `;
  }
}

customElements.define("gu-recycle-view", RecycleView);
