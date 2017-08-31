# PhotoSwippy

[PhotoSwipe](http://photoswipe.com/) is an awesome modular, lightweight and fast lightbox. Unfortunately its implementation can be a bit cumbersome, having to write a lot of code. There are some helpers, such as [jquery.photoswipe](https://github.com/yaquawa/jquery.photoswipe) and [photoswiper](https://www.npmjs.com/package/photoswiper), but something simpler, but configurable, was still needed and so **PhotoSwippy** was born.

## Installation

`npm install --save photoswippy`

`yarn add photoswippy`

`bower install --save photoswippy`

## Usage

`PhotoSwippy` is just a wrapper for `PhotoSwipe`. This means you still have to import/include the `PhotoSwipe` and `PhotoSwipeUI` libraries (and the rest of the relevant assets such as CSS and icons).

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
- Caption (`data-pswp-caption` or the `captionSelector` HTML or the thumbnail's `alt` attribute value)

*Obs: `PhotoSwipe` requires to previously know the size of the image to be opened. However, `PhotoSwippy` allows you to ommit if there's really no way to know the size values.*

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

- Extending the default *global* options by setting the third parameter of `PhotoSwippy.init()` call.

- Calling the `PhotoSwippy.build(elementOrSelector, options)` manually from your code.

- Passing the options object as the json data attribute `data-pswp-options`. Ex: `data-pswp-options='{"key":"val", "key2":"val2"}'`

PhotoSwippy has two extra options: `itemSelector` (defaults to `a`) and `captionSelector` (defaults to `figcaption`). For other options, please refer to the [PhotoSwipe Documentation](http://photoswipe.com/documentation/options.html).
