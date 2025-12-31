document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("schedule", ({ schedule }) => {
        const container = document.getElementById("table-container");

        if (!schedule || schedule.length === 0) {
            container.innerText = "Error: No schedule found! visit https://sis.addu.edu.ph/registration or reload the page.";
            return;
        }

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const startTimeDecimal = 7.5; // 7:30 AM
        const endTimeDecimal = 21.5;  // 9:00 PM

        function timeStrToDecimal(str) {
            let [time, period] = [str.slice(0, -1), str.slice(-1)];
            let [hour, min] = time.split(":").map(Number);
            if (period === "P" && hour !== 12) hour += 12;
            if (period === "A" && hour === 12) hour = 0;
            return hour + min / 60;
        }

        function parseSchedule(scheduleStr) {

        // Removes * and spaces
        scheduleStr = scheduleStr.replace(/^\*\s*|\s*\*$/g, '').trim();

        const match = scheduleStr.match(/(\d{1,2}:\d{2}[AP])-(\d{1,2}:\d{2}[AP])\s+(\S+)?\s+([A-Za-z]+)/);
        if (!match) return null;

        const [_, startTime, endTime, room, daysStr] = match;

        const daysArray = [];
        let tmpDaysStr = daysStr.replace("Th", "X").replace("Sa", "S");

        if (tmpDaysStr.includes("M")) daysArray.push("Monday");
        if (tmpDaysStr.includes("T")) daysArray.push("Tuesday");
        if (tmpDaysStr.includes("W")) daysArray.push("Wednesday");
        if (tmpDaysStr.includes("X")) daysArray.push("Thursday");
        if (tmpDaysStr.includes("F")) daysArray.push("Friday");
        if (tmpDaysStr.includes("S")) daysArray.push("Saturday");

        return {
            days: daysArray,
            start: timeStrToDecimal(startTime),
            end: timeStrToDecimal(endTime),
            room: room || ""
        };
    }

        function formatTimeRange(start, end) {
            function to12Hour(t) {
                const hour24 = Math.floor(t);
                const minutes = t % 1 === 0 ? "00" : "30";
                const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
                const period = hour24 < 12 ? "AM" : "PM";
                return `${hour12}:${minutes} ${period}`;
            }
            return `${to12Hour(start)} - ${to12Hour(end)}`;
        }

        const subjectColors = {};
        const colors = [
            "#FFD700", "#FFB6C1", "#90EE90", "#87CEFA", "#FFA07A",
            "#9370DB", "#FFC0CB", "#00FA9A", "#FF69B4", "#40E0D0",
            "#F08080", "#BA55D3", "#20B2AA", "#FF8C00", "#66CDAA"
        ];
        
        let colorIndex = 0;
        schedule.forEach(course => {
            if (!subjectColors[course.subjcode]) {
                subjectColors[course.subjcode] = colors[colorIndex % colors.length];
                colorIndex++;
            }
        });

        let timetable = {};
        days.forEach(day => {
            timetable[day] = {};
            for (let t = startTimeDecimal; t < endTimeDecimal; t += 0.5) {
                timetable[day][t] = null;
            }
        });

        schedule.forEach(course => {
            const parsed = parseSchedule(course.schedule);
            if (!parsed) return;

            parsed.days.forEach(day => {
                const duration = parsed.end - parsed.start;
                const slots = duration / 0.5;
                const courseText = `<b>${course.subjname}</b><br>${course.subjcode}<br>${formatTimeRange(parsed.start, parsed.end)}<br>${parsed.room}`;

                timetable[day][parsed.start] = {
                    text: courseText,
                    rowspan: slots,
                    color: subjectColors[course.subjcode]
                };

                let t = parsed.start + 0.5;
                for (let i = 1; i < slots; i++) {
                    timetable[day][t] = "skip";
                    t += 0.5;
                }
            });
        });

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.tableLayout = "fixed";
        table.style.borderCollapse = "collapse";
        table.border = "1";

        const tableWrapper = document.createElement("div");
        tableWrapper.id = "table-wrapper";
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);

        const header = document.createElement("tr");
        const timeTh = document.createElement("th");
        timeTh.innerText = "Time";
        header.appendChild(timeTh);

        days.forEach(day => {
            const th = document.createElement("th");
            th.innerText = day;
            header.appendChild(th);
        });
        table.appendChild(header);

        for (let t = startTimeDecimal; t < endTimeDecimal; t += 0.5) {
            const tr = document.createElement("tr");
            const hour24 = Math.floor(t);
            const minutes = t % 1 === 0 ? "00" : "30";
            const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
            const period = hour24 < 12 ? "AM" : "PM";

            const timeTd = document.createElement("td");
            timeTd.innerText = `${hour12}:${minutes} ${period}`;
            timeTd.style.textAlign = "center";
            timeTd.style.border = "1px solid black";
            timeTd.style.fontSize = "14px";
            tr.appendChild(timeTd);

            days.forEach(day => {
                const slot = timetable[day][t];
                if (!slot) {
                    const td = document.createElement("td");
                    td.innerText = "";
                    td.style.textAlign = "center";
                    td.style.border = "1px solid black";
                    td.style.fontSize = "14px";
                    tr.appendChild(td);
                } else if (slot === "skip") {
                    // skip
                } else {
                    const td = document.createElement("td");
                    td.innerHTML = slot.text;
                    td.rowSpan = slot.rowspan;
                    td.style.textAlign = "center";
                    td.style.verticalAlign = "middle";
                    td.style.whiteSpace = "pre-line";
                    td.style.backgroundColor = slot.color;
                    td.style.border = "2px solid black";
                    td.style.fontSize = "16px"; 
                    td.style.borderRadius = "16px";
                    tr.appendChild(td);
                }
            });

            table.appendChild(tr);
        }
    });
});
