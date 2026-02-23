'use client';

type Props = {
  title: string;
  userStory?: string;
  children: React.ReactNode;
};

export default function SlideLayout({
  title,
  userStory,
  children,
}: Props) {
  return (
    <div>
      <h2 className="wizard-title">{title}</h2>

      {userStory && (
        <p className="wizard-user-story">
          {userStory}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}
