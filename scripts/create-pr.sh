#!/usr/bin/env bash
set -euo pipefail

current_branch="$(git rev-parse --abbrev-ref HEAD)"

# Options: -y (auto confirm), -t <title>
AUTO_YES=0
TITLE_OVERRIDE=""
while getopts ":yt:" opt; do
  case "$opt" in
    y) AUTO_YES=1 ;;
    t) TITLE_OVERRIDE="$OPTARG" ;;
    \?) echo "Unknown option: -$OPTARG" >&2; exit 2 ;;
    :) echo "Option -$OPTARG requires an argument." >&2; exit 2 ;;
  esac
done
shift $((OPTIND-1))

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
echo "Base branch: ${base_branch}"

# 実行予定の確認
title_default="$(git log -1 --pretty=%s 2>/dev/null || echo "${current_branch}")"
if [[ -n "${TITLE_OVERRIDE}" ]]; then
  title="${TITLE_OVERRIDE}"
else
  title="${title_default}"
fi
echo "Plan: Create PR from '${current_branch}' into '${base_branch}'"
echo "Title: ${title}"
if [[ ${AUTO_YES} -eq 0 ]]; then
  printf "Proceed? [y/N]: "
  read ans || true
  if [[ ! "${ans}" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

ensure_upstream() {
  # upstreamが設定されていない場合はoriginにpushし、対話的なプロンプトを避ける
  if ! git rev-parse --abbrev-ref --symbolic-full-name @{upstream} >/dev/null 2>&1; then
    if git remote get-url origin >/dev/null 2>&1; then
      git push -u origin "${current_branch}" >/dev/null 2>&1 || true
    fi
  fi
}

# PRがすでに存在する場合は終了
if command -v gh >/dev/null 2>&1; then
  if gh pr view --head "${current_branch}" >/dev/null 2>&1; then
    url="$(gh pr view --head "${current_branch}" --json url -q .url 2>/dev/null || true)"
    if [[ -n "${url}" ]]; then
      echo "Existing PR detected for head '${current_branch}': ${url}"
      exit 0
    fi
  fi
fi

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
