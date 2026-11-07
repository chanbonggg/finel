import ContactForm from '@/features/contact/ContactForm';

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ productId?: string | string[]; product?: string | string[] }> }) {
  const query = await searchParams;
  const id = typeof query.productId === 'string' ? query.productId : undefined;
  const name = typeof query.product === 'string' ? query.product : undefined;
  return <ContactForm key={JSON.stringify([id, name])} productId={id} legacyName={name} />;
}
