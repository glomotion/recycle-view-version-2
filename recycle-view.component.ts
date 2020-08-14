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
      :host,
      :host *,
      :host *::before,
      :host *::after {
        box-sizing: border-box;
      }

      :host {
        width: 100%;
        height: 100%;
        overflow: auto;
        font-family: Lato;
      }

      .list {
        padding-top: var(--paddingTop);
        padding-bottom: var(--paddingBottom);
        margin: 0;
        display: flex;
        flex-wrap: wrap;
      }

      .sentinal {
        width: 100%;
        height: 1px;
      }

      .list__tile {
        width: calc(33.33% - 20px);
        background-color: #f5f5f5;
        color: grey;
        margin: 10px;
        padding: 10px;
        text-align: center;
      }

      .list__tile--empty {
        background: black;
      }

      .list__tile--empty .list__tile__img,
      .list__tile--empty .list__tile__title {
        opacity: 0;
      }

      .list__tile__title {

      }

      .list__tile__img {
        display: block;
        margin: 0 auto;
        width: 100%;
        height: 200px;
        object-fit: cover;
      }
    `;
  }

  static get properties() {
    return {};
  }

  private topSentinelPreviousY = 0;
  private bottomSentinelPreviousY = 0;
  private listSize = 0;
  private collectionSize = 100;
  private collection = [];
  private currentFirstIndex = 0;
  private observer: any;
  private paddingTop = 0;
  private paddingBottom = 0;

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  constructor(props) {
    super();
    this.collectionSize = 41;
    this.collection = initCollection(this.collectionSize);
    this.listSize = 18; // 3 columns * 2 * 3
    // this.listSize = 24; // 4 columns * 2 * 3
    const remainderCells = this.collectionSize % this.listSize;
    if (remainderCells !== 0) {
      this.collection.push(
        ...new Array(this.listSize - remainderCells).fill({ empty: true })
      );
      this.collectionSize = this.collection.length;
    }
  }

  firstUpdated() {
    this.initIntersectionObserver();
  } 


  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  private recycleDom(firstIndex) {
    for (let i = 0; i < this.listSize; i++) {
      const newItem = this.collection[i + firstIndex];
      if (!newItem.empty) {
        const tile = this.shadowRoot.querySelector('.list__tile--' + i) as HTMLElement;
        tile.classList.remove('list__tile--empty');
        const img = tile.querySelector('.list__tile__img');
        const title = tile.querySelector('.list__tile__title');
        tile.setAttribute('data-current-tile-id', newItem.catCounter);
        title.innerHTML = newItem.title;
        img.setAttribute('src', newItem.imgSrc);
      } else {
        const tile = this.shadowRoot.querySelector('.list__tile--' + i) as HTMLElement;
        tile.classList.add('list__tile--empty');
      }
    }
  }

  private updatePadding(scrollingDownwards = true) {
    const container = this.shadowRoot.querySelector('.list') as HTMLElement;
    const firstItem = container.querySelector('.list__tile');
    const removePaddingValue = getOuterHeight(firstItem) * (this.listSize / 6) + 1;

    if (scrollingDownwards) {
      this.paddingTop += removePaddingValue;
      this.paddingBottom = this.paddingBottom === 0 ? 0 : this.paddingBottom - removePaddingValue;
    } else {
      this.paddingTop = this.paddingTop === 0 ? 0 : this.paddingTop - removePaddingValue;
      this.paddingBottom += removePaddingValue;
    }
    this.style.setProperty('--paddingTop', `${this.paddingTop}px`);
    this.style.setProperty('--paddingBottom', `${this.paddingBottom}px`);
  }

  private getNewWindowFirstIndex(scrollingDownwards = true) {
    const increment = this.listSize / 6;
    let firstIndex;
    
    if (scrollingDownwards) {
      firstIndex = this.currentFirstIndex + increment;
    } else {
      firstIndex = this.currentFirstIndex - increment;
    }
    
    if (firstIndex < 0) {
      firstIndex = 0;
    }
    
    return firstIndex;
  }

  private topSentryCallback(entry) {

    // Stop users from going off the page (in terms of the results set total)
    if (this.currentFirstIndex === 0) {
      this.style.setProperty('--paddingBottom', '0px');
      this.style.setProperty('--paddingTop', '0px');
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;
    const shouldChangePage = currentY > this.topSentinelPreviousY &&
      isIntersecting && this.currentFirstIndex !== 0;

    // check if user is actually Scrolling up
    if (shouldChangePage) {
      const firstIndex = this.getNewWindowFirstIndex(false);
      this.updatePadding(false);
      this.recycleDom(firstIndex);
      this.currentFirstIndex = firstIndex;
      console.log('!!!!!!!!!!', firstIndex);
    }

    // Store current offset, for the next time:
    this.topSentinelPreviousY = currentY;
  }

  private bottomSentryCallback(entry) {

    // Stop users from going off the page (in terms of the results set total)
    if (this.currentFirstIndex === this.collectionSize - this.listSize) {
      return false;
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;
    const shouldChangePage = currentY < this.bottomSentinelPreviousY &&
      isIntersecting;

    // check if user is actually Scrolling down
    if (shouldChangePage) {
      const firstIndex = this.getNewWindowFirstIndex(true);
      this.updatePadding(true);
      this.recycleDom(firstIndex);
      this.currentFirstIndex = firstIndex;
      console.log('!!!!!!!!!!', firstIndex);
    }

    // Store current offset, for the next time:
    this.bottomSentinelPreviousY = currentY;
  }

  private initIntersectionObserver() {
    const handleIntersection = entries => {
      entries.forEach(entry => {
        const { target } = entry;
        if (target.classList.contains('topSentinal')) {
          this.topSentryCallback(entry);
        } else if (target.classList.contains('bottomSentinal')) {
          this.bottomSentryCallback(entry);
        }
      });
    }

    this.observer = new IntersectionObserver(handleIntersection, {
      root: this,
    });
    this.observer.observe(this.shadowRoot.querySelector(".topSentinal"));
    this.observer.observe(this.shadowRoot.querySelector(".bottomSentinal"));
  }

  render() {
    const { collection } = this;
    const moo = new Array(this.listSize).fill({});
    console.log('!!!!! RENDERING !!!!!');

    return html`
      <div class='list'>
        <div class="sentinal topSentinal"></div>
        ${moo.map((_, i) => {
          const tile = collection[i];
          return html`
            <div class="list__tile list__tile--${i}" data-current-tile-id=${tile.catCounter}>
              <div class="list__tile__title">${tile.title} title text</div>
              <img class="list__tile__img" src=${tile.imgSrc} alt="moo" />
            </div>
          `
        })}
        <div class="sentinal bottomSentinal"></div>
      </div>
    `;
  }
}

customElements.define('gu-recycle-view', RecycleView);
