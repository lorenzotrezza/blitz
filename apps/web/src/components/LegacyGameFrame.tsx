type LegacyGameFrameProps = {
  src: string;
  title: string;
};

export function LegacyGameFrame({ src, title }: LegacyGameFrameProps) {
  return (
    <iframe
      className="legacy-frame"
      src={src}
      title={title}
    />
  );
}
