# data/ — bootstrap ve yedek

Runtime CMS verisi **MySQL** `cms_documents` tablosundadır (`lib/cms/store.ts`).

- Bu klasördeki `*.json` dosyaları seed kaynağı / yerel yedektir; uygulama artık buraya yazmaz.
- `backup-pre-mysql/` — MySQL geçişi öncesi kopya (dokunma).
- Yeniden seed: `npm run db:seed:force`
- DB → JSON yedek: `npm run db:export`
