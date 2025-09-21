#!/bin/bash

echo "🔄 Updating project from git..."

current_branch=$(git branch --show-current)
default_branch=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')

has_changes=false
if ! git diff-index --quiet HEAD --; then
    has_changes=true
    echo "📦 Stashing local changes..."
    git stash push -m "Auto-stash during devcontainer attach at $(date)"
fi

git fetch --prune

git switch "$default_branch"
git pull --ff-only

git remote prune origin

git branch -vv | grep ': gone]' | awk '{print $1}' | xargs --no-run-if-empty git branch -D

if [[ "$current_branch" != "$default_branch" ]]; then
    if git show-ref --verify --quiet "refs/heads/$current_branch"; then
        echo "📍 Switching back to branch: $current_branch"
        git switch "$current_branch"
        if [[ "$has_changes" == true ]]; then
            echo "📤 Restoring stashed changes..."
            git stash pop
        fi
    elif git ls-remote --heads origin "$current_branch" | grep -q "$current_branch"; then
        echo "📍 Re-creating local branch: $current_branch"
        git switch -c "$current_branch" "origin/$current_branch"
        if [[ "$has_changes" == true ]]; then
            echo "📤 Restoring stashed changes..."
            git stash pop
        fi
    else
        echo "⚠️  Original branch '$current_branch' no longer exists (likely merged)"
        echo "📍 Staying on $default_branch"
        if [[ "$has_changes" == true ]]; then
            echo "📤 Restoring stashed changes to $default_branch..."
            git stash pop
        fi
    fi
elif [[ "$has_changes" == true ]]; then
    echo "📤 Restoring stashed changes..."
    git stash pop
fi

bun install --silent

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "🚀 Quick start:"
echo "   task dev        - Start development servers"
echo "   task --list     - Show all available tasks"
echo ""
echo "💡 Tips:"
echo "   - Edit .user_aliases for personal aliases"
echo "   - Edit .personal-extensions.json to manage VSCode extensions"
echo ""
