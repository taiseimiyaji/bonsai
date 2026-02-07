# Discord Phase 4 切り替え手順

この手順は `discord-ingress` / `discord-worker` をデプロイ済みであることを前提にしています。

## 1. 事前確認

```bash
scripts/check-discord-cutover.sh
```

確認ポイント:
- `discord-ingress` / `discord-worker` の URL が取得できる
- Queue `discord-update-queue` が存在する

## 2. Discord Interactions Endpoint の切替

1. Discord Developer Portal を開く
2. 対象 Application の `General Information` を開く
3. `Interactions Endpoint URL` に以下を設定

```text
https://<discord-ingress-url>/interactions
```

4. 保存し、検証が成功することを確認

## 3. 動作確認

1. Discord 上で `/atoraku-done` と `/hokora-done` を実行
2. 3秒以内に「考え中」表示（defer）が返ることを確認
3. 数秒以内に followup メッセージが返ることを確認
4. シート更新が正しいことを確認

## 4. 旧エンドポイント停止（互換モード解除）

切替が安定したら `bonsai` の旧ハンドラを無効化します。

```bash
gcloud run services update bonsai \
  --region asia-northeast1 \
  --update-env-vars DISCORD_LEGACY_HANDLER_ENABLED=false
```

これにより `app/api/discord` は `410 Gone` を返します。

## 5. ロールバック手順

問題発生時は次を実施:

1. Discord Interactions Endpoint を旧 URL に戻す
2. 必要なら旧ハンドラを再有効化

```bash
gcloud run services update bonsai \
  --region asia-northeast1 \
  --update-env-vars DISCORD_LEGACY_HANDLER_ENABLED=true
```

## 6. 補足

- `DISCORD_LEGACY_HANDLER_ENABLED` のデフォルトは `true`（未設定時）
- 本番で完全移行後は `false` 固定を推奨
