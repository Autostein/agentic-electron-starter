FROM node:24-bookworm

ARG AGENT_UID=1000
ARG AGENT_GID=1000

ENV COREPACK_DEFAULT_TO_LATEST=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends git curl jq ca-certificates ripgrep unzip \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

RUN if ! getent group "${AGENT_GID}" >/dev/null; then groupadd --gid "${AGENT_GID}" agent; fi \
  && useradd --uid "${AGENT_UID}" --gid "${AGENT_GID}" --create-home --shell /bin/bash agent

USER agent
ENV PNPM_HOME=/home/agent/.local/share/pnpm
ENV PATH="${PNPM_HOME}/bin:${PNPM_HOME}:${PATH}"

RUN pnpm add -g @anthropic-ai/claude-code @openai/codex

WORKDIR /home/agent/workspace
CMD ["sleep", "infinity"]
