import {
  html,
  LitElement,
  property,
  TemplateResult,
  CSSResult,
} from "lit-element";
import { ResizeObserver } from "@juggle/resize-observer";
import debounce from "lodash.debounce";

import { styles } from "./recycle-view.styles";

/* HELPER FUNCTIONS:
  ----------------------------------------------------------------------- */

const getOuterHeight = (el: HTMLElement) => {
  const computedStyles = window.getComputedStyle(el);
  const marginTop = parseInt(computedStyles.getPropertyValue("margin-top"));
  const marginBottom = parseInt(
    computedStyles.getPropertyValue("margin-bottom")
  );
  return el.offsetHeight + marginTop + marginBottom;
};

// Deploy a native ResizeOberver for this component instance:
const ro = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target as RecycleView;
    el.debouncedResize();
  });
});

export interface RecycleViewListItem {
  id: string;
}

/* THE RE-CYCLE VIEW COMPONENT:
  ----------------------------------------------------------------------- */

export class RecycleView extends LitElement {
  @property({ type: Array }) collection: RecycleViewListItem[] = [];
  @property({ type: Array }) startCollection: RecycleViewListItem[] = [];
  @property({ type: Number }) wholeCollectionSize: number;
  @property({ type: Number }) listSize = 0;
  @property({ type: String }) layoutMode: string;
  @property({ type: Object }) itemStyles: CSSResult;
  @property({ type: Object }) itemTemplate: TemplateResult;
  @property({ attribute: false }) recycleDom: (
    firstIndex: number,
    listSize: number,
    nodePoolContainer: HTMLElement
  ) => void;
  @property({ attribute: false }) pagingDataProvider: (
    lastIndexOfCurrentCollection: number
  ) => Promise<RecycleViewListItem[]>;

  static get styles() {
    return styles;
  }

  private intersectionObserver: any;
  private itemTemplateDom: HTMLElement;
  private nodePoolContainerDom: HTMLElement;
  private topSentinelDom: HTMLElement;
  private bottomSentinelDom: HTMLElement;

  private state = {
    topSentinelPreviousY: 0,
    bottomSentinelPreviousY: 0,
    paddingBottom: 0,
    paddingTop: 0,
    atListEnd: false,
    currentFirstIndex: 0,
    ticking: false,
    lastScrollPosition: 0,
  };

  private get currentCollectionSize() {
    return !!this.collection ? this.collection.length : 0;
  }

  private get listIncrement() {
    return 15; // 15 === 5 rows
  }

  private get paddingIncrement() {
    return 5;
  }

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  connectedCallback() {
    super.connectedCallback();
    ro.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    ro.unobserve(this);
  }
  protected firstUpdated() {
    this.storeNodeReferences();
    this.initEventListeners();
  }

  protected updated(changes: any) {
    super.updated(changes);
    if (changes.has("startCollection")) {
      if (this.startCollection.length > 0) {
        this.initRecycleView();
      } else {
        // @TODO: Visuall handle what happens when there is nothing to display:
      }
    }
    if (changes.has("collection")) {
      console.log(
        "!!!!!!! collection update!!!",
        this.currentCollectionSize,
        this.collection
      );
    }
  }

  /* PUBLIC METHODS:
  ----------------------------------------------------------------------- */
  public debouncedResize = debounce(() => this.handleResize(), 200);

  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  /**
   * Generic resize handling
   */

  private handleResize() {
    console.log("!!!!!!!!! RESIZIN !!!!!!!!!!!!!!");
  }

  private checkToGetMoreItems() {
    // console.log(`
    //   !!!!!!! check to get more items !!!!!!
    //   current: ${this.state.currentFirstIndex}
    //   end: ${this.currentCollectionSize - (this.listIncrement * 2)}
    // `);

    if (
      this.state.currentFirstIndex >=
      this.currentCollectionSize - this.listIncrement * 4
    ) {
      this.fetchMoreItems();
    }
  }

  private fetchMoreItems() {
    console.log(
      "@@@@@ fetch more?",
      this.currentCollectionSize,
      this.wholeCollectionSize,
      this.currentCollectionSize < this.wholeCollectionSize
    );
    return this.currentCollectionSize < this.wholeCollectionSize
      ? this.pagingDataProvider(this.currentCollectionSize).then(
          (moreItems) => {
            this.collection = [...this.collection, ...moreItems];
          }
        )
      : false;
  }

  private initRecycleView() {
    this.collection = this.startCollection;
    this.listSize = 21; // list length to recycle-view host height needs to be approx 3.4 : 1
    this.reset();
    this.domRecycleOperations(0);
  }

  private reset(): void {
    this.state.currentFirstIndex = 0;
    this.resetPadding();
    this.clearNodePool();
    this.initNodePool();
  }

  private storeNodeReferences(): void {
    this.itemTemplateDom = this.shadowRoot.querySelector("#itemTemplate")
      .children[0] as HTMLElement;
    this.nodePoolContainerDom = this.shadowRoot.querySelector(
      ".nodePool"
    ) as HTMLElement;
    this.topSentinelDom = this.shadowRoot.querySelector(".topSentinel");
    this.bottomSentinelDom = this.shadowRoot.querySelector(".bottomSentinel");
  }

