# Discord Bot Cloud Run 分離実装計画

## 1. 目的

- Discord Interaction の初回タイムアウトを解消する
- `min-instances=0` のまま運用し、固定課金を増やさない
- 既存のシート更新機能（`atoraku-done` / `hokora-done`）を維持する

## 2. 方針概要

- Discord の受け口を Next.js 本体から分離し、軽量な `discord-ingress` サービスへ移す
- `discord-ingress` は署名検証後に即時 `type: 5` を返し、実処理を Cloud Tasks に委譲する
- `discord-worker` が Cloud Tasks から呼ばれ、Sheets 更新と Discord followup 送信を実行する

## 3. 対象範囲

- 追加するもの
- `discord-ingress`（Cloud Run）
- `discord-worker`（Cloud Run）
- Cloud Tasks Queue（1つ）
- 既存ロジックの共通化（署名検証、名前照合、メッセージ生成）

- 変更するもの
- Discord の Interactions Endpoint URL
- デプロイ設定（`cloudbuild.yaml` / `.github/workflows/deploy.yml`）
- Secret / env 受け渡し定義

- 対象外
- コマンド仕様変更（コマンド名や引数仕様）
- シート構造の大幅な変更

## 4. アーキテクチャ

1. Discord -> `discord-ingress` `/interactions`
2. `discord-ingress` が署名検証
3. `discord-ingress` が即時 `{"type":5}` を返す
4. `discord-ingress` が Cloud Tasks にジョブ投入
5. Cloud Tasks -> `discord-worker` `/tasks/discord-update`
6. `discord-worker` が Sheets 更新 + Discord followup webhook 送信

## 5. 実装フェーズ

### Phase 0: 設計確定

- サービス名、リージョン、URL ルールを決定
- Cloud Tasks のキュー名と再試行ポリシーを決定
- ワーカー認証方式（OIDC）を決定

完了条件:
- 設計メモが残り、実装者間で認識齟齬がない

### Phase 1: `discord-ingress` 実装

- 署名検証ロジックを移植
- Discord payload を最小限でタスク化
- 3秒以内応答を最優先したハンドラ実装

完了条件:
- ローカル/ステージングで `type: 5` が即時返る

### Phase 2: `discord-worker` 実装

- 既存 `app/api/discord/route.ts` の業務ロジックを移植
- Sheets 読み取り/更新と followup 送信を実装
- 冪等性を考慮（同一 interaction 再実行時の重複更新抑止）

完了条件:
- タスク経由で既存同等の更新結果が得られる

### Phase 3: デプロイパイプライン更新

- 2サービス分の build/deploy を追加
- Secret と env の受け渡しを分離定義
- Queue 作成/更新コマンドを追加

完了条件:
- CI/CD から 2サービス + Queue が再現可能に構築できる

### Phase 4: 切り替え

- Discord 側 Endpoint を `discord-ingress` に変更
- 段階的にトラフィック確認
- 旧 `app/api/discord` を停止または互換モードにする

完了条件:
- 本番でタイムアウト発生率が許容値以下

## 6. タスク分解（実装順）

1. `services/discord-ingress` の雛形作成（Node.js）
2. `services/discord-worker` の雛形作成（Node.js）
3. 共通モジュール切り出し（名前照合/レスポンス整形）
4. Cloud Tasks クライアント実装（ingress 側）
5. ワーカーのタスク受信 API 実装
6. デプロイ設定更新（Cloud Build/GitHub Actions）
7. ステージング検証
8. 本番切り替え
9. 旧経路の整理

## 7. 受け入れ条件

- 初回リクエストでも Discord 側でタイムアウトしない
- `atoraku-done` / `hokora-done` が既存と同じ結果を返す
- `min-instances=0` のまま運用されている
- エラー時に Cloud Logging で追跡できる

## 8. リスクと対策

- リスク: ingress から worker への payload 欠落
- 対策: task payload の schema を定義しバリデーション

- リスク: 再試行で重複更新
- 対策: interaction ID ベースの冪等化キー導入

- リスク: Secret 設定漏れ
- 対策: 起動時バリデーション + デプロイ時チェック

## 9. 検証計画

- 正常系: 1人/複数人指定での更新
- 異常系: 署名不正、対象未指定、曖昧一致、Sheets API エラー
- 負荷系: 連続実行時の Queue 遅延と再試行挙動

## 10. 将来改善（任意）

- シートに `discord_user_id` 列を追加して ID 照合へ移行
- Google access token のキャッシュ最適化
- メトリクスダッシュボード（成功率/遅延/再試行回数）整備
