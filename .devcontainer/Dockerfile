FROM mcr.microsoft.com/devcontainers/base:latest

# Setup command history persistence
RUN mkdir -p /usr/local/share/shell-history \
  && chown -R vscode /usr/local/share/shell-history

# Install system dependencies for our stack
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        build-essential \
        git \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install Task (Taskfile runner)
RUN sh -c "$(curl -fsSL https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Switch to vscode user for any user-specific setup
USER vscode
