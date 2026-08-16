---
title: "One Ollama Endpoint, Two Very Different Backends"
date: "2026-08-14"
draft: true
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
---

--------------------------------------------------
# Introduction

Nine namespaces in my cluster call a local language model. The SDR stack tags transcriptions, the politics dashboard summarizes feeds, the congressional trade tracker writes daily summaries, and several agents run against the service continuously. All of them were designed to use one hostname on port 11434.

That hostname fronts two active Ollama deployments: an RTX 5090 in a desktop tower that is powered off some of the time, and an NVIDIA GB10 Spark board with unified memory where GPU allocations count against the pod's memory limit. The repository contains a CPU-only deployment manifest, but the kustomization leaves it disabled under normal circumstances. The active fallback is the Spark deployment.

Getting one stable endpoint out of that mix took more effort than I expected. Most of the difficulty was memory accounting, node availability, and failure handling rather than routing.

--------------------------------------------------------
# The Router

The routing configuration is small. The relevant NGINX excerpt has a primary server, an arm64 backup, and per-request failover:

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

The failover behavior comes from two details.

`max_fails=0` disables NGINX's passive failure accounting for these upstream servers. With the defaults, one unsuccessful attempt within `fail_timeout` marks a server unavailable for that period. That behavior can work against a host that disappears intentionally: the primary can remain marked unavailable after it returns. Here, `proxy_next_upstream` lets each request advance to the next upstream after an `error`, `timeout`, `502`, `503`, or `504`. `proxy_next_upstream_tries 2` limits the request to two upstream attempts.

The `backup` keyword means that the Spark node receives traffic only when no primary server is available. This is priority failover, not load sharing. The 5090 is faster, and the Spark deployment exists to keep requests working during an outage. An application-level `500` is not included in the current `proxy_next_upstream` list, which means it does not trigger failover.

The router's ConfigMap is mounted through `subPath`. Kubernetes does not update a `subPath` mount after the ConfigMap changes, and NGINX does not reload its configuration automatically. Updating the router configuration therefore requires a pod restart; in this deployment, deleting the pod is the restart mechanism.

--------------------------------------------------------
# The Backend That Taught Me Something

The Spark uses unified memory shared by the CPU and integrated GPU. In this deployment, the GPU-backed allocations are charged to the pod's memory cgroup rather than to a separate VRAM budget. An 80Gi pod limit can therefore terminate the Ollama process even when a discrete-GPU mental model suggests that memory remains available.

The NVIDIA device-plugin configuration adds another constraint. It exposes four time-sliced `nvidia.com/gpu` replicas on the GPU nodes, including the Spark node. A pod requesting `nvidia.com/gpu: 1` receives shared access to the physical GPU; it does not receive an exclusive quarter of the VRAM or compute capacity. Time-slicing interleaves CUDA work, but it does not enforce memory isolation, and workloads can contend for the same device. This is part of why the 5090 remains primary: the Spark is an explicitly shared, unified-memory fallback, while the 5090 deployment is tuned for one Ollama request stream and one loaded model.

My first response to the OOMKills was to reduce concurrency by lowering `OLLAMA_NUM_PARALLEL`. That reduced the footprint, but it reduced throughput as well. The larger multiplier was the context window.

Ollama's memory requirement grows with the product of parallel requests and context length. The KV cache grows with the context length of each active sequence, and additional parallel sequences multiply that memory. Setting `OLLAMA_CONTEXT_LENGTH` to `16384`, rather than using the default, stopped the OOMKills in this workload while allowing `OLLAMA_NUM_PARALLEL=4` and `OLLAMA_MAX_LOADED_MODELS=3` within the observed 80Gi limit.

When an inference pod OOMKills, inspect context length and the number of parallel sequences together. Reducing concurrency is not the only way to reduce memory use.

--------------------------------------------------------
# The Backend That Is Sometimes Off

The 5090 lives in a desktop that is not always powered on. That makes its Kubernetes node transient.

Any pod pinned to that node needs appropriate tolerations for both `node.kubernetes.io/not-ready:NoExecute` and `node.kubernetes.io/unreachable:NoExecute`. Without a matching toleration, the Taint Manager can evict the pod when the node receives a `NoExecute` taint. My deployment tolerates each taint for 30 seconds. That window delays eviction; it does not keep the pod running indefinitely. After eviction, a pod pinned to the absent node remains Pending until the node becomes schedulable again.

The node also uses NetworkManager rather than the netplan-managed configuration used elsewhere in the fleet. I saw a memorable `ImagePullBackOff` with `lookup ... 127.0.0.53 timeout` when that node pointed at its stub resolver instead of the LAN resolvers. The fix was to set DNS through `nmcli` and disable automatic DNS from DHCP.

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

Priority affects scheduling and preemption; it does not guarantee that a pod will run when no suitable node exists. A fallback should remain lower priority than the backend it supports. Under resource pressure, Kubernetes can preempt the lower-priority fallback before it preempts the primary GPU workload. Equal priorities remove that ordering and can let the fallback consume capacity needed by the primary.

--------------------------------------------------------
# Observability

An exporter polls both Ollama services at `/api/version`, `/api/ps`, and `/api/tags`, then exposes Prometheus metrics with an `instance` label. The Grafana dashboard uses that label to show the health, loaded models, model inventory, queries sent to Ollama, and API latency of `ollama` and `ollama-5090 separately.

The panel I read first shows which backend is healthy. Both "the assistant is slow" and "the assistant is wrong" can occur when the 5090 is offline and requests fall through to the arm64 backend. That panel answers the first diagnostic question faster than latency and token-throughput charts.

Provisioned Grafana dashboards have another failure mode. A dashboard that refers to a `${DS}` datasource variable while the variable's `current` value is empty can render `No data` even when Prometheus is receiving metrics. The current dashboard avoids that problem by using the Prometheus datasource UID directly and defining no datasource variable.

--------------------------------------------------------
# Security Notes

**The router has no application-level authentication.** NetworkPolicy provides part of the access boundary, but policies in a namespace are additive. The consumer policy allows the listed namespaces to reach the router on port 11434. Other policies in this namespace allow traffic from pods in `ai-stack`, `kube-system`, `authentik`, and `uptime-kuma`. A namespace outside the consumer list is not automatically denied if another policy grants access.

**Prompt content crosses namespace boundaries.** Several consumers send scraped articles or radio transcriptions to the shared endpoint. The router's access log includes `body=$request_body`, which writes request bodies to NGINX logs. Treat those logs as sensitive, and review retention and access controls accordingly.

The model-serving endpoint does not execute tools by itself. Any tool access or side effect belongs to the calling application, which means each consumer needs its own review of prompt handling, model output, and downstream actions.

**A shared endpoint is a shared failure domain.** If both backends are unavailable, all nine listed consumers can degrade at once. The politics dashboard shows a generic `AI Error` that does not identify the cause, which is something I need to fix soon. Each consumer should expose an error that distinguishes backend unavailability from an application or model error.

--------------------------------------------------------
# Wrapping Up

The routing decision is a small NGINX configuration. The operational work is in the backends: a memory model that does not behave like discrete VRAM, a node that is frequently absent by design, and a fallback that must remain subordinate to be useful.

If you are running inference across mixed hardware, you will likely spend more design time on memory limits, node lifecycle, and failure semantics than on your proxy configuration.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert
