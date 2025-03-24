# Cloud Runデプロイ改善ガイド

## 問題点

1. コンテナ起動のたびにマイグレーションが実行され非効率
2. 環境変数の問題でデータベースにアクセスできていない

## 解決策

1. マイグレーションとアプリケーション実行を分離
2. Secret Managerを使用して環境変数を適切に設定

## 実装手順

### 1. Secret Managerの既存シークレットを使用

既存のデータベースURLがすでにSecret Managerに登録されているため、以下の手順でCloud Runサービスからアクセスできるようにします：

```bash
# Cloud Runサービスアカウントにシークレットアクセス権を付与
# SERVICE_ACCOUNT_EMAILは実際のCloud Runサービスアカウントのメールアドレスに置き換えてください
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

# 現在のCloud Runサービスアカウントを確認するには以下のコマンドを実行
gcloud run services describe bonsai --format="value(spec.template.spec.serviceAccountName)"
```

### 2. Cloud Buildの設定

`cloudbuild.yaml`を更新して以下の変更を行いました：

1. マイグレーション専用のステップを追加
2. アプリケーションデプロイ時に環境変数とシークレットを設定

### 3. エントリポイントスクリプトの改善

`entrypoint.sh`を更新して以下の変更を行いました：

1. `RUN_MIGRATIONS`環境変数がtrueの場合のみマイグレーションを実行
2. データベース接続テストを追加して環境変数の問題を早期に検出

## デプロイ手順

1. 変更をコミットしてプッシュ
2. Cloud Buildトリガーを実行

```bash
git add .
git commit -m "Cloud Runデプロイ方法の改善"
git push origin main
```

3. Cloud Buildのログを確認してデプロイが正常に完了したことを確認

## 注意点

- データベースURLに含まれる特殊文字（`%23`など）は正しくエスケープされていることを確認
- Cloud Buildの代替手段としてCloud Run Jobsを使用することも検討可能
