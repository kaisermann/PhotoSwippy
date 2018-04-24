(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.photoswippy = factory());
}(this, (function () { 'use strict';

/** Clones an array-like */
var slice = function (arrayLike) { return Array.prototype.slice.call(arrayLike); };

/** Finds the closest hierarchical parent that matches a certain condition */
var closest = function (el, fn) { return el && (fn(el) ? el : closest(el.parentNode, fn)); };

/** Preloads an image and executes a callback */
var preloadImage = function (url, onLoad, onError) {
  var tmpImg = new Image();
  tmpImg.onload = function () { return onLoad(tmpImg); };
  if (onError) {
    tmpImg.onerror = function () { return onError(tmpImg); };
  }
  tmpImg.src = url;
};
/** Gets an element index relative to its siblings */
var getElementIndex = function (node) {
  var index = 0;
  while ((node = node.previousElementSibling)) {
    ++index;
  }
  return index
};

/** Cross-browser Element.matches */
var selectorMatches = function (el, selector) {
  var fn =
    Element.prototype.matches ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector;
  return fn.call(el, selector)
};

/** Transform the url hash into an object */
var getURLHash = function () {
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

  return hashData
};

/** Object.assign ponyfill */
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

var PhotoSwipe;
var PhotoSwipeUI;
var PhotoSwipeGlobalOptions;
var PhotoswipeTemplate;
var galleryCount = 0;
var galleryList = {};

var defaultPhotoswippyOptions = {
  indexSelector: null,
  itemSelector: 'a',
  captionSelector: 'figcaption',
  hoverPreload: false,
  useMsrc: true
};

var openPhotoSwipe = function (gallery, curIndex, triggerEl) {
  triggerEl = triggerEl ||
    gallery.items[curIndex].el.querySelector('img') || {
      offsetWidth: 0,
      offsetHeight: 0
    };
  var isOpening = true;

  var options = assign({}, gallery.options, {
    index: curIndex,
    getThumbBoundsFn: function getThumbBoundsFn (index) {
      if (triggerEl.nodeType && triggerEl.offsetParent) {
        // decide weather to use triggerEl or element based on index
        var element = triggerEl;
        var isValidIndex = index >= 0 && index < gallery.items.length;
        if (!isOpening && isValidIndex) {
          var image = gallery.items[index].el;
          var imageVisible = image.nodeType && image.offsetParent;
          if (imageVisible) { element = image; }
        }
        isOpening = false;

        var pageYScroll =
          window.pageYOffset || document.documentElement.scrollTop;
        var rect = element.getBoundingClientRect();

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
      item.w = triggerEl.offsetWidth;
      item.h = triggerEl.offsetHeight;

      if (!options.hoverPreload || !item.preloadState) {
        preloadImage(item.src, function (img) {
          item.w = img.width;
          item.h = img.height;
          pswpGallery.updateSize(true);
        });
      }
    }
  });

  pswpGallery.init();
};

var handleGalleryClick = function (gallery) { return function (e) {
  e.preventDefault();

  /*
   * Go up the DOM tree until it finds
   * the clicked item (matches the itemSelector)
   */
  var currentItem = closest(
    e.target,
    function (el) { return el.nodeType === 1 && selectorMatches(el, gallery.options.itemSelector); }
  );

  // If the click didn't hit a gallery item, do nothing
  if (!currentItem) { return }

  /*
   * Let's get the clicked item index.
   * If indexSelector is null, let's assume the gallery element direct child.
   * If not null, let's search for a selector match and find it index.
   */
  var indexItemEl = closest(
    currentItem,
    typeof gallery.options.indexSelector === 'string'
      ? function (el) { return selectorMatches(el, gallery.options.indexSelector); }
      : function (el) { return el.parentNode === gallery.el; }
  );
  var actualIndex = getElementIndex(indexItemEl);
  openPhotoSwipe(gallery, actualIndex, currentItem);
}; };

var buildGallery = function (galleryEl, galleryOptions) {
  if ( galleryOptions === void 0 ) galleryOptions = {};

  /** Reads the data-pswp-options */
  if (galleryEl.dataset.pswpOptions) {
    galleryOptions = JSON.parse(galleryEl.dataset.pswpOptions);
  } else {
    /** Or the data-pswp-{kebabed-property}="value" */
    var relevantKeys = Object.keys(galleryEl.dataset).filter(
      function (k) { return k.indexOf('pswp') === 0 && k !== 'pswp'; }
    );
    if (relevantKeys.length > 0) {
      relevantKeys.forEach(function (datasetKey) {
        var realKey = datasetKey[4].toLowerCase() + datasetKey.substring(5);
        /** Set to the passed value or as true if we only found the attribute key */
        galleryOptions[realKey] = galleryEl.dataset[datasetKey] || true;
      });
    }
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
  ).map(function (itemEl) {
    var image = itemEl.querySelector('img');
    var captionEl = itemEl.querySelector(options.captionSelector) || {};

    var ref = (itemEl.dataset.pswpSize || '')
      .toLowerCase()
      .split('x')
      .map(parseInt);
    var width = ref[0];
    var height = ref[1];

    var w = width || itemEl.dataset.pswpWidth || 0;
    var h = height || itemEl.dataset.pswpHeight || 0;
    var title = itemEl.dataset.pswpCaption || captionEl.innerHTML || '';
    var src = itemEl.dataset.pswpSrc || itemEl.href;
    var galleryItem = { el: itemEl, src: src, w: w, h: h, title: title };

    if (image && options.useMsrc) {
      galleryItem.msrc = image.src;
    }

    if (options.hoverPreload) {
      itemEl.addEventListener('mouseover', function itemHover (e) {
        if (!galleryItem.preloadState) {
          galleryItem.preloadState = 1;
          preloadImage(
            src,
            function (img) {
              galleryItem.preloadState = 2;
              galleryItem.w = img.width;
              galleryItem.h = img.height;
              itemEl.removeEventListener('mouseover', itemHover);
            },
            function () {
              /** Reset the preload state in case of error and remove the listener */
              galleryItem.preloadState = 0;
              itemEl.removeEventListener('mouseover', itemHover);
            }
          );
        }
      });
    }

    return galleryItem
  });

  var gallery = { el: galleryEl, options: options, items: items };
  galleryEl.addEventListener('click', handleGalleryClick(gallery));

  return gallery
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
      galleryCount++;
      var gallery = buildGallery(galleryEl, options);
      galleryEl.photoswippy = true;
      galleryList[gallery.options.galleryUID] = gallery;
    }
  });

  /** If url's hash has a 'pid' and a 'gid', let's open that gallery */
  var urlHash = getURLHash();
  if (urlHash.pid && urlHash.gid && galleryList[urlHash.gid]) {
    openPhotoSwipe(galleryList[urlHash.gid], urlHash.pid - 1, null);
  }
  refreshTriggers();
};

/*
 * Search for `data-pswp-trigger="gallery-id"` elements to be used
 * as triggers to open a specific gallery.
 */
var refreshTriggers = function () {
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
          openPhotoSwipe(gallery, -1, this);
        }
      });
    }
  });
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
  PhotoSwipeGlobalOptions = assign(defaultPhotoswippyOptions, options);
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
