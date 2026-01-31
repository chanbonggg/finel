import { PARTNERS } from "@/constants/partners";


export default function CompanyPage() {
    return (
        <div className="flex flex-col gap-16 py-10">

            {/* 1. 회사 소개 헤더 (Vision) */}
            <section className="text-center">
                <h1 className="text-4xl font-bold mb-6">About Us</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    "우리는 기술로 더 나은 세상을 만듭니다."<br />
                    고객의 신뢰를 최우선으로 생각하며, 끊임없는 혁신을 통해 최고의 가치를 제공합니다.
                </p>
            </section>

            {/* 2. 회사 개요 (Stats)
            <section className="bg-blue-50 rounded-2xl p-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-4xl font-bold text-blue-600 mb-2">2022</div>
                        <div className="text-gray-500 font-medium">설립연도</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                        <div className="text-gray-500 font-medium">프로젝트 완료</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
                        <div className="text-gray-500 font-medium">고객 만족도</div>
                    </div>
                </div>
            </section> */}

            {/* 3. [FR-01] 인증서 및 특허 (Certificates)
            <section>
                <h2 className="text-2xl font-bold mb-8 border-l-4 border-gray-800 pl-4">
                    인증현황 및 보유특허
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    
                    {['ISO 9001', 'ISO 14001', '기업부설연구소', '벤처기업인증', '특허등록 01호', '특허등록 02호', 'KC 인증', '녹색기술인증'].map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center hover:shadow-lg transition bg-white aspect-[3/4]">
                            <div className="w-16 h-16 bg-gray-100 rounded-full mb-4 flex items-center justify-center text-2xl">
                                📜
                            </div>
                            <span className="font-bold text-gray-700">{item}</span>
                        </div>
                    ))}
                </div>
            </section> */}

            {/* 4. [FR-01] 파트너사 (Partners) */}
            <section>
                <h2 className="text-2xl font-bold mb-8 border-l-4 border-gray-800 pl-4">
                    주요 파트너사
                </h2>

                {/* 2. 코드가 훨씬 깔끔해졌죠? */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {PARTNERS.map((partner) => (
                        <a
                            key={partner.id}
                            href={partner.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white border border-gray-200 h-32 rounded-lg flex items-center justify-center p-4 hover:shadow-lg hover:border-blue-500 transition duration-300"
                        >
                            <img
                                src={partner.logo}
                                alt={partner.name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </a>
                    ))}
                </div>
            </section>

            {/* 5. 오시는 길 (Map Placeholder) */}
            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-8 border-l-4 border-gray-800 pl-4">
                    오시는 길
                </h2>
                {/* 지도 영역 (Iframe 사용) */}
                <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100">
                    <iframe
                        width="100%"
                        height="100%"
                        title="map"
                        className=""
                        // q= 뒤에 주소를 넣으면 해당 위치를 보여줍니다.
                        src="https://maps.google.com/maps?q=인천광역시 동구 방축로 37번길 30&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        loading="lazy"
                    ></iframe>
                </div>
                <div className="mt-6 flex flex-col gap-2 text-gray-700">
                    <p><strong>주소:</strong> 인천광역시 동구 방축로 37번길 30,2동 206호</p>
                    <p><strong>전화:</strong> 02-2693-3569</p>
                    <p><strong>팩스:</strong> 032-232-8823</p>
                </div>
            </section>

        </div>
    );
}