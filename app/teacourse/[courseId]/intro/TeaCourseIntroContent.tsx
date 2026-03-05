"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { hasAccessForCourse } from "@/lib/courseRegistry"
import { TeaRecordForm } from "@/components/TeaRecordForm"
import { addIntroArchive, type InfusionNote } from "@/lib/musuiStore"

type Props = { courseId: string; internalId: string }

type CourseIntro = {
  title: string
  images: { id: string; label: string; src: string }[]
  description: string[]
  howToBrew: { title: string; items: string[] }
  tip?: string
}

type CourseRecord = {
  waterTempC?: number
  steepingTimeSec?: number
  body?: number
  aroma?: number
  aftertaste?: string
}

/** 고도 코스 인트로 데이터 */
const COURSE_INTROS: CourseIntro[] = [
  {
    title: "백호은침",
    images: [
      { id: "mountain", label: "산지 사진", src: "" },
      { id: "leaves", label: "찻잎 사진", src: "" },
      { id: "liquor", label: "찻물 사진", src: "" },
    ],
    description: [
      "고도가 높은 산지에서 자라는 어린 찻싹은 낮은 기온 속에서 천천히 자라며 섬세한 향을 품게 됩니다.",
      "첫 번째 코스는 해발 1500m 산지의 고산 환경에서 길러진 가장 맑고 부드러운 차, **백호은침**으로 시작합니다.",
      "백호은침은 어린 찻싹을 덮고 있는 하얀 솜털이 은빛 바늘처럼 보인다고 하여 붙여진 이름입니다.",
      "잎이 아닌 **아직 펼쳐지지 않은 어린 싹만을 사용해 만드는 백차**로, 차 가운데에서도 가장 섬세한 종류로 알려져 있습니다.",
      "뜨거운 물에 우려내면 맑고 투명한 연한 금빛을 띠며, 가느다란 찻싹이 물속에서 천천히 풀리며 모습을 드러냅니다.",
      "향은 은은한 꽃향과 풀향이 겹쳐지고, 맛은 부드럽고 맑으며 은근한 단맛이 길게 이어집니다. 떫은맛이 거의 없어 깨끗한 여운을 남깁니다.",
      "백호은침의 섬세한 향과 질감을 느끼며, 첫 잔으로 입안을 천천히 깨워보세요.",
    ],
    howToBrew: {
      title: "How to Brew",
      items: [
        "물 200ml를 90°C로 준비",
        "찻잎 4g",
        "50초 우린 뒤 바로 따라내기",
        "Ratio: 50:1",
      ],
    },
    tip: "백호은침을 마신 뒤에도 찻잎을 버리지 말고 잠시 그대로 두어 보세요. 시간이 지나며 공기와 만나 천천히 산화되면서, 다시 우렸을 때 황차와 비슷한 깊은 풍미를 느낄 수 있습니다.",
  },
  {
    title: "요부후 봉황단총",
    images: [
      { id: "mountain", label: "산지 사진", src: "" },
      { id: "leaves", label: "찻잎 사진", src: "" },
      { id: "liquor", label: "찻물 사진", src: "" },
    ],
    description: [
      "두 번째 코스는 해발 약 700m 산지에서 자란 **요부후 봉황단총**입니다.",
      "요부후 봉황단총은 중국 광둥성 봉황산의 요부후 지역에서 수확되었습니다.",
      "뜨거운 물에 우려내면 맑은 황금빛을 띠며, 맛은 부드러우면서도 바디감이 깊고 진하여 입안에 남는 여운이 길게 이어집니다.",
      "밀키 우롱으로 알려진 금훤은 밀크티 같은 질감을 지닌다면, 요부후 봉황단총은 마치 분유를 풀어낸 듯한 농밀한 우유처럼, 한층 깊고 두터운 바디감을 지닌 차입니다.",
      "천천히 음미하며 봉황단총의 깊어진 향과 질감을 느껴보세요.",
    ],
    howToBrew: {
      title: "How to Brew",
      items: [
        "물 200ml를 100°C로 준비",
        "찻잎 4g",
        "25초 우린 뒤 바로 따라내기",
        "Ratio: 50:1 = 200ml : 4g",
      ],
    },
  },
  {
    title: "동방미인",
    images: [
      { id: "mountain", label: "산지 사진", src: "" },
      { id: "leaves", label: "찻잎 사진", src: "" },
      { id: "liquor", label: "찻물 사진", src: "" },
    ],
    description: [
      "세 번째 코스는 해발 약 500m **산지에서 자란 동방미인**입니다.",
      "동방미인은 이름 그대로 '동방의 아름다운 여인'이라는 뜻을 지닌 차로, 꽃이 가득 피어난 듯한 화려한 향에서 그 이름이 유래했습니다.",
      "이 차는 찻잎이 차나무 매미(tea jassid)에게 물리면서 만들어지는 독특한 향이 특징입니다. 벌레가 잎을 물면 식물은 스스로를 보호하기 위해 향기 성분을 만들어내는데, 이 과정에서 동방미인 특유의 달콤한 꿀향과 과일향이 형성됩니다.",
      "이러한 이유로 동방미인은 벌레가 활동하기 좋은 **비교적 따뜻한 산지**에서 재배됩니다.",
      "뜨거운 물에 우려내면 맑은 붉은빛을 띠며, 향은 꿀과 잘 익은 과일을 떠올리게 하는 달콤한 향 위에 꽃향이 겹쳐집니다.",
      "맛은 부드럽고 자연스러운 단맛이 길게 이어지며, 떫은맛이 거의 없어 화사한 여운이 남는 것이 특징입니다.",
      "천천히 음미하며 입안에 꽃이 피는 듯한 동방미인의 화려한 향을 느껴보세요.",
    ],
    howToBrew: {
      title: "How to Brew",
      items: [
        "물 200ml를 100°C로 준비",
        "찻잎 4g",
        "25초 우린 뒤 바로 따라내기",
        "Ratio: 50:1 = 200ml : 4g",
      ],
    },
    tip: "차를 우린 뒤 찻잎을 버리지 말고 생수병에 담아 냉장고에 넣어 보세요. 5시간 이상 천천히 냉침하면 또 다른 부드러운 동방미인의 풍미를 느낄 수 있습니다.",
  },
  {
    title: "센차",
    images: [
      { id: "mountain", label: "산지 사진", src: "" },
      { id: "leaves", label: "찻잎 사진", src: "" },
      { id: "liquor", label: "찻물 사진", src: "" },
    ],
    description: [
      "마지막 잔은 평지의 차밭에서 자란 **센차**입니다.",
      "센차는 일본을 대표하는 녹차로, 햇빛을 그대로 받으며 자란 찻잎으로 만들어집니다. 높은 산지의 차가 섬세한 향을 지닌다면, 평지의 차는 햇빛과 비를 온전히 받으며 보다 또렷하고 생기 있는 향을 만들어 냅니다.",
      "뜨거운 물에 우려내면 맑은 연두빛을 띠며, 가느다란 찻잎이 물속에서 천천히 풀리며 모습을 드러냅니다.",
      "향은 신선한 풀향과 은은한 해조류 향이 겹쳐지며, 맛은 산뜻한 감칠맛과 함께 약간의 쌉싸름함이 어우러집니다. 일본 녹차에서 느껴지는 이러한 바다 같은 풍미는 센차의 특징적인 매력으로 알려져 있습니다.",
      "우리와 같은 햇빛과 바람, 비를 함께 맞으며 깃든 자연의 생기가 그대로 담겨 있는 것이 센차의 매력입니다.",
      "천천히 음미하며 티코스의 마지막 잔을 마무리해 보세요.",
    ],
    howToBrew: {
      title: "How to Brew",
      items: [
        "물 200ml를 80°C로 준비",
        "찻잎 4g",
        "20초 우린 뒤 바로 따라내기",
        "Ratio: 50:1 = 200ml : 4g",
      ],
    },
    tip: "찻잎을 후라이팬에 약한 불로 천천히 덖어 보세요. '호지(ほうじ)'는 일본어로 **볶다**라는 뜻으로, 찻잎을 볶으면 구수한 향의 호지차처럼 즐길 수 있습니다.",
  },
]

