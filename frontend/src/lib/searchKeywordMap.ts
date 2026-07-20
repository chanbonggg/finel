/**
 * 한글 검색어 → 영어 키워드 매핑
 * 사용자가 한글로 입력해도 영어 제품명을 찾을 수 있도록 변환합니다.
 * 실제 제품명에 맞춰 추가/수정하세요.
 */
export const KO_TO_EN_MAP: Record<string, string> = {
    // 공압 기본 부품
    '실린더': 'cylinder',
    '밸브': 'valve',
    '필터': 'filter',
    '레귤레이터': 'regulator',
    '루브리케이터': 'lubricator',
    '에어': 'air',
    '공압': 'pneumatic',
    '피팅': 'fitting',
    '커플러': 'coupler',
    '호스': 'hose',
    '튜브': 'tube',
    '실': 'seal',
    '개스킷': 'gasket',
    '노즐': 'nozzle',
    '펌프': 'pump',
    '컴프레서': 'compressor',
    '압력': 'pressure',
    '게이지': 'gauge',
    '스위치': 'switch',
    '센서': 'sensor',
    '솔레노이드': 'solenoid',
    '액추에이터': 'actuator',
    '그리퍼': 'gripper',
    '척': 'chuck',
    '부스터': 'booster',
    '모터': 'motor',
    '베어링': 'bearing',
    '스프링': 'spring',
    '로드': 'rod',
    '피스톤': 'piston',
    '포트': 'port',
    '매니폴드': 'manifold',
    '어댑터': 'adapter',
    '브라켓': 'bracket',
    '마운트': 'mount',
    '패널': 'panel',
    '유닛': 'unit',
    '세트': 'set',
    '키트': 'kit',
};

/**
 * 입력된 한글 검색어를 영어로 변환합니다.
 * 매핑이 없으면 원본 그대로 반환합니다.
 */
export function translateSearchQuery(query: string): string {
    const trimmed = query.trim();
    if (!trimmed) return trimmed;

    // 정확히 일치하는 매핑 먼저 확인
    if (KO_TO_EN_MAP[trimmed]) {
        return KO_TO_EN_MAP[trimmed];
    }

    // 부분 매핑: 입력어에 한글 키워드가 포함된 경우 영어로 교체
    let translated = trimmed;
    for (const [ko, en] of Object.entries(KO_TO_EN_MAP)) {
        translated = translated.replace(new RegExp(ko, 'g'), en);
    }

    return translated;
}
