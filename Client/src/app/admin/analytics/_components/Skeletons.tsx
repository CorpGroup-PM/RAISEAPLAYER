export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`aaSkel ${className}`} />;
}

export function PanelSkeleton() {
  return (
    <div className="aaCard aaPanel">
      <div className="aaPanelHeader">
        <div>
          <div className="aaSkel aaSkelLine" style={{ width: 160 }} />
          <div
            className="aaSkel aaSkelLine"
            style={{ width: 220, marginTop: 8 }}
          />
        </div>
        <div className="aaSkel aaSkelPill" />
      </div>

      <div className="aaDivider" />

      <div className="aaSkel aaSkelBlock" />
      <div className="aaSkel aaSkelBlock" style={{ marginTop: 12 }} />
      <div className="aaSkel aaSkelBlock" style={{ marginTop: 12 }} />
    </div>
  );
}
