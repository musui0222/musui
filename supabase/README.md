# Supabase 스키마

## 실행 방법

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **SQL Editor** 메뉴
3. **New query** 클릭
4. `schema.sql` 파일 내용 전체 복사 후 붙여넣기
5. **Run** 실행

## 테이블 요약

| 테이블        | 설명 |
|---------------|------|
| `profiles`    | 사용자 프로필 (auth.users 확장). 가입 시 자동 생성 |
| `archives`    | 차 기록 세션 (user_id, created_at, is_public) |
| `archive_items` | 기록 1건당 찻잎 1종 (tea_name, tea_type, laps, infusion_notes 등) |

## 사진 저장

찻자리 사진은 현재 base64로 저장 가능하나, 용량이 커질 수 있습니다.  
Supabase **Storage**에 버킷(예: `tea-photos`)을 만들고, 업로드 후 받은 URL을 `archive_items.photo_url`에 넣는 방식을 권장합니다.
