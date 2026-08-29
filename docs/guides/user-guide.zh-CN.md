# 用户指南

[English](user-guide.md) | 中文

本指南说明 Workflow Self Recursive 本地数据服务的配置、日常操作和 BI 使用方式。若尚未启动，请先完成[快速开始](quickstart.zh-CN.md)。

## 部署边界

`deployment/compose.yaml` 从当前 checkout 构建并运行 PostgreSQL、Evidence、Evolution 和 BI。它不会启动 DSH 或 Execution。BI 只监听 `127.0.0.1`，当前可信本地预览不提供应用登录，也不得直接暴露到局域网或公网。

启动命令：

```sh
./deployment/start.sh
```

更换 BI 端口：

```sh
WSR_BI_PORT=18080 ./deployment/start.sh
```

## 内部数据库口令

启动器会在 Git 忽略的 `deployment/.local/` 中自动生成 PostgreSQL admin、runtime 和 backup 角色口令。它们只用于 Compose 内部数据库角色隔离，不是用户账号、BI 密码或 API 鉴权配置；用户不需要创建、复制或轮换它们。

重复启动会保留已有值，使现有 PostgreSQL volume 能够继续访问。删除 `deployment/.local/` 但保留数据库 volume 会导致口令不匹配，因此不要手工管理该目录。

## Workflow source

默认配置包含官方 `firestige/wsr-workflow-package` source。只有当 Delivery 可能引用 fork 或其他 Workflow 仓库时，才需要在 [`deployment/evolution.config.json`](../../deployment/evolution.config.json) 中按优先顺序补充 `workflow_sources`。Evolution 依据 Package/Snapshot digest 精确匹配，第一个匹配源生效；仓库名称或版本字符串本身不构成匹配依据。

也可以用其他配置文件启动：

```sh
WSR_EVOLUTION_CONFIG_FILE=/absolute/path/evolution.json ./deployment/start.sh
```

## 使用 BI

打开 `/evaluate` 后：

1. 按 display name 查找并选择 Task；没有名称时界面回退显示 `task_id`。
2. Single 对一侧 Task 集合求值；Compare 分别选择 left/right Task 集合。
3. Metric Result 由 Evolution 计算；BI 不自行计算 metric。
4. 从结果进入 receipt/passport，查看本次解析使用的 Evidence 与 Workflow 上下文。
5. Fact 和 Trace drill-down 直接查询 Evidence；返回时保留原 selection。

URL 保存 selection identity，可用于刷新、收藏和返回。布局、主题等便利偏好保存在浏览器本地。

## 运行 DeepSeek Harness（DSH）与 Execution

DSH/Execution 的安装和执行方式见 [DSH Execution 快速开始](dsh-execution-quickstart.zh-CN.md)。当前数据服务与宿主机 Execution 之间的官方 Observation 部署接线仍在 [#104](https://github.com/firestige/workflow-self-recursive/issues/104) 跟踪；在该任务完成前，本指南不提供未经正式验收的端到端连接命令。

因此，当前部署不会自动启动 Execution。Evidence 中没有 Task 时，BI 只能显示空状态；真实数据必须由单独运行的 Execution 通过既有 Observation 接口上报。

## 日常操作

查看状态：

```sh
docker compose -f deployment/compose.yaml ps
```

跟随日志：

```sh
docker compose -f deployment/compose.yaml logs -f
```

停止并保留数据：

```sh
docker compose -f deployment/compose.yaml stop
```

移除容器和网络但保留 named volume：

```sh
docker compose -f deployment/compose.yaml down
```

永久删除全部 Evidence 数据：

```sh
docker compose -f deployment/compose.yaml down --volumes
```

最后一条命令不可从本项目恢复；只有明确需要重置本地数据库时才执行。

## 故障诊断

- 启动器报告找不到 Docker 或 Compose：安装 Docker Desktop/Engine，并确认 Docker daemon 已启动。
- `8080` 已被占用：通过 `WSR_BI_PORT` 选择其他 loopback 端口。
- BI 页面可打开但某个 panel 报错：查看 `docker compose -f deployment/compose.yaml logs -f`；上游故障按请求或 panel 隔离，不代表静态 BI 已停止。
- Task 列表为空：先确认 Execution 已经上报 Observation；空列表本身不是 Evidence 健康检查失败。

## 交付验证

维护者可运行隔离 smoke：

```sh
./deployment/smoke.sh
```

它会临时构建服务，验证网络、路由、健康检查和上游降级，然后自动清理。它不会生成真实 Delivery 数据，也不替代 Execution → Evidence 端到端验收。

Compose 网络、服务权限和反代边界见[部署实现说明](../../deployment/README.md)。
