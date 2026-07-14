#!/usr/bin/env python3
"""Generate PWA icons from the source persimmon photo.

Resizes assets/icons/persimmon.png (a square RGB image) into the PWA icon sizes
using high-quality Lanczos downscaling. Outputs 192, 512, a 180px apple-touch
icon, small favicon PNGs and a multi-size favicon.ico.
"""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(HERE, "persimmon.png")

SIZES = {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
    "favicon-16.png": 16,
    "favicon-32.png": 32,
    "favicon-48.png": 48,
}

ICO_SIZES = [16, 32, 48]


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

    # Multi-resolution favicon.ico for classic browser tabs/bookmarks.
    ico_path = os.path.join(HERE, "favicon.ico")
    src.save(ico_path, format="ICO", sizes=[(s, s) for s in ICO_SIZES])
    print("wrote", ico_path)


if __name__ == "__main__":
    main()
