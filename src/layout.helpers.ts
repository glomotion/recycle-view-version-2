export const gridUnits = (multiplier: number): string => `${multiplier * 4}px`;

export const checkOutOfBounds = ({
  x,
  y,
  left,
  top,
  width,
  height,
  tolerance = 2,
}) => {
  if (window.scrollY >= top) {
    top -= window.scrollY;
    height += window.scrollY;
  }
  return (
    y >= Math.floor(height + top - tolerance) ||
    y <= top + tolerance ||
    x >= Math.floor(width + left - tolerance) ||
    x <= left + tolerance
  );
};

export const getOuterHeight = (el: HTMLElement) => {
  const computedStyles = window.getComputedStyle(el);
  const marginTop = parseInt(computedStyles.getPropertyValue("margin-top"));
  const marginBottom = parseInt(
    computedStyles.getPropertyValue("margin-bottom")
  );
  return el.offsetHeight + marginTop + marginBottom;
};

export const waitForImageToLoad = (img: HTMLImageElement) => {
  return new Promise((res) => {
    const onError = (err: UIEvent) => {
      console.error('Awww snap! <img> or <picture> LOAD ERROR:', err, img.src);
      onLoad();
    };
    const onLoad = () => {
      res();
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };

    if (img.complete) {
      res();
    } else {
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
    }
  });
};