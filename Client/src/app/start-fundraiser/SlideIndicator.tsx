'use client';

import { useEffect, useRef } from 'react';

const steps = [1, 2, 3, 4, 5, 6];

export default function SlideIndicator({ slideNo }: { slideNo: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !activeRef.current) return;

    const container = containerRef.current;
    const active = activeRef.current;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const scrollLeft =
      activeRect.left -
      containerRect.left -
      containerRect.width / 2 +
      activeRect.width / 2;

    container.scrollBy({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }, [slideNo]);

  return (
    <div className="indicator" ref={containerRef}>
      {steps.map((step, index) => {
        const isActive = slideNo === step;
        const isCompleted = slideNo > step;

        return (
          <div className="indicator-step" key={step}>
            <div
              ref={isActive ? activeRef : null}
              className={`indicator-circle ${
                isActive ? 'active' : isCompleted ? 'completed' : ''
              }`}
            >
              {isCompleted ? '✓' : step}
            </div>

            {index < steps.length - 1 && (
              <div
                className={`indicator-line ${
                  isCompleted ? 'completed' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
