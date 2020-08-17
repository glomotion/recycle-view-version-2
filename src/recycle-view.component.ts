import { html, LitElement, property } from "lit-element";

import { styles } from "./recycle-view.styles";

/* HELPER FUNCTIONS:
  ----------------------------------------------------------------------- */

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
  @property({ type: Array }) collection: any[];
  @property({ type: Number }) listSize = 0;
  @property({ type: String }) layoutMode: string;
  @property({ attribute: false }) recycleDom: (
    firstIndex: number,
    listSize: number,
    nodePoolContainer: HTMLElement,
  ) => void;

  static get styles() {
    return styles;
  }

  private intersectionObserver: any;
  // private paddingTop = 0;
  // private paddingBottom = 0;
  // private topSentinelPreviousY = 0;
  // private bottomSentinelPreviousY = 0;
  // private currentFirstIndex = 0;
  // private atListEnd = false;
  private itemTemplate: HTMLElement;

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
  firstUpdated() {
    this.storeItemTemplate();
    this.initIntersectionObserver();
  }

  protected updated(changes: any) {
    super.updated(changes);
    if (changes.has("collection")) {
      this.listSize = 27;
      this.clearNodePool();
      this.initNodePool();
      this.domRecycleOperations(0);
      console.log("!!!!!!!!!!!!! INIT !!!!!!!!!!!!");
    }
  }

  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  private storeItemTemplate() {
    const slot = this.shadowRoot.getElementById(
      "itemTemplate"
    ) as HTMLSlotElement;
    this.itemTemplate = slot.assignedElements()[0] as HTMLElement;
  }

  private clearNodePool() {
    const nodePool = this.shadowRoot.querySelector('.nodePool');
    nodePool.innerHTML = '';
  }

  private initNodePool() {
    const nodePool = this.shadowRoot.querySelector('.nodePool');
    for (let index = 0; index < this.listSize; index++) {
      const clone = this.itemTemplate.cloneNode(true) as HTMLElement;
      clone.classList.add(`list__item--${index}`);
      nodePool.appendChild(clone);
    }
  }

  private internalDomRecycle(newFirstIndex: number) {
    for (let i = 0; i < this.listSize; i++) {
      const newItem = this.collection[i + newFirstIndex];
      const item = this.shadowRoot.querySelector(
        '.list__item--' + i
      ) as HTMLElement;
      
      if (newItem) {
        item.setAttribute('data-current-item-id', newItem.id);
        item.classList.remove('list__item--empty');
      } else {
        this.state.atListEnd = true;
        item.classList.add('list__item--empty');
        item.removeAttribute('data-current-item-id');
      }
    }
  }

  private domRecycleOperations(newFirstIndex: number) {

    // Internal recycle operations (updates internal state):
    this.internalDomRecycle(newFirstIndex);
    
    // Kickoff externalized dom recycle operations:
    this.recycleDom(newFirstIndex, this.listSize, this.shadowRoot.querySelector('.nodePool'));
  }

  private updatePadding(scrollingDownwards = true) {
    const container = this.shadowRoot.querySelector(".list") as HTMLElement;
    const firstItem = container.querySelector(".list__tile");
    const paddingOffset = getOuterHeight(firstItem) * this.paddingIncrement;

    if (scrollingDownwards) {
      this.state.paddingTop += paddingOffset;
      this.state.paddingBottom =
        this.state.paddingBottom === 0
          ? 0
          : this.state.paddingBottom - paddingOffset;
    } else {
      this.state.paddingTop =
        this.state.paddingTop === 0 ? 0 : this.state.paddingTop - paddingOffset;
      this.state.paddingBottom += paddingOffset;
    }
    this.style.setProperty("--paddingTop", `${this.state.paddingTop}px`);
    this.style.setProperty("--paddingBottom", `${this.state.paddingBottom}px`);
  }

  private calculateNewFirstIndex(scrollingDownwards = true) {
    let firstIndex;

    if (scrollingDownwards) {
      firstIndex = this.state.currentFirstIndex + this.listIncrement;
    } else {
      firstIndex = this.state.currentFirstIndex - this.listIncrement;
    }

    if (firstIndex < 0) {
      firstIndex = 0;
    }

    return firstIndex;
  }

  private topSentinelCallback(entry) {
    this.state.atListEnd = false;

    // Stop users from going off the page (in terms of the results set total)
    if (this.state.currentFirstIndex === 0) {
      this.style.setProperty("--paddingBottom", "0px");
      this.style.setProperty("--paddingTop", "0px");
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;
    const shouldChangePage =
      currentY > this.state.topSentinelPreviousY &&
      isIntersecting &&
      this.state.currentFirstIndex !== 0;

    // check if user is actually Scrolling up
    if (shouldChangePage) {
      const firstIndex = this.calculateNewFirstIndex(false);
      this.updatePadding(false);
      // this.recycleDom(firstIndex);
      this.state.currentFirstIndex = firstIndex;
    }

    // Store current offset, for the next time:
    this.state.topSentinelPreviousY = currentY;
  }

  private bottomSentinelCallback(entry) {
    const currentY = entry.boundingClientRect.top;

    if (
      this.state.atListEnd ||
      this.state.currentFirstIndex === this.collectionSize - this.listSize
    ) {
      this.state.bottomSentinelPreviousY = currentY;
      return false;
    }

    const isIntersecting = entry.isIntersecting;
    const shouldChangePage =
      currentY < this.state.bottomSentinelPreviousY && isIntersecting;

    // check if user is actually Scrolling down
    if (shouldChangePage) {
      const firstIndex = this.calculateNewFirstIndex(true);
      this.updatePadding(true);
      // this.recycleDom(firstIndex);
      this.state.currentFirstIndex = firstIndex;
    }

    // Store current offset, for the next time:
    this.state.bottomSentinelPreviousY = currentY;
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

    this.intersectionObserver = new IntersectionObserver(handleIntersection, {
      root: this,
    });
    this.intersectionObserver.observe(
      this.shadowRoot.querySelector(".topSentinel")
    );
    this.intersectionObserver.observe(
      this.shadowRoot.querySelector(".bottomSentinel")
    );
  }

  render() {
    console.log("!!!!!! RENDER !!!!!", this.listSize);
    const list = new Array(this.listSize).fill({});

    return html`
      <slot id="itemTemplate"></slot>
      <div class="list">
        <div class="sentinel topSentinel"></div>
        <div class="nodePool"></div>
        <div class="sentinel bottomSentinel"></div>
      </div>
    `;
  }
}

customElements.define("gu-recycle-view", RecycleView);
