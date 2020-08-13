import Stats from 'stats.js';
import 'requestidlecallback-polyfill';

import './style.css';

let topSentinelPreviousY = 0;
let bottomSentinelPreviousY = 0;
let listSize = 20;
let DBSize = 200;
let DB = [];
let currentIndex = 0;

const getCatImg = () => {
  const randomNum = () => {
    return Math.floor(Math.random() * 100000);
  };
  const url = "https://source.unsplash.com/collection/139386/200x200/?sig=";
  return url + randomNum();
};

const initDB = num => {
	const db = [];
  for (let i = 0; i < num; i++) {
  	db.push({
    	catCounter: i,
      title: `cat image number ${i}`,
      imgSrc: getCatImg()
    })
  }
  return db;
}

const initList = num => {
	const container = document.querySelector(".cat-list");
  
  for (let i = 0; i < num; i++) {
  	const tile = document.createElement("LI");
    tile.setAttribute("class", "cat-tile");
    tile.setAttribute("id", "cat-tile-" + i);
    const title = document.createElement("H3");
    const t = document.createTextNode(DB[i].title);
    title.appendChild(t);
    tile.appendChild(title);
    const img = document.createElement("IMG");
    img.setAttribute("src", DB[i].imgSrc);
    tile.appendChild(img);
  	container.appendChild(tile);
  }
}

function getOuterHeight(el) {
  const computedStyles = window.getComputedStyle(el);
  const marginTop = parseInt(computedStyles.getPropertyValue('margin-top'));
  const marginBottom = parseInt(computedStyles.getPropertyValue('margin-bottom'));
  return el.offsetHeight + marginTop + marginBottom;
}

const getSlidingWindow = isScrollDown => {
	const increment = listSize / 2;
	let firstIndex;
  
  if (isScrollDown) {
  	firstIndex = currentIndex + increment;
  } else {
    firstIndex = currentIndex - increment;
  }
  
  if (firstIndex < 0) {
  	firstIndex = 0;
  }
  
  return firstIndex;
}

const recycleDOM = firstIndex => {
	for (let i = 0; i < listSize; i++) {
  	const tile = document.querySelector("#cat-tile-" + i) as HTMLElement;
    (tile.firstElementChild as HTMLElement).innerText = DB[i + firstIndex].title;
    (tile.lastChild as HTMLElement).setAttribute("src", DB[i + firstIndex].imgSrc);
  }
}

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

const adjustPaddings = isScrollDown => {
	const container = document.querySelector(".cat-list") as HTMLElement;
  const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
  const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
  const firstItem = container.querySelector('.cat-tile:nth-child(1)');
  const removePaddingValue = getOuterHeight(firstItem) * (listSize / 2);

	if (isScrollDown) {
  	container.style.paddingTop = currentPaddingTop + removePaddingValue + "px";
    container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - removePaddingValue + "px";
  } else {
  	container.style.paddingBottom = currentPaddingBottom + removePaddingValue + "px";
    container.style.paddingTop = currentPaddingTop === 0 ? "0px" : currentPaddingTop - removePaddingValue + "px";
  }
}

const topSentCallback = entry => {
	if (currentIndex === 0) {
		const container = document.querySelector(".cat-list") as HTMLElement;
  	container.style.paddingTop = "0px";
  	container.style.paddingBottom = "0px";
  }

  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;

  // conditional check for Scrolling up
  if (
    currentY > topSentinelPreviousY &&
    isIntersecting &&
    currentIndex !== 0
  ) {
    const firstIndex = getSlidingWindow(false);
    adjustPaddings(false);
    recycleDOM(firstIndex);
    currentIndex = firstIndex;
  }

  topSentinelPreviousY = currentY;
}

const botSentCallback = entry => {
	if (currentIndex === DBSize - listSize) {
  	return;
  }

  const currentY = entry.boundingClientRect.top;
  const isIntersecting = entry.isIntersecting;
  // console.log(`
  //   !!!!!!!!!!!!!! BOTTOM CALLBACK !!!!!!!!!
  //   isIntersecting: ${isIntersecting},
  //   currentY: ${currentY},
  //   rect: ${JSON.stringify(entry.boundingClientRect)},
  // `);

  // conditional check for Scrolling down
  if (
    currentY < bottomSentinelPreviousY &&
    isIntersecting
  ) {
    const firstIndex = getSlidingWindow(true);
    adjustPaddings(true);
    recycleDOM(firstIndex);
    currentIndex = firstIndex;
  }

  bottomSentinelPreviousY = currentY;
}

const initIntersectionObserver = () => {
  const options = {
  	/* root: document.querySelector(".cat-list") */
  }

  const callback = entries => {
    entries.forEach(entry => {
      if (entry.target.id === 'cat-tile-0') {
        topSentCallback(entry);
      } else if (entry.target.id === `cat-tile-${listSize - 1}`) {
        botSentCallback(entry);
      }
    });
  }

  var observer = new IntersectionObserver(callback, options);
  observer.observe(document.querySelector("#cat-tile-0"));
  observer.observe(document.querySelector(`#cat-tile-${listSize - 1}`));
}

const start = () => {
  DBSize = 200;
  listSize = 10;
  DB = initDB(DBSize);
	initList(listSize);
	initIntersectionObserver();
}

start();
initStats();

function initStats() {
  const stats = new Stats();
  const domPanel = new Stats.Panel('DOM Nodes', '#0ff', '#002');
  stats.addPanel(domPanel);
  stats.showPanel(3);
  document.body.appendChild(stats.dom);

  const TIMEOUT = 100;
  setTimeout(function timeoutFunc() {
    // Only update DOM node graph when we have time to spare to call
    // numDomNodes(), which is a fairly expensive function.
    window.requestIdleCallback(function() {
      domPanel.update(numDomNodes(document.body), 1500);
      setTimeout(timeoutFunc, TIMEOUT);
    });
  }, TIMEOUT);
}

function numDomNodes(node) {
  if(!node.children || node.children.length == 0)
    return 0;
  var childrenCount = Array.from(node.children).map(numDomNodes);
  return node.children.length + childrenCount.reduce(function(p, c){ return p + c; }, 0);
}

declare const window: any;
