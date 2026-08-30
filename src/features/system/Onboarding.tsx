import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'

const steps = [
  { title: '像使用桌面一样调查', body: '单击图标选择，双击或按 Enter 打开。窗口可以移动、缩放、最小化和最大化。' },
  { title: '查看具体记录', body: '打开邮件、讯息、照片元数据与日志条目。只有检查具体痕迹时，线索才会写入案件记录。' },
  { title: '把矛盾连起来', body: '任务栏显示已记录数量。随时打开证据板，标记关键证据、建立关系并提交最终推理。' },
]

export function Onboarding() {
  const complete = useGameStore((state) => state.onboardingComplete)
  const setComplete = useGameStore((state) => state.setOnboardingComplete)
  const [step, setStep] = useState(0)
  if (complete) return null
  const current = steps[step] ?? steps[0]!
  return <div className="modal-backdrop onboarding-layer" role="dialog" aria-modal="true" aria-label="调查操作介绍"><section className="onboarding-card"><div className="onboarding-progress">{steps.map((_, index) => <i key={index} data-current={index === step} />)}</div><span>{step + 1} / {steps.length}</span><h2>{current.title}</h2><p>{current.body}</p><div><button onClick={() => setComplete(true)}>跳过介绍</button><button className="primary-button" autoFocus onClick={() => step < steps.length - 1 ? setStep(step + 1) : setComplete(true)}>{step < steps.length - 1 ? '下一步' : '开始调查'}</button></div></section></div>
}
