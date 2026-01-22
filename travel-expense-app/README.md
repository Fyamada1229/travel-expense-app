# TripSplit

国内・海外旅行の費用を**割り勘**するための、旅行支出プランナー。

## 機能

* **旅行設定**：基準通貨（ベース通貨）の設定、セッションのリセット
* **参加者管理**：参加者削除時のバリデーション（整合性チェック）
* **支出管理**：複数通貨に対応した出費の記録
* **為替レート取得**：レートの自動取得＋手動での上書き（変更）
* **精算計算**：送金回数（振込回数）が最小になるように精算を算出


## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Docker

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker

```bash
docker compose up --build
```

Open `http://localhost:3000`.
