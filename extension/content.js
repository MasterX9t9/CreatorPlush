// CreatorPulse YouTube Content Script (Manifest V3)
// Resilient DOM observation and interactive creator telemetry

(function () {
  "use strict";

  const PROCESSED_ATTR = "data-cp-processed";

  // Resilient video card selectors covering YouTube desktop homepage, search, and watch sidebar
  const VIDEO_SELECTORS = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
  ];

  function processVideoCards() {
    const cards = document.querySelectorAll(VIDEO_SELECTORS.join(","));

    cards.forEach((card) => {
      if (card.hasAttribute(PROCESSED_ATTR)) return;
      card.setAttribute(PROCESSED_ATTR, "true");

      // Extract title element resiliently
      const titleEl =
        card.querySelector("#video-title") ||
        card.querySelector("h3 a") ||
        card.querySelector("span#video-title");

      if (!titleEl) return;

      const title = titleEl.textContent?.trim() || "";
      const videoUrl = titleEl.getAttribute("href") || "";

      // Create CreatorPulse Quick Overlay
      const badgeContainer = document.createElement("div");
      badgeContainer.className = "cp-badge-container";

      // 1. One-click "Save to Swipe File" button
      const swipeBtn = document.createElement("button");
      swipeBtn.className = "cp-swipe-btn";
      swipeBtn.textContent = "+ Swipe";
      swipeBtn.title = "Save this video to CreatorPulse Swipe File";
      swipeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        swipeBtn.textContent = "Saving...";
        chrome.runtime.sendMessage(
          {
            type: "SAVE_TO_SWIPE",
            payload: {
              title,
              itemType: "VIDEO",
              url: videoUrl.startsWith("http")
                ? videoUrl
                : `https://www.youtube.com${videoUrl}`,
              notes: "Saved via CreatorPulse Chrome Extension",
              tags: ["extension_capture"],
            },
          },
          (res) => {
            if (res && res.success) {
              swipeBtn.textContent = "✓ Saved";
              swipeBtn.style.background = "#10b981";
            } else {
              swipeBtn.textContent = "Error";
            }
          }
        );
      });

      badgeContainer.appendChild(swipeBtn);

      // Insert adjacent to video title metadata
      const metaContainer =
        card.querySelector("#metadata-line") ||
        card.querySelector("#meta") ||
        titleEl.parentElement;

      if (metaContainer) {
        metaContainer.appendChild(badgeContainer);
      }
    });
  }

  // MutationObserver to safely handle YouTube dynamic infinite scroll without locking the UI
  let debounceTimeout = null;
  const observer = new MutationObserver(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(processVideoCards, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial pass
  processVideoCards();
})();
