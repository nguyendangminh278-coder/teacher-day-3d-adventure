#!/usr/bin/env python3
import argparse, json, os, pathlib, urllib.request

UA = "TeacherDay3DAdventure/1.0 (+https://github.com/nguyendangminh278-coder/teacher-day-3d-adventure)"

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)

def download(url, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r, open(path, "wb") as f:
        while True:
            chunk = r.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

def walk(obj, path=()):
    if isinstance(obj, dict):
        if isinstance(obj.get("url"), str):
            yield path, obj
        for k, v in obj.items():
            yield from walk(v, path + (str(k),))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk(v, path + (str(i),))

def choose_gltf(tree, resolution):
    candidates = []
    for path, rec in walk(tree):
        url = rec.get("url", "")
        if not url.lower().split("?")[0].endswith(".gltf"):
            continue
        p = "/".join(path).lower()
        score = 0
        if resolution.lower() in p: score += 10
        if f"/{resolution.lower()}/" in url.lower(): score += 10
        candidates.append((score, path, rec))
    if not candidates:
        raise RuntimeError("No glTF file found in Poly Haven file tree")
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][2]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--asset", required=True)
    ap.add_argument("--resolution", default="4k")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    files = get_json(f"https://api.polyhaven.com/files/{args.asset}")
    rec = choose_gltf(files, args.resolution)
    main_url = rec["url"]
    main_name = os.path.basename(main_url.split("?")[0])
    main_path = out / main_name
    print(f"Downloading {args.asset} {args.resolution} glTF: {main_url}")
    download(main_url, main_path)

    include = rec.get("include", {})
    for rel, info in include.items():
        if isinstance(info, dict) and info.get("url"):
            print(f"  + {rel}")
            download(info["url"], out / rel)

    manifest = {
        "asset": args.asset,
        "resolution": args.resolution,
        "gltf": str(main_path),
        "source": f"https://polyhaven.com/a/{args.asset}",
        "license": "CC0 1.0"
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(main_path)

if __name__ == "__main__":
    main()
