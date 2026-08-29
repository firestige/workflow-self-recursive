# 快速开始

[English](quickstart.md) | 中文

本指南帮助你在一台可信的个人电脑上启动 Workflow Self Recursive 的本地数据服务并打开 BI。
当前部署包括 PostgreSQL、Evidence、Evolution 和 BI；本脚本不会启动 DeepSeek Harness（DSH）或 Execution，它们必须另行运行。

## 1. 准备环境

安装并启动：

- Git；
- OpenSSL；
- Docker Desktop，或含 Compose v2 的 Docker Engine。

获取完整源码：

```sh
git clone --recurse-submodules https://github.com/firestige/workflow-self-recursive.git
cd workflow-self-recursive
```

已有 checkout 如果缺少组件仓库，执行：

```sh
git submodule update --init --recursive
```

## 2. 一条命令启动

```sh
./deployment/start.sh
```

首次启动会下载基础镜像、构建当前源码并初始化本地数据库，因此通常比后续启动慢。脚本等待服务健康后会打印访问地址。

## 3. 打开 BI

打开启动器打印的地址，默认是 <http://127.0.0.1:8080/evaluate>。

当前 Evidence 没有 Task 时，页面会显示空选择状态。这表示服务已经就绪但尚未收到 Execution 上报的数据，并非启动失败。

## 4. 停止

停止服务并保留 Evidence 数据：

```sh
docker compose -f deployment/compose.yaml stop
```

再次运行 `./deployment/start.sh` 即可恢复。

配置 Workflow source、运行 DSH/Execution、使用 BI、查看日志或清空数据，请继续阅读[用户指南](user-guide.zh-CN.md)。维护者可查看[部署实现说明](../../deployment/README.md)。
