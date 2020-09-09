import {
  html,
  LitElement,
  property,
  TemplateResult,
  CSSResult,
} from 'lit-element';
import { ResizeObserver } from '@juggle/resize-observer';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';

import * as layoutHelpers from './layout.helpers';
import { styles } from './recycle-view.styles';

/* HELPER FUNCTIONS:
  ----------------------------------------------------------------------- */

// Deploy a native ResizeOberver for this component instance:
// @TODO: implement type safety for resize observer and intersection observer
// https://gist.github.com/rhysd/cb83ab616211f271bc73186416a30811
const ro = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target as RecycleView;
    el.debouncedResize();
  });
});

export interface RecycleViewListItem {
  id: string;
}

export interface RecycleViewClickSelectEvent {
  detail: {
    itemNode: HTMLElement;
    selectedItemIndex: number;
    sourceEvent: UIEvent;
  };
}

const ACCEPTABLE_CARD_SIZE_RANGE = {
  minWidth: 170,
  maxWidth: 285,
};

export const ITEM_GRID_MARGIN = 10;

/* THE RE-CYCLE VIEW COMPONENT:
  ----------------------------------------------------------------------- */

export class RecycleView extends LitElement {
  @property({ type: Array }) collection: RecycleViewListItem[] = [];
  @property({ type: Array }) startCollection: RecycleViewListItem[] = [];
  @property({ type: Number }) wholeCollectionSize: number;
  // @property({ type: Number }) listSize = 0;
  @property({ type: String }) layoutMode: string;
  @property({ type: Object }) itemStyles: CSSResult;
  @property({ type: Object }) itemTemplate: TemplateResult;
  @property({ attribute: false }) recycleDom: (
    firstIndex: number,
    listSize: number,
    nodePoolContainer: HTMLElement,
  ) => void;
  @property({ attribute: false }) pagingDataProvider: (
    lastIndexOfCurrentCollection: number,
  ) => Promise<RecycleViewListItem[]>;

  static get styles() {
    return styles;
  }

  private intersectionObserver: any;
  private itemTemplateDom: HTMLElement;
  private nodePoolContainerDom: HTMLElement;
  private topSentinelDom: HTMLElement;
  private bottomSentinelDom: HTMLElement;
  private overflowAreaDom: HTMLElement;

  private state = {
    topSentinelPreviousY: 0,
    bottomSentinelPreviousY: 0,
    paddingBottom: 0,
    paddingTop: 0,
    atListEnd: false,
    currentFirstIndex: 0,
    ticking: false,
    lastScrollPosition: 0,
    currentColumnCount: 1,
    currentRowCount: 1,
    currentListSize: 0,
    dimensions: {
      container: {
        w: 0,
        h: 0,
      },
      singleItem: {
        w: 0,
        h: 0,
        outerH: 0,
      },
    },
  };

  private get currentCollectionSize() {
    return !!this.collection ? this.collection.length : 0;
  }

  // THE BELOW ARE CURRENTLY HARDCODED TO A 3 COLUMN LAYOUT:
  private get listIncrement() {
    return this.paddingIncrement * this.state.currentColumnCount;
    // return 15; // 5 rows of 3 = 15 items
  }

