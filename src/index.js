let PhotoSwipe
let PhotoSwipeUI
let PhotoSwipeGlobalOptions
let PhotoswipeTemplate
let galleryCount = 0
let galleryList = {}

const slice = arrayLike => Array.prototype.slice.call(arrayLike)
const closest = (el, fn) => el && (fn(el) ? el : closest(el.parentNode, fn))

const assign =
  Object.assign ||
  function (target /* sources */) {
    if (target === undefined || target === null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    const output = Object(target)

    for (let index = 1; index < arguments.length; index++) {
      let source = arguments[index]
      if (source !== undefined && source !== null) {
        for (let nextKey in source) {
          if (source.hasOwnProperty(nextKey)) {
            output[nextKey] = source[nextKey]
          }
        }
      }
    }
    return output
  }

const selectorMatches = (el, selector) => {
  const f =
    Element.prototype.matches ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector
  return f.call(el, selector)
}

const getElementIndex = node => {
  let index = 0
  while ((node = node.previousElementSibling) && ++index);
  return index
}

const getThumbBoundsFn = trigger => index => {
  if (trigger) {
    const pageYScroll = window.pageYOffset || document.documentElement.scrollTop
    const rect = trigger.getBoundingClientRect()
    return { x: rect.left, y: rect.top + pageYScroll, w: rect.width }
  }
}

const openPhotoSwipe = (gallery, index, trigger) => {
  // Photoswipe trigger is defined? If not, is the element to be shown visible? If yes, use its image as the trigger element
  trigger =
    trigger ||
    (gallery.items[index].el.offsetParent &&
      gallery.items[index].el.getElementsByTagName('img')[0])

  const options = assign({}, gallery.options, {
    index,
    getThumbBoundsFn: getThumbBoundsFn(trigger)
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
      const innerImgEl = item.el.getElementsByTagName('img')[0]
      if (innerImgEl) {
        item.w = innerImgEl.width
        item.h = innerImgEl.height
      }

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

  const target = e.target || e.srcElement
  const currentItem = closest(
    target,
    el => el.nodeType === 1 && selectorMatches(el, gallery.options.itemSelector)
  )
  if (!currentItem) return

  let tmpItem = currentItem
  while (tmpItem.parentNode !== gallery.el) {
    tmpItem = tmpItem.parentNode
  }
  const currentIndex = getElementIndex(tmpItem)
  if (currentIndex >= 0) {
    openPhotoSwipe(gallery, currentIndex, currentItem)
  }
}

const buildGallery = (el, galleryOptions) => {
  const dataPswp = el.dataset.pswp
  if (dataPswp != null && dataPswp !== '') {
    galleryOptions = JSON.parse(dataPswp)
  }

  const options = assign(
    // Default gallery ID
    { galleryUID: el.dataset.pswpId || `gallery-${++galleryCount}` },
    // Default options
    PhotoSwipeGlobalOptions,
    // Assign the options object if available. Otherwise, try to parse data-pswp
    galleryOptions
  )

  const items = slice(el.querySelectorAll(options.itemSelector)).map(item => {
    const [width, height] = (item.dataset.pswpSize || '').split('x')
    const captionEl = item.querySelector(options.captionSelector)
    const innerImgEl = item.getElementsByTagName('img')[0]

    return {
      el: item,
      src: item.dataset.pswpSrc || item.href,
      w: width || item.dataset.pswpWidth || 0,
      h: height || item.dataset.pswpHeight || 0,
      title:
        item.dataset.pswpTitle ||
        (captionEl && captionEl.innerHTML) ||
        (innerImgEl && innerImgEl.alt) ||
        ''
    }
  })

  return { el, options, items }
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
        openPhotoSwipe(galleryList[this.dataset.pswpTrigger], 0, this)
      })
    }
  })
}

const build = (elOrSelector, options) => {
  if (!PhotoSwipe || !PhotoSwipeUI) {
    throw Error(
      '[PhotoSwippy] Must initialize photoswipe with PhotoSwippy.init()'
    )
  }

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
  PhotoSwipeGlobalOptions = assign(
    {
      itemSelector: 'a',
      captionSelector: 'figcaption'
    },
    options
  )
  PhotoswipeTemplate = document.querySelector('.pswp')
  if (!PhotoswipeTemplate) {
    throw Error(
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
