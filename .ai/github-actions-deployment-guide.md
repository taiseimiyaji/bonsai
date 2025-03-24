# GitHub Actionsによるデプロイガイド

## 概要

GitHub Actionsを利用してCloud Runへのデプロイを自動化することで、以下の問題を解決します：

1. コンテナ起動のたびにマイグレーションが実行される非効率な問題
2. 環境変数の問題でデータベースにアクセスできない問題

## 設定した環境変数

### ワークフロー内の環境変数

`deploy.yml`ファイル内で設定している環境変数：

```yaml
env:
  PROJECT_ID: bonsai-410001
  SERVICE_NAME: bonsai
  REGION: asia-northeast1
```

これらの値はプロジェクトに合わせて設定されています。

### GitHub Secretsに設定すべき環境変数

GitHub リポジトリの Settings > Secrets and variables > Actions で以下のシークレットを設定する必要があります：

1. **GCP_SA_KEY**
   - 説明: GCPサービスアカウントのJSONキー
   - 形式: JSON形式の文字列
   - 取得方法: GCPコンソールでサービスアカウントキーを作成してダウンロード

### GCPのSecret Managerに設定されている環境変数

1. **DATABASE_URL**
   - 説明: Supabaseデータベースへの接続URL
   - 値: データベース接続文字列
   - 注意: 特殊文字（`%23`など）が正しくエスケープされていることを確認

2. **DIRECT_URL**
   - 説明: Prismaがマイグレーションやスキーマ操作に使用する直接接続URL
   - 値: 通常は`DATABASE_URL`と同じ値を設定
   - 重要性: Prismaのマイグレーション操作に必須

### Cloud Runサービスに設定される環境変数

デプロイ時に以下の環境変数がCloud Runサービスに設定されます：

1. **RUN_MIGRATIONS**
   - 値: `false`
   - 説明: アプリケーション起動時にマイグレーションを実行しないようにする設定

2. **DATABASE_URL**
   - 値: Secret Managerの`DATABASE_URL`シークレットから取得
   - 説明: データベース接続情報

3. **DIRECT_URL**
   - 値: Secret Managerの`DIRECT_URL`シークレットから取得
   - 説明: Prismaが直接データベースに接続するためのURL
   - 注意: Secret Managerに設定されていない場合は`DATABASE_URL`と同じ値が使用されます

## GCPサービスアカウントの設定

GitHub Actionsからデプロイを行うためには、適切な権限を持つGCPサービスアカウントが必要です：

1. GCPコンソールで新しいサービスアカウントを作成
   - 名前例: `github-actions-deployer`

2. 以下の権限を付与
   - Cloud Run Admin (`roles/run.admin`)
   - Storage Admin (`roles/storage.admin`)
   - Service Account User (`roles/iam.serviceAccountUser`)
   - Secret Manager Secret Accessor (`roles/secretmanager.secretAccessor`)

3. サービスアカウントキーを作成
   - JSON形式でキーをダウンロード
   - このJSONをGitHub Secretsの`GCP_SA_KEY`として設定

## デプロイの流れ

1. mainブランチへのプッシュ、またはワークフロー手動実行でデプロイが開始
2. リポジトリのチェックアウト
3. GCP認証とGcloud SDKのセットアップ
4. Dockerイメージのビルドとプッシュ
5. マイグレーションの実行（一時的なコンテナで実行）
6. Cloud Runへのデプロイ（マイグレーションなし）

## トラブルシューティング

1. **認証エラー**
   - GCP_SA_KEYが正しく設定されているか確認
   - サービスアカウントに必要な権限があるか確認

2. **マイグレーションエラー**
   - DATABASE_URLとDIRECT_URLが正しく設定されているか確認
   - 特殊文字のエスケープが正しいか確認
   - Prismaのバージョンが最新かどうか確認

3. **デプロイエラー**
   - プロジェクトID、リージョン、サービス名が正しいか確認
   - サービスアカウントにCloud Run Adminの権限があるか確認

## メリット

1. マイグレーションとアプリケーション実行が分離され、効率的
2. 環境変数が適切に管理され、データベースアクセスの問題を解決
3. デプロイプロセスの透明性が向上
4. 柔軟なワークフローのカスタマイズが可能
