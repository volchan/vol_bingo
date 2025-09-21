#!/bin/bash


echo "🚀 Setting up development environment..."

git config --add safe.directory /workspaces/vol_bingo 2>/dev/null || echo "✅ Git safe directory already configured"

echo "✅ Git configuration loaded from host .gitconfig"

if command -v gh > /dev/null && ! gh auth status > /dev/null 2>&1; then
    echo "💡 Run 'gh auth login --git-protocol ssh --web' on host to authenticate GitHub CLI"
fi


if [ ! -f /workspaces/vol_bingo/.user_aliases ]; then
    cat > /workspaces/vol_bingo/.user_aliases << 'EOF'
# Personal aliases - Edit this file to add your own aliases
# This file is sourced by ~/.zshrc and persists across container rebuilds
# Located at project root but not versioned (see .gitignore)

# Example aliases (uncomment and modify as needed):
# alias dev="bun run dev"
# alias build="bun run build"
# alias lint="task lint"
# alias check="task check:fix"
# alias gs="git status"
# alias gl="git log --oneline"

# Add your personal aliases below:

EOF
    echo "📝 Created .user_aliases at project root for your personal aliases"
fi

mkdir -p ~/workspace
mkdir -p ~/bin

if [ ! -d ~/.oh-my-zsh ]; then
    echo "📦 Installing Oh My Zsh..."
    sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    echo "✅ Oh My Zsh installed"
else
    echo "✅ Oh My Zsh already installed"
fi

if [ ! -d ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting ]; then
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting >/dev/null 2>&1
fi

if [ ! -d ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions ]; then
    git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions >/dev/null 2>&1
fi

if [ ! -d ~/.oh-my-zsh/custom/plugins/zsh-completions ]; then
    git clone https://github.com/zsh-users/zsh-completions ~/.oh-my-zsh/custom/plugins/zsh-completions >/dev/null 2>&1
fi

if [ ! -d ~/.oh-my-zsh/custom/plugins/zsh-history-substring-search ]; then
    git clone https://github.com/zsh-users/zsh-history-substring-search ~/.oh-my-zsh/custom/plugins/zsh-history-substring-search >/dev/null 2>&1
fi

if [ ! -d ~/.oh-my-zsh/custom/plugins/zsh-z ]; then
    git clone https://github.com/agkozak/zsh-z ~/.oh-my-zsh/custom/plugins/zsh-z >/dev/null 2>&1
fi

echo "✅ Zsh plugins installed"

if [ -f ~/.zshrc ]; then
    if ! grep -q "zsh-syntax-highlighting" ~/.zshrc; then
        sed -i 's/plugins=(git)/plugins=(git zsh-syntax-highlighting zsh-autosuggestions zsh-completions zsh-history-substring-search zsh-z docker docker-compose)/' ~/.zshrc
    fi

    if ! grep -q "HISTFILE=/usr/local/share/shell-history" ~/.zshrc; then
        cat >> ~/.zshrc << 'EOF'

export HISTFILE=/usr/local/share/shell-history/.zsh_history
export HISTSIZE=10000
export SAVEHIST=10000
setopt SHARE_HISTORY
setopt APPEND_HISTORY
setopt INC_APPEND_HISTORY
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE
EOF
    fi
fi

if [ -f ~/.zshrc ]; then
    if ! grep -q "source /workspaces/vol_bingo/.user_aliases" ~/.zshrc; then
        cat >> ~/.zshrc << 'EOF'

if [ -f /workspaces/vol_bingo/.user_aliases ]; then
    source /workspaces/vol_bingo/.user_aliases
fi

if [[ -n $DEV_TERMINAL ]]; then print -z "task dev"; fi
EOF
    fi
fi


if ssh -o BatchMode=yes -o StrictHostKeyChecking=no -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH connection successful"
elif [ -z "$SSH_AUTH_SOCK" ]; then
    echo "💡 To enable SSH forwarding: run 'eval \$(ssh-agent -s) && ssh-add' on host, then rebuild container"
fi

if [[ -f /workspaces/vol_bingo/.personal-extensions.json ]]; then
    extension_count=$(jq length /workspaces/vol_bingo/.personal-extensions.json 2>/dev/null)
    if [[ $extension_count -gt 0 ]]; then
        code="$(ls ~/.vscode-server*/bin/*/bin/code-server* 2>/dev/null | head -n 1)"
        if [[ -n "$code" && -f "$code" ]]; then
            install_cmd=("$code")

            while IFS= read -r ext_obj; do
                name=$(echo "$ext_obj" | jq -r '.name' 2>/dev/null)
                version=$(echo "$ext_obj" | jq -r '.version // empty' 2>/dev/null)

                if [[ -n "$name" && "$name" != "null" ]]; then
                    if [[ -n "$version" && "$version" != "null" && "$version" != "empty" ]]; then
                        extension_id="$name@$version"
                    else
                        extension_id="$name"
                    fi

                    install_cmd+=(--install-extension "$extension_id")
                fi
            done < <(jq -c '.[]' /workspaces/vol_bingo/.personal-extensions.json 2>/dev/null)

            install_cmd+=(--force)

            {
                spinner="/-\\|"
                i=0
                while true; do
                    printf "\r\033[K📦 Installing $extension_count personal extensions %c" "${spinner:$i:1}"
                    i=$(( (i+1) % ${#spinner} ))
                    sleep 0.2
                done
            } &
            spinner_pid=$!

            "${install_cmd[@]}" >/dev/null 2>&1 || true

            kill $spinner_pid 2>/dev/null
            wait $spinner_pid 2>/dev/null
            printf "\r\033[K✅ Personal extensions installed\n"
        else
            echo "⚠️  VSCode server not available, skipping extension installation"
        fi
    fi
fi

echo "🔧 Initializing environment files..."
task env:init

echo "🎉 Development environment ready!"
