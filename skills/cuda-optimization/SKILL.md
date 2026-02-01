---
name: cuda-optimization
description: Inference-first CUDA optimization for transformer/LLM runtimes (Atlas, vLLM, ExLlama, Ollama-like). Diagnose bottlenecks with Nsight Systems/Compute, then apply targeted fixes for attention/KV cache, GEMM/tensor cores, quant paths, kernel fusion, launch overhead, and VRAM/fragmentation.
version: 2.0.0
---

# CUDA Optimization Skill (LLM Inference)

This skill is designed to **fix correctness** and **maximize performance** in real LLM inference engines:
- attention + KV cache (prefill and decode)
- quantized weight paths (INT4/INT8 weight-only, mixed precision)
- GEMM-heavy blocks (QKV/MLP)
- orchestration overhead (kernel launch, synchronization, allocator churn)

Primary metrics:
- **decode latency** (ms/token) at batch=1..N
- **prefill throughput** (tokens/s) for long prompts
- **VRAM footprint** (KV + weights + workspace) and fragmentation
- **numerical stability** (no NaNs, no drift across steps)

---

## When I activate

Activate when you:
- touch CUDA C/C++ kernels (`.cu/.cuh`), PTX, or CUDA extensions
- mention **attention**, **KV cache**, **FlashAttention**, **paged attention**, **softmax**, **RoPE**, **RMSNorm/LayerNorm**
- mention **cuBLASLt**, **CUTLASS**, **Triton**, **tensor cores**, **INT4/INT8**, **dequant**, **group size**
- report "GPU slow", "underutilized", "many tiny kernels", "allocations every token", "D2H/H2D transfers", or "wrong logits"
- compare to engines like vLLM/ExLlama/llama.cpp/Ollama

---

## What I need (minimum context)

If available, provide:
1) GPU model + driver + CUDA runtime versions
2) shapes: (batch, seq/prompt length, n_heads, head_dim, hidden, dtype)
3) KV cache: layout, dtype, page/block size (if paged), where it lives (GPU vs host)
4) quant scheme: Q4_K/Q6_K/Q8_0/etc, group size, scale/zero layout
5) one profiling artifact:
   - **Nsight Systems** timeline (best for launch/sync/overlap)
   - **Nsight Compute** kernel report (best for memory/occupancy/tensor cores)
   - or a "top 10 kernels by time" dump

If you can't profile, I'll still help, but confidence drops.

---

## The optimization loop I follow

### 0) Establish baseline + reproducibility
- fixed prompt + seed + config
- record: tokens/s, ms/token (median + p95), peak VRAM
- capture "top kernels by time" (even if crude)

### 1) Classify bottleneck (so we don't optimize the wrong thing)
- **Bandwidth-bound**: KV reads, decode attention, unfused elementwise
- **Compute/tensor-core-bound**: GEMMs, prefill attention math
- **Launch/CPU-bound**: many tiny kernels, sync points, idle gaps
- **Occupancy-limited**: registers/shared memory limit blocks/SM
- **Layout/algorithm-limited**: poor KV layout, gather-heavy paging, extra intermediates

### 2) Profile in the right order
- **Nsight Systems** → find idle gaps, syncs, launch overhead, memcpy overlap
- **Nsight Compute** → find memory coalescing, L2 hit rate, occupancy, tensor-core usage

### 3) Apply the highest-leverage fixes first
Each suggestion includes:
- **why it works** (what limiter it attacks)
- **expected impact** (low/med/high)
- **failure modes** (correctness/numerics/corner shapes)
- **a test plan** (correctness + perf)

### 4) Verify + keep receipts
- correctness tests on small + edge shapes
- performance on representative workloads
- regression guard: store baseline JSON and compare

---

# LLM inference playbook (what actually moves the needle)

## A) GPU state, caching, and allocator churn (often the hidden killer)
Red flags:
- "state init" logs repeated per token
- allocations inside the decode loop
- weight upload/prepare called repeatedly
- frequent `cudaMalloc/cudaFree`

Fixes:
- persistent **per-model** GPU state (never global singleton across models)
- persistent weight cache (GPU-resident weights + metadata)
- persistent activation/KV arenas (reset pointers, don't reallocate)
- use CUDA async allocator / memory pools where possible

Why it works:
- removes CPU overhead and device synchronization
- avoids VRAM fragmentation and repeated uploads

---

## B) Attention + KV cache (decode is usually bandwidth-bound)
Decode often bottlenecks on **reading K/V** efficiently.

High-impact levers:
- keep KV **on GPU** (no D2H in attention loop)
- choose KV layout for **coalesced vector loads** over head_dim
- paged KV: choose page/block sizes to improve L2 locality; reduce gathers
- vectorize loads (16B/32B) + handle tails
- avoid materializing score matrices to global memory

Failure modes:
- page addressing off-by-one
- misalignment causing extra transactions or wrong reads
- numerically unstable softmax (missing max subtraction)

---

## C) Prefill attention (FlashAttention mental model)
Goal: never write the attention matrix to global memory.

Good kernels:
- tile Q and K, compute QK^T on-chip, stable softmax, multiply V, write once

Why it works:
- replaces massive HBM traffic with on-chip reuse

---

## D) GEMM stack (QKV + MLP) and tensor cores
Most FLOPs live in GEMMs.

High-impact levers:
- prefer **cuBLASLt** for better alg selection + fused epilogues (bias/activation)
- ensure layouts/dtypes that enable tensor core paths
- avoid hidden reformat kernels
- fuse epilogues (don't write+read activations unnecessarily)

Failure modes:
- losing tensor core usage due to alignment/layout
- slowdowns from unexpected transposes/reformats

---

## E) Quantized weight paths (ExLlama-style)
Rules of thumb:
- never materialize dequantized weights to global memory
- fuse dequant + matmul
- lay out scales/zeros so reads are coalesced

Failure modes:
- wrong scale indexing (catastrophic but subtle)
- rounding/clamp mismatches
- integer math overhead if not fused

---

## F) Launch overhead (the "GPU is idle" problem)
If Nsight Systems shows many tiny kernels and idle gaps:
- fuse elementwise chains (norm + bias + act + residual + cast)
- remove unnecessary sync points
- use **CUDA Graphs** for stable decode loops (capture once, replay many)

Failure modes:
- graph capture invalidated by changing shapes/addresses
- accidental sync via pageable memcpys or alloc/free

---

# Correctness + debugging toolkit (non-negotiable)

When output is wrong or unstable:
- `compute-sanitizer --tool memcheck` (OOB/illegal)
- `compute-sanitizer --tool racecheck` (races)
- `compute-sanitizer --tool initcheck` (uninitialized)
- compile debug builds with `-lineinfo` (keep perf builds separate)
- add NaN/Inf checks at boundaries of major ops

Numerical validation:
- compare against FP32 reference on small shapes
- dtype-appropriate tolerances (FP16/BF16/INT8)
- softmax invariants (sum≈1, stable with large logits)

---

# Output format (what I will produce)

1) **Bottleneck statement** (what's limiting you)
2) **Evidence** (profiling signals or code-level reasons)
3) **Top fixes (ranked)** with:
   - impact estimate
   - why it works
   - failure modes
   - how to test
4) **Concrete patch plan** (files/functions, minimal steps)
5) **Verification checklist** (correctness + perf + regression guard)
