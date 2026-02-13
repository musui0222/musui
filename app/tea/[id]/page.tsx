import Link from "next/link";
import { TeaDetailAccordion } from "@/components/TeaDetailAccordion";

const TEA_DATA: Record<
  string,
  {
    title: string;
    titleEn: string;
    category: string;
    categoryEn: string;
    year: string;
  }
> = {
  "tea-2": {
    title: "청향 사계춘",
    titleEn: "Four Seasons Spring",
    category: "청차",
    categoryEn: "Oolong tea",
    year: "2025",
  },
};

const ORIGIN = {
  subtitle: "난터우현(南投縣)",
  body: "대만 중부에 위치한 난터우현은 고산 지형과 온난한 기후가 어우러져 차 재배에 적합한 지역입니다. 아침·저녁의 큰 일교차와 풍부한 안개가 찻잎의 향을 맑고 선명하게 만듭니다.",
};

const ALTITUDE = {
  body: "청향 사계춘은 해발 약 600m의 다원에서 재배되었습니다. 부드러운 바람이 부는 이 고도에서 사계춘 특유의 산뜻한 향과 맑은 단맛이 자연스럽게 형성됩니다.",
};

const LEAF_TO_CUP = [
  { title: "채엽", titleEn: "Tea Picking", desc: "한 잎의 두께, 수분량, 잎맥의 탄성까지 세심하게 살피며 채엽합니다." },
  { title: "위조", titleEn: "Withering", desc: "실내 혹은 자연광 아래에서 찻잎의 수분을 서서히 날려 보냅니다." },
  { title: "주청", titleEn: "Tossing", desc: "찻잎을 흔들어 세포막을 자극해 미세하게 산화되도록 유도합니다." },
  { title: "살청", titleEn: "Kill-Green", desc: "열을 통해 산화가 진행되지 않도록 효소 활동을 멈춥니다." },
  { title: "유념", titleEn: "Rolling", desc: "손이나 기계로 잎을 말아 부피를 줄이고 형태를 잡습니다." },
  { title: "건조", titleEn: "Drying", desc: "저온에서 천천히 수분을 안정시키고 향을 정돈합니다." },
];

const TAGS = ["#대만", "#우롱차", "#청차", "#난터우현"];

export default async function TeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tea = TEA_DATA[id];

  if (!tea) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center">
        <p className="text-black/6">해당 제품 정보를 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-[14px] underline">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      {/* 상단 헤더 — 다른 페이지와 동일: 로고 가운데 고정 */}
      <header className="border-b border-black/15">
        <div className="relative mx-auto flex max-w-[480px] items-center justify-between px-3 py-2.5">
          <Link href="/" className="min-w-[2.5rem] text-[14px] text-black" aria-label="홈">←</Link>
          <Link
            href="/"
            aria-label="musui 홈"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-graphic.png" alt="musui" style={{ height: 28, width: "auto" }} />
          </Link>
          <div className="min-w-[2.5rem]" aria-hidden />
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-6">
        {/* 모바일: 포스터 위 → 상세 아래 단일 열 */}
        <section className="flex flex-col gap-6">
          {/* 제품 카드 — 포스터 이미지 원본 비율 그대로 표시 (잘리지 않음) */}
          <div className="mx-auto w-full max-w-[280px] border border-black/15 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/posters/tea-2-poster.png"
              alt={`${tea.title} 포스터`}
              className="block w-full object-contain object-center"
            />
          </div>

          {/* 상세 정보 + 어코디언 */}
          <div>
            <h1 className="text-[20px] font-semibold tracking-[0.02em] text-black">{tea.title}</h1>
            <p className="mt-1 text-[12px] tracking-[0.06em] text-black/80">
              우롱차 (Oolong) · {tea.year}
            </p>

            <div className="mt-6">
              <TeaDetailAccordion title="산지 (Origin)" defaultOpen>
                <h3 className="text-[13px] font-medium text-black">{ORIGIN.subtitle}</h3>
                <p className="mt-2 text-[13px] leading-relaxed tracking-[0.02em] text-black">
                  {ORIGIN.body}
                </p>
              </TeaDetailAccordion>

              <TeaDetailAccordion title="재배 고도 (Cultivation Altitude)">
                <p className="text-[13px] leading-relaxed tracking-[0.02em] text-black">
                  {ALTITUDE.body}
                </p>
              </TeaDetailAccordion>

              <TeaDetailAccordion title="찻잎에서 한 잔까지 (From Leaf to Cup)">
                <h3 className="mb-3 text-[14px] font-medium text-black">찻잎에서 한 잔까지</h3>
                <div className="grid grid-cols-1 gap-3">
                  {LEAF_TO_CUP.map((step) => (
                    <div
                      key={step.title}
                      className="border border-black/15 bg-white p-4 shadow-sm"
                    >
                      <div className="bg-black px-3 py-1.5 text-[12px] font-medium tracking-[0.06em] text-white">
                        {step.title} {step.titleEn}
                      </div>
                      <p className="mt-3 text-[12px] leading-relaxed text-black">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </TeaDetailAccordion>

              <TeaDetailAccordion title="우리는 방법 (Brewing Method)">
                <p className="text-[13px] leading-relaxed text-black">
                  첫물은 세차(洗茶)를 통해 찻잎을 씻어주고 깨워주세요.
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="rounded-full border border-black/20 bg-black/5 px-4 py-2 text-[13px] font-medium text-black">
                    HOT
                  </div>
                  <div className="rounded-full border border-black/20 bg-black/5 px-4 py-2 text-[13px] font-medium text-black">
                    ICE
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-[13px] text-black">
                  <p>
                    <strong>차 : 물 = 1 : 50</strong> (4g : 200ml)
                  </p>
                  <p>
                    <strong>우림 시간</strong> : 약 30초 (95℃ 기준, 온도에 따라 조정)
                  </p>
                  <p>
                    <strong>ICE</strong> : 1 : 50으로 약 40초간 우린 후, 차액을 얼음에 부어 가볍게
                    희석해 주세요.
                  </p>
                </div>
              </TeaDetailAccordion>
            </div>

            <p className="mt-5 text-[12px] text-black/80">
              Tags: {TAGS.join(" ")}
            </p>
          </div>
        </section>

        {/* 스크롤 시 보이는 섹션: 사계절이 모두 봄 */}
        <section className="mt-12 pt-8">
          <h2 className="text-[18px] font-semibold tracking-[0.02em] text-black">사계절이 모두 봄</h2>
          <div className="mt-4 space-y-4 text-[13px] leading-relaxed tracking-[0.02em] text-black">
            <p>
              사계춘(四季春)은 &apos;사계절이 모두 봄과 같다&apos;는 뜻을 가진 차나무 품종입니다.
              청향 사계춘은 사계절 내내 자라난 새잎으로 만들어진 우롱차로, 맑고 깨끗한 향이
              이어집니다.
            </p>
            <p>
              한 번에 큰 변화를 드러내기보다는, 시간에 따라 차분하게 이어지는 결을 가지고
              있습니다. 우리는 종종 변화가 느껴지지 않으면 멈춘 것처럼 느끼기도 합니다.
            </p>
            <p>
              청향 사계춘은 비슷해 보이는 우리의 하루하루가 멈춰 있는 시간만은 아닐지도 모른다는
              생각을 남깁니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
