from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path
from shutil import copy2

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SCAN_DIRS = [
    ROOT / "public/pet-battle/pets",
    ROOT / "public/pet-battle/enemies",
]
SKIP_DIRS = {"_backup-fake-transparent", "_backup-fake-transparent-batch", "_old"}

TARGETS = [
    ("public/pet-battle/pets/cloud-beast.png", "public/pet-battle/pets/_backup-fake-transparent"),
    ("public/pet-battle/pets/starfire-fox.png", "public/pet-battle/pets/_backup-fake-transparent"),
    ("public/pet-battle/pets/sprout-dragon.png", "public/pet-battle/pets/_backup-fake-transparent"),
    ("public/pet-battle/enemies/careless-beast.png", "public/pet-battle/enemies/_backup-fake-transparent"),
    ("public/pet-battle/enemies/forget-wraith.png", "public/pet-battle/enemies/_backup-fake-transparent"),
    ("public/pet-battle/enemies/anxiety-fang.png", "public/pet-battle/enemies/_backup-fake-transparent"),
]


def is_checker_background(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = pixel
    spread = max(r, g, b) - min(r, g, b)
    # The fake checkerboard is made of very light, low-saturation gray/white squares.
    return r >= 226 and g >= 226 and b >= 226 and spread <= 18


def edge_points(width: int, height: int):
    for x in range(width):
        yield x, 0
        yield x, height - 1
    for y in range(1, height - 1):
        yield 0, y
        yield width - 1, y


def remove_connected_checkerboard(image: Image.Image):
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def offset(x: int, y: int) -> int:
        return y * width + x

    for x, y in edge_points(width, height):
        idx = offset(x, y)
        if visited[idx]:
            continue
        visited[idx] = 1
        if is_checker_background(pixels[x, y]):
            queue.append((x, y))

    transparent_count = 0
    while queue:
        x, y = queue.popleft()
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        transparent_count += 1

        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                continue
            idx = offset(nx, ny)
            if visited[idx]:
                continue
            visited[idx] = 1
            if is_checker_background(pixels[nx, ny]):
                queue.append((nx, ny))

    return rgba, transparent_count, width * height


def alpha_stats(path: Path):
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    values = list(alpha.getdata())
    transparent = sum(1 for value in values if value == 0)
    partial = sum(1 for value in values if 0 < value < 255)
    opaque = sum(1 for value in values if value == 255)
    total = len(values)
    return {
        "width": image.width,
        "height": image.height,
        "alpha_min": min(values) if values else 255,
        "alpha_max": max(values) if values else 255,
        "transparent": transparent,
        "partial": partial,
        "opaque": opaque,
        "total": total,
        "transparent_ratio": transparent / total if total else 0,
    }


def edge_checker_ratio(path: Path):
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    edge = list(edge_points(width, height))
    if not edge:
      return 0
    matches = sum(1 for x, y in edge if is_checker_background(pixels[x, y]))
    return matches / len(edge)


def classify_png(path: Path):
    stats = alpha_stats(path)
    if stats["transparent"] > 0 or stats["partial"] > 0 or stats["alpha_min"] < 255:
        return "已是真透明", stats

    checker_ratio = edge_checker_ratio(path)
    if checker_ratio >= 0.82:
        return "假透明", stats

    return "普通不透明图", stats


def backup_dir_for(path: Path):
    return path.parent / "_backup-fake-transparent-batch"


def scan_pngs():
    files: list[Path] = []
    for directory in SCAN_DIRS:
        if not directory.exists():
            continue
        for path in sorted(directory.rglob("*.png")):
            if any(part in SKIP_DIRS for part in path.relative_to(directory).parts):
                continue
            files.append(path)
    return files


def process_path(path: Path):
    backup_dir = backup_dir_for(path)
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / path.name
    if not backup_path.exists():
        copy2(path, backup_path)

    original = Image.open(path)
    processed, transparent_count, _ = remove_connected_checkerboard(original)
    processed.save(path)
    return transparent_count


def run_batch():
    files = scan_pngs()
    rows = []
    processed = []
    already_transparent = []
    fake_transparent = []
    skipped = []

    print("SCAN")
    print("file, size, alpha_min, alpha_max, transparent_pixels, transparent_ratio, classification")
    for path in files:
        classification, stats = classify_png(path)
        relative = path.relative_to(ROOT)
        rows.append((path, classification, stats))
        print(
            f"{relative}, {stats['width']}x{stats['height']}, {stats['alpha_min']}, {stats['alpha_max']}, "
            f"{stats['transparent']}, {stats['transparent_ratio']:.2%}, {classification}"
        )
        if classification == "已是真透明":
            already_transparent.append(path)
        elif classification == "假透明":
            fake_transparent.append(path)
        else:
            skipped.append(path)

    print("\nPROCESS")
    print("file, backed_up, removed_pixels, final_alpha_min, final_alpha_max, final_transparent_pixels, final_transparent_ratio, final_status")
    for path in fake_transparent:
        removed = process_path(path)
        stats = alpha_stats(path)
        final_status = "处理成功（真透明）" if stats["transparent"] > 0 and stats["alpha_min"] == 0 else "未处理（无法安全判断）"
        processed.append(path)
        print(
            f"{path.relative_to(ROOT)}, yes, {removed}, {stats['alpha_min']}, {stats['alpha_max']}, "
            f"{stats['transparent']}, {stats['transparent_ratio']:.2%}, {final_status}"
        )

    print("\nFINAL")
    print("file, size, alpha_min, alpha_max, transparent_pixels, transparent_ratio, final_status")
    for path in files:
        stats = alpha_stats(path)
        if path in processed:
            status = "处理成功（真透明）" if stats["transparent"] > 0 and stats["alpha_min"] == 0 else "未处理（无法安全判断）"
        elif path in already_transparent:
            status = "原本就是真透明"
        else:
            status = "未处理（无法安全判断）"
        print(
            f"{path.relative_to(ROOT)}, {stats['width']}x{stats['height']}, {stats['alpha_min']}, {stats['alpha_max']}, "
            f"{stats['transparent']}, {stats['transparent_ratio']:.2%}, {status}"
        )

    print("\nSUMMARY")
    print(f"scanned={len(files)}")
    print(f"already_true_transparent={len(already_transparent)}")
    print(f"fake_transparent_detected={len(fake_transparent)}")
    print(f"processed={len(processed)}")
    print("skipped=" + ",".join(str(path.relative_to(ROOT)) for path in skipped))


def run_fixed_targets():
    print("file, backed_up, transparent_pixels, transparent_ratio, partial_alpha_pixels, note")
    for relative_path, backup_relative in TARGETS:
        path = ROOT / relative_path
        backup_dir = ROOT / backup_relative
        backup_dir.mkdir(parents=True, exist_ok=True)
        backup_path = backup_dir / path.name

        if not path.exists():
            print(f"{relative_path}, no, 0, 0.00%, 0, missing file")
            continue

        if not backup_path.exists():
            copy2(path, backup_path)

        original = Image.open(path)
        processed, transparent_count, total = remove_connected_checkerboard(original)
        processed.save(path)
        stats = alpha_stats(path)
        note = "ok" if stats["transparent"] > 0 else "needs manual check"
        print(
            f"{relative_path}, yes, {transparent_count}, "
            f"{stats['transparent_ratio']:.2%}, {stats['partial']}, {note}"
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixed-targets", action="store_true", help="Process the original six hard-coded images.")
    args = parser.parse_args()
    if args.fixed_targets:
        run_fixed_targets()
    else:
        run_batch()


if __name__ == "__main__":
    main()
