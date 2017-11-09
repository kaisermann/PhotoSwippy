/** Clones an array-like */
export const slice = arrayLike => Array.prototype.slice.call(arrayLike)

/** Finds the closest hierarchical parent that matches a certain condition */
export const closest = (el, fn) =>
  el && (fn(el) ? el : closest(el.parentNode, fn))

/** Preloads an image and executes a callback */
export const preloadImage = (url, onLoad, onError) => {
  const tmpImg = new Image()
  tmpImg.onload = () => onLoad(tmpImg)
  if (onError) {
    tmpImg.onerror = () => onError(tmpImg)
  }
  tmpImg.src = url
}
/** Gets an element index relative to its siblings */
export const getElementIndex = node => {
  let index = 0
  while ((node = node.previousElementSibling)) {
    ++index
  }
  return index
}

/** Cross-browser Element.matches */
export const selectorMatches = (el, selector) => {
  const fn =
    Element.prototype.matches ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector
  return fn.call(el, selector)
}

/** Transform the url hash into an object */
export const getURLHash = () => {
  const hashData = window.location.hash
    .substring(1)
    .split('&')
    .reduce((acc, cur) => {
      if (cur.length) {
        const [id, index] = cur.split('=')
        acc[id] = index
      }
      return acc
    }, {})

  return hashData
}

/** Object.assign ponyfill */
export const assign =
  Object.assign ||
  function (target /* sources */) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    const output = Object(target)

    for (let index = 1; index < arguments.length; index++) {
      const source = arguments[index]
      if (source != null) {
        for (const nextKey in source) {
          if (source.hasOwnProperty(nextKey)) {
            output[nextKey] = source[nextKey]
          }
        }
      }
    }
    return output
  }
