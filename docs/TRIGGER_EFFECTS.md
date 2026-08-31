# 触发器与安全效果

触发器由稳定 ID、一次性标记、声明式条件和三个效果列表组成：正常效果、`prefers-reduced-motion` 替代效果、安全模式替代效果。

## 白名单效果

- `NOTIFICATION`、`SYSTEM_MESSAGE`：显示本地文本。
- `UNLOCK_ITEM`、`SHOW_ITEM`：改变案件条目的可见/解锁状态。
- `OPEN_APP`、`FOCUS_APP`：打开或聚焦已注册应用。
- `SET_BADGE`、`SET_FLAG`：写入案件范围的声明式状态。
- `PLAY_SOUND`：播放案件包内的白名单音频，并限制持续时间。
- `WALLPAPER_STATE`：短暂切换已声明的桌面状态。
- `CLOCK_OFFSET`：在允许动态异常时短暂偏移虚构系统时间。

运行时不会从案件数据执行 JavaScript、HTML、CSS、Shell、网络请求或任意存储写入。效果引用的条目和应用必须存在；未知效果无法通过 Zod Schema。

安全模式必须使用 `safeModeEffects`；减弱动画环境使用 `reducedMotionEffects`。为空时表示跳过该视觉/声音效果，而不是回退执行高动态版本。
