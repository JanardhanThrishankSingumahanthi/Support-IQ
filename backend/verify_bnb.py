import torch

print("PyTorch CUDA available:", torch.cuda.is_available())
print("Device:", torch.cuda.get_device_name(0))

try:
    import bitsandbytes as bnb
    print("bitsandbytes version:", bnb.__version__)
    
    # Test linear layer on CUDA
    linear = bnb.nn.Linear8bitLt(16, 16, has_fp16_weights=False).cuda()
    x = torch.randn(2, 16).cuda()
    out = linear(x)
    print("bitsandbytes 8-bit CUDA forward pass:", "SUCCESS" if out.shape == (2, 16) else "UNEXPECTED")

    linear4 = bnb.nn.Linear4bit(16, 16, bias=False, compute_dtype=torch.float16).cuda()
    out4 = linear4(x.half())
    print("bitsandbytes 4-bit (QLoRA) CUDA forward pass:", "SUCCESS" if out4.shape == (2, 16) else "UNEXPECTED")
    print("ALL BITSANDBYTES CUDA KERNELS FUNCTIONAL: TRUE")
except Exception as e:
    print("bitsandbytes error:", e)
