# Google Search Console export workflow

API 연결 없이 Google Search Console에서 내려받은 파일만으로 SEO를 개선하는 흐름입니다.

## 추천 흐름

1. Google Search Console에서 `성과` > `검색결과`로 이동합니다.
2. 기간은 `최근 28일` 또는 `최근 3개월`로 선택합니다.
3. `내보내기`에서 CSV를 내려받습니다.
4. 가능하면 `검색어`와 `페이지` 데이터를 함께 준비합니다.
5. 파일을 Codex에게 보내거나, 저장소에서는 `reports/seo/input` 폴더에 넣습니다.
6. `npm run seo:gsc`를 실행하면 간단한 Markdown 리포트가 생성됩니다.

## 로컬 리포트 만들기

```bash
npm run seo:gsc
```

특정 파일만 분석하려면:

```bash
npm run seo:gsc -- reports/seo/input/queries.csv reports/seo/input/pages.csv
```

결과는 `reports/seo/gsc-export-report-YYYY-MM-DD.md`와 `.json`으로 생성됩니다. 검색어와 페이지 성과 데이터가 들어갈 수 있어서 생성된 리포트와 원본 CSV는 Git에 올리지 않습니다.

## 내가 볼 때 필요한 파일

가장 좋은 조합은 다음 둘입니다.

- 검색어 export: 어떤 키워드로 노출되는지 확인
- 페이지 export: 어떤 URL이 검색에서 성과를 내는지 확인

파일을 보내주면 여기서 바로 분석해서 제목, meta description, 본문 보강, 내부 링크, 구조화 데이터 수정까지 이어서 처리하면 됩니다.
