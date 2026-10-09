"""One-time migration of project-owned/CC0 assets from the previous published build.
Requires Pillow. Runtime and CI do not need this script or upstream downloads.
"""
from pathlib import Path
import io, subprocess, json, struct
from PIL import Image

root = Path(__file__).resolve().parent.parent
revision = '35edc3d5d494fb0d7a45ae617e608ea4f4221cb4'
models = ['teacher_mom_chibi.glb', 'sedan.glb']
models += ['v11/kenney/' + n + '.glb' for n in ['bench','bookcase','books','chair','coffee-table','floor-lamp','laptop','pottedplant','rug','sofa','tv']]
models += ['v11/quaternius/' + n + '.glb' for n in ['bush_flowers','bush_ultimate','tree_common','tree_twisted']]
def optimize_glb(data):
    json_length = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20+json_length])
    if not doc.get('images'): return data
    binary_start = 20+json_length+8
    binary = data[binary_start:]
    images_by_view = {image['bufferView']: image for image in doc['images'] if 'bufferView' in image}
    packed = bytearray()
    for index, view in enumerate(doc['bufferViews']):
        content = binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
        if index in images_by_view:
            image = Image.open(io.BytesIO(content))
            image.thumbnail((512,512),Image.Resampling.LANCZOS)
            output = io.BytesIO()
            if 'A' in image.getbands():
                image.save(output,format='PNG',optimize=True)
                images_by_view[index]['mimeType']='image/png'
            else:
                image.convert('RGB').save(output,format='JPEG',quality=88,optimize=True)
                images_by_view[index]['mimeType']='image/jpeg'
            content=output.getvalue()
        while len(packed)%4: packed.append(0)
        view['byteOffset']=len(packed);view['byteLength']=len(content);packed.extend(content)
    while len(packed)%4: packed.append(0)
    doc['buffers'][0]['byteLength']=len(packed)
    encoded=json.dumps(doc,separators=(',',':')).encode()
    while len(encoded)%4: encoded+=b' '
    return struct.pack('<III',0x46546c67,2,28+len(encoded)+len(packed))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(packed),0x004e4942)+packed
for name in models:
    path = 'assets/models/' + name
    out = root / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(optimize_glb(subprocess.check_output(['git', 'show', revision + ':' + path], cwd=root)))

for version, material in [('v16','wood_floor'),('v16','white_plaster_02'),('v17','concrete_floor'),('v16','forest_floor')]:
    for name in ['basecolor','normal','roughness']:
        path = f'assets/{version}/materials/{material}/{name}.jpg'
        data = subprocess.check_output(['git', 'show', revision + ':' + path], cwd=root)
        image = Image.open(io.BytesIO(data)).convert('RGB')
        image.thumbnail((512,512), Image.Resampling.LANCZOS)
        out = root / 'assets' / 'materials' / material / (name + '.jpg')
        out.parent.mkdir(parents=True, exist_ok=True)
        image.save(out, quality=85, optimize=True)
print('Imported local assets and 512px PBR maps from', revision)