  private clearNodePool(): void {
    this.nodePoolContainerDom.innerHTML = "";
  }

  private initNodePool(): void {
    for (let index = 0; index < this.listSize; index++) {
      const clone = this.itemTemplateDom.cloneNode(true) as HTMLElement;
      clone.classList.add("list__item", `list__item--${index}`);
      this.nodePoolContainerDom.appendChild(clone);
    }
  }

  private internalDomRecycle(newFirstIndex: number): void {
    for (let i = 0; i < this.listSize; i++) {
      const newItem = this.collection[i + newFirstIndex];
      const itemDom = this.nodePoolContainerDom.children[i];

      if (newItem) {
        itemDom.setAttribute("data-current-item-id", newItem.id);
        itemDom.classList.remove("list__item--empty");
      } else {
        this.state.atListEnd = true;
        itemDom.classList.add("list__item--empty");
        itemDom.removeAttribute("data-current-item-id");
      }
    }
  }

  private domRecycleOperations = (newFirstIndex: number) => {
    // Internal recycle operations (updates internal state):
    this.internalDomRecycle(newFirstIndex);

    // Kickoff externalized dom recycle operations:
    this.recycleDom(
      newFirstIndex,
      this.listSize,
      this.shadowRoot.querySelector(".nodePool")
    );
  };

  private updatePadding(scrollingDownwards = true): void {
    const firstItem = this.nodePoolContainerDom.children[0] as HTMLElement;
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

  private resetPadding() {
    this.state.paddingBottom = 0;
    this.state.paddingTop = 0;
    this.style.setProperty("--paddingBottom", "0px");
    this.style.setProperty("--paddingTop", "0px");
  }

  private calculateNewFirstIndex(scrollingDownwards = true): number {
    let firstIndex: number;

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

  private topSentinelCallback(entry): void {
    this.state.atListEnd = false;

    // Stop users from going off the page (in terms of the results set total)
    if (this.state.currentFirstIndex === 0) {
      this.resetPadding();
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;
    // console.log("!!!!!TOP SENTINEL!!!!!!", isIntersecting, this.state);
    const shouldChangePage =
      currentY > this.state.topSentinelPreviousY &&
      isIntersecting &&
      this.state.currentFirstIndex !== 0;

    // check if user is actually Scrolling up
    if (shouldChangePage) {
      const newFirstIndex = this.calculateNewFirstIndex(false);
      this.updatePadding(false);
      this.domRecycleOperations(newFirstIndex);
      this.state.currentFirstIndex = newFirstIndex;
    }

    // Store current offset, for the next time:
    this.state.topSentinelPreviousY = currentY;
  }

  private bottomSentinelCallback(entry): boolean {
    const currentY = entry.boundingClientRect.top;

    // Stop the paging from going further than the edge of the collection:
    if (
      this.state.atListEnd ||
      this.state.currentFirstIndex ===
        this.currentCollectionSize - this.listSize
    ) {
      this.state.bottomSentinelPreviousY = currentY;
      return false;
    }

    const isIntersecting = entry.isIntersecting;
    const shouldChangePage =
      currentY < this.state.bottomSentinelPreviousY && isIntersecting;
    // console.log("!!!!!BOTTOM SENTINEL!!!!!!", isIntersecting, this.state);

    // check if user is actually Scrolling down
    if (shouldChangePage) {
      const newFirstIndex = this.calculateNewFirstIndex(true);
      this.updatePadding(true);
      this.domRecycleOperations(newFirstIndex);
      this.state.currentFirstIndex = newFirstIndex;
      this.checkToGetMoreItems();
    }

    // Store current offset, for the next time:
    this.state.bottomSentinelPreviousY = currentY;
    return true;
  }

  private initEventListeners(): void {
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
    this.intersectionObserver.observe(this.topSentinelDom);
    this.intersectionObserver.observe(this.bottomSentinelDom);

    // @NOTE: Add some OVER-SCROLL PROTECTION:
    const handleScroll = debounce((e) => {
      const rect = this.topSentinelDom.getBoundingClientRect();
      if (rect.top > 0 && this.state.paddingTop !== 0) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!");
        this.state.currentFirstIndex = 0;
        this.resetPadding();
        this.domRecycleOperations(0);
        this.scrollTop = 0;
      }
    }, 100);

    // @NOTE: bind scroll event, to watch for extreme scrolls:
    this.addEventListener("scroll", handleScroll, { passive: true });
  }

  protected render(): TemplateResult {
    return html`
      <style>
        ${this.itemStyles}
      </style>
      <div id="itemTemplate">${this.itemTemplate}</div>
      <div class="list">
        <div class="sentinel topSentinel"></div>
        <div class="nodePool"></div>
        <div class="sentinel bottomSentinel"></div>
      </div>
    `;
  }
}

customElements.define("gu-recycle-view", RecycleView);
