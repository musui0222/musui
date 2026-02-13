export type TeaCourse = {
    id: string
    title: string
    subtitle: string
    guide: string
    suggestedLapsHint: string
    posterSrc: string // ✅ 추가
    venueKicker?: string // ✅ “SEOUL / GWACHEON” 같은 느낌(선택)
  }
  
  export const COURSES: TeaCourse[] = [
    {
      id: "course-1",
      title: "첫 잔 — 향을 여는 시간",
      subtitle: "가볍게 시작해서 감각을 깨우기",
      guide:
        "물을 준비하고, 잔을 데운 뒤 첫 우림을 시작하세요. 처음엔 향이 먼저 올라오고, 그 다음에 맛이 따라옵니다.",
      suggestedLapsHint: "예: 1st 20s · 2nd 15s · 3rd 25s",
      posterSrc: "/posters/course-1.jpg", // public/posters/ 에 넣기
      venueKicker: "SEOUL",
    },
    {
      id: "course-2",
      title: "둘째 잔 — 결이 드러나는 시간",
      subtitle: "텍스처와 바디를 느끼기",
      guide:
        "두 번째는 맛의 밀도가 올라옵니다. 혀의 가운데에서 느껴지는 질감, 목 넘김 이후의 여운을 확인해보세요.",
      suggestedLapsHint: "예: 1st 15s · 2nd 20s · 3rd 20s",
      posterSrc: "/posters/course-2.jpg",
      venueKicker: "GWACHEON",
    },
    {
      id: "course-3",
      title: "마지막 잔 — 여운을 남기는 시간",
      subtitle: "내가 좋아하는 지점을 기록하기",
      guide:
        "세 번째는 ‘내가 좋았던 지점’을 잡는 시간입니다. 완벽한 답은 없어요. 내 감각을 한 줄로만 남겨도 충분합니다.",
      suggestedLapsHint: "예: 1st 25s · 2nd 20s · 3rd 30s",
      posterSrc: "/posters/course-3.jpg",
      venueKicker: "CHEONGJU",
    },
  ]
  
  export function getCourseById(id: string | null): TeaCourse | null {
    if (!id) return null
    return COURSES.find((c) => c.id === id) ?? null
  }
  