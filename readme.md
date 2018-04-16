# PhotoSwippy

[PhotoSwipe](http://photoswipe.com/) is an awesome modular, lightweight and fast lightbox. Unfortunately its implementation can be a bit cumbersome, having to write a lot of code. There are some helpers, such as [jquery.photoswipe](https://github.com/yaquawa/jquery.photoswipe) and [photoswiper](https://www.npmjs.com/package/photoswiper), but something simpler, but still configurable, was needed and so **PhotoSwippy** was born.

## Installation

`npm install --save photoswippy`

`yarn add photoswippy`

`bower install --save photoswippy`

## Usage

`PhotoSwippy` is just a wrapper for `PhotoSwipe`. This means you still have to import/include the `PhotoSwipe` and `PhotoSwipeUI` libraries (and the rest of the relevant assets such as CSS and icons). `PhotoSwippy` expects that the [`PhotoSwipe template element`](http://photoswipe.com/documentation/getting-started.html) has the `pswp` class and it's already on the DOM.

### Module

```javascript
import PhotoSwipe from 'photoswipe'
import PhotoSwipeUIDefault from 'photoswipe/dist/photoswipe-ui-default'
import PhotoSwippy from 'photoswippy'

PhotoSwippy.init(
  PhotoSwipe,
  PhotoSwipeUIDefault,
  optionsObject = {}
)
```

### Browser

```html
<script src="..../photoswipe.js"></script>
<script src="..../photoswipe-ui-default.min.js"></script>
<script src="..../photoswippy.js"></script>
<script type="text/javascript">
  photoswippy.init(PhotoSwipe, PhotoSwipeUI_Default, options)
</script>
```

If both `PhotoSwipe` and `PhotoSwipeUI_Default` are on the global scope, the first parameters of `.init` can be `undefined`.

## How it works

Each element with a `data-pswp` attribute will become a photoswipe gallery. Its value is optional and defines the gallery ID. That's it.

The default `itemSelector` is `a` and `PhotoSwippy` searches it for:

- URL of image to be opened (`href` or `data-pswp-src`)
- Size of image to be opened (`data-pswp-width` AND `data-pswp-height` OR `data-pswp-size="WIDTHxHEIGHT"`)
- Caption (`data-pswp-caption` or the `options.captionSelector` HTML or the thumbnail's `alt` attribute value)

*Obs: `PhotoSwipe` requires to previously know the size of the image to be opened. However, `PhotoSwippy` allows you to ommit it if there's really no way to know the size values.*

**Example:**

```html
<!-- Default id is: 'gallery-{0..numberOfGalleriesInitialized}'-->

<!-- gallery id: gallery-1 -->
<div class="gallery" data-pswp>
  <a href="img1.jpg">
    <figure>
      <img src="thumb1.jpg" alt="">
      <figcaption>caption 1</figcaption>
    </figure>
  </a>
  <a href="img2.jpg">
    <figure>
      <img src="thumb2.jpg" alt="">
      <figcaption>caption 2</figcaption>
    </figure>
  </a>
</div>

<!-- gallery id: gallery-2 -->
<div class="gallery" data-pswp>
  <a href="img3.jpg">
    <figure>
      <img src="thumb3.jpg" alt="">
      <figcaption>caption 3</figcaption>
    </figure>
  </a>
  <a href="img4.jpg">
    <figure>
      <img src="thumb4.jpg" alt="">
      <figcaption>caption 4</figcaption>
    </figure>
  </a>
</div>

```

### Triggers

If a specific element outside of the gallery needs to trigger it (let's suppose a gallery cover or a button), just define a `data-pswp-trigger="GALLERY_ID"`.

**Example:**

```html
<button data-pswp-trigger="gallery-1">
  Open first gallery
</button>

<button data-pswp-trigger="gallery-2">
  Open second gallery
</button>
```

## Options

Options can be defined in three ways:

- Extending the default *global* options by setting the third parameter of `PhotoSwippy.init()` call;

- Calling the `PhotoSwippy.build(elementOrSelector, options)` manually from your code;

- Passing the options object as the json data attribute `data-pswp-options`. Ex: `data-pswp-options='{"key":"val", "key2":"val2"}'`;

- Passing a `data-pswp-{key}="value"` attribute for overriding a single property.

### Photoswippy options

```js
{
  /** Gallery item selector */
  itemSelector: 'a',
  /** Caption selector */
  captionSelector: 'figcaption',
  /*
   * Gallery item index selector.
   * Denotes the elements photoswippy uses to detect which item number the user has interacted with.
   * If a gallery uses, let's say, a slider, you can define it as the slide selector.
   * If 'null', photoswippy automatically uses the direct children of the gallery element.
   */
  indexSelector: null,
  /** If 'true', the mouseover on a gallery item will preload the image */
  hoverPreload: false,
  /** If 'true', the src of the thumbnail image (if it exists) will be used as thumbnail for photoswipe (msrc option)*/
  useMsrc: true
}
```

Each option is overridable with a data attribute like: `data-pswp-option-name="value"`

For other options, please refer to the [PhotoSwipe Documentation](http://photoswipe.com/documentation/options.html).

## Browsers support <sub><sup><sub><sub>made by <a href="https://godban.github.io">godban</a></sub></sub></sup></sub>

| [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png" alt="IE / Edge" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png" alt="Firefox" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png" alt="Chrome" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari.png" alt="Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/opera.png" alt="Opera" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Opera |
| --------- | --------- | --------- | --------- | --------- |
| 10+ | 4+ | 13+ | 5.1+ | 12+
