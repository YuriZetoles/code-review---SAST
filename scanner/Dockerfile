FROM python:3.12-slim

# Versões fixadas onde possível
# syft/grype/trivy: pinados via install script abaixo
# Para atualizar: trocar os ARGs ou rodar: docker build --build-arg X_VERSION=vX.Y.Z
ARG GITLEAKS_VERSION=8.21.2
ARG SEMGREP_VERSION=1.99.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git jq ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir semgrep==${SEMGREP_VERSION}

RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh \
    | sh -s -- -b /usr/local/bin

RUN curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh \
    | sh -s -- -b /usr/local/bin

RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
    | sh -s -- -b /usr/local/bin

RUN set -eux; \
    ARCH="$(dpkg --print-architecture)"; \
    case "$ARCH" in \
      amd64) GL_ARCH=x64 ;; \
      arm64) GL_ARCH=arm64 ;; \
      *) echo "Unsupported arch: $ARCH"; exit 1 ;; \
    esac; \
    curl -sSfL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_${GL_ARCH}.tar.gz" \
    | tar -xz -C /usr/local/bin gitleaks

RUN git config --global --add safe.directory '*'

ENV SAST_API_URL=http://codereview.yuriprojects.dpdns.org

COPY script/scan.sh /usr/local/bin/scan.sh
RUN chmod +x /usr/local/bin/scan.sh

WORKDIR /scan
ENTRYPOINT ["/usr/local/bin/scan.sh"]
