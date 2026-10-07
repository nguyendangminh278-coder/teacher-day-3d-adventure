import bpy, math, os, sys
from mathutils import Vector

# Blender-generated stylized chibi teacher-mother for the web game.
# Photo references are intentionally NOT embedded in the public repository.

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = 'teacher_mom_chibi.glb'
for i, a in enumerate(args):
    if a == '--output' and i + 1 < len(args): out = args[i + 1]
os.makedirs(os.path.dirname(out) or '.', exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# ---------- materials ----------
def material(name, rgba, rough=.65, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = rgba
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metallic
    return m

SKIN = material('Skin_Warm', (0.93,0.68,0.55,1), .72)
HAIR = material('Hair_Dark', (0.055,0.035,0.03,1), .48)
AO = material('AoDai_PastelBlue', (0.52,0.73,0.88,1), .62)
AO_LIGHT = material('AoDai_Highlight', (0.78,0.90,0.97,1), .7)
WHITE = material('Ivory_Trousers', (0.94,0.92,0.88,1), .74)
SHOE = material('Shoes_Warm', (0.34,0.22,0.20,1), .58)
EYE = material('Eyes', (0.035,0.025,0.025,1), .5)
LIP = material('Smile', (0.67,0.16,0.22,1), .56)
FLOWER = material('AoDai_Flower', (0.96,0.82,0.84,1), .66)

# ---------- helpers ----------
def parent(obj, p):
    obj.parent = p
    return obj

def empty(name, loc=(0,0,0), p=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = loc
    if p: o.parent = p
    return o

def uv(name, loc, scale, mat, p=None, seg=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if p: o.parent=p
    bpy.ops.object.shade_smooth()
    return o

def cube(name, loc, scale, mat, p=None, bevel=.08):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('SoftEdges','BEVEL'); mod.width=bevel; mod.segments=3
    if p: o.parent=p
    return o

def cone(name, loc, r1, r2, depth, mat, p=None):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r1, radius2=r2, depth=depth, location=loc)
    o=bpy.context.object; o.name=name; o.data.materials.append(mat)
    if p:o.parent=p
    bpy.ops.object.shade_smooth(); return o

def cyl(name, loc, radius, depth, mat, p=None, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=depth, location=loc, rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(mat)
    if p:o.parent=p
    bpy.ops.object.shade_smooth(); return o

def curve3(name, pts, mat, bevel=.025, p=None):
    crv=bpy.data.curves.new(name,'CURVE'); crv.dimensions='3D'; crv.bevel_depth=bevel; crv.bevel_resolution=3
    sp=crv.splines.new('BEZIER'); sp.bezier_points.add(len(pts)-1)
    for b,co in zip(sp.bezier_points,pts):
        b.co=co; b.handle_left_type='AUTO'; b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,crv); bpy.context.collection.objects.link(o); o.data.materials.append(mat)
    if p:o.parent=p
    return o

root=empty('TeacherMom_Root')
body=empty('TeacherMom_Body',(0,0,0),root)

# Feet / legs: ivory trousers peeking under áo dài.
legL=empty('Leg_L',(-.18,0,.66),body); legR=empty('Leg_R',(.18,0,.66),body)
cyl('Leg_L_Mesh',(0,0,-.35),.105,.72,WHITE,legL)
cyl('Leg_R_Mesh',(0,0,-.35),.105,.72,WHITE,legR)
cube('Shoe_L',(0,-.055,-.73),(.14,.25,.10),SHOE,legL,.04)
cube('Shoe_R',(0,-.055,-.73),(.14,.25,.10),SHOE,legR,.04)

# Áo dài: tapered torso + long split panels.
cone('AoDai_Torso',(0,0,1.22),.43,.31,1.12,AO,body)
cube('AoDai_Panel_Front',(0,-.045,.52),(.34,.08,.64),AO,body,.09)
cube('AoDai_Panel_Back',(0,.10,.52),(.34,.08,.64),AO_LIGHT,body,.09)
# Collar
cyl('AoDai_Collar',(0,0,1.79),.25,.12,AO_LIGHT,body)

# Arms with shoulder pivots for browser animation.
armL=empty('Arm_L',(-.42,0,1.55),body); armR=empty('Arm_R',(.42,0,1.55),body)
cyl('Arm_L_Mesh',(0,0,-.36),.105,.72,AO,armL)
cyl('Arm_R_Mesh',(0,0,-.36),.105,.72,AO,armR)
uv('Hand_L',(0,-.005,-.76),(.12,.11,.14),SKIN,armL,20,12)
uv('Hand_R',(0,-.005,-.76),(.12,.11,.14),SKIN,armR,20,12)

# Head: slim oval with warm smile, based on the provided reference photos.
head=empty('Head',(0,0,2.22),root)
uv('Face',(0,-.01,0),(.54,.48,.66),SKIN,head,36,20)
# ears
uv('Ear_L',(-.51,0,.0),(.09,.07,.14),SKIN,head,16,8); uv('Ear_R',(.51,0,.0),(.09,.07,.14),SKIN,head,16,8)
# eyes sit on Blender front (-Y)
uv('Eye_L',(-.17,-.455,.08),(.055,.025,.052),EYE,head,16,8)
uv('Eye_R',(.17,-.455,.08),(.055,.025,.052),EYE,head,16,8)
# nose
uv('Nose',(0,-.493,-.035),(.045,.025,.065),SKIN,head,16,8)
# smile
curve3('Smile',[(-.18,-.492,-.18),(0,-.515,-.235),(.18,-.492,-.18)],LIP,.025,head)

# Shoulder-length dark hair with softly curled ends, rather than the earlier generic bun.
uv('Hair_Cap',(0,.035,.13),(.58,.50,.69),HAIR,head,32,16)
# flatten front of hair visually with fringe/part pieces
uv('Hair_Side_L',(-.43,.02,-.18),(.19,.23,.54),HAIR,head,24,12)
uv('Hair_Side_R',(.43,.02,-.18),(.19,.23,.54),HAIR,head,24,12)
uv('Hair_Curl_L',(-.40,.02,-.55),(.22,.25,.20),HAIR,head,20,10)
uv('Hair_Curl_R',(.40,.02,-.55),(.22,.25,.20),HAIR,head,20,10)
# carve perceived forehead by placing a skin oval slightly in front; preserves the familiar open forehead from references
uv('Forehead_FaceLayer',(0,-.465,.20),(.37,.025,.22),SKIN,head,24,12)
# re-add eyes in front of the forehead layer
uv('Eye_L_Front',(-.17,-.492,.08),(.055,.02,.052),EYE,head,16,8)
uv('Eye_R_Front',(.17,-.492,.08),(.055,.02,.052),EYE,head,16,8)

# Small pastel floral motif on áo dài.
for i,(x,z) in enumerate([(-.13,1.35),(.05,1.25),(.17,1.43)]):
    for k in range(5):
        a=k*math.tau/5
        uv(f'Flower_{i}_{k}',(x+math.cos(a)*.045,-.435,z+math.sin(a)*.045),(.035,.025,.035),FLOWER,body,12,6)

# custom metadata
root['character']='teacher_mom_chibi'
root['visual_reference']='user-provided-photo-inspired; no source images embedded'
root['outfit']='pastel blue Vietnamese ao dai'
root['animation_nodes']='Arm_L,Arm_R,Leg_L,Leg_R,Head'

# sensible rest pose
armL.rotation_euler=(0,0,math.radians(-7)); armR.rotation_euler=(0,0,math.radians(7))

# Export
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_materials='EXPORT',
    export_extras=True
)
print('WROTE', out)
