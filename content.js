const interval = setInterval(() => {
    const table = document.querySelector("table.sticky-enabled");
    if (table) {
        clearInterval(interval);

        const rows = table.querySelectorAll("tbody tr");
        const scheduleData = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            scheduleData.push({
                subjcode: cells[1]?.innerText.trim() || "",
                subjname: cells[2]?.innerText.trim() || "",
                schedule: cells[3]?.innerText.trim() || ""
            });
        });

        chrome.storage.local.set({ schedule: scheduleData });
        console.log("Schedule saved:", scheduleData);
    }
}, 500);
