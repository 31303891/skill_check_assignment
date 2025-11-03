#!/usr/bin/env bash
set -euo pipefail

# Auto-detect base branch and create a PR from current branch
# 
# 1. upstreamが設定されていればupstreamを使用
# 2. 設定されていない場合は最も近いローカルブランチを取得（HEADの祖先）
# 3. リポジトリのデフォルトブランチ（gh）にフォールバック、その後master/mainのヒューリスティック
# 4. upstreamが設定されていない場合はoriginにpushし、対話的なプロンプトを避ける
# 5. hubのgit extensionを使用
# 6. フォールバックとしてghを使用
# 7. 両方のコマンドが使用できない場合はエラーを返す

current_branch="$(git rev-parse --abbrev-ref HEAD)"

# 1) # 設定されていればupstreamを使用
upstream_ref="$(git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null || true)"
base_branch=""
if [[ -n "${upstream_ref}" ]]; then
  if [[ "${upstream_ref}" == */* ]]; then
    base_branch="${upstream_ref#*/}"
  else
    base_branch="${upstream_ref}"
  fi
  # upstreamが同じブランチ名の場合は無視
  if [[ "${base_branch}" == "${current_branch}" ]]; then
    base_branch=""
  fi
  echo "Using upstream branch: ${base_branch}"
else
  # 2) 最も近いローカルブランチを取得（HEADの祖先）
  mapfile -t local_branches < <(git for-each-ref --format='%(refname:short)' refs/heads)
  best_date=""
  for b in "${local_branches[@]}"; do
    [[ "${b}" == "${current_branch}" ]] && continue
    if git merge-base --is-ancestor "${b}" HEAD; then
      d="$(git log -1 --format=%cI "${b}")"
      if [[ -z "${best_date}" || "${d}" > "${best_date}" ]]; then
        base_branch="${b}"
        best_date="${d}"
      fi
    fi
    echo "Checking branch: ${b}, date: ${d}"
  done

  # 3) リポジトリのデフォルトブランチ（gh）にフォールバック、その後master/mainのヒューリスティック
  if [[ -z "${base_branch}" ]]; then
    if command -v gh >/dev/null 2>&1; then
      base_branch="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || true)"
    fi
    if [[ -z "${base_branch}" ]]; then
      if git show-ref --verify --quiet refs/heads/master; then
        base_branch="master"
      elif git show-ref --verify --quiet refs/heads/main; then
        base_branch="main"
      else
        base_branch="$(git for-each-ref --format='%(refname:short)' --sort=-committerdate refs/heads | head -n1)"
      fi
    fi
  fi
fi
echo "Base branch: ${base_branch}"

ensure_upstream() {
  # upstreamが設定されていない場合はoriginにpushし、対話的なプロンプトを避ける
  if ! git rev-parse --abbrev-ref --symbolic-full-name @{upstream} >/dev/null 2>&1; then
    if git remote get-url origin >/dev/null 2>&1; then
      git push -u origin "${current_branch}" >/dev/null 2>&1 || true
    fi
  fi
}

if git help -a | grep -q "pull-request"; then
  # hubのgit extensionを使用
  if [[ -z "${GITHUB_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1; then
    tok="$(gh auth token 2>/dev/null || true)"
    [[ -n "${tok}" ]] && export GITHUB_TOKEN="${tok}"
  fi
  ensure_upstream
  exec git pull-request -b "${base_branch}" -F .github/pull_request_template.md -o "$@"
elif command -v gh >/dev/null 2>&1; then
  # フォールバックとしてghを使用
  title="$(git log -1 --pretty=%s)"
  ensure_upstream
  exec gh pr create --base "${base_branch}" --title "${title}" --body-file .github/pull_request_template.md "$@"
else
  echo "Neither 'git pull-request' (hub) nor 'gh' is available." >&2
  exit 1
fi
