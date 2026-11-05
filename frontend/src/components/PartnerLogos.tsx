import Image from 'next/image';
import { PARTNERS } from '@/constants/partners';

export default function PartnerLogos({ boxed = false }: { boxed?: boolean }) {
  return <ul className={`grid grid-cols-2 items-center gap-3 sm:grid-cols-5 ${boxed ? 'lg:gap-5' : ''}`}>
    {PARTNERS.map(p => <li key={p.id} className={boxed ? 'fine-panel' : ''}><a href={p.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center px-3 ${boxed ? 'h-[88px]' : 'h-12'}`}><Image src={p.logo} alt={p.name.toUpperCase()} width={140} height={48} className="h-auto max-h-10 w-auto object-contain" /></a></li>)}
  </ul>;
}
