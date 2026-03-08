/**
 * Tea Course registry: maps courseId (URL slug) to course metadata.
 * Supports clean URLs: /teacourse/altitude
 */

export type CourseMeta = {
  id: string
  title: string
  oneLiner: string
  poster: string
  totalMinutes: number
  concept: string
  /** Internal ID for DB (course_items, entitlements) */
  internalId: string
  /** 프리뷰용 상세 설명 (HTML 또는 텍스트, 굵게: 백호은침/봉황단총/동방미인/센차) */
  previewDescription?: string
}

const ALTITUDE_PREVIEW_DESC = `높은 고도에서 자란 찻잎은 낮은 온도 속에서 천천히 자라며 그 과정에서 향은 더욱 섬세해지고, 맛은 부드러워지는 경향을 보입니다. 낮은 고도에서 자란 찻잎은 기온이 높고 생장이 빨라지면서 보다 또렷하고 힘 있는 향미가 나타나기도 합니다.

무수이의 첫 번째 티코스 '고도'는 높은 산지에서 평지로 이어지며, 고도에 따라 달라지는 차의 향과 질감을 경험할 수 있도록 구성되었습니다. 해발 약 2000m에서 자란 맑고 깨끗한 백호은침을 시작으로, 깊고 부드러운 향을 지닌 봉황단총, 입 안에서 꽃이 피는 듯한 향을 머금은 동방미인, 그리고 평지에서 우리와 같은 공기를 마시며 비를 맞고 자란 센차까지.

산의 높이를 따라 달라지는 찻잎의 시간을 천천히 내려오며 경험해 보세요. 패키지에 포함된 코드를 입력하시면 티코스에 대한 자세한 설명을 확인하실 수 있습니다.`

const COURSES: CourseMeta[] = [
  {
    id: "altitude",
    internalId: "session-1",
    title: "고도를 따라서",
    oneLiner: "Musui Tea course 01",
    poster: "/posters/teacourse-godo.png",
    totalMinutes: 40,
    concept:
      "이 코스는 해안 평지에서 시작해 2,000m 이상의 고산까지, 고도가 높아질수록 향의 밀도와 공기의 질감이 어떻게 달라지는지 경험하도록 설계되었습니다.",
    previewDescription: ALTITUDE_PREVIEW_DESC,
  },
  {
    id: "session-1",
    internalId: "session-1",
    title: "고도를 따라서",
    oneLiner: "Musui Tea course 01",
    poster: "/posters/teacourse-godo.png",
    totalMinutes: 40,
    concept:
      "이 코스는 해안 평지에서 시작해 2,000m 이상의 고산까지, 고도가 높아질수록 향의 밀도와 공기의 질감이 어떻게 달라지는지 경험하도록 설계되었습니다.",
    previewDescription: ALTITUDE_PREVIEW_DESC,
  },
]

const BY_ID = new Map(COURSES.map((c) => [c.id, c]))

/** Resolve courseId to internal ID for DB (course_items, entitlements) */
export function resolveInternalCourseId(courseId: string | null): string | null {
  const meta = courseId ? BY_ID.get(courseId) : null
  return meta?.internalId ?? (courseId || null)
}

/** Get course metadata by courseId */
export function getCourseById(courseId: string | null): CourseMeta | null {
  if (!courseId) return null
  return BY_ID.get(courseId) ?? null
}

/** All course IDs for iteration */
export function getKnownCourseIds(): string[] {
  return [...new Set(COURSES.map((c) => c.id))]
}

/** 목록용: 중복 제거된 코스 (altitude만, session-1 제외) */
export function getListCourseIds(): string[] {
  const seen = new Set<string>()
  return COURSES.filter((c) => {
    if (seen.has(c.internalId)) return false
    seen.add(c.internalId)
    return c.id !== "session-1" // session-1은 altitude의 alias
  }).map((c) => c.id)
}

/** Check if user has access (entitlement for courseId or its internal alias) */
export function hasAccessForCourse(
  entitledCourseIds: string[],
  courseId: string
): boolean {
  const meta = BY_ID.get(courseId)
  if (!meta) return entitledCourseIds.includes(courseId)
  return (
    entitledCourseIds.includes(courseId) ||
    entitledCourseIds.includes(meta.internalId)
  )
}

/** Preferred URL slug for redirect (e.g. session-1 → altitude) */
export function getPreferredCourseId(internalId: string | null): string | null {
  if (!internalId) return null
  const c = COURSES.find((x) => x.internalId === internalId)
  return c ? c.id : internalId
}

/** Map redeem code (uppercase) to courseId for /start redirect */
const CODE_TO_COURSE: Record<string, string> = {
  ALTITUDE: "altitude",
}

export function resolveCourseIdFromCode(code: string | null): string | null {
  if (!code) return null
  const key = code.trim().toUpperCase()
  return CODE_TO_COURSE[key] ?? null
}
