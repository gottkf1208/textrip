/** 사진 준비: 방향 보정 → 회전·자르기 → 긴 변 2048px 이하 JPEG(4MB 이하). 캔버스로 다시 그려 EXIF는 남지 않는다. */

export const MAX_FILES = 5;
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 2048;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export class ImageError extends Error {}

export function checkFile(f: File) {
  const type = f.type || (/\.(heic|heif)$/i.test(f.name) ? 'image/heic' : '');
  if (!ACCEPT.includes(type)) throw new ImageError('이 사진 형식은 아직 읽지 못했어요. JPG나 PNG로 다시 선택해 주세요.');
  if (f.size > MAX_INPUT_BYTES) throw new ImageError('사진이 15MB보다 커요. 조금 작은 사진으로 다시 선택해 주세요.');
}

export async function decode(f: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(f, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    // 일부 브라우저: <img>로는 읽히는 경우(HEIC 등)
    try {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      const bmp = await createImageBitmap(img);
      URL.revokeObjectURL(url);
      return bmp;
    } catch {
      throw new ImageError('이 사진 형식은 아직 읽지 못했어요. JPG나 PNG로 다시 선택해 주세요.');
    }
  }
}

export interface Crop {
  x: number;
  y: number;
  w: number;
  h: number; // 회전 뒤 기준 정규화 좌표
}

export interface Prepared {
  blob: Blob;
  base64: string;
  url: string; // 미리보기·책등 잘라 보기용
  width: number;
  height: number;
}

function toBlob(c: HTMLCanvasElement, q: number) {
  return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new ImageError('사진을 준비하지 못했어요.'))), 'image/jpeg', q));
}

export async function prepare(bmp: ImageBitmap, rotation: number, crop: Crop | null): Promise<Prepared> {
  const rot = ((rotation % 360) + 360) % 360;
  const rw = rot % 180 ? bmp.height : bmp.width;
  const rh = rot % 180 ? bmp.width : bmp.height;
  // 1) 회전
  const r = document.createElement('canvas');
  r.width = rw;
  r.height = rh;
  const rc = r.getContext('2d')!;
  rc.translate(rw / 2, rh / 2);
  rc.rotate((rot * Math.PI) / 180);
  rc.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  // 2) 자르기
  const cx = crop ? Math.round(crop.x * rw) : 0;
  const cy = crop ? Math.round(crop.y * rh) : 0;
  const cw = crop ? Math.max(16, Math.round(crop.w * rw)) : rw;
  const ch = crop ? Math.max(16, Math.round(crop.h * rh)) : rh;
  // 3) 크기 맞추기 + 압축
  let scale = Math.min(1, MAX_EDGE / Math.max(cw, ch));
  let quality = 0.86;
  for (let attempt = 0; attempt < 6; attempt++) {
    const out = document.createElement('canvas');
    out.width = Math.round(cw * scale);
    out.height = Math.round(ch * scale);
    const oc = out.getContext('2d')!;
    oc.imageSmoothingQuality = 'high';
    oc.drawImage(r, cx, cy, cw, ch, 0, 0, out.width, out.height);
    const blob = await toBlob(out, quality);
    if (blob.size <= MAX_OUTPUT_BYTES || attempt === 5) {
      const base64 = await blobToBase64(blob);
      return { blob, base64, url: URL.createObjectURL(blob), width: out.width, height: out.height };
    }
    quality = Math.max(0.6, quality - 0.1);
    scale *= 0.85;
  }
  throw new ImageError('사진을 준비하지 못했어요.');
}

function blobToBase64(b: Blob) {
  return new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1] ?? '');
    fr.onerror = () => rej(new ImageError('사진을 읽지 못했어요.'));
    fr.readAsDataURL(b);
  });
}

/** 후보의 책등 영역을 작은 이미지로 */
export async function cropThumb(url: string, bbox: [number, number, number, number]): Promise<string> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const [x0, y0, x1, y1] = bbox;
  const pad = 0.01;
  const sx = Math.max(0, (x0 - pad) * img.naturalWidth);
  const sy = Math.max(0, (y0 - pad) * img.naturalHeight);
  const sw = Math.min(img.naturalWidth - sx, (x1 - x0 + pad * 2) * img.naturalWidth);
  const sh = Math.min(img.naturalHeight - sy, (y1 - y0 + pad * 2) * img.naturalHeight);
  const scale = Math.min(1, 240 / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * scale));
  c.height = Math.max(1, Math.round(sh * scale));
  c.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}
