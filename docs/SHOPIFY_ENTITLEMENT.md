# Shopify 티코스 접근 권한(Entitlement) 설정

## 0. 로그인 전략

- **회원 = Shopify 고객 계정**으로 통일. 자체 로그인/회원가입은 보류.
- 아카이브 DB 등에서 사용하는 유저 키는 **Shopify `customer_id`**로 저장.

---

## 1. 티코스 ↔ Shopify 상품 · 태그 규칙

| 티코스 ID    | 고객 태그 | 비고     |
|-------------|-----------|----------|
| session-1   | `tc_1`    | 고도(高度) |
| session-2   | `tc_2`    | 순환 循環  |
| session-3   | `tc_3`    | 발견(發見) |
| session-4   | `tc_4`    | 봄(春)    |

- 티코스 1개 = Shopify 상품 1개 = 고객 태그 1개 (`tc_1` ~ `tc_4`).
- 해당 티코스를 **구매한 고객**에게만 해당 태그를 부여하면, 앱에서 “접근 가능”으로 인식합니다.

---

## 2. 구매 완료 시 고객 태그 자동 부여

**목표:** 주문 결제 완료(또는 fulfillment/paid) 시, 해당 티코스 상품을 구매한 고객에게 위 태그를 자동 부여.

### 2-1. Shopify Flow 사용 (권장)

1. **Flow 트리거**
   - **Order paid** 또는 **Order fulfillment** 등 “결제/완료” 시점 선택.

2. **조건**
   - Order의 line items 중 “티코스 상품”이 포함된 경우만 실행.
   - 상품 핸들/ID/Variant ID로 구매한 티코스를 구분.

3. **액션**
   - **Add customer tag**: 고객에게 `tc_1`, `tc_2`, `tc_3`, `tc_4` 중 해당 태그 추가.
   - 상품 1개당 태그 1개 매핑 예:
     - 상품 A(티코스1) 구매 → `tc_1`
     - 상품 B(티코스2) 구매 → `tc_2`
     - 동일 주문에 여러 티코스 구매 시 → 각각 해당 태그 모두 추가.

4. **Flow 이름 예**
   - "Tea course: Add entitlement tag on purchase"

### 2-2. 커스텀 앱/스크립트 사용 시

- **Order paid** (또는 Webhook) 수신 시:
  1. 주문의 line items에서 “티코스 상품” 식별 (상품 ID/핸들/Variant ID).
  2. 상품 ↔ 태그 매핑 (`tc_1` ~ `tc_4`) 적용.
  3. Admin API: `Customer` 업데이트하여 해당 태그 추가.

---

## 3. 티코스 안내 페이지 접근 제어

- **URL 예:** `/teacourse/session-1`, `/teacourse/session-2` …
- **동작:**
  - 로그인 안 됨 → “로그인 필요” 화면.
  - 로그인됐지만 해당 티코스 태그 없음 → “구매자 전용” + 구매 버튼/링크.
  - 해당 태그 있음 → 티코스 안내(기존 UI)로 진입.

구현 위치: `app/teacourse/[courseId]/page.tsx`, `app/api/shopify/entitlement/route.ts`.

---

## 4. Shopify 스토어 도메인에서 동작시키기

- **App Proxy** 또는 **Theme App Extension**으로, “같은 도메인”에서 티코스 페이지/위젯을 서빙.
- 스토어 상단/페이지에서 `https://스토어도메인/apps/teacourse/session-1` 형태로 접근하도록 설정하면, 외부 도메인 이동 없이 동작하게 할 수 있음.

### 세션 토큰 전달 (접근 권한 확인용)

- 티코스 게이트 페이지는 **Shopify Customer Account API 세션 토큰**으로 “현재 로그인한 고객”을 식별합니다.
- **App Proxy**로 페이지를 불러올 때, 스토어 측에서 다음 중 하나로 토큰을 넘겨주어야 합니다.
  1. **스토어 테마에서:** 로그인한 고객용으로 `getSessionToken()` 등으로 받은 JWT를, 페이지 로드 시 `window.__SHOPIFY_SESSION_TOKEN__`에 넣어 두거나, iframe/스크립트로 우리 앱에 전달.
  2. **또는** 티코스 페이지로 이동하는 링크에 쿼리로 토큰을 붙이지 말고, 같은 도메인 내에서만 쿠키/세션으로 처리하도록 Shopify 권장 방식 사용.
- **개발/테스트:** 프로덕션이 아닐 때 `?customerId=숫자` 로 호출하면, 해당 고객 ID로 태그만 조회해 접근 가능 여부를 확인합니다 (세션 토큰 없이).

---

## 5. 환경 변수 (Next.js)

| 변수 | 설명 |
|------|------|
| `SHOPIFY_STORE_DOMAIN` | Admin API 호출용 스토어 도메인 (예: `my-store.myshopify.com`) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API 액세스 토큰 (고객 조회/태그 확인용) |
| `NEXT_PUBLIC_SHOPIFY_STORE_URL` | 스토어 프론트 URL (구매 버튼 링크용, 예: `https://my-store.com`) |

---

## 6. 샘플 확인 순서

1. **태그 부여 확인**
   - Shopify Admin → Customers → 특정 고객에 `tc_1` 등 수동 태그 추가.
2. **엔타이틀먼트 API**
   - 개발 시: `POST /api/shopify/entitlement` body에 `{ "customerId": "해당고객ID" }` 로 호출 → `entitledCourseIds`에 `session-1` 등 포함되는지 확인.
3. **게이트 페이지**
   - `/teacourse/session-1?customerId=고객ID` 로 접속 → “시작하기”까지 나오는지 확인.
4. 성공 시 티코스 2·3·4에도 동일 패턴 적용.
