let PhotoSwipe
let PhotoSwipeUI
let PhotoSwipeGlobalOptions
let PhotoswipeTemplate
let galleryCount = 0
let galleryList = {}

const defaultPhotoswippyOptions = {
  indexSelector: null,
  itemSelector: 'a',
  captionSelector: 'figcaption'
}

/** Clones an array-like */
const slice = arrayLike => Array.prototype.slice.call(arrayLike)

/** Finds the closest hierarchical parent that matches a certain condition */
const closest = (el, fn) => el && (fn(el) ? el : closest(el.parentNode, fn))

const assign =
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

const selectorMatches = (el, selector) => {
  const fn =
    Element.prototype.matches ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector
  return fn.call(el, selector)
}

const getElementIndex = node => {
  let index = 0
  while ((node = node.previousElementSibling)) {
    ++index
  }
  return index
}

const openPhotoSwipe = (gallery, index, trigger) => {
  const maybeCurrentThumb = gallery.items[index].el.querySelector('img') || {}
  trigger = trigger || maybeCurrentThumb

  const options = assign({}, gallery.options, {
    index,
    getThumbBoundsFn (index) {
      if (trigger.nodeType === 1) {
        const pageYScroll =
          window.pageYOffset || document.documentElement.scrollTop
        const rect = trigger.getBoundingClientRect()
        return { x: rect.left, y: rect.top + pageYScroll, w: rect.width }
      }
    }
  })

  const pswpGallery = new PhotoSwipe(
    PhotoswipeTemplate,
    PhotoSwipeUI,
    gallery.items,
    options
  )

  // Set width and height if not previously defined
  pswpGallery.listen('gettingData', (index, item) => {
    if (!item.w || !item.h) {
      item.w = trigger.offsetWidth || maybeCurrentThumb.offsetWidth
      item.h = trigger.offsetHeight || maybeCurrentThumb.offsetHeight

      const img = new Image()
      img.onload = function () {
        item.w = this.width
        item.h = this.height
        pswpGallery.updateSize(true)
      }
      img.src = item.src
    }
  })

  pswpGallery.init()
}

const handleGalleryClick = gallery => e => {
  e = e || window.event
  e.preventDefault ? e.preventDefault() : (e.returnValue = false)

  /*
   * Go up the DOM tree until it finds
   * the clicked item (matches the itemSelector)
   */
  const currentItem = closest(
    e.target || e.srcElement,
    el => el.nodeType === 1 && selectorMatches(el, gallery.options.itemSelector)
  )

  // If the click didn't hit a gallery item, do nothing
  if (!currentItem) return

  /*
   * Let's get the clicked item index.
   * If indexSelector is null, let's assume the gallery element direct child.
   * If not null, let's search for a selector match and find it index.
   */
  const indexItemEl = closest(
    currentItem,
    typeof gallery.options.indexSelector === 'string'
      ? el => selectorMatches(el, gallery.options.indexSelector)
      : el => el.parentNode === gallery.el
  )
  openPhotoSwipe(gallery, getElementIndex(indexItemEl))
}

const buildGallery = (galleryEl, galleryOptions = {}) => {
  galleryCount++

  const dataPswpOptions = galleryEl.dataset.pswpOptions
  /** Reads the data-pswp-options */
  if (dataPswpOptions != null && dataPswpOptions !== '') {
    galleryOptions = JSON.parse(dataPswpOptions)
  } else {
    /** Or the data-pswp-{kebabed-property}="value" */
    const relevantKeys = Object.keys(galleryEl.dataset).filter(
      k => k.indexOf('pswp') === 0 && k !== 'pswp'
    )
    if (relevantKeys.length > 0) {
      relevantKeys.forEach(datasetKey => {
        const realKey = datasetKey[4].toLowerCase() + datasetKey.substring(5)
        if (galleryEl.dataset[datasetKey]) {
          galleryOptions[realKey] = galleryEl.dataset[datasetKey]
        }
      })
    }
  }

  const options = assign(
    // Default gallery ID
    {
      galleryUID:
        galleryEl.dataset.pswpId ||
        galleryEl.dataset.pswp ||
        `gallery-${galleryCount}`
    },
    // Default options
    PhotoSwipeGlobalOptions,
    // Assign the options object if available. Otherwise, try to parse data-pswp
    galleryOptions
  )

  /* Update the element data-pswp attribute
   * with the actual ID (useful for generated ones)
   */
  galleryEl.dataset.pswp = options.galleryUID

  const items = slice(
    galleryEl.querySelectorAll(options.itemSelector)
  ).map(el => {
    const captionEl = el.querySelector(options.captionSelector) || {}

    const [width, height] = (el.dataset.pswpSize || '')
      .toLowerCase()
      .split('x')
      .map(parseInt)

    const w = width || el.dataset.pswpWidth || 0
    const h = height || el.dataset.pswpHeight || 0
    const title = el.dataset.pswpCaption || captionEl.innerHTML || ''
    const src = el.dataset.pswpSrc || el.href

    return { el, src, w, h, title }
  })

  return { el: galleryEl, options, items }
}

// Check if hash url has a 'gid' and a 'pid'
const verifyURLHash = () => {
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

  if (hashData.pid && hashData.gid && galleryList[hashData.gid]) {
    openPhotoSwipe(galleryList[hashData.gid], hashData.pid - 1)
  }
}

/*
 * Search for `data-pswp-trigger="gallery-id"` elements to be used
 * as triggers to open a specific gallery.
 */
const searchTriggers = () => {
  const triggers = slice(document.querySelectorAll('[data-pswp-trigger]'))
  triggers.forEach(trigger => {
    if (!trigger.photoswippy) {
      trigger.photoswippy = true
      trigger.addEventListener('click', function () {
        const gallery = galleryList[this.dataset.pswpTrigger]
        if (!gallery) {
          console.error(
            `[PhotoSwippy] Gallery with id '${this.dataset
              .pswpTrigger}' not found.`
          )
        } else {
          openPhotoSwipe(gallery, 0, this)
        }
      })
    }
  })
}

const build = (elOrSelector, options) => {
  if (!PhotoSwipe || !PhotoSwipeUI) {
    console.error(
      '[PhotoSwippy] PhotoSwipe and PhotoSwipeUI libraries were not found. Was "PhotoSwippy.init()" called?'
    )
  }

  if (!elOrSelector) return

  const galleryEls =
    typeof elOrSelector === 'string'
      ? slice(document.querySelectorAll(elOrSelector))
      : [elOrSelector]

  galleryEls.forEach(galleryEl => {
    if (!galleryEl.photoswippy) {
      const gallery = buildGallery(galleryEl, options)
      galleryEl.photoswippy = true
      galleryEl.addEventListener('click', handleGalleryClick(gallery))
      galleryList[gallery.options.galleryUID] = gallery
    }
  })

  // Verify hash url
  verifyURLHash()
  searchTriggers()
}

const init = (
  pswpLib = window.PhotoSwipe,
  pswpUILib = window.PhotoSwipeUI_Default,
  options
) => {
  PhotoSwipe = pswpLib
  PhotoSwipeUI = pswpUILib
  PhotoSwipeGlobalOptions = assign(defaultPhotoswippyOptions, options)
  PhotoswipeTemplate = document.querySelector('.pswp')
  if (!PhotoswipeTemplate) {
    console.error(
      '[PhotoSwippy] Photoswipe template (Element with .pswp class) not found.'
    )
  }

  // Initialize all available galleries (data-pswp)
  build('[data-pswp]')
}

export default {
  init,
  build
}
