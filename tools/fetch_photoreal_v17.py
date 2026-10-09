#!/usr/bin/env python3
from pathlib import Path
import json, shutil, subprocess, sys, tempfile, urllib.parse, urllib.request, zipfile

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else '../site').resolve()
ROOT = SITE / 'assets' / 'v17'
ROOT.mkdir(parents=True, exist_ok=True)
UA = {'User-Agent':'TeacherDay3D/17.0 (GitHub Actions; CC0 Poly Haven assets)'}


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


def download(url, dest, min_size=1024):
    dest=Path(dest); dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > min_size:
        print('Reuse', dest)
        return dest
    req=urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=240) as r, open(dest,'wb') as f:
        shutil.copyfileobj(r,f)
    print('Downloaded', dest, dest.stat().st_size)
    return dest


def choose_url(asset, predicates, preferred=()):
    items=flatten(get_json(f'https://api.polyhaven.com/files/{asset}'))
    ranked=[]
    for p,u in items:
        s=(p+' '+u).lower()
        if not all(pred(s,u.lower()) for pred in predicates):
            continue
        score=sum(15 for token in preferred if token.lower() in s)
        score-=len(u)/10000
        ranked.append((score,u,p))
    if not ranked:
        raise RuntimeError(f'No Poly Haven file match for {asset}')
    ranked.sort(reverse=True)
    print('Selected', asset, ranked[0][2], ranked[0][1])
    return ranked[0][1]


def fetch_map(asset, token, filename):
    def p(s,u): return token in s and '2k' in s and u.split('?')[0].endswith(('.jpg','.jpeg','.png'))
    url=choose_url(asset,[p],preferred=('2k','jpg'))
    return download(url,ROOT/'materials'/asset/filename)


def fetch_material(asset):
    fetch_map(asset,'diff','basecolor.jpg')
    try: fetch_map(asset,'nor_gl','normal.jpg')
    except Exception: fetch_map(asset,'normal','normal.jpg')
    fetch_map(asset,'rough','roughness.jpg')


def find_gltf_url(asset):
    data=get_json(f'https://api.polyhaven.com/files/{asset}')
    items=flatten(data)
    ranked=[]
    for p,u in items:
        ul=u.lower().split('?')[0]
        if not ul.endswith('.gltf'):
            continue
        s=(p+' '+u).lower()
        score=(60 if '1k' in s else 0)+(25 if 'gltf' in s else 0)+(10 if '2k' in s else 0)-len(u)/10000
        ranked.append((score,u,p))
    if ranked:
        ranked.sort(reverse=True)
        print('Selected glTF',asset,ranked[0][2],ranked[0][1])
        return ranked[0][1]
    return None


def fetch_gltf_tree(gltf_url, work):
    gltf_path=download(gltf_url,work/'model.gltf',100)
    doc=json.loads(gltf_path.read_text(encoding='utf-8'))
    uris=[]
    for key in ('buffers','images'):
        for item in doc.get(key,[]):
            uri=item.get('uri')
            if uri and not uri.startswith('data:') and uri not in uris:
                uris.append(uri)
    for uri in uris:
        target=work/urllib.parse.unquote(uri)
        target.parent.mkdir(parents=True,exist_ok=True)
        download(urllib.parse.urljoin(gltf_url,uri),target,1)
    return gltf_path


def fetch_model(asset,out_name):
    out=ROOT/'models'/out_name
    if out.exists() and out.stat().st_size>4096:
        print('Reuse',out); return out
    try:
        with tempfile.TemporaryDirectory() as td:
            work=Path(td)
            gltf_url=find_gltf_url(asset)
            if gltf_url:
                src=fetch_gltf_tree(gltf_url,work)
            else:
                def zpred(s,u): return u.split('?')[0].endswith('.zip')
                zurl=choose_url(asset,[zpred],preferred=('gltf','1k','zip'))
                zp=download(zurl,work/'model.zip',100)
                ex=work/'ex'; ex.mkdir()
                with zipfile.ZipFile(zp) as z: z.extractall(ex)
                gltfs=list(ex.rglob('*.gltf'))
                if not gltfs: raise RuntimeError('No glTF in zip')
                src=min(gltfs,key=lambda p:len(str(p)))
            out.parent.mkdir(parents=True,exist_ok=True)
            subprocess.run(['npx','gltf-transform','copy',str(src),str(out)],check=True)
            if out.stat().st_size<4096: raise RuntimeError('packed model too small')
            print('Packed',asset,'->',out,out.stat().st_size)
            return out
    except Exception as e:
        print('WARN optional V17 model unavailable:',asset,e)
        return None

# New scanned/PBR surfaces used for the school exterior and courtyard.
for mat in ('concrete_floor','brick_wall_003'):
    try: fetch_material(mat)
    except Exception as e: print('WARN V17 material unavailable:',mat,e)

# Real CC0 models. Keep these local so the deployed game has no runtime CDN dependency.
for asset,name in (
    ('SchoolDesk_01','school_desk.glb'),
    ('SchoolChair_01','school_chair.glb'),
    ('island_tree_01','island_tree.glb'),
    ('pine_tree_01','pine_tree.glb'),
    ('potted_plant_02','potted_plant.glb'),
):
    fetch_model(asset,name)

print('V17 photoreal assets ready at',ROOT)
