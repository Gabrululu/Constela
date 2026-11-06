# Imagen de compilación de Constela. Corre sin red: todas las dependencias se resuelven aquí, al construirla.
FROM rust:1.98-slim-bookworm

ARG STELLAR_CLI_VERSION=30.0.1
ARG STELLAR_CLI_SHA256=48c70074020e09af0a3ebbd2bf62d53c9aec47935e49a112d3cd90fb4e37658f

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl libdbus-1-3 libudev1 \
  && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32v1-none

RUN curl -fsSL -o /tmp/stellar.tgz \
    "https://github.com/stellar/stellar-cli/releases/download/v${STELLAR_CLI_VERSION}/stellar-cli-${STELLAR_CLI_VERSION}-x86_64-unknown-linux-gnu.tar.gz" \
  && echo "${STELLAR_CLI_SHA256}  /tmp/stellar.tgz" | sha256sum -c - \
  && tar -xzf /tmp/stellar.tgz -C /usr/local/bin stellar \
  && rm /tmp/stellar.tgz

RUN useradd --create-home --uid 1000 builder
WORKDIR /build
COPY Cargo.toml ./
COPY warmup.rs src/lib.rs
COPY compile.sh /usr/local/bin/compile.sh
RUN chmod 0755 /usr/local/bin/compile.sh && chown -R builder:builder /build

USER builder
ENV STELLAR_NO_UPDATE_CHECK=1

# Compila dependencias por adelantado: builds rápidos y sin acceso a crates.io durante la ejecución.
RUN stellar contract build && cargo test

ENV CARGO_NET_OFFLINE=true
ENTRYPOINT ["/usr/local/bin/compile.sh"]
