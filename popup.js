document.getElementById("load-schedule").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("schedule.html") });
});
