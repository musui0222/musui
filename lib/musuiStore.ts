/** 우림 1회분 감각 기록 (수동 기록용) */
export type InfusionNote = {
  aroma?: string
  body?: number // 1~7 (Light ~ Full)
  aftertaste?: string
}

export type BrewNote = {
  courseId: string
  laps: number[]
  mood: string
  memo: string
  photoDataUrl?: string
  /** 수동 기록: 차 이름 */
  teaName?: string
  /** 수동 기록: 차 종류 (녹차, 말차, 백차, ...) */
  teaType?: string
  /** 수동 기록: 산지 */
  origin?: string
  /** 수동 기록: 브랜드 또는 구매처 */
  brandOrPurchase?: string
  /** 수동 기록: 우림별 감각 노트 (최대 5) */
  infusionNotes?: InfusionNote[]
}

export type SessionArchive = {
  id: string
  createdAt: string
  items: BrewNote[]
  isPublic: boolean
}

const archives: SessionArchive[] = []

export function addArchive(archive: SessionArchive): void {
  archives.push(archive)
}

export function getArchives(): SessionArchive[] {
  return [...archives]
}

export function toggleArchivePublic(id: string, isPublic: boolean): void {
  const a = archives.find((x) => x.id === id)
  if (a) a.isPublic = isPublic
}

export function getPublicArchives(): SessionArchive[] {
  return archives.filter((a) => a.isPublic)
}

/** 수동 기록 1건을 아카이브에 추가 (차 이름·종류·산지·브랜드·우림시간·노트·사진·공개) */
export function addManualArchive(params: {
  teaName: string
  teaType: string
  origin?: string
  brandOrPurchase?: string
  laps: number[]
  infusionNotes: InfusionNote[]
  photoDataUrl?: string
  isPublic: boolean
}): SessionArchive {
  const archive: SessionArchive = {
    id: `manual-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isPublic: params.isPublic,
    items: [
      {
        courseId: "manual",
        laps: params.laps,
        mood: params.teaType,
        memo: params.teaName,
        photoDataUrl: params.photoDataUrl,
        teaName: params.teaName,
        teaType: params.teaType,
        origin: params.origin,
        brandOrPurchase: params.brandOrPurchase,
        infusionNotes: params.infusionNotes,
      },
    ],
  }
  archives.push(archive)
  return archive
}
