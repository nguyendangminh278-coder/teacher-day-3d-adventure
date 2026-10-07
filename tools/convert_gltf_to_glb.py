import argparse, os, sys, bpy

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--input', required=True)
ap.add_argument('--output', required=True)
args = ap.parse_args(argv)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

src = os.path.abspath(args.input)
dst = os.path.abspath(args.output)
os.makedirs(os.path.dirname(dst), exist_ok=True)

bpy.ops.import_scene.gltf(filepath=src)

# Keep Poly Haven's original geometry/materials/textures; only ensure web-friendly transforms.
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format='GLB',
    export_apply=True,
    export_animations=False,
    export_materials='EXPORT',
    export_image_format='AUTO'
)

print(f'Exported GLB: {dst}')
