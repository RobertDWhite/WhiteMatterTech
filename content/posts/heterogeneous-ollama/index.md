---
title: "One Ollama Endpoint, Two Very Different Backends"
date: "2026-08-14"
categories:
  - "ai"
  - "kubernetes"
  - "homelab"
  - "tutorials"
tags:
  - "ai"
  - "ollama"
  - "kubernetes"
  - "gpu"
  - "nvidia"
  - "arm64"
  - "nginx"
  - "prometheus"
  - "self-hosted"
aliases:
  - /posts/heterogeneous-ollama/heterogeneous-ollama
  - /2026/heterogeneous-ollama
cover:
  image: "cover.png"
---

--------------------------------------------------
# Introduction

Nine namespaces in my cluster depend upon a local language model. The SDR research stack tags transcriptions, the politics dashboard summarizes feeds, the congressional-trade tracker prepares daily summaries, and several agents submit work to the service continuously. Despite their differing purposes and operational rhythms, each consumer was designed to address one stable hostname on port 11434.

That hostname fronts two active Ollama deployments: an RTX 5090 in a desktop tower that is intentionally powered down at intervals, and an NVIDIA GB10 Spark board whose unified-memory architecture causes GPU-backed allocations to count against the pod's memory limit. The repository contains a CPU-only deployment manifest, but the active Kustomization excludes it under ordinary circumstances. The Spark deployment is therefore the operational fallback.

Establishing one dependable endpoint across that mixture required rather more effort than the compact routing configuration might suggest. The substantive difficulty lay in memory accounting, node availability, and failure handling rather than in the proxy directive itself.

--------------------------------------------------------
# The Router

The routing configuration is concise, but it embodies several important operational decisions. The relevant NGINX excerpt establishes a primary server, an arm64 backup, and per-request failover:

```nginx
upstream ollama_backends {
  server ollama-5090.ai-stack.svc.cluster.local:11434 max_fails=0;
  server ollama.ai-stack.svc.cluster.local:11434 backup max_fails=0;
}

server {
  listen 11434;

  location / {
    proxy_pass         http://ollama_backends;
    proxy_next_upstream error timeout http_502 http_503 http_504;
    proxy_next_upstream_tries 2;
  }
}
```

The resulting failover behavior rests upon two details that are easy to overlook in a smaller configuration.

`max_fails=0` disables NGINX's passive failure accounting for the two upstream servers. With the defaults, an unsuccessful attempt within `fail_timeout` can mark a server unavailable for that interval, a behavior that is unhelpful when the primary host disappears intentionally and subsequently returns. Here, `proxy_next_upstream` permits an individual request to advance to the next upstream after an `error`, `timeout`, `502`, `503`, or `504`; `proxy_next_upstream_tries 2` confines that attempt to the two configured backends.

The `backup` keyword means that the Spark deployment receives traffic only when no primary server is available. This is priority failover rather than load sharing: the 5090 is the faster backend, while the Spark exists to preserve service during an outage or an intentional power-down. An application-level `500` does not appear in the current `proxy_next_upstream` list and consequently does not trigger failover.

The router's ConfigMap is mounted through `subPath`. Kubernetes does not update a `subPath` mount after the ConfigMap changes, and NGINX does not reload its configuration automatically. Updating the router configuration therefore requires a pod restart; in this deployment, deleting the router pod supplies that restart mechanism.

--------------------------------------------------------
# The Spark's Memory Model

The Spark uses unified memory shared by the CPU and integrated GPU. In this deployment, GPU-backed allocations are charged to the pod's memory cgroup rather than to a separate VRAM budget. An 80Gi pod limit can therefore terminate the Ollama process even when a discrete-GPU mental model suggests that additional graphics memory remains available.

The NVIDIA device-plugin configuration adds a further constraint: each GPU node advertises four time-sliced `nvidia.com/gpu` replicas. A pod requesting `nvidia.com/gpu: 1` receives shared access to the underlying physical GPU, not an exclusive quarter of VRAM or compute capacity. Time-slicing multiplexes CUDA workloads, but it does not impose memory isolation, and workloads can contend for the same device. The 5090 remains primary because it is faster and its Ollama deployment constrains itself to one parallel request and one loaded model; the Spark remains the fallback because its unified memory and higher configured service concurrency make resource contention materially more consequential.

My initial response to the OOMKills was to reduce concurrency by lowering `OLLAMA_NUM_PARALLEL`. That adjustment reduced the memory footprint, but it reduced throughput as well. The more consequential multiplier proved to be the context window.

