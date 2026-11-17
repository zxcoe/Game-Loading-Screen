"""Make ASTRA's GLB materials explicit for consistent glTF renderers."""
from pathlib import Path
import json,struct,sys
src=Path(sys.argv[1]);dst=Path(sys.argv[2]);data=src.read_bytes()
magic,ver,size=struct.unpack_from('<4sII',data)
assert magic==b'glTF' and ver==2 and size==len(data)
pos=12;parts={}
while pos<len(data):
 n,ty=struct.unpack_from('<I4s',data,pos);pos+=8
 parts[ty]=data[pos:pos+n];pos+=n
g=json.loads(parts[b'JSON'])
# The source uses COLOR_0 vertex attributes, so glTF must explicitly enable
# PBR materials with COLOR_0 support. glTF supports using vertex color with PBR.
g['materials']=[{
 'name':'ASTRA_VertexColors_Matte',
 'pbrMetallicRoughness':{
  'baseColorFactor':[1,1,1,1],
  'metallicFactor':0.0,
  'roughnessFactor':0.95
 },
 'doubleSided':True,
 'alphaMode':'OPAQUE'
}]
count=0
for mesh in g['meshes']:
 for prim in mesh['primitives']:
  if 'COLOR_0' in prim['attributes']:
   prim['material']=0
   count+=1
assert count==len(g['meshes'])
g['asset']['generator']='ASTRA v1.1 game integration material pass'
g['asset']['extras']={
 'project':'ASTRA / Original anime tactical FPS operative',
 'rendering':'vertex colors with matte PBR material; web viewer replaces with stepped MeshToonMaterial',
 'developmentStatus':'Game-loading-screen prototype. Art/rig motion requires visual QA before production use.'
}
js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
blob=parts[b'BIN\0'];blob+=b'\0'*((-len(blob))%4)
result=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(blob))
result+=struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(blob),b'BIN\0')+blob
dst.write_bytes(result)
assert struct.unpack_from('<I',result,8)[0]==len(result)
print(dst,len(result),'mesh material references',count,'clips',len(g.get('animations',[])))