export default function TeaCourseIntroContent({ courseId, internalId }: Props) {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code")?.trim()?.toUpperCase() ?? ""

  const [entitled, setEntitled] = React.useState<boolean | null>(null)
  const [courseIndex, setCourseIndex] = React.useState(0)
  const [slideIndex, setSlideIndex] = React.useState(0)
  const [laps, setLaps] = React.useState<number[]>([0])
  const [infusionNotes, setInfusionNotes] = React.useState<InfusionNote[]>([{}])
  const [courseRecords, setCourseRecords] = React.useState<CourseRecord[]>(
    Array(COURSE_INTROS.length).fill(null).map(() => ({}))
  )
  const [showRecords, setShowRecords] = React.useState(false)
  const [recordPhotoDataUrl, setRecordPhotoDataUrl] = React.useState<string | undefined>()
  const [saving, setSaving] = React.useState(false)

  const intro = COURSE_INTROS[courseIndex]
  const isLastCourse = courseIndex >= COURSE_INTROS.length - 1

  const saveCurrentRecord = (): CourseRecord => {
    const note = infusionNotes[0] ?? {}
    return {
      waterTempC: note.waterTempC,
      steepingTimeSec: laps[0] || 0,
      body: note.body,
      aroma: note.aroma,
      aftertaste: note.aftertaste ?? "",
    }
  }

  const updateInfusionNote = (index: number, patch: Partial<InfusionNote>) => {
    setInfusionNotes((prev) => {
      const next = [...prev]
      next[index] = { ...(next[index] ?? {}), ...patch }
      return next
    })
  }

  React.useEffect(() => {
    Promise.all([
      fetch("/api/auth/user").then((r) => r.json()),
      fetch("/api/me/entitlements").then((r) => r.json()),
    ]).then(([authRes, entRes]) => {
      const auth = authRes as { user: { id: string } | null }
      const ent = entRes as { entitledCourseIds?: string[] }
      setEntitled(
        Array.isArray(ent?.entitledCourseIds) && hasAccessForCourse(ent.entitledCourseIds, courseId)
      )
    }).catch(() => setEntitled(false))
  }, [courseId])

  const goPrev = () =>
    setSlideIndex((i) => (i <= 0 ? intro.images.length - 1 : i - 1))
  const goNext = () =>
    setSlideIndex((i) => (i >= intro.images.length - 1 ? 0 : i + 1))

  const goToNextCourse = () => {
    setCourseRecords((prev) => {
      const next = [...prev]
      next[courseIndex] = saveCurrentRecord()
      return next
    })
    setCourseIndex((i) => i + 1)
    setSlideIndex(0)
    setLaps([0])
    setInfusionNotes([{}])
    window.scrollTo(0, 0)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/archives/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teaCourseName: "고도(高度)",
          courseRecords,
          photoDataUrl: recordPhotoDataUrl ?? undefined,
          isPublic: false,
        }),
      })
      if (res.ok) {
        window.location.href = "/archive"
        return
      }
      if (res.status === 401) {
        window.location.href = codeFromUrl
          ? `/login?redirect=${encodeURIComponent(`/teacourse/${courseId}/intro?code=${codeFromUrl}`)}`
          : "/login"
        return
      }
    } catch {
      // API 실패 시 로컬 저장
    } finally {
      setSaving(false)
    }
    addIntroArchive({
      teaCourseName: "고도(高度)",
      courseRecords,
      photoDataUrl: recordPhotoDataUrl ?? undefined,
      isPublic: false,
    })
    window.location.href = "/archive"
  }

  const openRecordsView = () => {
    setCourseRecords((prev) => {
      const next = [...prev]
      next[courseIndex] = saveCurrentRecord()
      return next
    })
    setShowRecords(true)
  }

  const goBack = () => {
    if (courseIndex === 0) {
      window.location.href = `/teacourse/${courseId}`
      return
    }
    const prevIndex = courseIndex - 1
    const rec = courseRecords[prevIndex] ?? {}
    setCourseRecords((prev) => {
      const next = [...prev]
      next[courseIndex] = saveCurrentRecord()
      return next
    })
    setCourseIndex(prevIndex)
    setSlideIndex(0)
    setLaps([rec.steepingTimeSec ?? 0])
    setInfusionNotes([
      {
        waterTempC: rec.waterTempC,
        body: rec.body,
        aroma: rec.aroma,
        aftertaste: rec.aftertaste ?? "",
      },
    ])
  }

  if (entitled === null) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center text-black">
        <p className="text-[14px] text-black/70">권한 확인 중...</p>
      </div>
    )
  }

  if (!entitled) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center text-black">
        <p className="text-[14px] text-black/80">이 코스에 대한 접근 권한이 없습니다.</p>
        <Link href={`/teacourse/${courseId}`} className="mt-4 inline-block text-[14px] underline">
          준비물 페이지로 돌아가기
        </Link>
      </div>
    )
  }

  if (showRecords) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <div className="mx-auto max-w-[480px] px-4 py-8">
          <div className="mb-6">
            <h2 className="font-manrope text-[18px] font-semibold text-black">코스 기록</h2>
          </div>
          <div className="space-y-4">
            {COURSE_INTROS.map((course, i) => {
              const rec = courseRecords[i] ?? {}
              return (
                <div
                  key={course.title}
                  className="border border-black/15 bg-black/[0.02] p-4"
                >
                  <h3 className="font-manrope mb-3 text-[14px] font-semibold text-black">
                    {i + 1}. {course.title}
                  </h3>
                  <dl className="space-y-2 text-[13px]">
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-black/60">물 온도</dt>
                      <dd className="text-black/90">
                        {rec.waterTempC != null ? `${rec.waterTempC}°C` : "—"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-black/60">우림 시간</dt>
                      <dd className="text-black/90">
                        {(rec.steepingTimeSec ?? 0) > 0
                          ? `${rec.steepingTimeSec}초`
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-black/60">바디감</dt>
                      <dd className="text-black/90">
                        {rec.body != null ? rec.body : "—"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-black/60">향미</dt>
                      <dd className="text-black/90">
                        {rec.aroma != null ? rec.aroma : "—"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-black/60">여운</dt>
                      <dd className="text-black/90">
                        {(rec.aftertaste ?? "").trim() || "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )
            })}
          </div>

          {/* 찻자리 사진 추가하기 */}
          <div className="mt-6 mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-black/80">
              찻자리 사진 추가하기
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) {
                  setRecordPhotoDataUrl(undefined)
                  return
                }
                const reader = new FileReader()
                reader.onload = () => setRecordPhotoDataUrl(String(reader.result))
                reader.readAsDataURL(file)
              }}
              className="block text-[11px] text-black/70 file:mr-2 file:border file:border-black/15 file:bg-white file:px-2.5 file:py-1.5 file:text-[11px] file:rounded-none"
            />
            {recordPhotoDataUrl && (
              <img
                src={recordPhotoDataUrl}
                alt="찻자리"
                className="mt-2 max-h-32 w-auto border border-black/12 object-cover rounded-none"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mb-3 flex w-full items-center justify-center border border-black bg-black px-4 py-3 text-[14px] font-medium hover:bg-black/90 disabled:opacity-60"
            style={{ color: "#fff" }}
          >
            {saving ? "저장 중…" : "저장하기"}
          </button>
          <Link
            href="/archive"
            className="flex w-full items-center justify-center border border-black/25 bg-white px-4 py-3 text-[14px] font-medium text-black hover:bg-black/[0.04]"
          >
            마이아카이브 보러가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <div className="mx-auto max-w-[480px] px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="flex h-7 w-7 shrink-0 items-center justify-center text-[14px] text-black/70 hover:text-black"
            aria-label="뒤로가기"
          >
            ‹
          </button>
          <h2 className="font-manrope min-w-0 flex-1 text-[18px] font-semibold text-black">
            {intro.title}
          </h2>
        </div>

        {/* 이미지 슬라이드 */}
        <div className="relative mb-8 overflow-hidden border border-black/10 bg-black/[0.03]">
          <div className="flex aspect-[4/3] items-center justify-center">
            {intro.images.map((img, i) => (
              <div
                key={img.id}
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                style={{
                  opacity: i === slideIndex ? 1 : 0,
                  pointerEvents: i === slideIndex ? "auto" : "none",
                }}
              >
                {img.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.src}
                    alt={img.label}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-black/[0.06] text-[13px] text-black/40"
                    aria-label={img.label}
                  >
                    {img.label} (이미지 준비 중)
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="이전"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="다음"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {intro.images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlideIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === slideIndex ? "bg-black" : "bg-black/30"
                }`}
                aria-label={`${i + 1}번째 이미지`}
              />
            ))}
          </div>
        </div>

        {/* 본문 설명 */}
        <div className="mb-8 space-y-4 text-[14px] leading-relaxed text-black/90">
          {intro.description.map((para, i) => (
            <p key={i}>
              {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          ))}
        </div>

        {/* How to Brew - 사각형 박스 */}
        <div className="mb-6 border border-black/15 bg-black/[0.02] p-4">
          <h3 className="font-manrope mb-3 text-[14px] font-semibold text-black">
            {intro.howToBrew.title}
          </h3>
          <ul className="space-y-2 text-[13px] leading-relaxed text-black/85">
            {intro.howToBrew.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Tip - 사각형 박스 (있을 때만) */}
        {intro.tip && (
          <div className="mb-8 border border-black/15 bg-black/[0.02] p-4">
            <h3 className="font-manrope mb-2 text-[14px] font-semibold text-black">Tip</h3>
            <p className="text-[13px] leading-relaxed text-black/85">
              {intro.tip.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          </div>
        )}

        {/* 기록 창 */}
        <div className="mb-6">
          <TeaRecordForm
            laps={laps}
            setLaps={setLaps}
            selectedInfusion={0}
            infusionNotes={infusionNotes}
            updateInfusionNote={updateInfusionNote}
          />
        </div>

        {/* 다음 코스 / 코스 기록 보기 */}
        {isLastCourse ? (
          <button
            type="button"
            onClick={openRecordsView}
            className="w-full border border-black bg-black px-4 py-3 text-[14px] font-medium text-white hover:bg-black/90"
          >
            코스 기록 보기
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextCourse}
            className="w-full border border-black bg-white px-4 py-3 text-[14px] font-medium text-black hover:bg-black/[0.04]"
          >
            다음 코스로 넘어가기 →
          </button>
        )}
      </div>
    </div>
  )
}
