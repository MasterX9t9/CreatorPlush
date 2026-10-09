// Sidepanel script detecting active tab state

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  const surfaceEl = document.getElementById("activeSurface");

  if (currentTab && currentTab.url) {
    if (currentTab.url.includes("youtube.com/watch")) {
      surfaceEl.textContent = "Watch Page";
    } else if (currentTab.url.includes("youtube.com/results")) {
      surfaceEl.textContent = "Search Results";
    } else if (currentTab.url.includes("youtube.com/@")) {
      surfaceEl.textContent = "Channel Page";
    } else if (currentTab.url.includes("youtube.com")) {
      surfaceEl.textContent = "Home Browse Feed";
    } else {
      surfaceEl.textContent = "Non-YouTube Tab";
    }
  }
});
