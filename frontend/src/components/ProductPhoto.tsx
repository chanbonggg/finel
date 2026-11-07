'use client';

import Image from 'next/image';
import { useState } from 'react';
import FineIcon from './FineIcon';

export default function ProductPhoto({ url, name, className = '', sizes = '64px', label = '제품 이미지', icon = 'Image' }: {
  url?: string | null; name: string; className?: string; sizes?: string; label?: string; icon?: 'Image' | 'ImageLarge' | 'ImageAdmin' | 'ImageForm';
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return <div className={`relative grid min-w-0 place-items-center overflow-hidden rounded bg-[var(--color-paper)] ${className}`}>
    {url && failedUrl !== url ? <Image src={url} alt={name} fill sizes={sizes} unoptimized
      className="object-contain p-1" onError={() => setFailedUrl(url)} /> :
      <span className="grid justify-items-center gap-1 text-center text-[10px] text-[var(--color-muted)]"><FineIcon name={icon} />{label}</span>}
  </div>;
}
