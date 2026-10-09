#!/usr/bin/env python3
from pathlib import Path
import json, shutil, subprocess, sys, tempfile, urllib.request, zipfile

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else '../site').resolve()
ROOT = SITE / 'assets' / 'v16'
ROOT.mkdir(parents=True, exist_ok=True)
UA = {'User-Agent':'TeacherDay3D/16.0 (GitHub Actions; CC0 Poly Haven assets)'}


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def flatten(node, path=()):
    out=[]
    if isinstance(node, dict):
        for k,v in node.items(): out += flatten(v, path+(str(k),))
    elif isinstance(node, list):
        for i,v in enumerate(node): out += flatten(v, path+(str(i),))
    elif isinstance(node, str) and node.startswith('http'):
        out.append((' '.join(path).lower(), node))
    return out


def choose(asset, required=(), preferred=(), exts=()):
    data = get_json(f'https://api.polyhaven.com/files/{asset}')
    items = flatten(data)
    scored=[]
    for p,u in items:
        s=(p+' '+u).lower()
        if required and not all(x.lower() in s for x in required):
            continue
        if exts and not any(u.lower().split('?')[0].endswith(e) for e in exts):
            continue
        score=sum(10 for x in preferred if x.lower() in s)
        score-=len(u)/10000
        scored.append((score,u,p))
    if not scored:
        raise RuntimeError(f'No Poly Haven file match for {asset}: required={required}, preferred={preferred}, exts={exts}')
    scored.sort(reverse=True)
    print('Selected', asset, scored[0][2], scored[0][1])
    return scored[0][1]


def download(url, dest):
    dest=Path(dest); dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size>2048:
        print('Reuse', dest)
        return dest
    req=urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as r, open(dest,'wb') as f:
        shutil.copyfileobj(r,f)
    print('Downloaded', dest, dest.stat().st_size)
    return dest


def fetch_hdri(asset='cloud_layers'):
    url=choose(asset, required=('hdr',), preferred=('2k','hdr'), exts=('.hdr',))
    return download(url, ROOT/'hdri'/'cloud_layers_2k.hdr')


def fetch_map(asset, map_tokens, filename):
    url=choose(asset, required=map_tokens, preferred=('2k','jpg'), exts=('.jpg','.jpeg','.png'))
    return download(url, ROOT/'materials'/asset/filename)


def fetch_material(asset):
    fetch_map(asset, ('diff','2k'), 'basecolor.jpg')
    try: fetch_map(asset, ('nor_gl','2k'), 'normal.jpg')
    except Exception: fetch_map(asset, ('normal','2k'), 'normal.jpg')
    fetch_map(asset, ('rough','2k'), 'roughness.jpg')


def fetch_model(asset, out_name):
    out=ROOT/'models'/out_name
    if out.exists() and out.stat().st_size>4096:
        print('Reuse', out); return out
    try:
        # Poly Haven's model API varies by asset; score every ZIP and prefer a glTF/1K package.
        url=choose(asset, preferred=('gltf','1k','zip'), exts=('.zip',))
        with tempfile.TemporaryDirectory() as td:
            td=Path(td); z=download(url, td/f'{asset}.zip'); ex=td/'ex'; ex.mkdir()
            with zipfile.ZipFile(z) as zz: zz.extractall(ex)
            gltfs=list(ex.rglob('*.gltf'))
            if not gltfs:
                raise RuntimeError(f'Chosen package for {asset} did not contain glTF')
            src=min(gltfs, key=lambda p: len(str(p)))
            out.parent.mkdir(parents=True,exist_ok=True)
            subprocess.run(['npx','gltf-transform','copy',str(src),str(out)],check=True)
            print('Packed', asset, '->', out, out.stat().st_size)
            return out
    except Exception as e:
        # Photoreal HDRI/PBR is mandatory; furniture is an enhancement and must not block deployment.
        print('WARN optional Poly Haven model unavailable:', asset, e)
        return None

fetch_hdri()
for mat in ('forest_floor','wood_floor','white_plaster_02'):
    fetch_material(mat)
for asset,name in (
    ('SchoolDesk_01','school_desk.glb'),
    ('SchoolChair_01','school_chair.glb'),
    ('standing_chalkboard_01','chalkboard.glb')):
    fetch_model(asset,name)
print('V16 photoreal assets ready at', ROOT)
