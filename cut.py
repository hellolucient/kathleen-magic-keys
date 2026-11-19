import sys,glob,os
from rembg import remove,new_session
from PIL import Image
import numpy as np
sess=new_session('isnet-general-use')
os.makedirs('../sprites',exist_ok=True)
for f in sorted(glob.glob('s-*.jpg')):
    n=f[2:-4]
    im=Image.open(f).convert('RGB')
    if n=='star':
        a=np.asarray(im).astype(float); alpha=(255-a.min(2)); alpha=np.clip(alpha*1.6,0,255)
        # unmultiply from white
        al=alpha[...,None]/255.; rgb=np.where(al>0.01,(a-255*(1-al))/np.maximum(al,0.01),0).clip(0,255)
        out=Image.fromarray(np.dstack([rgb,alpha]).astype(np.uint8),'RGBA')
    else:
        out=remove(im,session=sess)
    bb=out.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox(); out=out.crop(bb)
    out.thumbnail((1024,1024),Image.LANCZOS)
    out.save(f'../sprites/{n}.png',optimize=True); print(n,out.size)
