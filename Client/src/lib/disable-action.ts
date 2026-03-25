// "use client";

// import { useEffect } from "react";

// export default function DisableActions() {
//   useEffect(() => {
//     // Disable right click
//     const handleContextMenu = (e: MouseEvent) => e.preventDefault();

//     // Disable keyboard shortcuts
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (!e.key) return;
//       const key = e.key.toLowerCase();
//       if (
//         e.key === "F12" ||
//         (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
//         (e.ctrlKey && key === "u") ||
//         (e.ctrlKey && key === "s") ||
//         (e.ctrlKey && key === "c") ||
//         // (e.ctrlKey && key === "v") ||
//         (e.ctrlKey && key === "a")
//       ) {
//         e.preventDefault();
//       }
//     };

//     // Disable copy/cut
//     const disableClipboard = (e: ClipboardEvent) => e.preventDefault();

//     // ─── DevTools Detection ───────────────────────────────────────────────────
//     //
//     // Problem with a plain (outerWidth - innerWidth > 150) check:
//     //   • At 110%+ browser zoom, innerWidth shrinks → the gap exceeds 150px
//     //     even with no DevTools open (false positive).
//     //
//     // Problem with (outerWidth - innerWidth * devicePixelRatio > 150):
//     //   • devicePixelRatio = OS display scale × browser zoom.
//     //   • On Windows 125% scaling or Retina screens (2×), the OS component
//     //     makes innerWidth * dpr overshoot outerWidth → gap goes negative
//     //     and DevTools is never detected (false negative).
//     //
//     // Correct approach:
//     //   Capture baseDpr once at load (= OS scale alone, assumes ~100% browser
//     //   zoom on first load). Divide current dpr by baseDpr to isolate the
//     //   browser zoom factor, then multiply innerWidth by that zoom to cancel
//     //   its effect. The remaining gap is only scrollbar + DevTools panel.
//     //
//     //   widthDiff  = outerWidth  - innerWidth  × zoom  ≈ scrollbar + devtools_w
//     //   heightDiff = outerHeight - innerHeight × zoom  ≈ chrome    + devtools_h

//     let baseDpr = window.devicePixelRatio;

//     // If the user zooms OUT below the initial DPR, we can self-correct baseDpr.
//     // (Guards the edge-case where the page loaded at a non-100% zoom level.)
//     const handleResize = () => {
//       if (window.devicePixelRatio < baseDpr) {
//         baseDpr = window.devicePixelRatio;
//       }
//     };
//     window.addEventListener("resize", handleResize);

//     const detectDevTools = () => {
//       const zoom = window.devicePixelRatio / baseDpr; // browser zoom only

//       const widthDiff  = window.outerWidth  - window.innerWidth  * zoom;
//       const heightDiff = window.outerHeight - window.innerHeight * zoom;

//       // widthDiff  without DevTools ≈ scrollbar (~15 px)  → threshold 150 is safe
//       // heightDiff without DevTools ≈ browser chrome bar  → threshold 200 is safe
//       if (widthDiff > 150 || heightDiff > 200) {
//         document.body.innerHTML = `
//   <style>
//     body { margin: 0; }
//   </style>
//   <div style="
//     height: 100vh;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     background: radial-gradient(circle at top, #1e293b, #020617);
//     font-family: 'Segoe UI', sans-serif;
//   ">
//     <div style="
//       background: rgba(30, 41, 59, 0.95);
//       backdrop-filter: blur(12px);
//       padding: 40px 30px;
//       border-radius: 18px;
//       text-align: center;
//       color: white;
//       box-shadow: 0 20px 60px rgba(0,0,0,0.6);
//       max-width: 420px;
//     ">
//       <div style="font-size: 50px; margin-bottom: 15px;">🚫</div>
//       <h1 style="font-size: 26px; margin-bottom: 10px; font-weight: 700;">
//         Access Restricted
//       </h1>
//       <p style="font-size: 15px; opacity: 0.8; margin-bottom: 25px; line-height: 1.5;">
//         Developer tools are disabled to protect platform security.
//       </p>
//       <button
//         onclick="window.location.reload()"
//         style="
//           padding: 10px 22px;
//           background: linear-gradient(135deg, #2563eb, #3b82f6);
//           border: none;
//           border-radius: 10px;
//           color: white;
//           cursor: pointer;
//           font-weight: 600;
//         "
//       >
//         Reload Page
//       </button>
//     </div>
//   </div>
// `;
//       }
//     };

//     const interval = setInterval(detectDevTools, 1000);

//     document.addEventListener("contextmenu", handleContextMenu);
//     document.addEventListener("keydown", handleKeyDown);
//     document.addEventListener("copy", disableClipboard);
//     // document.addEventListener("paste", disableClipboard);
//     document.addEventListener("cut", disableClipboard);

//     return () => {
//       clearInterval(interval);
//       window.removeEventListener("resize", handleResize);
//       document.removeEventListener("contextmenu", handleContextMenu);
//       document.removeEventListener("keydown", handleKeyDown);
//       document.removeEventListener("copy", disableClipboard);
//       // document.removeEventListener("paste", disableClipboard);
//       document.removeEventListener("cut", disableClipboard);
//     };
//   }, []);

//   return null;
// }
