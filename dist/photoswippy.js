(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.photoswippy = factory());
}(this, (function () { 'use strict';

var PhotoSwipe;
var PhotoSwipeUI;
var PhotoSwipeGlobalOptions;
var PhotoswipeTemplate;
var galleryCount = 0;
var galleryList = {};

var slice = function (arrayLike) { return Array.prototype.slice.call(arrayLike); };

var closest = function (el, fn) { return el && (fn(el) ? el : closest(el.parentNode, fn)); };

var assign =
  Object.assign ||
  function (target /* sources */) {
    var arguments$1 = arguments;

    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    var output = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var source = arguments$1[index];
      if (source != null) {
        for (var nextKey in source) {
          if (source.hasOwnProperty(nextKey)) {
            output[nextKey] = source[nextKey];
          }
        }
      }
    }
    return output
  };

var selectorMatches = function (el, selector) {
  var fn =
    Element.prototype.matches ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector;
  return fn.call(el, selector)
};

var getElementIndex = function (node) {
  var index = 0;
  while ((node = node.previousElementSibling)) {
    ++index;
  }
  return index
};

var openPhotoSwipe = function (gallery, index, trigger) {
  /* Photoswipe trigger is defined?
   * If not, is the element to be shown visible?
   * If yes, use its image as the trigger element
   */
  trigger =
    trigger ||
    (gallery.items[index].el.offsetParent &&
      gallery.items[index].el.getElementsByTagName('img')[0]);

  var options = assign({}, gallery.options, {
    index: index,
    getThumbBoundsFn: function (index) {
      if (trigger) {
        var pageYScroll =
          window.pageYOffset || document.documentElement.scrollTop;
        var rect = trigger.getBoundingClientRect();
        return { x: rect.left, y: rect.top + pageYScroll, w: rect.width }
      }
    }
  });

  var pswpGallery = new PhotoSwipe(
    PhotoswipeTemplate,
    PhotoSwipeUI,
    gallery.items,
    options
  );

  // Set width and height if not previously defined
  pswpGallery.listen('gettingData', function (index, item) {
    if (!item.w || !item.h) {
      var innerImgEl = item.el.getElementsByTagName('img')[0];
      if (innerImgEl) {
        item.w = innerImgEl.width;
        item.h = innerImgEl.height;
      }

      var img = new Image();
      img.onload = function () {
        item.w = this.width;
        item.h = this.height;
        pswpGallery.updateSize(true);
      };
      img.src = item.src;
    }
  });
  pswpGallery.init();
};

var handleGalleryClick = function (gallery) { return function (e) {
  e = e || window.event;
  e.preventDefault ? e.preventDefault() : (e.returnValue = false);

  /*
   * Go up the DOM tree until it finds
   * the clicked item (matches the itemSelector)
   */
  var currentItem = closest(
    e.target || e.srcElement,
    function (el) { return el.nodeType === 1 && selectorMatches(el, gallery.options.itemSelector); }
  );

  // If the click didn't hit a gallery item, do nothing
  if (!currentItem) { return }

  /* If, for some structural reason, the item is not a
   * direct child of the gallery element,
   * let's go up the DOM tree until we find it.
   */
  var tmpItem = currentItem;
  while (tmpItem.parentNode !== gallery.el) {
    tmpItem = tmpItem.parentNode;
  }
  openPhotoSwipe(gallery, getElementIndex(tmpItem), currentItem);
}; };

var buildGallery = function (galleryEl, galleryOptions) {
  galleryCount++;

  var dataPswpOptions = galleryEl.dataset.pswpOptions;
  if (dataPswpOptions != null && dataPswpOptions !== '') {
    galleryOptions = JSON.parse(dataPswpOptions);
  }

  var options = assign(
    // Default gallery ID
    {
      galleryUID:
        galleryEl.dataset.pswpId ||
        galleryEl.dataset.pswp ||
        ("gallery-" + galleryCount)
    },
    // Default options
    PhotoSwipeGlobalOptions,
    // Assign the options object if available. Otherwise, try to parse data-pswp
    galleryOptions
  );

  /* Update the element data-pswp attribute
   * with the actual ID (useful for generated ones)
   */
  galleryEl.dataset.pswp = options.galleryUID;

  var items = slice(
    galleryEl.querySelectorAll(options.itemSelector)
  ).map(function (item) {
    var ref = (item.dataset.pswpSize || '')
      .toLowerCase()
      .split('x');
    var width = ref[0];
    var height = ref[1];
    var captionEl = item.querySelector(options.captionSelector);
    var innerImgEl = item.getElementsByTagName('img')[0];

    return {
      el: item,
      src: item.dataset.pswpSrc || item.href,
      w: width || item.dataset.pswpWidth || 0,
      h: height || item.dataset.pswpHeight || 0,
      title:
        item.dataset.pswpCaption ||
        (captionEl && captionEl.innerHTML) ||
        (innerImgEl && innerImgEl.alt) ||
        ''
    }
  });

  return { el: galleryEl, options: options, items: items }
};

// Check if hash url has a 'gid' and a 'pid'
var verifyURLHash = function () {
  var hashData = window.location.hash
    .substring(1)
    .split('&')
    .reduce(function (acc, cur) {
      if (cur.length) {
        var ref = cur.split('=');
        var id = ref[0];
        var index = ref[1];
        acc[id] = index;
      }
      return acc
    }, {});

  if (hashData.pid && hashData.gid && galleryList[hashData.gid]) {
    openPhotoSwipe(galleryList[hashData.gid], hashData.pid - 1);
  }
};

/*
 * Search for `data-pswp-trigger="gallery-id"` elements to be used
 * as triggers to open a specific gallery.
 */
var searchTriggers = function () {
  var triggers = slice(document.querySelectorAll('[data-pswp-trigger]'));
  triggers.forEach(function (trigger) {
    if (!trigger.photoswippy) {
      trigger.photoswippy = true;
      trigger.addEventListener('click', function () {
        var gallery = galleryList[this.dataset.pswpTrigger];
        if (!gallery) {
          console.error(
            ("[PhotoSwippy] Gallery with id '" + (this.dataset
              .pswpTrigger) + "' not found.")
          );
        } else {
          openPhotoSwipe(gallery, 0, this);
        }
      });
    }
  });
};

var build = function (elOrSelector, options) {
  if (!PhotoSwipe || !PhotoSwipeUI) {
    console.error(
      '[PhotoSwippy] PhotoSwipe and PhotoSwipeUI libraries were not found. Was "PhotoSwippy.init()" called?'
    );
  }

  if (!elOrSelector) { return }

  var galleryEls =
    typeof elOrSelector === 'string'
      ? slice(document.querySelectorAll(elOrSelector))
      : [elOrSelector];

  galleryEls.forEach(function (galleryEl) {
    if (!galleryEl.photoswippy) {
      var gallery = buildGallery(galleryEl, options);
      galleryEl.photoswippy = true;
      galleryEl.addEventListener('click', handleGalleryClick(gallery));
      galleryList[gallery.options.galleryUID] = gallery;
    }
  });

  // Verify hash url
  verifyURLHash();
  searchTriggers();
};

var init = function (
  pswpLib,
  pswpUILib,
  options
) {
  if ( pswpLib === void 0 ) pswpLib = window.PhotoSwipe;
  if ( pswpUILib === void 0 ) pswpUILib = window.PhotoSwipeUI_Default;

  PhotoSwipe = pswpLib;
  PhotoSwipeUI = pswpUILib;
  PhotoSwipeGlobalOptions = assign(
    {
      itemSelector: 'a',
      captionSelector: 'figcaption'
    },
    options
  );
  PhotoswipeTemplate = document.querySelector('.pswp');
  if (!PhotoswipeTemplate) {
    console.error(
      '[PhotoSwippy] Photoswipe template (Element with .pswp class) not found.'
    );
  }

  // Initialize all available galleries (data-pswp)
  build('[data-pswp]');
};

var index = {
  init: init,
  build: build
};

return index;

})));
