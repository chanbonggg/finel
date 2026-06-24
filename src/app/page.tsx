import Link from "next/link";
import type { Metadata } from "next";
import { getFeaturedProducts } from "@/lib/api/products";
import { SEO } from "@/constants/seo";
import PhoneButton from "@/components/PhoneButton";

export const dynamic = 'force-dynamic'; // 항상 최신 데이터를 보여주기 위해 설정

export const metadata: Metadata = {
  title: `${SEO.companyName} | ${SEO.siteName}`,
  description: `${SEO.siteNameKo}(${SEO.siteName})은 신뢰할 수있는 산업용 공압 부품을 공급하는 전문 기업입니다. 파카(Parker), 노그린(IMI), 공압전문메이커(SNS Pneumatic), 케이시시공압(KCC), SMC 등 공압 전문 제품을 상담, 기술지원, 맞춤형 솔루션을 제공합니다.`,
  keywords: [...SEO.baseKeywords, "공압 부품 공급", "전문 기업"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SEO.companyName} | ${SEO.siteName}`,
    description: `${SEO.siteNameKo}(${SEO.siteName})은 신뢰할 수있는 산업용 공압 부품을 공급하는 전문 기업입니다. 파카(Parker), 노그린(IMI), 공압전문메이커(SNS Pneumatic), 케이시시공압(KCC), SMC 등 공압 전문 제품을 상담, 기술지원, 맞춤형 솔루션을 제공합니다.`,
    url: "/",
    type: "website",
    images: ["/og-image.png"],
  },
};

export default async function Home() {

  // 1. DB에서 최신 제품 4개 가져오기
  const products = await getFeaturedProducts(4);

  const formattedProducts = products.map((product) => ({
    ...product,
    categoryName: product.category,
  }));

  // 디자인용 배경색 배열 (DB에 색상 정보가 없으므로 순서대로 적용)
  const bgColors = ["bg-slate-200", "bg-gray-200", "bg-zinc-200", "bg-neutral-200"];

  return (
    <div className="flex flex-col gap-16 pb-10">

      {/* 1. 히어로 섹션 (메인 배너) */}
      <section className="bg-gray-900 text-white py-20 px-6 rounded-b-3xl text-center shadow-xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          신뢰할 수 있는 기술, <br />
          <span className="text-blue-400">검증된 안정성</span>
        </h1>
        <p className="text-gray-400 mb-10 max-w-2xl mx-auto text-lg">
          책임 있는 계약과 지속적인 지원으로
          고객의 비즈니스 성장을 꾸준히 돕습니다
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full transition shadow-lg"
          >
            제품 보기
          </Link>
          <Link
            href="/contact"
            className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-4 px-10 rounded-full transition"
          >
            견적 및 제휴 문의
          </Link>
          <PhoneButton />
        </div>
      </section>


      {/* 3. [FR-02] 주력 제품 소개 (DB 연동 완료) */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">주력 제품 안내</h2>
            <p className="text-gray-500 mt-2">최고의 기술력이 담긴 최신 제품을 만나보세요.</p>
          </div>
          <Link href="/products" className="text-blue-600 font-semibold hover:underline">
            전체보기 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 제품 데이터가 없을 경우 처리 */}
          {formattedProducts.length === 0 ? (
            <div className="col-span-4 text-center py-10 text-gray-400 bg-gray-50 rounded-xl">
              등록된 주력 제품이 없습니다. 관리자 페이지에서 제품을 등록해주세요.
            </div>
          ) : (
            formattedProducts.map((product, index) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition duration-300 bg-white flex flex-col">

                {/* 이미지 영역 (색상 랜덤 배정) */}
                <div className={`h-56 ${bgColors[index % bgColors.length]} flex items-center justify-center text-gray-400`}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="group-hover:scale-110 transition duration-300 font-bold text-2xl opacity-20">
                      {product.categoryName.substring(0, 2)}
                    </span>
                  )}
                </div>

                {/* 정보 영역 */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                    {product.categoryName} | {product.spec}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition">{product.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 4. [FR-03] 하단 CTA (문의 유도) */}
      <section className="container mx-auto px-4 my-10">
        <div className="bg-blue-50 rounded-3xl p-10 md:p-16 text-center">
          <h2 className="text-3xl font-bold mb-4">원하시는 제품을 찾지 못하셨나요?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            저희는 고객의 요구사항에 맞춘 커스텀 솔루션도 제공하고 있습니다.
            담당자와의 1:1 상담을 통해 최적의 제안을 받아보세요.
          </p>
          <Link href="/contact" className="inline-block bg-blue-600 text-white font-bold py-4 px-12 rounded-full hover:bg-blue-700 transition shadow-lg">
            무료 상담 신청하기
          </Link>
        </div>
      </section>

    </div>
  );
}
