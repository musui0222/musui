/**
 * Tea Course 실행형 세션 데이터 (Sessions → 고도/순환/발견/봄)
 */
export type TeaInCourse = {
  id: string
  name: string
  origin: string
  tastingNote: string
  meaningInCourse: string
  recommendedTemp: string
  recommendedTime: string
  steepingGuide: string
  /** 고도 코스용: 고도 구간 표시 (예: "0m ~ 300m") */
  altitudeRange?: string
  /** 고도 코스용: 구간 이름 (제목용, 예: "해안평지") */
  zoneName?: string
  /** 차 이미지 경로 (선택) */
  imageSrc?: string
  /** Musui Tip (권장온도 아래 표시) */
  musuiTip?: string
}

export type TeaCourseSession = {
  id: string
  title: string
  oneLiner: string
  totalMinutes: number
  concept: string
  teas: TeaInCourse[]
}

/** 고도(高度) — 4개 차 구성 (DB course_items가 우선) */
export const TEA_COURSE_SESSIONS: TeaCourseSession[] = [
  {
    id: "session-1",
    title: "고도(高度)",
    oneLiner: "고산에서 내려오는 차의 여정",
    totalMinutes: 30,
    concept:
      "이 코스는 해안 평지에서 시작해 2,000m 이상의 고산까지, 고도가 높아질수록 향의 밀도와 공기의 질감이 어떻게 달라지는지 경험하도록 설계되었습니다.",
    teas: [
      {
        id: "tea-01",
        name: "하동 중작",
        origin: "한국 (경남 하동)",
        tastingNote:
          "풍부한 일조량과 남해의 해풍을 머금고 자란 하동 중작은, 잎이 충분히 성숙한 상태에서 수확되어 묵직한 바디감을 형성합니다. 전통 덖음 공정을 거치며 형성된 구수한 곡물 향과 은은한 견과류 뉘앙스, 그리고 토양에서 기인한 미네랄리티가 안정적으로 받쳐주는 구조감이 특징입니다.",
        meaningInCourse: "[해안 평지]",
        imageSrc: "/posters/hadong-jungjak.png",
        recommendedTemp: "90℃",
        recommendedTime: "30초",
        steepingGuide: "1~3회",
        altitudeRange: "0m ~ 300m",
        zoneName: "지리산 자락의 저지대",
        musuiTip: `■ 유리 다구를 권합니다.
녹차의 맑은 초록빛이 우러나는 과정을 눈으로 함께 경험해보세요.
■ 녹차는 세차(찻잎을 먼저 씻는 과정)를 권하지 않습니다.
연한 잎의 섬세한 향과 아미노산의 단맛이 씻겨 나갈 수 있기 때문입니다.
■ 물을 붓기 전, 마른 찻잎을 가볍게 흔들어 향을 먼저 맡아보세요.
따뜻해지기 전 잎이 지닌 풋향이 먼저 열립니다.
■ 한 모금 머금고,
한국 녹차 특유의 포근함과 부드러운 질감을 천천히 느껴보세요.`,
      },
      {
        id: "tea-02",
        name: "다즐링 퍼스트 플러쉬",
        origin: "인도 (다즐링)",
        tastingNote:
          "고산으로 향하는 길목에서 만나는 화사한 머스캣 향과 섬세한 산미의 균형",
        meaningInCourse: "[완만한 구릉]",
        recommendedTemp: "88℃",
        recommendedTime: "1분 20초",
        steepingGuide: "1~3회",
        altitudeRange: "500m ~ 800m",
        zoneName: "완만한 구릉",
      },
      {
        id: "tea-03",
        name: "아리산 고산 오롱",
        origin: "대만 (가이현)",
        tastingNote:
          "기압이 낮아지며 향기가 응축되는 단계. 부드러운 유향(Milk note)이 특징",
        meaningInCourse: "[고산의 시작]",
        recommendedTemp: "90℃",
        recommendedTime: "1분 40초",
        steepingGuide: "1~3회",
        altitudeRange: "1,000m ~ 1,200m",
        zoneName: "고산의 시작",
      },
      {
        id: "tea-04",
        name: "리산 고산 오롱",
        origin: "대만 (태중시)",
        tastingNote:
          "짙은 안개 속에서 자라난 날카로운 난꽃향. 향기의 밀도가 한층 더 조밀해지는 구간",
        meaningInCourse: "[운무의 정점]",
        recommendedTemp: "92℃",
        recommendedTime: "1분 50초",
        steepingGuide: "1~3회",
        altitudeRange: "1,500m ~ 1,800m",
        zoneName: "운무의 정점",
      },
    ],
  },
  {
    id: "session-2",
    title: "순환 循環",
    oneLiner: "차와 재료가 순환하는 시간",
    totalMinutes: 30,
    concept: "다양한 재료가 한 접시 위에서 순환하며 만나는 경험.",
    teas: [1, 2, 3, 4].map((n) => ({
      id: `tea-${n}`,
      name: `${n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`} Tea`,
      origin: "예시",
      tastingNote: "예시 노트",
      meaningInCourse: "예시",
      recommendedTemp: "85℃",
      recommendedTime: "1분 30초",
      steepingGuide: "1~3회",
    })),
  },
  {
    id: "session-3",
    title: "발견(發見)",
    oneLiner: "차의 다양성을 발견하는 시간",
    totalMinutes: 30,
    concept: "여러 종류의 차를 경험하며 나만의 발견을 기록합니다.",
    teas: [1, 2, 3, 4].map((n) => ({
      id: `tea-${n}`,
      name: `${n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`} Tea`,
      origin: "예시",
      tastingNote: "예시 노트",
      meaningInCourse: "예시",
      recommendedTemp: "85℃",
      recommendedTime: "1분 30초",
      steepingGuide: "1~3회",
    })),
  },
  {
    id: "session-4",
    title: "봄(春)",
    oneLiner: "봄철 찻잎의 신선함",
    totalMinutes: 30,
    concept: "봄에 수확한 신선한 찻잎을 맛보는 코스.",
    teas: [1, 2, 3, 4].map((n) => ({
      id: `tea-${n}`,
      name: `${n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`} Tea`,
      origin: "예시",
      tastingNote: "예시 노트",
      meaningInCourse: "예시",
      recommendedTemp: "85℃",
      recommendedTime: "1분 30초",
      steepingGuide: "1~3회",
    })),
  },
]

export function getTeaCourseSessionById(id: string | null): TeaCourseSession | null {
  if (!id) return null
  return TEA_COURSE_SESSIONS.find((c) => c.id === id) ?? null
}
