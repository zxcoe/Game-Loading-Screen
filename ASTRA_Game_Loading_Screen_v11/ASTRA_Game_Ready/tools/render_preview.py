"""Tiny offscreen CPU preview from original glTF triangles (no Blender/WebGL needed)."""
from pathlib import Path
import numpy as np,struct,json,cv2
from PIL import Image,ImageDraw
p=Path(__file__).resolve().parents[1]/'public/models/ASTRA_GameReady.glb'
d=p.read_bytes();jlen=struct.unpack_from('<I',d,12)[0];g=json.loads(d[20:20+jlen]);bi=20+jlen;binlen=struct.unpack_from('<I',d,bi)[0];binary=d[bi+8:bi+8+binlen]
def acc(idx):
 a=g['accessors'][idx];v=g['bufferViews'][a['bufferView']]
 types={5126:'<f4',5123:'<u2',5125:'<u4',5121:'u1'};comps={'SCALAR':1,'VEC3':3,'VEC4':4}
 dt=np.dtype(types[a['componentType']]);size=comps[a['type']];off=v.get('byteOffset',0)+a.get('byteOffset',0)
 return np.ndarray((a['count'],size),dtype=dt,buffer=binary,offset=off,strides=(v.get('byteStride',size*dt.itemsize),dt.itemsize)).copy()
W,H=880,1020
bg=np.zeros((H,W,3),dtype=np.uint8)
for y in range(H):
 t=y/H;bg[y,:,:]=[int(33*(1-t)+11*t),int(25*(1-t)+10*t),int(45*(1-t)+20*t)]
# Camera normal to front +Z with slight elevated x angle
cam=np.array([5.3,4.0,11.0]);target=np.array([0.15,1.70,0])
forward=target-cam;forward/=np.linalg.norm(forward)
right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right)
up=np.cross(right,forward)
scale=232
light=np.array([.4,.9,1.]);light/=np.linalg.norm(light)
face_data=[]
for mesh in g['meshes']:
 for prim in mesh['primitives']:
  a=prim['attributes'];v=acc(a['POSITION']).astype(np.float64);ind=acc(prim['indices']).reshape(-1,3)
  col=acc(a['COLOR_0']);
  if col.dtype!=np.float32 and col.dtype!=np.float64: col=col.astype(np.float32)/255.
  if col.max()>1.001: col=col/255.
  relative=v-cam
  x=np.dot(relative,right);y=np.dot(relative,up);z=np.dot(relative,forward)
  xy=np.column_stack([x*scale+W*.5,-y*scale+H*.52]);
  tri=xy[ind].astype(np.int32)
  depth=z[ind].mean(axis=1)
  p=v[ind];norm=np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]);norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-8)
  shade=np.clip(np.abs(norm@light)*.6+.42,.30,1.0)
  # use face colors
  rgb=col[ind,:3].mean(axis=1)
  rgb=np.clip(rgb*shade[:,None]*255,0,255).astype(np.uint8)
  for t,dep,c in zip(tri,depth,rgb):
   if np.max(t[:,0])<0 or np.min(t[:,0])>W or np.max(t[:,1])<0 or np.min(t[:,1])>H:continue
   face_data.append((dep,t,c))
face_data.sort(key=lambda f:-f[0])
for dep,t,c in face_data:
 cv2.fillConvexPoly(bg,t,tuple(int(x) for x in c.tolist()),lineType=cv2.LINE_AA)
# small subtitle frame
im=Image.fromarray(bg);draw=ImageDraw.Draw(im)
draw.rectangle((24,24,285,70),fill=(15,13,26))
draw.text((38,35),'ASTRA  /  MODEL CHECK',fill=(204,170,237))
draw.text((39,75),'Software projection of actual GLB geometry',fill=(146,133,159))
out=Path(__file__).resolve().parents[1]/'ASTRA_Model_Preview.png';im.save(out)
print(out,'rendered faces',len(face_data))
