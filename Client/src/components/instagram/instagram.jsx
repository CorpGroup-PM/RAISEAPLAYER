import { useEffect, useRef } from "react";

export default function InstagramEmbed({ url }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    containerRef.current.innerHTML = `<blockquote
      class="instagram-media"
      data-instgrm-permalink="${url}"
      data-instgrm-version="14"
      style="max-width:100%;width:100%;margin:0 auto"
    ></blockquote>`;

    const process = () => {
      if (window.instgrm) window.instgrm.Embeds.process();
    };

    const existing = document.querySelector(
      'script[src="https://www.instagram.com/embed.js"]'
    );

    if (existing) {
      process();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = process;
      document.body.appendChild(script);
    }
  }, [url]);

  if (!url) return null;

  return (
    <div ref={containerRef} style={{ width: "100%" }} />
  );
}
