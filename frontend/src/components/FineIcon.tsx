import Image from 'next/image';

const sizes = { Search: 20, Menu: 18, Columns2: 17, Columns3: 20, Image: 20, ImageLarge: 28, ImageAdmin: 18, ImageForm: 26, ArrowRight: 18, ArrowRightDark: 18, EditArrow: 14, ArrowLeft: 18, FileText: 18, Package: 18, Mail: 18, ExternalLink: 15, Plus: 18, PlusDark: 18, Upload: 18, UnreadIndicator: 6, ExternalLink1: 18 } as const;

export default function FineIcon({ name }: { name: keyof typeof sizes }) {
  return <Image src={`/figma/${name}.svg`} alt="" width={sizes[name]} height={sizes[name]} unoptimized className="shrink-0" />;
}
