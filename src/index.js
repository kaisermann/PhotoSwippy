import {
  slice,
  closest,
  assign,
  getElementIndex,
  selectorMatches,
  getURLHash,
  preloadImage
} from './helpers.js'

let PhotoSwipe
let PhotoSwipeUI
let PhotoSwipeGlobalOptions
let PhotoswipeTemplate
let galleryCount = 0
let galleryList = {}

const defaultPhotoswippyOptions = {
  indexSelector: null,
  itemSelector: 'a',
  captionSelector: 'figcaption',
  hoverPreload: false
}

const openPhotoSwipe = (gallery, curIndex, triggerEl) => {
  triggerEl = triggerEl ||
    gallery.items[curIndex].el.querySelector('img') || {
      offsetWidth: 0,
      offsetHeight: 0
    }

  const options = assign({}, gallery.options, {
    index: curIndex,
    getThumbBoundsFn (index) {
      if (triggerEl.nodeType && triggerEl.offsetParent) {
        const pageYScroll =
          window.pageYOffset || document.documentElement.scrollTop
        const rect = triggerEl.getBoundingClientRect()
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
      item.w = triggerEl.offsetWidth
      item.h = triggerEl.offsetHeight

      if (!options.hoverPreload || !item.preloadState) {
        preloadImage(item.src, img => {
          item.w = img.width
          item.h = img.height
          pswpGallery.updateSize(true)
        })
      }
    }
  })

  pswpGallery.init()
}

const handleGalleryClick = gallery => e => {
  e.preventDefault()

  /*
   * Go up the DOM tree until it finds
   * the clicked item (matches the itemSelector)
   */
  const currentItem = closest(
    e.target,
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
  const actualIndex = getElementIndex(indexItemEl)
  openPhotoSwipe(gallery, actualIndex, currentItem)
}

const buildGallery = (galleryEl, galleryOptions = {}) => {
  /** Reads the data-pswp-options */
  if (galleryEl.dataset.pswpOptions) {
    galleryOptions = JSON.parse(galleryEl.dataset.pswpOptions)
  } else {
    /** Or the data-pswp-{kebabed-property}="value" */
    const relevantKeys = Object.keys(galleryEl.dataset).filter(
      k => k.indexOf('pswp') === 0 && k !== 'pswp'
    )
    if (relevantKeys.length > 0) {
      relevantKeys.forEach(datasetKey => {
        const realKey = datasetKey[4].toLowerCase() + datasetKey.substring(5)
        /** Set to the passed value or as true if we only found the attribute key */
        galleryOptions[realKey] = galleryEl.dataset[datasetKey] || true
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
  ).map(itemEl => {
    const captionEl = itemEl.querySelector(options.captionSelector) || {}

    const [width, height] = (itemEl.dataset.pswpSize || '')
      .toLowerCase()
      .split('x')
      .map(parseInt)

    const w = width || itemEl.dataset.pswpWidth || 0
    const h = height || itemEl.dataset.pswpHeight || 0
    const title = itemEl.dataset.pswpCaption || captionEl.innerHTML || ''
    const src = itemEl.dataset.pswpSrc || itemEl.href
    const galleryItem = { el: itemEl, src, w, h, title }

    if (options.hoverPreload) {
      itemEl.addEventListener('mouseover', function itemHover (e) {
        if (!galleryItem.preloadState) {
          galleryItem.preloadState = 1
          preloadImage(
            src,
            img => {
              galleryItem.preloadState = 2
              galleryItem.w = img.width
              galleryItem.h = img.height
              itemEl.removeEventListener('mouseover', itemHover)
            },
            () => {
              /** Reset the preload state in case of error and remove the listener */
              galleryItem.preloadState = 0
              itemEl.removeEventListener('mouseover', itemHover)
            }
          )
        }
      })
    }

    return galleryItem
  })

  const gallery = { el: galleryEl, options, items }
  galleryEl.addEventListener('click', handleGalleryClick(gallery))

  return gallery
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
      galleryCount++
      const gallery = buildGallery(galleryEl, options)
      galleryEl.photoswippy = true
      galleryList[gallery.options.galleryUID] = gallery
    }
  })

  /** If url's hash has a 'pid' and a 'gid', let's open that gallery */
  const urlHash = getURLHash()
  if (urlHash.pid && urlHash.gid && galleryList[urlHash.gid]) {
    openPhotoSwipe(galleryList[urlHash.gid], urlHash.pid - 1, null)
  }
  refreshTriggers()
}

/*
 * Search for `data-pswp-trigger="gallery-id"` elements to be used
 * as triggers to open a specific gallery.
 */
const refreshTriggers = () => {
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
