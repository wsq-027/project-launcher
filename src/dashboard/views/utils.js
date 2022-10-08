const { watch } = Vue

export function gradient(p, rgb_beginning, rgb_end) {
  var w = (p / 100) * 2 - 1;
  var w1 = (w + 1) / 2.0;
  var w2 = 1 - w1;

  var rgb = [parseInt(rgb_beginning[0] * w1 + rgb_end[0] * w2),
      parseInt(rgb_beginning[1] * w1 + rgb_end[1] * w2),
          parseInt(rgb_beginning[2] * w1 + rgb_end[2] * w2)];

  return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

export function autoClose(closeReference, closeCallback) {
  const unwatch = watch(closeReference, () => {
    if (!closeReference.value) {
      closeCallback()
      unwatch()
    }
  })
}