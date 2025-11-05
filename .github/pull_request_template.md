## 目的
- dependabotで出てた警告を消したい

### 変更内容
- 何をどう変えたか
  - 本文はテンプレに入力してエディタでプレビュー
  - タイトルはターミナルで対話的に入力

### 動作確認手順
1. セットアップ（必要なら）
2. 再現/確認手順
3. 期待結果

### チェックリスト
- [ ] 本文がテンプレのままになっていないか
- [ ] タイトルをミスっていないか
- [ ] ドキュメント/README 更新（必要なら）

---

PR作成コマンド:

```bash
# 自動で base ブランチを推定して PR を作成
scripts/create-pr.sh

# 直接指定で作成（同一リポ / 現在ブランチを head に使用）
git pull-request -b master -F .github/pull_request_template.md -o

# gh を使う場合
gh pr create --base master --title "feat: awesome change" --body-file .github/pull_request_template.md
```
