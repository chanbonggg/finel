import type { Metadata } from "next";
import Link from "next/link";
import ProductPhoto from "@/components/ProductPhoto";
import FineIcon from "@/components/FineIcon";
import { catalogUrl } from "@/lib/api/catalogs";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProduct as fetchProduct } from "@/lib/api/products";
import { safeJsonLd, truncateMeta, uniqueStrings } from "@/lib/metadata-utils";
import { getSiteUrl } from "@/lib/site-url";
import { SEO } from "@/constants/seo";
import { PARTNERS } from "@/constants/partners";

// Metadata and page content require the Compose-only Spring API endpoint.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getProductBrand(companyId: number) {
  const partner = PARTNERS.find((item) => item.id === companyId);
  if (!partner) return { name: "FineL", url: getSiteUrl() };

  const displayNames: Record<string, string> = {
    imi: "IMI Norgren",
    "sns pneumatic": "SNS Pneumatic",
    cypag: "CYPAG",
    parker: "Parker",
    kcc: "KCC",
  };

  return {
    name: displayNames[partner.name] ?? partner.name,
    url: partner.url,
  };
}

const getProduct = cache(async function getProduct(id: string) {
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return fetchProduct(productId);
});

function productSearchTerms(product: {
  name: string;
  spec: string;
  category: string;
}, brandName: string): string[] {
  const tokens = `${product.name} ${product.spec}`
    .split(/[\s,/|()·_-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

  return uniqueStrings([
    product.name,
    product.spec,
    product.category,
    brandName,
    `${SEO.siteNameKo} ${product.name}`,
    `${SEO.siteName} ${product.name}`,
    `${product.category} ${product.name}`,
    ...tokens,
  ]).slice(0, 16);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.isVisible) {
    return {
      title: "제품을 찾을 수 없습니다",
      description: "요청하신 제품 정보를 찾을 수 없습니다.",
    };
  }

  const pageUrl = `/products/${product.id}`;
  const brand = getProductBrand(product.companyId);
  const terms = productSearchTerms(product, brand.name);
  const description = truncateMeta(
    `${product.name} (${product.spec})은 ${product.category} 제품군의 산업용 공압 부품입니다. ${product.description || `${SEO.siteNameKo}에서 제품 상담과 견적 문의를 지원합니다.`}`
  );
  const keywords = [
    ...SEO.baseKeywords,
    ...terms,
  ];
  const image = product.imageUrl
    ? [{ url: product.imageUrl, alt: `${product.name} ${product.category}` }]
    : [{ url: "/og-image.png", alt: `${SEO.siteNameKo} ${product.category}` }];

  return {
    title: `${product.name} ${product.category}`,
    description,
    keywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${product.name} ${product.category} | ${SEO.siteName}`,
      description,
      url: pageUrl,
      type: "website",
      images: image,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} ${product.category} | ${SEO.siteName}`,
      description,
      images: product.imageUrl ? [product.imageUrl] : ["/og-image.png"],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.isVisible) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const brand = getProductBrand(product.companyId);
  const alternateName = productSearchTerms(product, brand.name);
  const productJsonLd = {
    "@type": "Product",
    name: product.name,
    alternateName,
    description: product.description,
    image: product.imageUrl || undefined,
    category: product.category,
    model: product.modelName || undefined,
    url: `${siteUrl}/products/${product.id}`,
    brand: {
      "@type": "Organization",
      name: brand.name,
      url: brand.url,
    },
  };
  const breadcrumbJsonLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "제품",
        item: `${siteUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category,
        item: `${siteUrl}/products/category/${product.categoryId}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${siteUrl}/products/${product.id}`,
      },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [productJsonLd, breadcrumbJsonLd],
  };

  const pdf = product.catalogFileId && product.catalogPage ? catalogUrl(product.catalogFileId, product.catalogPage) : null;
  const summary = [['등록 규격', product.spec], ['모델명', product.modelName], ['용도', product.useCase]];
  const fields = [['제품명', product.name], ['제품군', product.category], ...summary.slice(0,2), ...(product.specifications ?? []).map(row => [row.name, row.value])];
  const rows = (values: (string | null)[][]) => values.map(([key,value], index) => <div key={index} className="grid grid-cols-[minmax(0,115px)_minmax(0,1fr)] gap-3 border-b border-[var(--color-line)] py-3"><dt className="site-muted">{key}</dt><dd className="break-words">{value || '미등록'}</dd></div>);
  return <div className="site-container py-7 pb-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    <p className="site-muted mb-7 text-xs"><Link href="/">홈</Link>　›　<Link href="/products">제품 목록</Link>　›　<Link href={`/products/category/${product.categoryId}`}>{product.category}</Link>　›　{product.name}</p>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      <div><ProductPhoto url={product.imageUrl} name={product.name} icon="ImageLarge" sizes="(min-width: 1024px) 42vw, 100vw" className="aspect-[1.47] w-full" />{!product.imageUrl && <p className="site-muted mt-3">제품 이미지는 등록 전입니다.</p>}</div>
      <div className="min-w-0"><p className="site-muted mb-5">{product.category} · {brand.name}</p><h1 className="fine-title">{product.name}</h1>
        <dl className="my-5 text-sm">{rows(summary)}</dl>
        <div className="grid gap-3 sm:grid-cols-2"><Link className="button-primary gap-2" href={`/contact?productId=${product.id}`}>이 제품 문의하기 <FineIcon name="ArrowRight" /></Link>
          {pdf ? <a className="button-secondary gap-2" href={pdf} target="_blank" rel="noopener noreferrer"><FineIcon name="FileText" />카탈로그 PDF 보기</a> :
            <button className="button-secondary gap-2" disabled><FineIcon name="FileText" />카탈로그 PDF 미등록</button>}</div>
        <p className="site-muted mt-4 text-xs">문의 화면에 이 제품이 선택됩니다. 필요한 수량과 사용 환경을 함께 남겨주세요.</p>
      </div>
    </div>
    <nav aria-label="제품 상세 목차" className="mt-9 flex gap-8 border-y border-[var(--color-line)] py-4 text-sm"><a className="fine-link" href="#product-info">제품 정보</a><a href="#product-description">설명 · 용도</a></nav>
    <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
      <section id="product-info"><h2 className="mb-4 text-xl font-bold">등록 사양</h2><dl className="border-t border-[var(--color-line)] text-sm">{rows(fields)}</dl></section>
      <section id="product-description"><h2 className="mb-4 text-xl font-bold">제품 설명</h2><p className="site-muted whitespace-pre-wrap">{product.description || '등록된 제품 설명이 없습니다.'}</p>
        <div className="mt-5 rounded bg-[var(--color-paper)] p-5"><h3 className="mb-2 font-bold">주요 용도</h3><p className="site-muted whitespace-pre-wrap">{product.useCase || '등록된 용도 정보가 없습니다. 적용하려는 환경과 필요한 조건은 문의 내용에 남겨주세요.'}</p></div></section>
    </div>
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3"><Link href="/products" className="button-secondary">← 제품 목록으로</Link><Link href={`/products/category/${product.categoryId}`} className="fine-link text-sm">{product.category}의 다른 제품 보기 →</Link></div>
  </div>;
}
