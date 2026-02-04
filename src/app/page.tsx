import Link from "next/link";
import { prisma } from "@/lib/prisma"; // 👈 DB 직접 접속을 위해 추가

export const dynamic = 'force-dynamic'; // 항상 최신 데이터를 보여주기 위해 설정

export default async function Home() {

  // 1. DB에서 최신 제품 4개 가져오기
  const products = await prisma.product.findMany({
    where: { isVisible: true }, // (선택) 관리자가 숨김 처리하지 않은 것만
    take: 4,                    // 4개만 가져오기
    orderBy: { id: 'desc' },    // 최신순 정렬
    include: { category: true },
  });

  const formattedProducts = products.map((product) => ({
    ...product,
    categoryName: product.category?.name ?? '',
  }));

  // 디자인용 배경색 배열 (DB에 색상 정보가 없으므로 순서대로 적용)
  const bgColors = ["bg-slate-200", "bg-gray-200", "bg-zinc-200", "bg-neutral-200"];

  return (
    <div className="flex flex-col gap-16 pb-10">

      {/* 1. 히어로 섹션 (메인 배너) */}
      <section className="bg-gray-900 text-white py-20 px-6 rounded-b-3xl text-center shadow-xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          고객의 성공을 위한 <br />
          <span className="text-blue-400">최적의 솔루션</span>을 제공합니다.
        </h1>
        <p className="text-gray-400 mb-10 max-w-2xl mx-auto text-lg">
          우리는 단순한 제품 판매를 넘어, 귀사의 비즈니스 환경에 맞는
          맞춤형 컨설팅과 기술 지원을 약속드립니다.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full transition shadow-lg"
          >
            제품 카탈로그 보기
          </Link>
          <Link
            href="/contact"
            className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-4 px-10 rounded-full transition"
          >
            견적 및 제휴 문의
          </Link>
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
              <div key={product.id} className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition duration-300 bg-white">

                {/* 이미지 영역 (색상 랜덤 배정) */}
                <div className={`h-56 ${bgColors[index % bgColors.length]} flex items-center justify-center text-gray-400`}>
                  {product.imageUrl ? (
                    /* 이미지가 있다면 보여주기 (현재는 비워둠) */
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="group-hover:scale-110 transition duration-300 font-bold text-2xl opacity-20">
                      {product.categoryName.substring(0, 2)}
                    </span>
                  )}
                </div>

                {/* 정보 영역 */}
                <div className="p-6">
                  <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                    {product.categoryName} | {product.spec}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                    {product.description}
                  </p>

                  {/* 버튼: 구매가 아닌 '문의' 유도 */}
                  <Link
                    href={`/contact?product=${encodeURIComponent(product.name)}`} // 한글 깨짐 방지
                    className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition"
                  >
                    상세 견적 문의
                  </Link>
                </div>
              </div>
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
