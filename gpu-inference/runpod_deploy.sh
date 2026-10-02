#!/usr/bin/env bash
# ==============================================================================
# SupportIQ GPU Inference Service — RunPod Startup & Deployment Script
# ==============================================================================
set -euo pipefail

echo "=== [SupportIQ] Initializing Cloud GPU Inference Service on RunPod ==="

# 1. Environment & Port Configuration
export PORT="${PORT:-8001}"
export PYTHONUNBUFFERED=1

if [ -z "${SUPPORTIQ_INFERENCE_API_KEY:-}" ]; then
  echo "WARNING: SUPPORTIQ_INFERENCE_API_KEY is not set."
  echo "Generating an ephemeral random secret key for this session..."
  export SUPPORTIQ_INFERENCE_API_KEY=$(openssl rand -hex 24)
  echo ">> YOUR SUPPORTIQ_INFERENCE_API_KEY is: ${SUPPORTIQ_INFERENCE_API_KEY}"
  echo ">> Save this key and configure it in Render environment variables!"
fi

# 2. Verify NVIDIA GPU & CUDA
echo "--- Checking GPU Hardware ---"
if command -v nvidia-smi &> /dev/null; then
  nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
else
  echo "ERROR: nvidia-smi not detected. Please verify NVIDIA GPU attachment."
  exit 1
fi

# 3. Install / Verify Python Dependencies
echo "--- Installing / Verifying Python Requirements ---"
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# 4. Verify PyTorch CUDA & bitsandbytes
echo "--- Testing PyTorch CUDA & bitsandbytes ---"
python3 -c "
import torch, transformers, peft, bitsandbytes as bnb
print('PyTorch Version :', torch.__version__)
print('CUDA Available  :', torch.cuda.is_available())
if torch.cuda.is_available():
    print('GPU Device      :', torch.cuda.get_device_name(0))
    print('CUDA Version    :', torch.version.cuda)
print('Transformers    :', transformers.__version__)
print('PEFT            :', peft.__version__)
print('bitsandbytes    :', bnb.__version__)
"

# 5. Display RunPod Public Endpoint Guidance
if [ -n "${RUNPOD_POD_ID:-}" ]; then
  echo "=================================================================="
  echo " RUNPOD PUBLIC HTTPS PROXY ENDPOINT:"
  echo " https://${RUNPOD_POD_ID}-${PORT}.proxy.runpod.net"
  echo "=================================================================="
  echo "Configure Render with:"
  echo " SUPPORTIQ_INFERENCE_URL=https://${RUNPOD_POD_ID}-${PORT}.proxy.runpod.net"
  echo " SUPPORTIQ_INFERENCE_API_KEY=${SUPPORTIQ_INFERENCE_API_KEY}"
  echo "=================================================================="
fi

# 6. Start the Service
echo "--- Starting Uvicorn Model Server on port ${PORT} ---"
exec python3 -m uvicorn app:app --host 0.0.0.0 --port "${PORT}" --workers 1
