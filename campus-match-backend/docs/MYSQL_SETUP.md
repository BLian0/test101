# MySQL Setup

当前后端默认仍然使用 SQLite 文件：

- `C:\Users\ASUS\Documents\Playground\campus-match-backend\data\campus-match.sqlite`

这一套 MySQL 文件的目的，是把生产态需要的建库、建表、种子数据先准备好，后续再把业务服务正式切到 MySQL 连接层。

## 1. 复制环境变量

在后端目录下复制：

```powershell
cd C:\Users\ASUS\Documents\Playground\campus-match-backend
Copy-Item .env.example .env
```

如果你只是继续用当前 SQLite 开发态，保留：

```env
DB_DRIVER=sqlite
```

如果后面准备切 MySQL，改成：

```env
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=campus_match
DB_USER=campus_match
DB_PASSWORD=campus_match_dev
```

## 2. 启动本地 MySQL

需要本机已安装 Docker Desktop。
还需要确保 Docker Desktop 已经实际启动，`dockerDesktopLinuxEngine` 可用。

```powershell
cd C:\Users\ASUS\Documents\Playground\campus-match-backend
npm run db:mysql:up
```

这会启动：

- MySQL 8.4
- 数据库名：`campus_match`
- 用户名：`campus_match`
- 密码：`campus_match_dev`
- root 密码：`root`

## 3. 初始化文件位置

首次启动容器时会自动执行：

- [01-schema.sql](/C:/Users/ASUS/Documents/Playground/campus-match-backend/database/mysql/init/01-schema.sql)
- [02-seed.sql](/C:/Users/ASUS/Documents/Playground/campus-match-backend/database/mysql/init/02-seed.sql)

## 4. 查看运行状态

```powershell
cd C:\Users\ASUS\Documents\Playground\campus-match-backend
npm run db:mysql:logs
```

## 5. 检查 MySQL 连通性

```powershell
cd C:\Users\ASUS\Documents\Playground\campus-match-backend
npm run db:mysql:check
```

如果成功，会返回一段 `status: ok` 的 JSON。

## 6. 停止 MySQL

```powershell
cd C:\Users\ASUS\Documents\Playground\campus-match-backend
npm run db:mysql:down
```

## 7. 当前状态说明

现在代码层仍然是：

- 运行时业务逻辑使用 SQLite
- MySQL 结构和初始化脚本已经准备好
- `/api/v1/health` 会返回当前配置的数据库驱动和实际运行中的存储驱动

后续正式切换 MySQL 时，下一步应该做的是：

1. 抽离 `AppState` 接口
2. 新增 `MySqlAppStateService`
3. 通过 `DB_DRIVER` 在 Nest 里切换 provider
4. 把当前 SQLite SQL 读写逻辑迁到 MySQL 查询层
