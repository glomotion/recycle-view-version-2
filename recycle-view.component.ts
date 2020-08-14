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
        height: 2px;
      }

      .list__tile {
        width: calc(50% - 20px);
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
        opacity: 0;
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
  private atListEnd = false;

  /* LIT ELEMENT COMPONENT LIFE CYCLE EVENTS:
  ----------------------------------------------------------------------- */
  constructor(props) {
    super();
    this.collectionSize = 43;
    this.collection = initCollection(this.collectionSize);
    this.listSize = 20;
  }

  firstUpdated() {
    this.initIntersectionObserver();
  } 


  /* PRIVATE METHODS:
  ----------------------------------------------------------------------- */
  private get listIncrement() {
    return 10;
  }
  private get paddingIncrement() {
    return 5;
  }

  private recycleDom(firstIndex) {
    for (let i = 0; i < this.listSize; i++) {
      const newItem = this.collection[i + firstIndex];
      const tile = this.shadowRoot.querySelector('.list__tile--' + i) as HTMLElement;
      const img = tile.querySelector('.list__tile__img');
      const title = tile.querySelector('.list__tile__title');
      if (newItem) {
        tile.setAttribute('data-current-tile-id', newItem.catCounter);
        title.innerHTML = newItem.title;
        img.setAttribute('src', newItem.imgSrc);
      } else {
        this.atListEnd = true;
        tile.removeAttribute('data-current-tile-id');
        title.innerHTML = '';
        img.setAttribute('src', '');
      }
    }
  }

  private updatePadding(scrollingDownwards = true) {
    const container = this.shadowRoot.querySelector('.list') as HTMLElement;
    const firstItem = container.querySelector('.list__tile');
    const paddingOffset = getOuterHeight(firstItem) * (this.paddingIncrement);

    if (scrollingDownwards) {
      this.paddingTop += paddingOffset;
      this.paddingBottom = this.paddingBottom === 0 ? 0 : this.paddingBottom - paddingOffset;
    } else {
      this.paddingTop = this.paddingTop === 0 ? 0 : this.paddingTop - paddingOffset;
      this.paddingBottom += paddingOffset;
    }
    this.style.setProperty('--paddingTop', `${this.paddingTop}px`);
    this.style.setProperty('--paddingBottom', `${this.paddingBottom}px`);
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

  private topSentryCallback(entry) {
    this.atListEnd = false;

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
      const firstIndex = this.calculateNewFirstIndex(false);
      this.updatePadding(false);
      this.recycleDom(firstIndex);
      this.currentFirstIndex = firstIndex;
    }

    // Store current offset, for the next time:
    this.topSentinelPreviousY = currentY;
  }

  private bottomSentryCallback(entry) {
    console.log('!!!!!!!!!', this.atListEnd);

    // Stop users from going off the page (in terms of the results set total)
    // if (this.calculateNewFirstIndex(true) + this.listIncrement > this.collectionSize) {
    //   console.log('!!!!!!!!!! UNEVEN ENDING !!!!!!!!!!!!');
    //   const firstIndex = this.collectionSize - this.listSize;
    //   this.recycleDom(firstIndex);
    //   this.currentFirstIndex = firstIndex;
    //   return false;
    // } else 
    if (this.atListEnd || this.currentFirstIndex === this.collectionSize - this.listSize) {
      console.log('@@@@@@@@@ DOWNWARDS: EVEN END @@@@@@@@@@@@');
      return false;
    }

    const currentY = entry.boundingClientRect.top;
    const isIntersecting = entry.isIntersecting;
    const shouldChangePage = currentY < this.bottomSentinelPreviousY &&
      isIntersecting;

    // check if user is actually Scrolling down
    if (shouldChangePage) {
      const firstIndex = this.calculateNewFirstIndex(true);
      this.updatePadding(true);
      this.recycleDom(firstIndex);
      this.currentFirstIndex = firstIndex;
      // console.log('!!!!!!!!!!', firstIndex);
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
              <div class="list__tile__title">${tile.title}</div>
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
