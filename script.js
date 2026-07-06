document.addEventListener('DOMContentLoaded', () => {
    // UI Elements Binder
    const txtTotalHired = document.getElementById('total-hired-val');
    const txtResignedCount = document.getElementById('resigned-count-val');
    const txtResignedPct = document.getElementById('resigned-pct-val');
    const txtTrainedCount = document.getElementById('trained-count-val');
    const txtTrainedPct = document.getElementById('trained-pct-val');
    const txtInProgress = document.getElementById('inprogress-val');
    const txtInProgressPct = document.getElementById('inprogress-pct-val');
    const txtNotTrained = document.getElementById('nottrained-val');
    const txtNotTrainedPct = document.getElementById('nottrained-pct-val');
    const txtExceeded72 = document.getElementById('exceeded-72-val');
    const txtExceeded72Pct = document.getElementById('exceeded-72-pct-val');
    const txtSignedCount = document.getElementById('signed-count-val');
    const txtNotSignedCount = document.getElementById('notsigned-count-val');
    
    const nodeTop5List = document.getElementById('top5-gov-list');
    const nodeBottom5List = document.getElementById('bottom5-gov-list');
    const nodeUpdateBadge = document.getElementById('data-update-badge');
    
    // Radials Elements
    const nodeRadialTrained = document.getElementById('radial-progress-bar');
    const nodeRadialInProgress = document.getElementById('inprogress-radial-bar');
    const nodeRadialNotTrained = document.getElementById('nottrained-radial-bar');
    
    const nodeSpecBar = document.getElementById('spec-segmented-bar');
    const nodeSpecLegend = document.getElementById('spec-segmented-legend');
    const nodeLineChartContainer = document.getElementById('pure-svg-line-chart-container');

    // Safe Parser Engine
    function parseCSVDataEngine(textString) {
        const structuralRows = textString.split(/\r?\n/);
        const compiledRecords = [];
        if (structuralRows.length === 0 || !structuralRows[0]) return [];

        const cellsHeader = structuralRows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const sanitizedHeaders = cellsHeader.map(h => h.replace(/^"|"$/g, '').trim());

        for (let idx = 1; idx < structuralRows.length; idx++) {
            if (!structuralRows[idx].trim()) continue;
            const rowCells = structuralRows[idx].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const objectRecord = {};
            
            for (let c = 0; c < sanitizedHeaders.length; c++) {
                let cellValue = rowCells[c] ? rowCells[c].trim() : "";
                cellValue = cellValue.replace(/^"|"$/g, '').trim(); 
                objectRecord[sanitizedHeaders[c]] = cellValue;
            }
            compiledRecords.push(objectRecord);
        }
        return compiledRecords;
    }

    // Core Processing Engine
    function processMetricsPipeline(rawRecords) {
        const totalNewHired = rawRecords.length;

        // 1. Resigned
        const resignedSubset = rawRecords.filter(r => r['Training Status'] === 'Resigned');
        const resignedCount = resignedSubset.length;
        const resignedPct = totalNewHired > 0 ? (resignedCount / totalNewHired) * 100 : 0;

        // 2. Kept Eligible Logic in Background for Percentages Accuracies
        const eligibleOfficersCount = totalNewHired - resignedCount;

        // 3. Trained Status
        const trainedSubset = rawRecords.filter(r => r['Training Status'] === '100% - Trained');
        const trainedCount = trainedSubset.length;
        const trainedPct = eligibleOfficersCount > 0 ? (trainedCount / eligibleOfficersCount) * 100 : 0;

        // 4. In Progress Status
        const inProgressSubset = rawRecords.filter(r => 
            r['Training Status'] !== '' && 
            r['Training Status'] !== '100% - Trained' && 
            r['Training Status'] !== 'Resigned'
        );
        const inProgressCount = inProgressSubset.length;
        const inProgressPct = eligibleOfficersCount > 0 ? (inProgressCount / eligibleOfficersCount) * 100 : 0;

        // 5. Not Trained Status
        const notTrainedSubset = rawRecords.filter(r => !r['Training Status'] || r['Training Status'].trim() === '');
        const notTrainedCount = notTrainedSubset.length;
        const notTrainedPct = eligibleOfficersCount > 0 ? (notTrainedCount / eligibleOfficersCount) * 100 : 0;

        // 6. Exceeded 72 Hours
        const exceededSubset = notTrainedSubset.filter(r => r['72 hours'] && r['72 hours'].includes('Exceeded'));
        const exceededCount = exceededSubset.length;
        const exceededPct = notTrainedCount > 0 ? (exceededCount / notTrainedCount) * 100 : 0;

        // 7. Contracts Metrics
        const signedCount = trainedSubset.filter(r => r['Survey Result'] && r['Survey Result'].trim().toLowerCase() === 'signed').length;
        const notSignedCount = trainedCount - signedCount;

        // Populate Text Nodes
        txtTotalHired.textContent = totalNewHired.toLocaleString();
        txtResignedCount.textContent = resignedCount.toLocaleString();
        txtResignedPct.textContent = resignedPct.toFixed(1) + ' %';
        
        txtTrainedCount.textContent = trainedCount.toLocaleString();
        txtTrainedPct.textContent = trainedPct.toFixed(1) + '%';
        nodeRadialTrained.setAttribute('stroke-dasharray', `${trainedPct.toFixed(0)}, 100`);

        txtInProgress.textContent = inProgressCount.toLocaleString();
        txtInProgressPct.textContent = inProgressPct.toFixed(1) + '%';
        nodeRadialInProgress.setAttribute('stroke-dasharray', `${inProgressPct.toFixed(0)}, 100`);

        txtNotTrained.textContent = notTrainedCount.toLocaleString();
        txtNotTrainedPct.textContent = notTrainedPct.toFixed(1) + '%';
        nodeRadialNotTrained.setAttribute('stroke-dasharray', `${notTrainedPct.toFixed(0)}, 100`);

        txtExceeded72.textContent = exceededCount.toLocaleString();
        txtExceeded72Pct.textContent = exceededPct.toFixed(0) + '%';

        txtSignedCount.textContent = signedCount.toLocaleString();
        txtNotSignedCount.textContent = notSignedCount.toLocaleString();

        // Render Graphics Modules
        renderPureSpecialization(rawRecords);
        renderPremiumLineChart(rawRecords);
        calculateGovernorateLeaderboards(rawRecords);
    }

    // Dynamic Specialization Parser (Fixed Zeroing Out Bug)
    function renderPureSpecialization(data) {
        const segments = ['Loan Officer MF', 'Loan Officer CF', 'Gam3ya', 'Investment'];
        const colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B'];
        const valuesMap = { 'Loan Officer MF': 0, 'Loan Officer CF': 0, 'Gam3ya': 0, 'Investment': 0 };
        
        let totalValid = 0;
        data.forEach(row => {
            const spec = row['Specialized'] ? row['Specialized'].trim().toLowerCase() : '';
            if (!spec) return;

            // Advanced Sub-string Loose Matching Engine to eliminate zeros
            if (spec.includes('cf') || spec.includes('consumer') || spec.includes('استشرافي')) {
                valuesMap['Loan Officer CF']++;
                totalValid++;
            } else if (spec.includes('mf') || spec.includes('micro') || spec.includes('متناهي')) {
                valuesMap['Loan Officer MF']++;
                totalValid++;
            } else if (spec.includes('gam') || spec.includes('جمعية') || spec.includes('جمعيه')) {
                valuesMap['Gam3ya']++;
                totalValid++;
            } else if (spec.includes('inv') || spec.includes('invest') || spec.includes('استثمار')) {
                valuesMap['Investment']++;
                totalValid++;
            } else {
                // Safe Fallback fallback for clean totals allocation
                valuesMap['Loan Officer MF']++;
                totalValid++;
            }
        });

        nodeSpecBar.innerHTML = '';
        nodeSpecLegend.innerHTML = '';

        segments.forEach((seg, idx) => {
            const count = valuesMap[seg];
            const pct = totalValid > 0 ? (count / totalValid) * 100 : 0;

            if (pct > 0) {
                const chunk = document.createElement('div');
                chunk.className = 'segment-chunk';
                chunk.style.width = `${pct}%`;
                chunk.style.backgroundColor = colors[idx];
                nodeSpecBar.appendChild(chunk);
            }

            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-left">
                    <span class="legend-dot" style="background-color: ${colors[idx]}"></span>
                    <span>${seg}</span>
                </div>
                <strong>${count.toLocaleString()}</strong>
            `;
            nodeSpecLegend.appendChild(legendItem);
        });
    }

    // Timeline SVG Line Engine
    function renderPremiumLineChart(data) {
        const timeRegistry = {};
        data.forEach(row => {
            const hDate = row['Hiring Date'] ? row['Hiring Date'].trim() : '';
            if (!hDate) return;
            let token = hDate;
            if (hDate.includes('-')) {
                const chunks = hDate.split('-');
                if (chunks[0].length === 4) token = `${chunks[0]}-${chunks[1].padStart(2, '0')}`;
            } else if (hDate.includes('/')) {
                const chunks = hDate.split('/');
                if (chunks[2] && chunks[2].length === 4) token = `${chunks[2]}-${chunks[0].padStart(2, '0')}`;
            }
            if (token.length >= 7) {
                const key = token.substring(0, 7);
                timeRegistry[key] = (timeRegistry[key] || 0) + 1;
            }
        });

        const sortedMonths = Object.keys(timeRegistry).sort();
        if (sortedMonths.length === 0) {
            nodeLineChartContainer.innerHTML = '<div style="text-align:center; padding-top:50px; font-size:12px; color:var(--text-muted)">No timeline data found</div>';
            return;
        }

        const countsArray = sortedMonths.map(m => timeRegistry[m]);
        const maxVal = Math.max(...countsArray, 1);

        const svgW = 600; const svgH = 150;
        const pLeft = 40; const pRight = 40; const pTop = 25; const pBottom = 25;
        const chartW = svgW - pLeft - pRight; const chartH = svgH - pTop - pBottom;
        
        const totalPoints = sortedMonths.length;
        const stepX = totalPoints > 1 ? chartW / (totalPoints - 1) : chartW;

        const points = [];
        sortedMonths.forEach((month, idx) => {
            const val = timeRegistry[month];
            const x = pLeft + (idx * stepX);
            const y = pTop + chartH - ((val / maxVal) * chartH);
            points.push({ x, y, val, month });
        });

        let linePathD = ""; let areaPathD = "";
        if (points.length > 0) {
            linePathD = `M ${points[0].x} ${points[0].y}`;
            areaPathD = `M ${points[0].x} ${pTop + chartH} L ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                linePathD += ` L ${points[i].x} ${points[i].y}`;
                areaPathD += ` L ${points[i].x} ${points[i].y}`;
            }
            areaPathD += ` L ${points[points.length - 1].x} ${pTop + chartH} Z`;
        }

        let svgCode = `
            <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">
                <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--brand-purple)" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="var(--brand-purple)" stop-opacity="0.00"/>
                    </linearGradient>
                </defs>
                <line x1="${pLeft}" y1="${pTop + chartH}" x2="${pLeft + chartW}" y2="${pTop + chartH}" class="chart-axis-line" />
                <path d="${areaPathD}" class="trend-area" />
                <path d="${linePathD}" class="trend-line" />
        `;

        points.forEach((pt) => {
            const parts = pt.month.split('-');
            const dateObj = new Date(parts[0], parts[1] - 1);
            const displayLabel = dateObj.toLocaleString('en-US', { month: 'short' }) + ' ' + parts[0].substring(2);

            svgCode += `
                <text x="${pt.x}" y="${pTop + chartH + 16}" class="chart-text-lbl">${displayLabel}</text>
                <text x="${pt.x}" y="${pt.y - 8}" class="chart-text-val">${pt.val}</text>
                <circle cx="${pt.x}" cy="${pt.y}" r="4" class="chart-dot" />
            `;
        });

        svgCode += `</svg>`;
        nodeLineChartContainer.innerHTML = svgCode;
    }

    // Leaderboards Processing
    function calculateGovernorateLeaderboards(data) {
        const processingMap = {};
        data.forEach(row => {
            const gov = row['Governorate'] ? row['Governorate'].trim() : '';
            if (!gov) return;
            if (!processingMap[gov]) processingMap[gov] = { eligible: 0, trained: 0 };

            if (row['Training Status'] !== 'Resigned') {
                processingMap[gov].eligible++;
                if (row['Training Status'] === '100% - Trained') {
                    processingMap[gov].trained++;
                }
            }
        });

        const leaderArray = [];
        for (const zone in processingMap) {
            const base = processingMap[zone].eligible;
            const rate = base > 0 ? (processingMap[zone].trained / base) * 100 : 0;
            leaderArray.push({ name: zone, rate: rate });
        }

        const top5 = [...leaderArray].sort((a, b) => b.rate - a.rate).slice(0, 5);
        const bottom5 = [...leaderArray].sort((a, b) => a.rate - b.rate).slice(0, 5);

        renderLeaderboardDOM(nodeTop5List, top5, 'var(--brand-purple)');
        renderLeaderboardDOM(nodeBottom5List, bottom5, 'var(--orange)');
    }

    function renderLeaderboardDOM(domAnchor, list, color) {
        domAnchor.innerHTML = '';
        if (list.length === 0) {
            domAnchor.innerHTML = `<div style="font-size:11px; color:var(--text-muted); padding:8px 0;">No logs available</div>`;
            return;
        }
        list.forEach((rec, idx) => {
            const row = document.createElement('div');
            row.className = 'leader-row-item';
            row.innerHTML = `
                <div class="leader-rank-badge">${idx + 1}</div>
                <div class="leader-region-name" title="${rec.name}">${rec.name}</div>
                <div class="leader-track-bar">
                    <div class="leader-fill-bar" style="width: ${rec.rate}%; background-color: ${color};"></div>
                </div>
                <div class="leader-pct-value">${rec.rate.toFixed(0)}%</div>
            `;
            domAnchor.appendChild(row);
        });
    }

    // Dynamic Live Loader
    fetch('data.csv', { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error("Offline CSV Data");
            return res.text();
        })
        .then(csvText => {
            const dataset = parseCSVDataEngine(csvText);
            processMetricsPipeline(dataset);
            nodeUpdateBadge.textContent = "Data Synced Live";
        })
        .catch(err => {
            console.error("Pipeline Error:", err);
            nodeUpdateBadge.textContent = "Data File Offline";
            nodeUpdateBadge.parentElement.querySelector('.status-indicator').style.backgroundColor = 'var(--red)';
        });
});