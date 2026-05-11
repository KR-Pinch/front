# Search Console Export Reports

Put Google Search Console CSV or TSV exports in `reports/seo/input`, then run:

```bash
npm run seo:gsc
```

The generated dated Markdown and JSON reports are ignored by Git because they can contain private Search Console query and page data.
