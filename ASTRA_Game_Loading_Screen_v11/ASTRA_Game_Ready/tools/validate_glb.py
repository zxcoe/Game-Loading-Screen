from pathlib import Path
import json,struct
import numpy as np,trimesh
p=Path(__file__).resolve().parents[1]/'public/models/ASTRA_GameReady.glb'
b=p.read_bytes();h=struct.unpack_from('<4sII',b)
assert h==(b'glTF',2,len(b))
n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);off=20+n;ln=struct.unpack_from('<I',b,off)[0];bin=b[off+8:off+8+ln]
assert g['buffers'][0]['byteLength']<=len(bin)
assert len(g['skins'][0]['joints'])==26
assert len(g['meshes'])==309
assert len(g['animations'])==6
assert len(set(x['name'] for x in g['animations']))==6
assert all(x['primitives'][0].get('material')==0 for x in g['meshes'])
for x in g['animations']:
 assert all(channel['target']['node']<len(g['nodes']) for channel in x['channels'])
 for sampler in x['samplers']:
  assert sampler['input']<len(g['accessors']) and sampler['output']<len(g['accessors'])
for mesh in g['meshes']:
 for prim in mesh['primitives']:
  for idx in list(prim['attributes'].values())+[prim['indices']]:
   a=g['accessors'][idx]
   assert a['bufferView']<len(g['bufferViews'])
scene=trimesh.load(p,force='scene')
assert len(scene.geometry)==309
print('VALIDATED',p,'bytes',p.stat().st_size,'meshes',len(scene.geometry),'joints',len(g['skins'][0]['joints']),'animations',','.join(c['name'] for c in g['animations']))
