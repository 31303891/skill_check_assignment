#!/usr/bin/env bash
set -euo pipefail

current_branch="$(git rev-parse --abbrev-ref HEAD)"

# ブランチがリモートに存在しない場合は早期リターン
if ! git rev-parse --abbrev-ref --symbolic-full-name @{upstream} >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    echo "Push '${current_branch}' branch before creating a PR"
    exit 0
  fi
fi

# PRがすでに存在する場合は早期リターン
if command -v gh >/dev/null 2>&1; then
  if gh pr view --head "${current_branch}" >/dev/null 2>&1; then
    url="$(gh pr view --head "${current_branch}" --json url -q .url 2>/dev/null || true)"
    if [[ -n "${url}" ]]; then
      echo "PR already exists for head '${current_branch}': ${url}"
      exit 0
    fi
  fi
fi

# 1) 設定されていればupstreamを使用
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
fi

# 2) 最も近いローカルブランチを取得（HEADの祖先）
if [[ -z "${base_branch}" ]]; then
  local_branches=()
  while IFS= read -r b; do
    local_branches+=("${b}")
  done < <(git for-each-ref --format='%(refname:short)' refs/heads)
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
  done
fi

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

# 実行予定の確認
printf "Create PR From '${current_branch}'? [y/N]: "
read ans1 || true
if [[ ! "${ans1}" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi
printf "Into '${base_branch}'? [y/N]: "
read ans2 || true
if [[ ! "${ans2}" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi
printf "Enter title and press Enter:"
read title || true

if git help -a | grep -q "pull-request"; then
  # hubのgit extensionを使用
  if [[ -z "${GITHUB_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1; then
    tok="$(gh auth token 2>/dev/null || true)"
    [[ -n "${tok}" ]] && export GITHUB_TOKEN="${tok}"
  fi
  ensure_upstream
  exec git pull-request -b "${base_branch}" -m "${title}" -F .github/pull_request_template.md -o "$@"
elif command -v gh >/dev/null 2>&1; then
  # フォールバックとしてghを使用
  ensure_upstream
  exec gh pr create --base "${base_branch}" --title "${title}" --body-file .github/pull_request_template.md "$@"
else
  echo "Neither 'git pull-request' (hub) nor 'gh' is available." >&2
  exit 1
fi
