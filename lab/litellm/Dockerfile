FROM ghcr.io/berriai/litellm:main-latest
COPY config.yaml /app/config.yaml
ENV LITELLM_MASTER_KEY=sk-1234
# CORS wide open for lab fingerprinting
ENV LITELLM_LOG=INFO
EXPOSE 4000
CMD ["--config", "/app/config.yaml", "--host", "0.0.0.0", "--port", "4000"]
