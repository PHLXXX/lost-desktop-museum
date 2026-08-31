export function TrustBadge({ curated }: { curated: boolean }) {
  return <span className="community-trust"><span title="包格式、路径、资源、引用与哈希通过自动校验">✓ 自动校验通过</span><span className={curated ? 'curated' : 'unreviewed'}>{curated ? '◇ 人工精选' : '○ 未人工审阅'}</span></span>
}
