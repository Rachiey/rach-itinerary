#!/usr/bin/env python3
"""Generate PWA icons from the source ginkgo photo.

Resizes assets/icons/ginkgo.png (a square RGB image) into the PWA icon sizes
using high-quality Lanczos downscaling. Outputs 192, 512 and a 180px
apple-touch icon.
"""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(HERE, "ginkgo.png")

SIZES = {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
}


def main():
    src = Image.open(SOURCE).convert("RGB")
    w, h = src.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    src = src.crop((left, top, left + side, top + side))

    for name, size in SIZES.items():
        out = src.resize((size, size), Image.LANCZOS)
        path = os.path.join(HERE, name)
        out.save(path, "PNG", optimize=True)
        print("wrote", path)


if __name__ == "__main__":
    main()
