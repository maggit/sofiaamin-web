const WORDS = ["Sofia", "Amin"];

export default function Home() {
  let i = 0;
  return (
    <main className="landing">
      <span className="blob blob-1" aria-hidden />
      <span className="blob blob-2" aria-hidden />
      <span className="blob blob-3" aria-hidden />
      <span className="blob blob-4" aria-hidden />
      <h1 className="name" aria-label="Sofia Amin">
        {WORDS.map((word) => (
          <span key={word} className="word" aria-hidden>
            {[...word].map((ch) => (
              <span key={i} className="l" style={{ "--i": i++ } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </h1>
    </main>
  );
}
