#!/usr/bin/env bash
set -euo pipefail

current_branch="$(git rev-parse --abbrev-ref HEAD)"
base_branch=""

# upstreamが未設定の場合は早期リターン
if ! git rev-parse --abbrev-ref --symbolic-full-name @{upstream} >/dev/null 2>&1; then
  echo -e "No upstream for '${current_branch}'\nTo set upstream, use\n\n\tgit push --set-upstream origin ${current_branch}\n"
  exit 0
fi

# upstreamが未設定の場合は早期リターン
if ! git rev-parse --abbrev-ref --symbolic-full-name @{upstream} >/dev/null 2>&1; then
  echo -e "No upstream for '${current_branch}'\nTo set upstream, use\n\n\tgit push --set-upstream origin ${current_branch}\n"
  exit 0
fi

# pushされていないコミットがある場合は早期リターン
ahead_count="$(git rev-list --count @{u}..HEAD 2>/dev/null || echo 0)"
if [ "${ahead_count}" -gt 0 ]; then
  if [ "${ahead_count}" -eq 1 ]; then
    echo "1 commit is not pushed"
  else
    echo "${ahead_count} commits are not pushed"
  fi
  exit 0
fi

# PRがすでに存在する場合は早期リターン
if command -v gh >/dev/null 2>&1; then
  url="$(gh pr list --head "${current_branch}" --state open --json url -q '.[0].url' 2>/dev/null || true)"
  if [[ -z "${url}" ]]; then
    # フォークやフィルタの揺らぎに備えて owner:branch でも確認
    owner_repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
    owner="${owner_repo%%/*}"
    if [[ -n "${owner}" ]]; then
      url="$(gh pr list --head "${owner}:${current_branch}" --state open --json url -q '.[0].url' 2>/dev/null || true)"
    fi
  fi
  if [[ -n "${url}" ]]; then
    echo -e "PR already exists\n\t${url}"
    exit 0
  fi
fi

# 1) 最も近いローカルブランチをbase_branchに設定（HEADの祖先）
if [[ -z "${base_branch:-}" ]]; then
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

# 2) デフォルトブランチ検出（origin/HEAD）
if [[ -z "${base_branch:-}" ]]; then
  default_remote_head="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  if [[ -n "${default_remote_head}" ]]; then
    base_branch="${default_remote_head#origin/}"
  fi
fi

# 実行予定を対話形式で確認
echo "Create Pull Request"
printf "From '${current_branch}'? [y/N]: "
read ans1 || true
if [[ ! "${ans1}" =~ ^[Yy]$ ]]; then
  echo "Aborted"
  exit 0
fi
printf "Into '${base_branch}'? [y/N]: "
read ans2 || true
if [[ ! "${ans2}" =~ ^[Yy]$ ]]; then
  echo "Aborted"
  exit 0
fi
while true; do
  printf "Enter title and press Enter: "
  read title || true
  if [[ -n "${title}" ]]; then
    break
  fi
done

# PR作成
if git help -a | grep -q "pull-request"; then
  # hubのgit extensionを使用
  if [[ -z "${GITHUB_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1; then
    tok="$(gh auth token 2>/dev/null || true)"
    [[ -n "${tok}" ]] && export GITHUB_TOKEN="${tok}"
  fi
  exec git pull-request -b "${base_branch}" -m "${title}" -F .github/pull_request_template.md -o "$@"
elif command -v gh >/dev/null 2>&1; then
  # フォールバックとしてghを使用
  exec gh pr create --base "${base_branch}" --title "${title}" --body-file .github/pull_request_template.md "$@"
else
  echo "Neither 'git pull-request' (hub) nor 'gh' is available" >&2
  exit 1
fi
