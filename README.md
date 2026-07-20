# Family Quest 자동업데이트 패치

이 패치는 다음 문제를 해결합니다.

- GitHub에 새 코드를 올려도 휴대폰에 옛 화면이 남는 문제
- 주소에 `?ver=10`을 계속 붙여야 하는 문제
- 홈 화면에 설치한 PWA가 새 버전을 늦게 받는 문제

## 적용 파일

- `sw.js`: 프로젝트 루트의 기존 파일과 교체
- `index-service-worker-patch.txt`: `index.html`에서 교체할 코드와 Git 명령어

Supabase 데이터는 캐시에 저장하거나 삭제하지 않습니다.
체크 상태와 일정 데이터는 기존처럼 Supabase에 그대로 남습니다.
