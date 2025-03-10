## 概要
~~DBはPlanetScaleを使用しています。~~

2024年4月の有料化に伴って、supabaseに移行しました。

prismaのテーブル定義変更をsupabaseに反映

## サーバーの起動

```shell
npm run dev
```


```shell
npx prisma db push
```

prismaクライアントの再生成

```shell
npx prisma generate
```

biomeの適用

```shell
npx @biomejs/biome check --apply ./app
```


## プロダクトのコンセプト

細く長く個人開発をする

- ちょっとした個人で欲しいツールを作る
- フロントエンドやデザインに力をいれ、Webの基本から習得漏れを埋める

## 当面の開発目標

- トップページの作成 => 完了
- Googleログインの実装 => 完了
- Todoリストの作成でCRUDとDBの実装を試す => 完了
- 二つ目の機能を作ってみる => 進行中
  - WEB上のURLでスクラップ記事を作る
  - 基本的にはNext.jsで完結するように作りきってしまって、ある程度固まったらGoとかでバックエンドをリプレイスする