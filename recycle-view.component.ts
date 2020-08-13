import { html, css, LitElement } from 'lit-element';

/* DEMO HELPER FUNCTIONS:
  ----------------------------------------------------------------------- */
const getRandomCatImg = () => {
  const randomNum = () => {
    return Math.floor(Math.random() * 100000);
  };
  const url = 'https://source.unsplash.com/collection/139386/200x200/?sig=';
  return url + randomNum();
};

const initCollection = numberOfItems => {
	const collection = [];
  for (let i = 0; i < numberOfItems; i++) {
  	collection.push({
    	catCounter: i,
      title: `Cat image: ${i}`,
      imgSrc: getRandomCatImg()
    })
  }
  return collection;
}

const getOuterHeight = (el) => {
  const computedStyles = window.getComputedStyle(el);
  const marginTop = parseInt(computedStyles.getPropertyValue('margin-top'));
  const marginBottom = parseInt(computedStyles.getPropertyValue('margin-bottom'));
  return el.offsetHeight + marginTop + marginBottom;
}

const getNumberFromStyle = style => parseInt(style, 10);

/* THE RE-CYCLE VIEW COMPONENT:
  ----------------------------------------------------------------------- */

export class RecycleView extends LitElement {
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

  private topSentinelPreviousY = 0;
  private bottomSentinelPreviousY = 0;
  private listSize = 20;
  private collectionSize = 200;
  private collection = [];
  private currentIndex = 0;
  private observer: any;

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  constructor(props) {
    super();
    this.collectionSize = 200;
    this.listSize = 10;
    this.collection = initCollection(this.collectionSize);
  }

  firstUpdated() {
    this.initIntersectionObserver();
  } 


  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  private recycleDom(firstIndex) {
    for (let i = 0; i < this.listSize; i++) {
      const tile = this.shadowRoot.querySelector('.tile-' + i) as HTMLElement;
      (tile.firstElementChild as HTMLElement).innerText = this.collection[i + firstIndex].title;
      (tile.lastChild as HTMLElement).setAttribute('src', this.collection[i + firstIndex].imgSrc);
    }
  }

  private updatePadding(scrollingDownwards = true) {
    const container = this.shadowRoot.querySelector('.list') as HTMLElement;
    const currentPaddingTop = getNumberFromStyle(this.style.paddingTop);
    const currentPaddingBottom = getNumberFromStyle(this.style.paddingBottom);
    const firstItem = container.querySelector('.tile:nth-child(1)');
    const removePaddingValue = getOuterHeight(firstItem) * (this.listSize / 2);

    if (scrollingDownwards) {
      container.style.paddingTop = `${currentPaddingTop + removePaddingValue}px`;
      container.style.paddingBottom = currentPaddingBottom === 0 ? '0px' : `${currentPaddingBottom - removePaddingValue}px`;
    } else {
      container.style.paddingBottom = `${currentPaddingBottom + removePaddingValue}px`;
      container.style.paddingTop = currentPaddingTop === 0 ? '0px' : `${currentPaddingTop - removePaddingValue}px`;
    }
  }

  private getCurrentWindowFirstIndex(scrollingDownwards = true) {
    const increment = this.listSize / 2;
    let firstIndex;
    
    if (scrollingDownwards) {
      firstIndex = this.currentIndex + increment;
    } else {
      firstIndex = this.currentIndex - increment;
    }
    
    if (firstIndex < 0) {
      firstIndex = 0;
    }
    
    return firstIndex;
  }

  private topSentryCallback(entry) {

    // Stop users from going off the page (in terms of the results set total)
    if (this.currentIndex === 0) {
      const container = this.shadowRoot.querySelector('.list') as HTMLElement;
      container.style.paddingTop = '0px';
      container.style.paddingBottom = '0px';
      return false;
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;

    // check if user is actually Scrolling up
    if (
      currentY > this.topSentinelPreviousY &&
      isIntersecting &&
      this.currentIndex !== 0
    ) {
      const firstIndex = this.getCurrentWindowFirstIndex(false);
      this.updatePadding(false);
      this.recycleDom(firstIndex);
      this.currentIndex = firstIndex;
    }

    // Store current offset, for the next time:
    this.topSentinelPreviousY = currentY;
  }

  private bottomSentryCallback(entry) {

    // Stop users from going off the page (in terms of the results set total)
    if (this.currentIndex === this.collectionSize - this.listSize) {
      return false;
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;

    // check if user is actually Scrolling down
    if (
      currentY < this.bottomSentinelPreviousY &&
      isIntersecting
    ) {
      const firstIndex = this.getCurrentWindowFirstIndex(true);
      this.updatePadding(true);
      this.recycleDom(firstIndex);
      this.currentIndex = firstIndex;
    }

    // Store current offset, for the next time:
    this.bottomSentinelPreviousY = currentY;
  }

  private initIntersectionObserver() {
    const options = {
      /* root: document.querySelector(".cat-list") */
    }

    const callback = entries => {
      entries.forEach(entry => {
        if (entry.target.id === 'tile-0') {
          this.topSentryCallback(entry);
        } else if (entry.target.id === `tile-${this.listSize - 1}`) {
          this.bottomSentryCallback(entry);
        }
      });
    }

    this.observer = new IntersectionObserver(callback, options);
    this.observer.observe(this.shadowRoot.querySelector("#tile-0"));
    this.observer.observe(this.shadowRoot.querySelector(`#tile-${this.listSize - 1}`));
  }

  render() {
    const { collection } = this;

    return html`
      <div 
        class='list' 
        style='top-padding: 0px; bottom-padding: 0px'
      >
        ${collection.map((tile) => {
          return html`
            <div class="tile tile-${tile.catCounter}">
              <div class="tile__name">${tile.title}</div>
              <img src=${tile.imgSrc} alt="moo" />
            </div>
          `;
        })}
      </div>
    `;
  }
}

customElements.define('gu-recycle-view', RecycleView);
