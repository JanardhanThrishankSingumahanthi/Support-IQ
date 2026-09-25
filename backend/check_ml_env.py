import sys

print(f"Python: {sys.version}")

try:
    import torch
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Device Name: {torch.cuda.get_device_name(0)}")
        print(f"Device Count: {torch.cuda.device_count()}")
        print(f"CUDA Version (torch): {torch.version.cuda}")
        props = torch.cuda.get_device_properties(0)
        print(f"Total VRAM: {props.total_memory / (1024**3):.2f} GB")
except ImportError:
    print("PyTorch: NOT installed")

packages = ["transformers", "peft", "bitsandbytes", "accelerate", "datasets", "huggingface_hub"]
for pkg in packages:
    try:
        mod = __import__(pkg)
        ver = getattr(mod, "__version__", "installed")
        print(f"{pkg}: {ver}")
    except ImportError:
        print(f"{pkg}: NOT installed")
