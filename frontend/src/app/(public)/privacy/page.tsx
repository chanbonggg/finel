'use client';

export default function PrivacyPolicyPage() {
    return (
        <div className="py-16 bg-white">
            <div className="container mx-auto px-4 max-w-4xl prose lg:prose-lg prose-slate prose-headings:text-gray-900 prose-strong:text-blue-600">
                <h1 className="text-3xl font-extrabold mb-8">개인정보처리방침</h1>

                <p className="lead border-l-4 border-blue-500 pl-4 bg-gray-50 py-4">
                    Finel(이하 &apos;회사&apos;)은 이용자의 개인정보를 소중하게 생각하며, 개인정보보호법 등 관련 법령을 준수하기 위해 최선을 다하고 있습니다. 본 방침을 통해 제공하시는 개인정보가 어떻게 이용되고 보호되는지 안내해 드립니다.
                </p>

                <h2>1. 개인정보의 처리 목적</h2>
                <p>회사는 다음의 목적을 위해 최소한의 개인정보를 처리합니다.</p>
                <ul>
                    <li><strong>고객 문의 응대:</strong> 제품 문의, 견적 요청, 기술 지원 등에 대한 본인 확인 및 답변 제공</li>
                    <li><strong>서비스 개선:</strong> 서비스 이용 기록 분석을 통한 맞춤형 솔루션 제안</li>
                </ul>

                <h2>2. 처리하는 개인정보의 항목</h2>
                <ul>
                    <li><strong>수집항목:</strong> 이름, 이메일, 연락처(선택), 회사명(선택), 관심 제품(선택)</li>
                    <li><strong>자동수집항목:</strong> IP주소, 쿠키, 서비스 방문 기록, 기기 정보</li>
                </ul>

                <h2>3. 개인정보의 보유 및 이용기간</h2>
                <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                <ul>
                    <li><strong>고객 문의 및 상담 기록:</strong> 3년 (전자상거래법 등에 따른 보관)</li>
                </ul>

                <h2>4. 개인정보처리의 위탁 및 국외 이전</h2>
                <p>회사는 안정적인 서비스 제공을 위해 아래와 같이 업무를 위탁하고 있으며, 서버 호스팅의 경우 데이터가 국외에 저장될 수 있습니다.</p>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-t">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-2 border-b">수탁자</th>
                                <th className="p-2 border-b">위탁 업무</th>
                                <th className="p-2 border-b">이전 국가 및 시기</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2 border-b">Vercel, Inc.</td>
                                <td className="p-2 border-b">웹 호스팅 및 서버 관리</td>
                                <td className="p-2 border-b text-sm">미국 / 서비스 이용 시</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>5. 이용자의 권리와 의무</h2>
                <p>이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 권리 행사는 [김치완 대표님]에게 이메일 또는 서면으로 연락주시면 지체 없이 조치하겠습니다.</p>

                <h2>6. 개인정보 자동 수집 장치의 설치·운영 및 거부</h2>
                <p>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 정보를 저장하고 수시로 불러오는 ‘쿠키(cookie)’를 사용합니다.</p>
                <ul>
                    <li><strong>설치 목적:</strong> 이용자의 접속 빈도나 방문 시간 분석 등을 통한 서비스 개선</li>
                    <li><strong>거부 방법:</strong> 웹 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. (단, 거부 시 서비스 이용에 일부 불편이 있을 수 있습니다.)</li>
                </ul>

                <h2>7. 개인정보 보호책임자</h2>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <ul className="list-none m-0 p-0">
                        <li><strong>성명:</strong> 김치완</li>
                        <li><strong>직책:</strong> 대표</li>
                        <li><strong>연락처:</strong> 02-2693-3569 / kimcw153@gmail.com</li>
                    </ul>
                </div>

                <p className="text-sm text-gray-400 mt-12 border-t pt-4">
                    공고일자: 2026년 1월 31일<br />
                    시행일자: 2026년 1월 31일
                </p>
            </div>
        </div>
    );
}
