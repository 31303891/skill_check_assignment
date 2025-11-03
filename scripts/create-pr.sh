#!/usr/bin/env bash
set -euo pipefail

# Auto-detect base branch and create a PR from current branch

current_branch="$(git rev-parse --abbrev-ref HEAD)"

# 1) Prefer upstream if set
upstream_ref="$(git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null || true)"
base_branch=""
if [[ -n "${upstream_ref}" ]]; then
  if [[ "${upstream_ref}" == */* ]]; then
    base_branch="${upstream_ref#*/}"
  else
    base_branch="${upstream_ref}"
  fi
else
  # 2) Pick the nearest local branch whose tip is an ancestor of HEAD
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
  done

  # 3) Fallback to repo default branch (gh), then master/main heuristics
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

if git help -a | grep -q "pull-request"; then
  # Use hub's git extension if available
  if [[ -z "${GITHUB_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1; then
    tok="$(gh auth token 2>/dev/null || true)"
    [[ -n "${tok}" ]] && export GITHUB_TOKEN="${tok}"
  fi
  exec git pull-request -b "${base_branch}" -F .github/pull_request_template.md -o "$@"
elif command -v gh >/dev/null 2>&1; then
  # Fallback to gh
  title="$(git log -1 --pretty=%s)"
  exec gh pr create --base "${base_branch}" --title "${title}" --body-file .github/pull_request_template.md "$@"
else
  echo "Neither 'git pull-request' (hub) nor 'gh' is available." >&2
  exit 1
fi


