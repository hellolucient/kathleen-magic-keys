import cv2,numpy as np
from rembg import remove,new_session
from PIL import Image
sess=new_session('isnet-general-use')
for n in ['jewellery-box-closed','jewellery-box-open','mirror-glow','star','wardrobe-open','fairy-cheer','fairy-talk','toy-chest-closed','toy-chest-open','teddy']:
    im=Image.open(f's-{n}.jpg').convert('RGB'); a=np.asarray(im)
    ra=np.asarray(remove(im,session=sess))[...,3].astype(np.uint8)
    white=(a.min(2)>236).astype(np.uint8)
    h,w=white.shape; ff=np.zeros((h+2,w+2),np.uint8); bgm=white.copy()
    reach=np.zeros_like(white)
    num,lab=cv2.connectedComponents(white)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border)).astype(np.uint8)
    fg=(1-bg)*255
    fg=cv2.erode(fg.astype(np.uint8),np.ones((3,3),np.uint8))
    fgs=cv2.GaussianBlur(fg,(5,5),0)
    alpha=np.maximum(ra,fgs) if n!='star' else fgs
    out=Image.fromarray(np.dstack([a,alpha]),'RGBA')
    bb=out.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox(); out=out.crop(bb); out.thumbnail((1024,1024),Image.LANCZOS)
    out.save(f'../sprites/{n}.png',optimize=True); print(n,out.size)
