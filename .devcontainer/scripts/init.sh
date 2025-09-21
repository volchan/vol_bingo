#!/bin/bash

echo "🔄 Updating project from git..."
current_branch=$(git branch --show-current)
default_branch=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')

has_changes=false
if ! git diff-index --quiet HEAD --; then
    has_changes=true
    echo "📦 Stashing local changes..."
    git stash push -m "Auto-stash during devcontainer init at $(date)"
fi

git switch "$default_branch"
git fetch --prune
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs --no-run-if-empty git branch -D

if [[ "$current_branch" != "$default_branch" ]] && git show-ref --verify --quiet "refs/heads/$current_branch"; then
    git switch "$current_branch"
    if [[ "$has_changes" == true ]]; then
        echo "📤 Restoring stashed changes..."
        git stash pop
    fi
elif [[ "$has_changes" == true ]]; then
    echo "⚠️  Original branch was deleted, staying on $default_branch"
    echo "📤 Restoring stashed changes..."
    git stash pop
fi

echo "🔧 VSCode Extensions Setup"

# Check if jq is installed, install if missing
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq (required for extension processing)..."

    # Detect package manager and install jq
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y jq
    elif command -v brew &> /dev/null; then
        brew install jq
    elif command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm jq
    else
        echo "❌ Could not install jq automatically. Please install jq manually:"
        echo "   Ubuntu/Debian: sudo apt install jq"
        echo "   RHEL/CentOS: sudo yum install jq"
        echo "   macOS: brew install jq"
        echo "   Arch: sudo pacman -S jq"
        exit 1
    fi

    echo "✅ jq installed successfully"
fi

if [[ ! -f .personal-extensions.json ]]; then
    # Check for VSCode extensions in various possible locations
    VSCODE_EXTENSIONS_PATH=""
    EXTENSIONS_JSON=""

    # Try different possible paths for VSCode extensions
    POSSIBLE_PATHS=(
        "$HOME/.vscode/extensions"
        "$HOME/.vscode-server/extensions"
        "/mnt/c/Users/$USER/.vscode/extensions"
        "/mnt/c/Users/${USER}/AppData/Local/Programs/Microsoft VS Code/resources/app/extensions"
        "$HOME/.vscode-insiders/extensions"
    )

    for path in "${POSSIBLE_PATHS[@]}"; do
        if [[ -d "$path" && -f "$path/extensions.json" ]]; then
            VSCODE_EXTENSIONS_PATH="$path"
            EXTENSIONS_JSON="$path/extensions.json"
            echo "📋 Found VSCode extensions at: $path"
            break
        fi
    done

    # Also check for Windows paths if in WSL
    if [[ -z "$VSCODE_EXTENSIONS_PATH" && -n "$WSL_DISTRO_NAME" ]]; then
        # Get Windows username
        WIN_USER=$(powershell.exe -c "echo \$env:USERNAME" 2>/dev/null | tr -d '\r\n' || echo "$USER")
        WIN_PATHS=(
            "/mnt/c/Users/$WIN_USER/.vscode/extensions"
            "/mnt/c/Users/$WIN_USER/AppData/Roaming/Code/User/extensions"
        )

        for path in "${WIN_PATHS[@]}"; do
            if [[ -d "$path" && -f "$path/extensions.json" ]]; then
                VSCODE_EXTENSIONS_PATH="$path"
                EXTENSIONS_JSON="$path/extensions.json"
                echo "📋 Found VSCode extensions at Windows path: $path"
                break
            fi
        done
    fi

    if [[ -n "$VSCODE_EXTENSIONS_PATH" && -f "$EXTENSIONS_JSON" ]]; then
        echo "📋 Found local VSCode extensions"

        echo -n "Would you like to add personal VSCode extensions to this devcontainer? (Y/n): "
        read add_extensions < /dev/tty
        add_extensions=${add_extensions:-y}

        if [[ $add_extensions =~ ^[Yy]$ ]]; then
            initial_array=$(jq -n '[]')
            json_content=$(cat "$EXTENSIONS_JSON")

            # Get list of extensions already configured in devcontainer.json
            devcontainer_extensions=()
            if [[ -f .devcontainer/devcontainer.json ]]; then
                while IFS= read -r ext; do
                    devcontainer_extensions+=("$ext")
                done < <(jq -r '.customizations.vscode.extensions[]?' .devcontainer/devcontainer.json 2>/dev/null || echo "")
            fi

            echo ""
            echo "Choose extensions to add to .personal-extensions.json:"
            echo "  y - yes (add extension)"
            echo "  n - no (skip extension)"
            echo "  c - custom version"
            echo "  (Extensions already in devcontainer.json will be skipped)"
            echo ""

            extensions=$(echo "$json_content" | jq -c '.[]')
            while IFS= read -r obj; do
                name=$(echo "$obj" | jq -r '.identifier.id')
                version=$(echo "$obj" | jq -r '.version')

                # Skip if extension is already in devcontainer.json
                skip_extension=false
                for dev_ext in "${devcontainer_extensions[@]}"; do
                    if [[ "$name" == "$dev_ext" ]]; then
                        echo "⏭️  Skipped $name (already in devcontainer.json)"
                        skip_extension=true
                        break
                    fi
                done

                if [[ "$skip_extension" == true ]]; then
                    continue
                fi

                # Use /dev/tty to read from terminal directly
                echo -n "Add $name ($version)? (Y/n/c): "
                read reply < /dev/tty
                reply=${reply:-y}

                case $reply in
                    [Yy]*)
                        new_obj=$(jq -n --arg name "$name" '{name: $name}')
                        initial_array=$(echo "$initial_array" | jq --argjson new_obj "$new_obj" '. + [$new_obj]')
                        echo "✅ Added $name"
                        ;;
                    [Nn]*)
                        echo "⏭️  Skipped $name"
                        ;;
                    [Cc]*)
                        echo -n "Enter version for $name (default: $version): "
                        read custom_version < /dev/tty
                        custom_version=${custom_version:-$version}
                        new_obj=$(jq -n --arg name "$name" --arg version "$custom_version" '{name: $name, version: $version}')
                        initial_array=$(echo "$initial_array" | jq --argjson new_obj "$new_obj" '. + [$new_obj]')
                        echo "✅ Added $name@$custom_version"
                        ;;
                    *)
                        echo "❌ Invalid option. Skipped $name"
                        ;;
                esac
            done <<< "$extensions"

            echo "$initial_array" > .personal-extensions.json
            echo ""
            echo "📄 Generated .personal-extensions.json with $(echo "$initial_array" | jq length) extensions"
            echo "💡 To regenerate, delete .personal-extensions.json and rebuild the devcontainer"
        else
            echo "⏭️  Skipped personal extensions setup"
        fi
    else
        echo "💡 Host VSCode extensions not found. Extensions can be added manually later."
        echo "💡 Create .personal-extensions.json to configure personal extensions"
    fi
else
    echo "✅ Personal extensions configuration already exists"
    extension_count=$(jq length .personal-extensions.json 2>/dev/null || echo "0")
    echo "📄 Found $extension_count personal extensions in .personal-extensions.json"
fi

echo "✅ Extensions setup complete"
