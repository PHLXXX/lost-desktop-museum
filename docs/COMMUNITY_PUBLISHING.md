# 社区投稿

档案工坊只有在正式 `.ldmcase` 成功导出后才启用“准备社区投稿”。六步面板重新检查包，收集本地发布者资料、社区标题/简介/标签/难度/时长/评级/提示/许可证/CHANGELOG/引擎范围/兼容模式，以及 1—5 张本地截图。

生成的 ZIP 只含 `submission/publisher.json`、`entry.json`、案件包、`CHANGELOG.md`、`screenshots/`、`checksums.json` 与 `SUBMISSION.md`，不含工程 UI 状态或玩家进度。作者手动 Fork 社区仓库、放置文件并创建 Pull Request；应用不会获取 Token、上传文件或代表作者创建 PR。自动技术校验通过后仍由维护者人工审核，`curated` 最终值不由作者决定。

CLI 使用：`npm run community:prepare -- --package ./case.ldmcase --publisher ./publisher.json --screenshots ./screenshots --output ./community-submission [--dry-run]`。干运行完成全部读取与校验但不写文件，也不会执行 git 或网络操作。