  private get paddingIncrement() {
    return 4; // means that we always increment by 5 rows at once
  }

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    ro.unobserve(this);
  }
  protected firstUpdated() {
    this.storeNodeReferences();
    ro.observe(this);
  }

  protected updated(changes: any) {
    super.updated(changes);
    if (changes.has('startCollection')) {
      if (this.startCollection.length > 0) {
        this.initRecycleView();
      } else {
        // @TODO: Visually handle what happens when there is nothing to display:
      }
    }
    // if (changes.has('collection')) {
    //   console.log(
    //     '!!!!!!! collection update (from pagination) !!!!!!!',
    //     this.currentCollectionSize,
    //     this.collection,
    //   );
    // }
  }

  /* PUBLIC METHODS:
  ----------------------------------------------------------------------- */
  public debouncedResize = debounce(() => this.handleResize(), 400);
  public triggerRecycleUpdate() {
    this.domRecycleOperations(this.state.currentFirstIndex);
  }

  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  /**
   * Generic resize handling
   */

  private handleItemClick(itemNode: HTMLElement, e: UIEvent) {
    this.dispatchEvent(
      new CustomEvent('onViewItemClick', {
        detail: {
          itemNode,
          selectedItemIndex: parseInt(
            itemNode.getAttribute('data-current-item-id'),
            10,
          ),
          sourceEvent: e,
        },
      } as RecycleViewClickSelectEvent),
    );
  }

  private handleResize() {
    // @NOTRE: grab the width of the nodePoolContainerDom,
    // because we need the width minus any scroll bars
    this.state.dimensions.container.w = this.nodePoolContainerDom.offsetWidth;
    this.state.dimensions.container.h = this.offsetHeight;

    // @NOTE: the list dom object needs a min-height property to avoid flicker on windows browsers...
    this.style.setProperty('--minHeight', `${this.offsetHeight + 150}`);
    this.calculateGridColumns();
    this.calculateListSize();
    this.initRecycleView();
  }

  private checkToGetMoreItems() {
    return this.state.currentFirstIndex >=
      this.currentCollectionSize - this.listIncrement * 4 &&
      this.currentCollectionSize < this.wholeCollectionSize
      ? this.fetchMoreItems()
      : false;
  }

  private fetchMoreItems() {
    this.pagingDataProvider(this.currentCollectionSize).then((moreItems) => {
      this.collection = [...this.collection, ...moreItems];
    });
  }

  private initRecycleView() {
    // @NOTE: early exit, we have no usable data just yet...
    if (this.startCollection.length === 0) {
      return false;
    }

    // @NOTE: proceed with the initialization:
    this.collection = this.startCollection;
    this.reset();
    this.domRecycleOperations(0);
    this.initScrollAndIoListeners();
  }

  private calculateListSize() {
    const { currentColumnCount, dimensions } = this.state;
    const { container, singleItem } = dimensions;

    if (container.h === 0) {
      return false;
    }

    // @NOTE: Smaller form-factor screens require greater ratio's for the 
    // total list item size vs the screen size  
    // (to prevent the intersection observers from triggering during page changes)
    let heightMultiplyer =
      currentColumnCount === 1
        ? 6.5
        : container.h <= 150
        ? 13
        : container.h <= 250
        ? 10
        : container.h <= 500
        ? 6
        : 4;
    let rowCount = 1;
    let looping = true;
    const itemHeight = singleItem.outerH;
    while (looping && rowCount < 100) {
      const allRowsHeight = rowCount * itemHeight;
      // console.log('!!!!!! LOOPING !!!!!', this.state.dimensions.singleItem, rowCount, allRowsHeight);
      if (allRowsHeight / container.h >= heightMultiplyer) {
        looping = false;
      } else {
        rowCount += 1;
      }
    }

    this.state.currentRowCount = rowCount;
    // @NOTE: The list size must be atleast 8 on tiny devices (not exactly sure why)
    this.state.currentListSize = rowCount * this.state.currentColumnCount;
  }

  private calculateGridColumns() {
    const { container } = this.state.dimensions;

    if (container.w === 0) {
      return false;
    }

    let columnCount = 1;
    let cardWidth = container.w - ITEM_GRID_MARGIN;
    if (container.w > (ACCEPTABLE_CARD_SIZE_RANGE.minWidth + 20) * 2) {
      let looping = true;
      // @NOTE protect while loop from crashing out 40 * 200 = 8000px
      // (no desktop resolutions should ever get wider than this ...)
      while (looping && columnCount <= 40) {
        cardWidth = Math.floor(container.w / columnCount);
        cardWidth -= ITEM_GRID_MARGIN;
        // console.log(`
        //   !!!!! looping !!!
        //   container.w: ${container.w},
        //   container.w / columnCount: ${container.w / columnCount},
        //   cardWidth: ${cardWidth},
        //   columnCount: ${columnCount},
        // `);
        if (
          cardWidth <= ACCEPTABLE_CARD_SIZE_RANGE.maxWidth &&
          cardWidth >= ACCEPTABLE_CARD_SIZE_RANGE.minWidth
        ) {
          looping = false;
        } else {
          columnCount += 1;
        }
      }
    }

    // console.log('@@@@@@@@@@', columnCount);
    this.state.currentColumnCount = columnCount;
    this.setTemplateItemDimensions(cardWidth);
    this.style.setProperty('--columnCount', `${columnCount}`);
  }

  private setTemplateItemDimensions(cardWidth: number) {
    this.itemTemplateDom.classList.add('list__item');
    this.itemTemplateDom.style.width = `${cardWidth}px`;
    this.state.dimensions.singleItem.w = cardWidth;
    this.state.dimensions.singleItem.h = this.itemTemplateDom.offsetHeight;
    this.state.dimensions.singleItem.outerH = layoutHelpers.getOuterHeight(
      this.itemTemplateDom,
    );
  }

  private reset(): void {
    this.state.currentFirstIndex = 0;
    this.resetPadding();
    this.clearNodePool();
    this.initNodePool();
  }

  private storeNodeReferences(): void {
    this.itemTemplateDom = this.shadowRoot.querySelector('#itemTemplate')
      .children[0] as HTMLElement;
    this.nodePoolContainerDom = this.shadowRoot.querySelector(
      '.nodePool',
    ) as HTMLElement;
    this.topSentinelDom = this.shadowRoot.querySelector('.topSentinel');
    this.bottomSentinelDom = this.shadowRoot.querySelector('.bottomSentinel');
    this.overflowAreaDom = this.shadowRoot.querySelector('.overflowArea');
    // console.log(
    //   'storeNodeReferences()',
    //   this.itemTemplateDom,
    //   this.nodePoolContainerDom,
    //   this.topSentinelDom,
    //   this.bottomSentinelDom,
    // );
  }

  private clearNodePool(): void {
    this.nodePoolContainerDom.innerHTML = '';
  }

  private initNodePool(): void {
    for (let index = 0; index < this.state.currentListSize; index++) {
      const clone = this.itemTemplateDom.cloneNode(true) as HTMLElement;
      clone.style.width = null;
      clone.classList.add(`list__item--${index}`);
      clone.addEventListener('click', this.handleItemClick.bind(this, clone));
      this.nodePoolContainerDom.appendChild(clone);
    }
  }

  private internalDomRecycle(newFirstIndex: number): void {
    for (let i = 0; i < this.state.currentListSize; i++) {
      const newItem = this.collection[i + newFirstIndex];
      const itemDom = this.nodePoolContainerDom.children[i];
      // console.log('!!!!!!!! internalDomRecycle !!!!!!!', newItem, itemDom);

      if (newItem) {
        itemDom.setAttribute('data-current-item-id', newItem.id);
        itemDom.classList.remove('list__item--empty');
      } else {
        this.state.atListEnd = true;
        itemDom.classList.add('list__item--empty');
        itemDom.removeAttribute('data-current-item-id');
      }
    }
  }

  private domRecycleOperations(newFirstIndex: number) {
    // Internal recycle operations (updates internal state):
    this.internalDomRecycle(newFirstIndex);

    // Kickoff externalized dom recycle operations:
    this.recycleDom(
      newFirstIndex,
      this.state.currentListSize,
      this.shadowRoot.querySelector('.nodePool'),
    );
  }

  private updatePadding(scrollingDownwards = true): void {
    const paddingOffset =
      this.state.dimensions.singleItem.outerH * this.paddingIncrement;

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
    this.style.setProperty('--paddingTop', `${this.state.paddingTop}px`);
    this.style.setProperty('--paddingBottom', `${this.state.paddingBottom}px`);
  }

  private resetPadding(): void {
    this.state.paddingBottom = 0;
    this.state.paddingTop = 0;
    this.style.setProperty('--paddingBottom', '0px');
    this.style.setProperty('--paddingTop', '0px');
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
    console.log('!!!!!TOP SENTINEL!!!!!!', isIntersecting, this.state);
    const shouldChangePage =
      currentY > this.state.topSentinelPreviousY &&
      isIntersecting &&
      this.state.currentFirstIndex !== 0;

    // @NOTE: if the user has scrolled up enough, trigger a new page event:
    if (shouldChangePage) {
      this.changePaging(false);
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
        this.currentCollectionSize - this.state.currentListSize
    ) {
      this.state.bottomSentinelPreviousY = currentY;
      return false;
    }

    const isIntersecting = entry.isIntersecting;
    const shouldChangePage =
      currentY < this.state.bottomSentinelPreviousY && isIntersecting;
    // console.log("!!!!!BOTTOM SENTINEL!!!!!!", shouldChangePage);

    // @NOTE: if the user has scrolled down enough, trigger a new page event:
    if (shouldChangePage) {
      this.changePaging(true);
    }

    // Store current offset, for the next time:
    this.state.bottomSentinelPreviousY = currentY;
    return true;
  }

  private changePaging(downwards: boolean) {
    const newFirstIndex = this.calculateNewFirstIndex(downwards);
    this.updatePadding(downwards);
    this.domRecycleOperations(newFirstIndex);
    this.state.currentFirstIndex = newFirstIndex;
    if (downwards) this.checkToGetMoreItems();
  }

  private initScrollAndIoListeners(): void {
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const { target } = entry;
        if (target.classList.contains('topSentinel')) {
          this.topSentinelCallback(entry);
        } else if (target.classList.contains('bottomSentinel')) {
          this.bottomSentinelCallback(entry);
        }
      });
    };

    this.intersectionObserver = new IntersectionObserver(handleIntersection, {
      root: this.overflowAreaDom,
    });
    this.intersectionObserver.observe(this.topSentinelDom);
    this.intersectionObserver.observe(this.bottomSentinelDom);

    // @NOTE: Add some OVER-SCROLL PROTECTION:
    const handleScroll = throttle((e: UIEvent) => {
      // @NOTE: atm we dont care if the user is scrolling down...
      if (this.scrollTop > this.state.lastScrollPosition) {
        this.state.lastScrollPosition = this.scrollTop;
        return false;
      }

      this.state.lastScrollPosition = this.scrollTop;
      const rect = this.topSentinelDom.getBoundingClientRect();
      console.log(
        '!!!!!! CHECK TO RESCUE !!!!!!!',
        rect.top,
        this.state.paddingTop,
        this.state.currentFirstIndex,
        rect.top > this.state.dimensions.container.h &&
          this.state.paddingTop !== 0,
      );
      if (
        rect.top > this.state.dimensions.container.h &&
        this.state.paddingTop !== 0
      ) {
        console.log('$$$$$$$$$$$$$ DOING RESCUE $$$$$$$$$$$$$$$');
        this.state.currentFirstIndex = 0;
        this.resetPadding();
        this.domRecycleOperations(0);
        this.scrollTop = 0;
      }
    }, 1000);

    // @NOTE: bind scroll event, to watch for extreme scrolls:
    this.overflowAreaDom.addEventListener('scroll', handleScroll, {
      passive: true,
    });
  }

  protected render(): TemplateResult {
    return html`
      <style>
        ${this.itemStyles}
      </style>
      <div id="itemTemplate">${this.itemTemplate}</div>
      <div class="overflowArea">
        <div class="list">
          <div class="sentinel topSentinel"></div>
          <div class="nodePool"></div>
          <div class="sentinel bottomSentinel"></div>
        </div>
      </div>
      <div class="blockScrollBar"></div>
    `;
  }
}

customElements.define('gu-recycle-view', RecycleView);
