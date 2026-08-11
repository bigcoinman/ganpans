# Antigravity Agent Rules

## Git Worktree 규칙

새 프로젝트 시작 시 Git 저장소를 초기화한 후, **반드시 Git Worktree를 생성**해야 한다.

### 적용 조건
- Git 저장소 기반 프로젝트 (`git init` 또는 `git clone` 후)
- 장기 개발 또는 배포가 예정된 프로젝트

### Worktree 생성 기본 패턴
```bash
# 1. main 브랜치에서 첫 커밋 완료 후
git worktree add "../{프로젝트명}-dev" -b develop
```

- **메인 워크트리**: `main` 브랜치 (운영/배포용)
- **추가 워크트리**: `develop` 또는 `feature/*` 브랜치 (개발용)
- 경로는 현재 프로젝트 폴더 **옆에** 생성 (`../프로젝트명-dev`)

### 예외
- 1회성 스크립트 또는 실험용 코드
- Git을 사용하지 않는 단순 파일 편집
