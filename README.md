# TripSplit

国内・海外旅行の費用を**割り勘**するための、旅行支出プランナー。

## 主な機能

* **旅行設定**：旅行タイトル・基準通貨の設定、ローカル自動保存、セッションのリセット
* **参加者管理**：参加者の追加・編集、支出がある参加者の削除制御
* **支出管理**：複数通貨で支出を記録、一定件数以上で一覧モーダルを表示
* **為替レート**：最新レート取得＋手動上書き、JPYは100円単位で表示
* **精算計算**：最小回数で精算し、サマリーと差額を可視化
* **精算結果ページ**：確定後にPNG/PDFダウンロード、精算終了で全データをクリア


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
