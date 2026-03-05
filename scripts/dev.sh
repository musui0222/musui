#!/bin/bash
# EMFILE 에러 방지를 위해 파일 디스크립터 한도 상향 후 dev 서버 실행
ulimit -n 10240 2>/dev/null || true
exec npm run dev
