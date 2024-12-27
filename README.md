# cloud-native-sec-vuln：云原生安全漏洞
该仓库由 [collect-cloud-native-sec-vuln](https://github.com/miao2sec/collect-cloud-native-sec-vuln) 通过 GitHub Action 每 6 小时进行更新。该仓库的数据不仅方便安全研究人员对云原生安全漏洞进行学习研究，还可以为集群组件漏洞扫描引擎提供数据。

## 组件范围

漏洞按照披露组件名称、披露的年份和月份，以 JSON 的形式保存在文件中。文件名为 CVE 编号，方便大家查找，若 CVE 编号为空，则使用 GHSA （GitHub Security Advisory，Github 安全公告）编号。
### 运行时组件

1. Docker (Moby)
2. runc
3. containerd
4. CRI-O
5. gVisor
6. inclavare-containers
7. iSulad
8. Kata Containers
9. Krustlet
10. Kuasar
11. Lima
12. LXC
13. rkt
14. Singularity
15. SmartOS
16. Stratovirt
17. Sysbox
18. Virtual Kubelet
19. WasmEdge
20. Youki
21. Podman

### 网络组件

1. Cilium

### 容器镜像构建

1. Kaniko
2. BuildKit
3. Buildah
4. Bazel
5. img
6. orca-build

### 服务网格

1. istio

### 容器编排

1. kubernetes

### 容器管理平台

1. rancher

### 协调与服务发现

1. coredns
2. etcd
3. zookeeper
4. kubebrain
5. nacos
6. k8gb
7. eureka
8. Xline
