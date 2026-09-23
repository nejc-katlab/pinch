import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'store', 'brand', 'pinch-source.jpg')
OUT = os.path.join(ROOT, 'icons')
HAT_BOX = (820, 395, 1180, 700)
T_LO, T_HI = 18.0, 60.0


def cut_out(path):
    arr = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    corners = np.concatenate([arr[:40, :40].reshape(-1, 3), arr[:40, -40:].reshape(-1, 3),
                              arr[-40:, :40].reshape(-1, 3), arr[-40:, -40:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    dist = np.sqrt(((arr - bg) ** 2).sum(axis=2))
    labels, _ = ndimage.label(dist < T_HI)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    region = np.isin(labels, list(edge))
    alpha = np.ones(dist.shape, np.float32)
    alpha[region] = np.clip((dist[region] - T_LO) / (T_HI - T_LO), 0, 1)
    a = alpha[..., None]
    rgb = np.clip(np.where(a > 1e-3, (arr - (1 - a) * bg) / np.where(a > 1e-3, a, 1), 0), 0, 255)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')


def largest_component(img):
    arr = np.asarray(img).copy()
    solid = arr[..., 3] > 12
    lab, n = ndimage.label(solid)
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    keep = lab == (1 + int(np.argmax(sizes)))
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return Image.fromarray(arr, 'RGBA')


def square(img):
    img = img.crop(img.getbbox())
    side = max(img.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.size[0]) // 2, (side - img.size[1]) // 2))
    return canvas


def render(art, size, pad):
    scale = 8
    big = size * scale
    inner = big - 2 * pad * scale
    canvas = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    canvas.paste(art.resize((inner, inner), Image.LANCZOS), (pad * scale, pad * scale))
    return canvas.resize((size, size), Image.LANCZOS)


full = cut_out(SRC)
emblem = square(full)
hat = square(largest_component(full.crop(HAT_BOX)))

render(hat, 16, 0).save(os.path.join(OUT, 'icon16.png'))
render(hat, 32, 1).save(os.path.join(OUT, 'icon32.png'))
render(emblem, 48, 2).save(os.path.join(OUT, 'icon48.png'))
render(emblem, 128, 16).save(os.path.join(OUT, 'icon128.png'))
render(emblem, 512, 64).save(os.path.join(OUT, 'icon512.png'))
print('icons written to', OUT)