Ollama's memory requirement grows with the product of parallel requests and context length. The key-value cache grows with the context length of each active sequence, and additional parallel sequences multiply that allocation. Setting `OLLAMA_CONTEXT_LENGTH` to `16384`, rather than retaining the default, stopped the OOMKills in this workload while allowing `OLLAMA_NUM_PARALLEL=4` and `OLLAMA_MAX_LOADED_MODELS=3` within the observed 80Gi limit.

When an inference pod OOMKills, inspect the context length and the number of parallel sequences together. Reducing concurrency is only one means of reducing memory consumption; a deliberate context limit can preserve considerably more useful throughput.

--------------------------------------------------------
# The Intermittent Primary

The 5090 resides in a desktop whose power state is intentionally intermittent. That decision makes its Kubernetes node intentionally transient, which in turn affects the scheduling and eviction behavior of every pod assigned exclusively to it.

Any pod pinned to that node requires appropriate tolerations for both `node.kubernetes.io/not-ready:NoExecute` and `node.kubernetes.io/unreachable:NoExecute`. Without a matching toleration, the Taint Manager can evict the pod when the node receives a `NoExecute` taint. My deployment tolerates each taint for 30 seconds, a period that delays eviction without keeping the pod running indefinitely. After eviction, a pod pinned to the absent node remains Pending until the node becomes schedulable again.

The node also uses NetworkManager rather than the netplan-managed configuration used elsewhere in the fleet. I encountered a memorable `ImagePullBackOff` with `lookup ... 127.0.0.53 timeout` when the node pointed at its local stub resolver rather than the LAN resolvers. The correction was to set DNS through `nmcli` and disable the automatic DNS configuration supplied by DHCP.

--------------------------------------------------------
# Priority Classes

The manifests define separate priority classes for GPU workloads and the optional CPU fallback:

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 500
```

The active GPU deployments use `high-priority`. The CPU-only deployment manifest uses `low-priority`, but that deployment is commented out in the current kustomization. If enabled, it would provide a lower-priority fallback.

Priority affects scheduling and preemption, but it does not guarantee that a pod will run when no suitable node exists. A fallback should remain lower priority than the backend it supports. Under resource pressure, Kubernetes can preempt the lower-priority fallback before it preempts the primary GPU workload; equal priorities remove that ordering and can allow the fallback to consume capacity required by the primary.

--------------------------------------------------------
# Observability

An exporter polls both Ollama services at `/api/version`, `/api/ps`, and `/api/tags`, then exposes Prometheus metrics with an `instance` label. The Grafana dashboard uses that label to show the health, loaded models, model inventory, queries sent to Ollama, and API latency of `ollama` and `ollama-5090` separately.

The first panel I consult identifies the healthy backend. Reports that an assistant is slow or producing less satisfactory results can both arise when the 5090 is unavailable and requests fall through to the arm64 backend. That panel answers the initial diagnostic question more directly than latency or token-throughput charts.

Provisioned Grafana dashboards have another, less visible failure mode. A dashboard that refers to a `${DS}` datasource variable while the variable's `current` value is empty can render `No data` even when Prometheus is receiving metrics. The current dashboard avoids that condition by using the Prometheus datasource UID directly and defining no datasource variable.

--------------------------------------------------------
# Security Notes

**The router has no application-level authentication.** NetworkPolicy provides part of the access boundary, but policies in a namespace are additive. The consumer policy permits the listed namespaces to reach the router on port 11434; other policies in this namespace permit traffic from pods in `ai-stack`, `kube-system`, `authentik`, and `uptime-kuma`. A namespace outside the consumer list is not automatically denied when another applicable policy grants access.

**Prompt content crosses namespace boundaries.** Several consumers send scraped articles or radio transcriptions to the shared endpoint. The router's access log includes `body=$request_body`, which writes request bodies to NGINX logs. Treat those logs as sensitive material, and review their retention and access controls accordingly.

The model-serving endpoint does not execute tools by itself. Any tool access or side effect belongs to the calling application, which means that each consumer requires its own review of prompt handling, model output, and downstream actions.

**A shared endpoint is a shared failure domain.** If both backends are unavailable, all nine listed consumer namespaces can degrade at once. The politics dashboard currently presents a generic `AI Error` that does not identify the cause, an ambiguity that remains on my remediation list. Each consumer should expose an error that distinguishes backend unavailability from an application or model error.

--------------------------------------------------------
# Wrapping Up

The routing decision is a small NGINX configuration. The operational work resides in the backends: a memory model that does not behave like discrete VRAM, a node that is deliberately absent at intervals, and a fallback that must remain subordinate in order to remain useful.

When running inference across mixed hardware, expect to spend more design time on memory limits, node lifecycle, and failure semantics than on the proxy configuration itself.

Questions or corrections are welcome. Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
