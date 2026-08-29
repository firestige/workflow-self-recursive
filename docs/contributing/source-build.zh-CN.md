# Contributor 源码构建预览

[English](source-build.md) | 中文

此路径供需要从当前 checkout 构建 PostgreSQL、Evidence、Evolution 与 BI 的贡献者使用。它不会安装
或启动 DSH/Execution，也不能替代打包产品。

安装 Git、OpenSSL，以及 Docker Desktop 或含 Compose v2 的 Docker Engine，然后获取全部源码组件：

```sh
git clone --recurse-submodules https://github.com/firestige/workflow-self-recursive.git
cd workflow-self-recursive
```

已有 checkout 如果尚未初始化组件仓库：

```sh
git submodule update --init --recursive
```

启动源码构建的数据服务：

```sh
./deployment/start.sh
```

首次启动会下载基础镜像、构建 checkout、初始化 PostgreSQL 并等待服务健康。打开脚本打印的 BI
地址，默认是 <http://127.0.0.1:8080/evaluate>。

停止服务并保留 Evidence 数据：

```sh
docker compose -f deployment/compose.yaml stop
```

再次运行 `./deployment/start.sh` 即可恢复。源码拓扑、网络、生成的本地 secret 与维护者 smoke test
见[部署实现说明](../../deployment/README.md)。

当前 checkout 通过 Git submodule 连接 Workflow Package、Execution、Evidence、Evolution、共享
Contracts 与 UI 仓库。这些是源码 workstream，不是独立的产品安装步骤，也不代表产品包含六个系统。

Release 维护者使用 `deployment/published/build-bundle.py` 资格验证独立的 published-image service
bundle。该工具只消费已冻结的镜像坐标；它不是另一套源码预览启动器，也不会在 clean-machine
qualification 前成为最终用户 Release。
