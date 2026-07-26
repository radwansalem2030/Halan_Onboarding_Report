document.addEventListener('DOMContentLoaded', () => {
    // UI Elements Binder - Tab 1
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
    const monthFilterSelect = document.getElementById('month-filter');
    const tooltipNode = document.getElementById('dashboard-tooltip');
    
    // Radials Elements
    const nodeRadialTrained = document.getElementById('radial-progress-bar');
    const nodeRadialInProgress = document.getElementById('inprogress-radial-bar');
    const nodeRadialNotTrained = document.getElementById('nottrained-radial-bar');
    
    const nodeSpecBar = document.getElementById('spec-segmented-bar');
    const nodeSpecLegend = document.getElementById('spec-segmented-legend');
    const nodeLineChartContainer = document.getElementById('pure-svg-line-chart-container');

    // Dataset Globals
    let globalDataset = [];
    let supervisorDataset = [];
    let rawSupervisorRecordsGlobal = [];
    let currentGovMatrixSort = { key: 'eff', dir: 'desc' };
    let currentSupGovSort = { key: 'officers', dir: 'desc' };
    let currentSupDetailSort = { key: 'gov', dir: 'asc' };

    // HQ Validation Globals
    let hqBreakdownMode = 'gov'; // 'gov' | 'sup'
    let hqSortConfig = { key: 'name', dir: 'asc' };

    // Initialize Navigation Tab Switching Logic
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetNode = document.getElementById(targetTab);
            if (targetNode) targetNode.classList.add('active');
        });
    });

    // Universal Tooltip Controls
    function showTooltip(evt, htmlContent) {
        if (!tooltipNode) return;
        tooltipNode.innerHTML = htmlContent;
        tooltipNode.style.display = 'block';
        
        const padding = 12;
        let x = evt.clientX + padding;
        let y = evt.clientY + padding;

        if (x + tooltipNode.offsetWidth > window.innerWidth - padding) {
            x = evt.clientX - tooltipNode.offsetWidth - padding;
        }
        if (y + tooltipNode.offsetHeight > window.innerHeight - padding) {
            y = evt.clientY - tooltipNode.offsetHeight - padding;
        }

        tooltipNode.style.left = `${Math.max(padding, x)}px`;
        tooltipNode.style.top = `${Math.max(padding, y)}px`;
    }

    function hideTooltip() {
        if (tooltipNode) tooltipNode.style.display = 'none';
    }

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

    // Helper Engine to extract standard YYYY-MM key from Hiring Date
    function parseMonthKey(hDate) {
        if (!hDate) return '';
        let token = hDate.trim();
        if (token.includes('-')) {
            const chunks = token.split('-');
            if (chunks[0].length === 4) return `${chunks[0]}-${chunks[1].padStart(2, '0')}`;
        } else if (token.includes('/')) {
            const chunks = token.split('/');
            if (chunks[2] && chunks[2].length === 4) return `${chunks[2]}-${chunks[0].padStart(2, '0')}`;
        }
        return '';
    }

    // Dynamic Filter UI Builder (Consolidates months from both datasets)
    function populateMonthFilter() {
        const monthsSet = new Set();
        
        globalDataset.forEach(row => {
            const key = parseMonthKey(row['Hiring Date']);
            if (key) monthsSet.add(key);
        });

        rawSupervisorRecordsGlobal.forEach(row => {
            const key = parseMonthKey(row['Hiring Date']);
            if (key) monthsSet.add(key);
        });

        const sortedKeys = Array.from(monthsSet).sort();
        const currentSelected = monthFilterSelect.value;
        monthFilterSelect.innerHTML = '<option value="all">All Months</option>';

        sortedKeys.forEach(key => {
            const [year, month] = key.split('-');
            const dateObj = new Date(year, month - 1);
            const label = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = label;
            monthFilterSelect.appendChild(opt);
        });

        if (currentSelected && Array.from(monthFilterSelect.options).some(o => o.value === currentSelected)) {
            monthFilterSelect.value = currentSelected;
        }
    }

    // Central Helper for Questionnaire Exceeded Rule Correct Logic
    function isQuestionnaireExceeded(row) {
        if (!row || typeof row !== 'object') return false;

        let statusVal = '';
        for (const k of Object.keys(row)) {
            const cleanK = k.trim().toLowerCase();
            if (cleanK.includes('training status') || cleanK.includes('trainingstatus') || cleanK === 'training') {
                statusVal = String(row[k] || '').trim();
                break;
            }
        }
        if (!statusVal.includes('100%')) return false;

        let questVal = '';
        for (const k of Object.keys(row)) {
            const cleanK = k.trim().toLowerCase();
            if (cleanK.includes('questionnaire')) {
                questVal = String(row[k] || '').trim();
                break;
            }
        }
        const isBlankQuest = (questVal === '' || questVal.toLowerCase() === 'null' || questVal.toLowerCase() === 'undefined');
        if (!isBlankQuest) return false;

        let test10dVal = '';
        for (const k of Object.keys(row)) {
            const cleanK = k.trim().toLowerCase();
            if (cleanK.includes('10') && (cleanK.includes('working') || cleanK.includes('days') || cleanK.includes('day'))) {
                test10dVal = String(row[k] || '').trim().toLowerCase();
                break;
            }
        }
        if (!test10dVal) {
            for (const k of Object.keys(row)) {
                const cleanK = k.trim().toLowerCase();
                if (cleanK.includes('working days') || cleanK.includes('10 working') || cleanK.includes('10 days')) {
                    test10dVal = String(row[k] || '').trim().toLowerCase();
                    break;
                }
            }
        }

        const isExceeded = test10dVal.includes('exceeded') && !test10dVal.includes('not');
        return isExceeded;
    }

    // Single Unified Calculator for Central Metrics
    function calculateCentralMetrics(rawRecords) {
        const totalNewHired = rawRecords.length;
        const resignedSubset = rawRecords.filter(r => {
            const st = (r['Training Status'] || '').trim().toLowerCase();
            return st === 'resigned';
        });
        const resignedCount = resignedSubset.length;
        const resignedPct = totalNewHired > 0 ? (resignedCount / totalNewHired) * 100 : 0;

        const effectivePopulation = totalNewHired - resignedCount;

        const trainedSubset = rawRecords.filter(r => (r['Training Status'] || '').includes('100%'));
        const trainedCount = trainedSubset.length;
        const trainedPct = effectivePopulation > 0 ? (trainedCount / effectivePopulation) * 100 : 0;

        const inProgressSubset = rawRecords.filter(r => {
            const st = (r['Training Status'] || '').trim();
            return st !== '' && !st.includes('100%') && st.toLowerCase() !== 'resigned';
        });
        const inProgressCount = inProgressSubset.length;
        const inProgressPct = effectivePopulation > 0 ? (inProgressCount / effectivePopulation) * 100 : 0;

        const notTrainedSubset = rawRecords.filter(r => !r['Training Status'] || r['Training Status'].trim() === '');
        const notTrainedCount = notTrainedSubset.length;
        const notTrainedPct = effectivePopulation > 0 ? (notTrainedCount / effectivePopulation) * 100 : 0;

        const slaBreachSubset = rawRecords.filter(r => 
            (!r['Training Status'] || r['Training Status'].trim() === '') && 
            r['72 hours'] && r['72 hours'].includes('Exceeded')
        );
        const sla72hBreachCount = slaBreachSubset.length;
        const sla72hBreachRate = effectivePopulation > 0 ? (sla72hBreachCount / effectivePopulation) * 100 : 0;

        const questOverdueSubset = rawRecords.filter(r => isQuestionnaireExceeded(r));
        const questOverdueCount = questOverdueSubset.length;
        const questOverdueRate = effectivePopulation > 0 ? (questOverdueCount / effectivePopulation) * 100 : 0;

        const signedCount = trainedSubset.filter(r => r['Survey Result'] && r['Survey Result'].trim().toLowerCase() === 'signed').length;
        const declPendingCount = trainedCount - signedCount;
        const declPendingRate = effectivePopulation > 0 ? (declPendingCount / effectivePopulation) * 100 : 0;

        return {
            totalNewHired,
            resignedCount,
            resignedPct,
            effectivePopulation,
            trainedCount,
            trainedPct,
            inProgressCount,
            inProgressPct,
            notTrainedCount,
            notTrainedPct,
            sla72hBreachCount,
            sla72hBreachRate,
            questOverdueCount,
            questOverdueRate,
            signedCount,
            declPendingCount,
            declPendingRate
        };
    }

    // Pipeline Orchestrator on Filter Event
    function applyDynamicFiltering() {
        const chosenValue = monthFilterSelect.value;
        let scopedData = globalDataset;
        let scopedSupRecords = rawSupervisorRecordsGlobal;

        if (chosenValue !== 'all') {
            scopedData = globalDataset.filter(row => parseMonthKey(row['Hiring Date']) === chosenValue);
            scopedSupRecords = rawSupervisorRecordsGlobal.filter(row => parseMonthKey(row['Hiring Date']) === chosenValue);
        }

        const metrics = calculateCentralMetrics(scopedData);

        // Tab 1 Pipeline Processing
        processMetricsPipeline(scopedData, metrics);

        // Tab 2 Analytics Pipeline Processing
        processTab2AnalyticsPipeline(scopedData, metrics);

        // Tab 3 Supervisor Performance Pipeline Processing (Connected to Month Filter by Hiring Date)
        processTab3SupervisorPipeline(scopedSupRecords);
    }

    monthFilterSelect.addEventListener('change', applyDynamicFiltering);

    // Core Processing Engine for Tab 1
    function processMetricsPipeline(rawRecords, metrics) {
        txtTotalHired.textContent = metrics.totalNewHired.toLocaleString();
        txtResignedCount.textContent = metrics.resignedCount.toLocaleString();
        txtResignedPct.textContent = metrics.resignedPct.toFixed(1) + ' %';
        
        txtTrainedCount.textContent = metrics.trainedCount.toLocaleString();
        txtTrainedPct.textContent = metrics.trainedPct.toFixed(1) + '%';
        if(nodeRadialTrained) nodeRadialTrained.setAttribute('stroke-dasharray', `${metrics.trainedPct.toFixed(0)}, 100`);

        txtInProgress.textContent = metrics.inProgressCount.toLocaleString();
        txtInProgressPct.textContent = metrics.inProgressPct.toFixed(1) + '%';
        if(nodeRadialInProgress) nodeRadialInProgress.setAttribute('stroke-dasharray', `${metrics.inProgressPct.toFixed(0)}, 100`);

        txtNotTrained.textContent = metrics.notTrainedCount.toLocaleString();
        txtNotTrainedPct.textContent = metrics.notTrainedPct.toFixed(1) + '%';
        if(nodeRadialNotTrained) nodeRadialNotTrained.setAttribute('stroke-dasharray', `${metrics.notTrainedPct.toFixed(0)}, 100`);

        txtExceeded72.textContent = metrics.sla72hBreachCount.toLocaleString();
        txtExceeded72Pct.textContent = metrics.sla72hBreachRate.toFixed(1) + '%';

        txtSignedCount.textContent = metrics.signedCount.toLocaleString();
        txtNotSignedCount.textContent = metrics.declPendingCount.toLocaleString();

        renderPureSpecialization(rawRecords);
        calculateGovernorateLeaderboards(rawRecords);
    }

    // Dynamic Specialization Parser
    function renderPureSpecialization(data) {
        const segments = ['Loan Officer MF', 'Loan Officer CF', 'Gam3ya', 'Investment'];
        const colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B'];
        const valuesMap = { 'Loan Officer MF': 0, 'Loan Officer CF': 0, 'Gam3ya': 0, 'Investment': 0 };
        
        let totalValid = 0;
        data.forEach(row => {
            const spec = row['Specialized'] ? row['Specialized'].trim().toLowerCase() : '';
            if (!spec) return;

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
                valuesMap['Loan Officer MF']++;
                totalValid++;
            }
        });

        if(!nodeSpecBar || !nodeSpecLegend) return;
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

    // Master Historical SVG Timeline Chart Engine
    function renderPremiumLineChart(data) {
        if(!nodeLineChartContainer) return;
        const timeRegistry = {};
        data.forEach(row => {
            const key = parseMonthKey(row['Hiring Date']);
            if (key) {
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

    // Leaderboards Processing - Tab 1
    function calculateGovernorateLeaderboards(data) {
        const processingMap = {};
        data.forEach(row => {
            const gov = row['Governorate'] ? row['Governorate'].trim() : '';
            if (!gov) return;
            if (!processingMap[gov]) processingMap[gov] = { eligible: 0, trained: 0 };

            if (row['Training Status'] !== 'Resigned') {
                processingMap[gov].eligible++;
                if ((row['Training Status'] || '').includes('100%')) {
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
        if(!domAnchor) return;
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

    // ==========================================================================
    // TAB 2: ANALYTICS CORE PROCESSING PIPELINE
    // ==========================================================================

    function processTab2AnalyticsPipeline(data, centralMetrics) {
        renderCompactOnboardingFlow(centralMetrics);
        renderDailyHiringAnalysis(data, centralMetrics.totalNewHired);
        renderGovMatrixAndScatter(data);
        renderResignationAnalysis(data);
        renderExecutiveInsights(data, centralMetrics);
    }

    function renderCompactOnboardingFlow(m) {
        const wrapper = document.getElementById('flow-strip-wrapper');
        if (!wrapper) return;

        const activePct = m.totalNewHired > 0 ? ((m.effectivePopulation / m.totalNewHired) * 100).toFixed(1) : '0.0';

        wrapper.innerHTML = `
            <div class="flow-step-item">
                <span class="flow-step-pct">100%</span>
                <span class="flow-step-title">TOTAL HIRED</span>
                <span class="flow-step-sub">${m.totalNewHired.toLocaleString()} employees</span>
            </div>

            <div class="flow-arrow-separator">→</div>

            <div class="flow-step-item">
                <span class="flow-step-pct text-danger">${m.resignedPct.toFixed(1)}%</span>
                <span class="flow-step-title">RESIGNED</span>
                <span class="flow-step-sub">${m.resignedCount.toLocaleString()} of total hired</span>
            </div>

            <div class="flow-arrow-separator">→</div>

            <div class="flow-step-item">
                <span class="flow-step-pct text-purple">${activePct}%</span>
                <span class="flow-step-title">ACTIVE POPULATION</span>
                <span class="flow-step-sub">${m.effectivePopulation.toLocaleString()} remaining</span>
            </div>

            <div class="flow-arrow-separator">→</div>

            <div class="flow-group-box">
                <span class="flow-group-title">TRAINING STATUS (% of Active)</span>
                <div class="flow-group-row">
                    <div class="flow-sub-stat">
                        <span class="stat-pct text-success">${m.trainedPct.toFixed(1)}%</span>
                        <span class="stat-lbl">Trained (${m.trainedCount})</span>
                    </div>
                    <div class="flow-sub-stat">
                        <span class="stat-pct text-orange-main">${m.inProgressPct.toFixed(1)}%</span>
                        <span class="stat-lbl">In Progress (${m.inProgressCount})</span>
                    </div>
                    <div class="flow-sub-stat">
                        <span class="stat-pct text-muted">${m.notTrainedPct.toFixed(1)}%</span>
                        <span class="stat-lbl">Not Trained (${m.notTrainedCount})</span>
                    </div>
                </div>
            </div>

            <div class="flow-arrow-separator">→</div>

            <div class="flow-group-box">
                <span class="flow-group-title">FOLLOW-UP (% of Active Base)</span>
                <div class="flow-group-row">
                    <div class="flow-sub-stat">
                        <span class="stat-pct text-danger">${m.sla72hBreachRate.toFixed(1)}%</span>
                        <span class="stat-lbl">72h Breach (${m.sla72hBreachCount})</span>
                    </div>
                    <div class="flow-sub-stat">
                        <span class="stat-pct text-warning">${m.questOverdueRate.toFixed(1)}%</span>
                        <span class="stat-lbl">Quest. Overdue (${m.questOverdueCount})</span>
                    </div>
                    <div class="flow-sub-stat">
                        <span class="stat-pct">${m.declPendingRate.toFixed(1)}%</span>
                        <span class="stat-lbl">Decl. Pending (${m.declPendingCount})</span>
                    </div>
                </div>
            </div>
        `;
    }

    function formatShortDate(dateStr) {
        if (!dateStr) return '';
        let d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) d = new Date(parts[0], parts[1] - 1, parts[2]);
                else d = new Date(parts[2], parts[0] - 1, parts[1]);
            }
        }
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }

    function formatFullDate(dateStr) {
        if (!dateStr) return '';
        let d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) d = new Date(parts[0], parts[1] - 1, parts[2]);
                else d = new Date(parts[2], parts[0] - 1, parts[1]);
            }
        }
        if (isNaN(d.getTime())) return dateStr;
        return {
            dateStr: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' })
        };
    }

    function renderDailyHiringAnalysis(data, totalHired) {
        const dailyMap = {};
        const govSet = new Set();

        data.forEach(r => {
            const dateStr = r['Hiring Date'] ? r['Hiring Date'].trim() : '';
            if (dateStr) dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
            if (r['Governorate']) govSet.add(r['Governorate'].trim());
        });

        const sortedDates = Object.keys(dailyMap).sort();
        let peakDay = 'N/A';
        let peakCount = 0;

        sortedDates.forEach(d => {
            if (dailyMap[d] > peakCount) {
                peakCount = dailyMap[d];
                peakDay = d;
            }
        });

        const avgDaily = sortedDates.length > 0 ? (totalHired / sortedDates.length) : 0;

        const subTitleEl = document.getElementById('daily-hiring-subtitle');
        if (subTitleEl) {
            subTitleEl.textContent = `New hires by hiring date • Avg ${avgDaily.toFixed(1)} hires/day`;
        }

        document.getElementById('cap-total-hired').textContent = totalHired.toLocaleString();
        document.getElementById('cap-active-govs').textContent = govSet.size;
        document.getElementById('cap-avg-daily').textContent = avgDaily.toFixed(1);
        document.getElementById('cap-peak-day').textContent = formatShortDate(peakDay);
        document.getElementById('cap-peak-cnt').textContent = peakCount.toLocaleString();

        const chartBox = document.getElementById('daily-hiring-chart');
        if (!chartBox) return;

        if (sortedDates.length === 0) {
            chartBox.innerHTML = '<div style="text-align:center; padding-top:80px; font-size:12px; color:var(--text-muted)">No hiring date data available</div>';
            return;
        }

        const maxIntake = Math.max(...Object.values(dailyMap), 1);
        const svgW = 600; const svgH = 220;
        const pL = 40; const pR = 25; const pT = 35; const pB = 30;
        const cW = svgW - pL - pR; const cH = svgH - pT - pB;

        const totalBars = sortedDates.length;
        const barStep = cW / totalBars;
        const barWidth = Math.max(4, barStep - 4);

        let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">`;
        
        const avgY = pT + cH - ((avgDaily / maxIntake) * cH);
        svg += `<line x1="${pL}" y1="${avgY}" x2="${pL + cW}" y2="${avgY}" stroke="var(--brand-purple)" stroke-dasharray="4,4" stroke-width="1.5"/>`;
        svg += `<line x1="${pL}" y1="${pT + cH}" x2="${pL + cW}" y2="${pT + cH}" stroke="var(--border-color)" stroke-width="1"/>`;

        const labelInterval = Math.ceil(totalBars / 8);

        sortedDates.forEach((d, idx) => {
            const cnt = dailyMap[d];
            const x = pL + (idx * barStep) + (barStep - barWidth) / 2;
            const barH = (cnt / maxIntake) * cH;
            const y = pT + cH - barH;
            const isPeak = d === peakDay;
            const barColor = isPeak ? 'var(--brand-purple)' : '#CBD5E1';

            const fullD = formatFullDate(d);
            const pctTotal = ((cnt / totalHired) * 100).toFixed(1);

            const ttHtml = `
                <div class="tt-title">${fullD.dateStr} (${fullD.dayOfWeek})</div>
                <div class="tt-row"><span>Hires:</span> <strong>${cnt}</strong></div>
                <div class="tt-row"><span>Share of Total:</span> <strong>${pctTotal}%</strong></div>
            `;

            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${barColor}" rx="2" class="interactive-bar" style="cursor:pointer; transition: opacity 0.2s;" data-tt="${encodeURIComponent(ttHtml)}"></rect>`;

            if (isPeak) {
                svg += `
                    <rect x="${Math.max(pL, x + barWidth/2 - 40)}" y="${Math.max(8, y - 22)}" width="80" height="18" fill="var(--brand-purple)" rx="4"/>
                    <text x="${Math.max(pL + 40, x + barWidth/2)}" y="${Math.max(20, y - 10)}" fill="#FFFFFF" font-size="9" font-weight="700" text-anchor="middle">${cnt} Hires (Peak)</text>
                `;
            }

            if (idx % labelInterval === 0 || idx === totalBars - 1) {
                svg += `<text x="${x + barWidth/2}" y="${pT + cH + 16}" fill="var(--text-muted)" font-size="9" font-weight="500" text-anchor="middle">${formatShortDate(d)}</text>`;
            }
        });

        svg += `</svg>`;
        chartBox.innerHTML = svg;

        chartBox.querySelectorAll('.interactive-bar').forEach(rect => {
            const content = decodeURIComponent(rect.getAttribute('data-tt'));
            rect.addEventListener('mouseenter', (e) => { rect.style.opacity = '0.7'; showTooltip(e, content); });
            rect.addEventListener('mousemove', (e) => { showTooltip(e, content); });
            rect.addEventListener('mouseleave', () => { rect.style.opacity = '1'; hideTooltip(); });
            rect.addEventListener('click', (e) => { showTooltip(e, content); });
        });
    }

    function calculateMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function renderGovMatrixAndScatter(data) {
        const govMap = {};

        data.forEach(r => {
            const gov = r['Governorate'] ? r['Governorate'].trim() : 'Unknown';
            if (!govMap[gov]) {
                govMap[gov] = {
                    hired: 0, resigned: 0, effective: 0,
                    trained: 0, inProgress: 0, notTrained: 0,
                    slaBreach: 0, questOverdue: 0, declPending: 0
                };
            }

            govMap[gov].hired++;
            const status = (r['Training Status'] || '').trim();

            if (status.toLowerCase() === 'resigned') {
                govMap[gov].resigned++;
            } else {
                govMap[gov].effective++;
                if (status.includes('100%')) {
                    govMap[gov].trained++;
                    if (!r['Survey Result'] || r['Survey Result'].trim().toLowerCase() !== 'signed') {
                        govMap[gov].declPending++;
                    }
                } else if (status !== '') {
                    govMap[gov].inProgress++;
                } else {
                    govMap[gov].notTrained++;
                    if (r['72 hours'] && r['72 hours'].includes('Exceeded')) {
                        govMap[gov].slaBreach++;
                    }
                }

                if (isQuestionnaireExceeded(r)) {
                    govMap[gov].questOverdue++;
                }
            }
        });

        const matrixArray = [];
        const volumes = [];
        const rates = [];

        for (const g in govMap) {
            const item = govMap[g];
            const eff = item.effective;
            const trPct = eff > 0 ? (item.trained / eff) * 100 : 0;
            const prPct = eff > 0 ? (item.inProgress / eff) * 100 : 0;
            const ntPct = eff > 0 ? (item.notTrained / eff) * 100 : 0;
            const resPct = item.hired > 0 ? (item.resigned / item.hired) * 100 : 0;

            matrixArray.push({
                gov: g, hired: item.hired, resigned: item.resigned, resPct: resPct, eff: eff,
                trained: item.trained, trPct: trPct,
                inProgress: item.inProgress, prPct: prPct,
                notTrained: item.notTrained, ntPct: ntPct,
                slaBreach: item.slaBreach, questOverdue: item.questOverdue, declPending: item.declPending
            });

            if (eff > 0) {
                volumes.push(eff);
                rates.push(trPct);
            }
        }

        const medianVol = calculateMedian(volumes);
        const medianRate = calculateMedian(rates);

        renderScatterPlot(matrixArray, medianVol, medianRate);
        renderPerformanceCallouts(matrixArray, medianVol, medianRate);
        renderGovTableDOM(matrixArray);
    }

    function renderPerformanceCallouts(array, medianVol, medianRate) {
        if (array.length === 0) return;

        const largest = [...array].sort((a,b) => b.eff - a.eff)[0];
        document.getElementById('callout-largest-gov').textContent = largest ? largest.gov : '-';
        document.getElementById('callout-largest-pop').textContent = largest ? `${largest.eff.toLocaleString()} active employees` : '0';

        const scaleGroup = array.filter(a => a.eff >= medianVol);
        const highestScale = scaleGroup.sort((a,b) => b.trPct - a.trPct)[0];
        document.getElementById('callout-scale-gov').textContent = highestScale ? highestScale.gov : '-';
        document.getElementById('callout-scale-rate').textContent = highestScale ? `${highestScale.trPct.toFixed(1)}% completion (${highestScale.eff} active)` : '-';

        const highLowGroup = array.filter(a => a.eff >= medianVol && a.trPct < medianRate);
        const highLow = highLowGroup.sort((a,b) => b.eff - a.eff)[0];
        document.getElementById('callout-highlow-gov').textContent = highLow ? highLow.gov : 'None matching';
        document.getElementById('callout-highlow-info').textContent = highLow ? `${highLow.trPct.toFixed(1)}% completion (${highLow.eff} active)` : 'No governorates match profile';

        const highestNotTrained = [...array].sort((a,b) => b.notTrained - a.notTrained)[0];
        document.getElementById('callout-nottrained-gov').textContent = highestNotTrained ? highestNotTrained.gov : '-';
        document.getElementById('callout-nottrained-cnt').textContent = highestNotTrained ? `${highestNotTrained.notTrained} employees (${highestNotTrained.ntPct.toFixed(1)}%)` : '0';
    }

    function renderScatterPlot(matrixArray, medVol, medRate) {
        const box = document.getElementById('scatter-plot-container');
        if (!box) return;

        const svgW = 600; const svgH = 350;
        const pL = 65; const pR = 35; const pT = 45; const pB = 45;
        const cW = svgW - pL - pR; const cH = svgH - pT - pB;

        const maxVol = Math.max(...matrixArray.map(m => m.eff), 1);

        const yPlotMin = pT + 30;
        const yPlotMax = pT + cH - 15;
        const yPlotH = yPlotMax - yPlotMin;

        const medX = pL + ((medVol / maxVol) * cW);
        const medY = yPlotMax - ((medRate / 100) * yPlotH);

        let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">`;
        
        svg += `<line x1="${pL}" y1="${pT + cH}" x2="${pL + cW}" y2="${pT + cH}" stroke="var(--border-color)"/>`;
        svg += `<line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT + cH}" stroke="var(--border-color)"/>`;

        svg += `<text x="${pL + cW/2}" y="${pT + cH + 32}" fill="var(--text-muted)" font-size="9.5" font-weight="700" text-anchor="middle">ONBOARDING POPULATION (Lower Volume → Higher Volume)</text>`;
        svg += `<text x="${14}" y="${pT + cH/2}" fill="var(--text-muted)" font-size="9.5" font-weight="700" text-anchor="middle" transform="rotate(-90 14 ${pT + cH/2})">TRAINING COMPLETION % (Lower → Higher)</text>`;

        svg += `<line x1="${medX}" y1="${pT + 22}" x2="${medX}" y2="${pT + cH - 20}" stroke="#CBD5E1" stroke-dasharray="4,4"/>`;
        svg += `<line x1="${pL}" y1="${medY}" x2="${pL + cW}" y2="${medY}" stroke="#CBD5E1" stroke-dasharray="4,4"/>`;

        svg += `<text x="${pL + 6}" y="${pT + 12}" fill="#0F172A" font-size="8.5" font-weight="700">HIGHER COMPLETION</text>`;
        svg += `<text x="${pL + 6}" y="${pT + 21}" fill="var(--text-muted)" font-size="7.5" font-weight="500">Lower Volume</text>`;

        svg += `<text x="${pL + cW - 6}" y="${pT + 12}" fill="#0F172A" font-size="8.5" font-weight="700" text-anchor="end">HIGHER COMPLETION</text>`;
        svg += `<text x="${pL + cW - 6}" y="${pT + 21}" fill="var(--text-muted)" font-size="7.5" font-weight="500" text-anchor="end">Higher Volume</text>`;

        svg += `<text x="${pL + 6}" y="${pT + cH - 12}" fill="#0F172A" font-size="8.5" font-weight="700">LOWER COMPLETION</text>`;
        svg += `<text x="${pL + 6}" y="${pT + cH - 4}" fill="var(--text-muted)" font-size="7.5" font-weight="500">Lower Volume</text>`;

        svg += `<text x="${pL + cW - 6}" y="${pT + cH - 12}" fill="#0F172A" font-size="8.5" font-weight="700" text-anchor="end">LOWER COMPLETION</text>`;
        svg += `<text x="${pL + cW - 6}" y="${pT + cH - 4}" fill="var(--text-muted)" font-size="7.5" font-weight="500" text-anchor="end">Higher Volume</text>`;

        const sortedByVol = [...matrixArray].sort((a,b) => b.eff - a.eff);
        const sortedByRate = [...matrixArray].sort((a,b) => b.trPct - a.trPct);

        const highlightSet = new Set();
        if (sortedByVol[0]) highlightSet.add(sortedByVol[0].gov);
        if (sortedByVol[1]) highlightSet.add(sortedByVol[1].gov);
        if (sortedByRate[0]) highlightSet.add(sortedByRate[0].gov);
        if (sortedByRate[sortedByRate.length - 1]) highlightSet.add(sortedByRate[sortedByRate.length - 1].gov);

        const pointCoords = [];
        matrixArray.forEach(item => {
            if (item.eff === 0) return;
            const cx = pL + ((item.eff / maxVol) * cW);
            const cy = yPlotMax - ((item.trPct / 100) * yPlotH);
            pointCoords.push({ ...item, cx, cy, isHighlight: highlightSet.has(item.gov) });
        });

        const placedLabels = [];

        pointCoords.forEach(item => {
            const ttContent = `
                <div class="tt-title">${item.gov}</div>
                <div class="tt-row"><span>Hired:</span> <strong>${item.hired}</strong></div>
                <div class="tt-row"><span>Active Population:</span> <strong>${item.eff}</strong></div>
                <div class="tt-row"><span>Trained:</span> <strong>${item.trained} (${item.trPct.toFixed(1)}%)</strong></div>
                <div class="tt-row"><span>In Progress:</span> <strong>${item.inProgress} (${item.prPct.toFixed(1)}%)</strong></div>
                <div class="tt-row"><span>Not Trained:</span> <strong>${item.notTrained} (${item.ntPct.toFixed(1)}%)</strong></div>
                <div class="tt-row"><span>Resigned:</span> <strong>${item.resigned} (${item.resPct.toFixed(1)}%)</strong></div>
            `;

            svg += `
                <circle cx="${item.cx}" cy="${item.cy}" r="${item.isHighlight ? '6' : '4.5'}" 
                        fill="${item.isHighlight ? 'var(--brand-purple)' : '#94A3B8'}" 
                        stroke="#FFFFFF" stroke-width="1.5" class="gov-map-dot"
                        style="cursor:pointer; transition: transform 0.2s, fill 0.2s;"
                        data-tt="${encodeURIComponent(ttContent)}">
                </circle>
            `;

            if (item.isHighlight) {
                const candidates = [
                    { dx: 0, dy: -10, anchor: 'middle' },
                    { dx: 0, dy: 14, anchor: 'middle' },
                    { dx: 10, dy: 3, anchor: 'start' },
                    { dx: -10, dy: 3, anchor: 'end' },
                    { dx: 8, dy: -8, anchor: 'start' },
                    { dx: -8, dy: -8, anchor: 'end' },
                    { dx: 8, dy: 10, anchor: 'start' },
                    { dx: -8, dy: 10, anchor: 'end' }
                ];

                let bestCand = candidates[0];
                let maxMinDist = -1;

                for (const cand of candidates) {
                    const lx = item.cx + cand.dx;
                    const ly = item.cy + cand.dy;

                    if (lx < pL + 15 || lx > pL + cW - 15 || ly < pT + 25 || ly > pT + cH - 15) continue;

                    let minDist = 9999;
                    for (const pt of pointCoords) {
                        const d = Math.hypot(pt.cx - lx, pt.cy - ly);
                        if (d < minDist) minDist = d;
                    }
                    for (const lbl of placedLabels) {
                        const d = Math.hypot(lbl.x - lx, lbl.y - ly);
                        if (d < minDist) minDist = d;
                    }

                    if (minDist > maxMinDist) {
                        maxMinDist = minDist;
                        bestCand = cand;
                    }
                }

                const finalX = Math.max(pL + 15, Math.min(pL + cW - 15, item.cx + bestCand.dx));
                const finalY = Math.max(pT + 25, Math.min(pT + cH - 15, item.cy + bestCand.dy));

                placedLabels.push({ x: finalX, y: finalY, name: item.gov });
                svg += `<text x="${finalX}" y="${finalY}" font-size="8.5" fill="var(--text-main)" text-anchor="${bestCand.anchor}" font-weight="700" style="pointer-events:none;" stroke="#FFFFFF" stroke-width="3" paint-order="stroke fill" stroke-linejoin="round">${item.gov}</text>`;
            }
        });

        const popMedY = pT + cH - 18;
        svg += `
            <rect x="${medX + 2}" y="${popMedY - 8}" width="95" height="11" fill="var(--card-bg)" opacity="0.92" rx="2"/>
            <text x="${medX + 4}" y="${popMedY}" font-size="8" fill="var(--brand-purple)" font-weight="700">Population Median: ${medVol.toFixed(0)}</text>
        `;

        const compMedY = Math.max(pT + 30, Math.min(pT + cH - 25, medY - 4));
        svg += `
            <rect x="${pL + 4}" y="${compMedY - 8}" width="105" height="11" fill="var(--card-bg)" opacity="0.92" rx="2"/>
            <text x="${pL + 6}" y="${compMedY}" font-size="8" fill="var(--brand-purple)" font-weight="700" text-anchor="start">Completion Median: ${medRate.toFixed(1)}%</text>
        `;

        svg += `</svg>`;
        box.innerHTML = svg;

        box.querySelectorAll('.gov-map-dot').forEach(dot => {
            const content = decodeURIComponent(dot.getAttribute('data-tt'));
            dot.addEventListener('mouseenter', (e) => {
                dot.setAttribute('r', '8.5');
                dot.setAttribute('fill', 'var(--brand-purple)');
                showTooltip(e, content);
            });
            dot.addEventListener('mousemove', (e) => { showTooltip(e, content); });
            dot.addEventListener('mouseleave', () => {
                dot.setAttribute('r', dot.nextElementSibling && dot.nextElementSibling.tagName === 'text' ? '6' : '4.5');
                dot.setAttribute('fill', dot.nextElementSibling && dot.nextElementSibling.tagName === 'text' ? 'var(--brand-purple)' : '#94A3B8');
                hideTooltip();
            });
            dot.addEventListener('click', (e) => { showTooltip(e, content); });
        });
    }

    function renderGovTableDOM(array) {
        const tbody = document.getElementById('gov-matrix-tbody');
        if (!tbody) return;

        const k = currentGovMatrixSort.key;
        const dir = currentGovMatrixSort.dir === 'asc' ? 1 : -1;

        array.sort((a, b) => {
            let valA = a[k];
            let valB = b[k];
            if (typeof valA === 'string') return valA.localeCompare(valB) * dir;
            return (valA - valB) * dir;
        });

        tbody.innerHTML = '';
        array.forEach(r => {
            const isSmall = r.eff > 0 && r.eff < 5;
            const smallBadge = isSmall ? `<span class="small-pop-badge">Small Base</span>` : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${r.gov}</strong> ${smallBadge}</td>
                <td>${r.hired}</td>
                <td class="text-danger">${r.resigned}</td>
                <td><strong>${r.eff}</strong></td>
                <td><strong>${r.trPct.toFixed(1)}%</strong> (${r.trained})</td>
                <td class="text-orange-main">${r.prPct.toFixed(1)}% (${r.inProgress})</td>
                <td class="text-muted">${r.ntPct.toFixed(1)}% (${r.notTrained})</td>
                <td class="text-danger">${r.slaBreach}</td>
                <td class="text-warning">${r.questOverdue}</td>
                <td>${r.declPending}</td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('#gov-matrix-table th').forEach(th => {
            th.onclick = () => {
                const sortKey = th.getAttribute('data-sort');
                if (currentGovMatrixSort.key === sortKey) {
                    currentGovMatrixSort.dir = currentGovMatrixSort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    currentGovMatrixSort.key = sortKey;
                    currentGovMatrixSort.dir = 'desc';
                }
                renderGovTableDOM(array);
            };
        });
    }

    function renderResignationAnalysis(data) {
        const govMap = {};
        const specMap = {};

        data.forEach(r => {
            const g = r['Governorate'] ? r['Governorate'].trim() : 'Unknown';
            const s = r['Specialized'] ? r['Specialized'].trim() : 'General';
            const isResigned = (r['Training Status'] || '').trim().toLowerCase() === 'resigned';

            if (!govMap[g]) govMap[g] = { total: 0, resigned: 0 };
            if (!specMap[s]) specMap[s] = { total: 0, resigned: 0 };

            govMap[g].total++;
            specMap[s].total++;

            if (isResigned) {
                govMap[g].resigned++;
                specMap[s].resigned++;
            }
        });

        const govList = Object.keys(govMap)
            .filter(g => govMap[g].resigned > 0)
            .map(g => ({
                name: g,
                cnt: govMap[g].resigned,
                rate: (govMap[g].resigned / govMap[g].total) * 100
            }))
            .sort((a,b) => b.cnt - a.cnt);

        const specList = Object.keys(specMap)
            .filter(s => specMap[s].resigned > 0)
            .map(s => ({
                name: s,
                cnt: specMap[s].resigned,
                rate: (specMap[s].resigned / specMap[s].total) * 100
            }))
            .sort((a,b) => b.cnt - a.cnt);

        renderSimpleLeaderboard(document.getElementById('resignation-gov-list'), govList, 'var(--red)');
        renderSimpleLeaderboard(document.getElementById('resignation-spec-list'), specList, 'var(--orange)');
    }

    function renderSimpleLeaderboard(anchor, list, color) {
        if (!anchor) return;
        anchor.innerHTML = '';
        if (list.length === 0) {
            anchor.innerHTML = `<div style="font-size:11px; color:var(--text-muted); padding:8px 0;">No resignations logged</div>`;
            return;
        }

        list.slice(0, 5).forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'leader-row-item';
            row.innerHTML = `
                <div class="leader-rank-badge">${idx + 1}</div>
                <div class="leader-region-name" title="${item.name}">${item.name}</div>
                <div class="leader-track-bar">
                    <div class="leader-fill-bar" style="width: ${Math.min(item.rate, 100)}%; background-color: ${color};"></div>
                </div>
                <div class="leader-pct-value" style="width:70px; text-align:right;">${item.cnt} (${item.rate.toFixed(1)}%)</div>
            `;
            anchor.appendChild(row);
        });
    }

    function renderExecutiveInsights(data, metrics) {
        const container = document.getElementById('executive-insights-grid');
        if (!container) return;

        const candidates = [];

        const dailyMap = {};
        data.forEach(r => {
            const d = r['Hiring Date'] ? r['Hiring Date'].trim() : '';
            if (d) dailyMap[d] = (dailyMap[d] || 0) + 1;
        });
        const sortedDays = Object.keys(dailyMap).sort((a,b) => dailyMap[b] - dailyMap[a]);
        if (sortedDays.length > 0 && metrics.totalNewHired > 0) {
            const peakD = sortedDays[0];
            const peakC = dailyMap[peakD];
            const peakPct = ((peakC / metrics.totalNewHired) * 100).toFixed(1);
            const avg = (metrics.totalNewHired / Object.keys(dailyMap).length).toFixed(1);

            candidates.push({
                priority: 1,
                title: `Hiring concentrated on ${formatShortDate(peakD)}`,
                tag: "Hiring Intake",
                text: `${peakC} employees were hired on ${formatShortDate(peakD)}, representing ${peakPct}% of total hiring and over ${(peakC / avg).toFixed(1)}× the daily average (${avg} hires/day).`
            });
        }

        const govCounts = {};
        data.forEach(r => {
            if ((r['Training Status'] || '').trim().toLowerCase() !== 'resigned') {
                const g = r['Governorate'] ? r['Governorate'].trim() : 'Unknown';
                govCounts[g] = (govCounts[g] || 0) + 1;
            }
        });
        const topGovByPop = Object.keys(govCounts).sort((a,b) => govCounts[b] - govCounts[a])[0];
        if (topGovByPop && metrics.effectivePopulation > 0) {
            const cnt = govCounts[topGovByPop];
            const pct = ((cnt / metrics.effectivePopulation) * 100).toFixed(1);
            candidates.push({
                priority: 2,
                title: `${topGovByPop} carries the largest active onboarding population`,
                tag: "Workforce Scale",
                text: `${topGovByPop} accounts for ${cnt} active employees, representing ${pct}% of the total effective onboarding population.`
            });
        }

        const ntGovMap = {};
        data.forEach(r => {
            if (!r['Training Status'] || r['Training Status'].trim() === '') {
                const g = r['Governorate'] ? r['Governorate'].trim() : 'Unknown';
                ntGovMap[g] = (ntGovMap[g] || 0) + 1;
            }
        });
        const topNtGov = Object.keys(ntGovMap).sort((a,b) => ntGovMap[b] - ntGovMap[a])[0];
        if (topNtGov) {
            const ntCnt = ntGovMap[topNtGov];
            const totalInGov = govCounts[topNtGov] || 1;
            const share = ((ntCnt / totalInGov) * 100).toFixed(1);
            candidates.push({
                priority: 3,
                title: `Not-trained cases are concentrated in specific governorates`,
                tag: "Training Backlog",
                text: `${topNtGov} records ${ntCnt} not-trained employees, representing ${share}% of its active onboarding workforce.`
            });
        }

        if (metrics.sla72hBreachCount > 0) {
            candidates.push({
                priority: 4,
                title: `72h SLA breaches affect initial onboarding stage`,
                tag: "SLA Overview",
                text: `Currently ${metrics.sla72hBreachCount} recruits (${metrics.sla72hBreachRate.toFixed(1)}% of effective population) remain in the 72h breach state.`
            });
        }

        container.innerHTML = '';
        candidates.slice(0, 4).forEach(ins => {
            const card = document.createElement('div');
            card.className = 'insight-card-item';
            card.innerHTML = `
                <div class="insight-head">
                    <span class="insight-title">${ins.title}</span>
                    <span class="insight-tag">${ins.tag}</span>
                </div>
                <p class="insight-body-text">${ins.text}</p>
            `;
            container.appendChild(card);
        });
    }

    // ==========================================================================
    // TAB 3: SUPERVISOR PERFORMANCE CORE PIPELINE
    // ==========================================================================

    function findColumnName(sampleRow, candidates) {
        if (!sampleRow) return '';
        const keys = Object.keys(sampleRow);
        for (const cand of candidates) {
            const found = keys.find(k => k.trim().toLowerCase() === cand.toLowerCase() || k.trim().toLowerCase().includes(cand.toLowerCase()));
            if (found) return found;
        }
        return '';
    }

    function parseFinalResult(valStr) {
        if (valStr === undefined || valStr === null) return null;
        let str = String(valStr).trim();
        if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return null;
        
        str = str.replace('%', '').trim();
        let num = parseFloat(str);
        if (isNaN(num)) return null;

        if (num <= 1.0 && num > 0) {
            num = num * 100;
        }
        return num;
    }

    function aggregateSupervisorData(rawRecords) {
        if (rawRecords.length === 0) return { supervisors: [], rawValids: [] };

        const sample = rawRecords[0];
        const supCol = findColumnName(sample, ['Supervisor Name', 'Supervisor', 'Direct Manager', 'Manager']);
        const govCol = findColumnName(sample, ['Gov', 'Governorate', 'Region', 'Branch Governorate']);
        const officerCol = findColumnName(sample, ['Officer HR Code', 'HR Code', 'Officer Code', 'Officer Name', 'Employee ID']);
        const branchCol = findColumnName(sample, ['Branch', 'Branch Name', 'Branch Code']);
        const resultCol = findColumnName(sample, ['Final Result', 'KPI Result', 'Average Result', 'Result']);

        const supMap = {};
        const rawValids = [];

        rawRecords.forEach(row => {
            const supName = row[supCol] ? row[supCol].trim() : '';
            if (!supName) return;

            const gov = row[govCol] ? row[govCol].trim() : 'Unknown';
            const officerId = row[officerCol] ? row[officerCol].trim() : null;
            const branchId = row[branchCol] ? row[branchCol].trim() : null;
            const rawRes = row[resultCol];
            const parsedRes = parseFinalResult(rawRes);

            if (parsedRes !== null) {
                rawValids.push(parsedRes);
            }

            if (!supMap[supName]) {
                supMap[supName] = {
                    supervisor: supName,
                    governorate: gov,
                    officersSet: new Set(),
                    branchesSet: new Set(),
                    evaluatedCount: 0,
                    validResultsSum: 0
                };
            }

            if (officerId) supMap[supName].officersSet.add(officerId);
            if (branchId) supMap[supName].branchesSet.add(branchId);

            if (parsedRes !== null) {
                supMap[supName].evaluatedCount++;
                supMap[supName].validResultsSum += parsedRes;
            }
        });

        const compiledSupervisors = Object.values(supMap).map(s => {
            const uniqueOfficers = s.officersSet.size;
            const uniqueBranches = s.branchesSet.size;
            const evaluatedOfficers = s.evaluatedCount;
            const avgFinalResult = evaluatedOfficers > 0 ? (s.validResultsSum / evaluatedOfficers) : null;
            const evaluationCoverage = uniqueOfficers > 0 ? (evaluatedOfficers / uniqueOfficers) * 100 : 0;

            return {
                supervisor: s.supervisor,
                governorate: s.governorate,
                uniqueOfficers,
                uniqueBranches,
                evaluatedOfficers,
                avgFinalResult,
                evaluationCoverage
            };
        });

        return { supervisors: compiledSupervisors, rawValids };
    }

    function processTab3SupervisorPipeline(supRecords) {
        const { supervisors, rawValids } = aggregateSupervisorData(supRecords);
        supervisorDataset = supervisors;

        renderSupervisorExecutiveSummary(supervisors, rawValids);
        renderHQValidationSection(supRecords);
        renderSupervisorPerformanceMapAndHighlights(supervisors);
        renderPerformanceAndWorkloadDistributions(supervisors);
        renderSupervisionByGovernorate(supervisors, supRecords);
        populateSupervisorGovFilter(supervisors);
        renderSupervisorDetailsTable(supervisors);
        renderSupervisorInsights(supervisors, supRecords);
    }

    function renderSupervisorExecutiveSummary(supervisors, rawValids) {
        const container = document.getElementById('sup-exec-summary');
        if (!container) return;

        const totalSupervisors = supervisors.length;
        const govSet = new Set(supervisors.map(s => s.governorate));
        const activeGovs = govSet.size;

        const totalOfficers = supervisors.reduce((acc, s) => acc + s.uniqueOfficers, 0);
        const totalBranches = supervisors.reduce((acc, s) => acc + s.uniqueBranches, 0);

        const avgOfficersPerSup = totalSupervisors > 0 ? (totalOfficers / totalSupervisors) : 0;
        const avgBranchesPerSup = totalSupervisors > 0 ? (totalBranches / totalSupervisors) : 0;

        const overallAvgResult = rawValids.length > 0 ? (rawValids.reduce((a, b) => a + b, 0) / rawValids.length) : 0;

        const totalEvaluated = supervisors.reduce((acc, s) => acc + s.evaluatedOfficers, 0);
        const overallCoverage = totalOfficers > 0 ? (totalEvaluated / totalOfficers) * 100 : 0;

        container.innerHTML = `
            <div class="sup-exec-card">
                <span class="sup-card-lbl">Total Supervisors</span>
                <span class="sup-card-val">${totalSupervisors.toLocaleString()}</span>
                <span class="sup-card-sub">Active managers</span>
            </div>
            <div class="sup-exec-card">
                <span class="sup-card-lbl">Active Governorates</span>
                <span class="sup-card-val">${activeGovs}</span>
                <span class="sup-card-sub">Geographic coverage</span>
            </div>
            <div class="sup-exec-card">
                <span class="sup-card-lbl">Branches Covered</span>
                <span class="sup-card-val">${totalBranches.toLocaleString()}</span>
                <span class="sup-card-sub">Avg ${avgBranchesPerSup.toFixed(1)} / Sup</span>
            </div>
            <div class="sup-exec-card">
                <span class="sup-card-lbl">Officers Covered</span>
                <span class="sup-card-val">${totalOfficers.toLocaleString()}</span>
                <span class="sup-card-sub">Avg ${avgOfficersPerSup.toFixed(1)} / Sup</span>
            </div>
            <div class="sup-exec-card">
                <span class="sup-card-lbl">Overall Avg Result</span>
                <span class="sup-card-val text-purple">${overallAvgResult.toFixed(1)}%</span>
                <span class="sup-card-sub">From ${rawValids.length} evaluations</span>
            </div>
            <div class="sup-exec-card">
                <span class="sup-card-lbl">Evaluation Coverage</span>
                <span class="sup-card-val">${overallCoverage.toFixed(1)}%</span>
                <span class="sup-card-sub">${totalEvaluated} of ${totalOfficers} officers</span>
            </div>
        `;
    }

    // ==========================================================================
    // NEW SECTION: HQ VALIDATION CALLS ENGINE
    // ==========================================================================
    function isValidHQVal(val) {
        if (val === undefined || val === null) return false;
        const str = String(val).trim();
        if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'nan') return false;
        return true;
    }

    function renderHQValidationSection(supRecords) {
        const stmtNode = document.getElementById('hq-summary-statement');
        const covNode = document.getElementById('hq-coverage-value');
        const fillNode = document.getElementById('hq-progress-fill');

        if (!supRecords || supRecords.length === 0) {
            if (stmtNode) stmtNode.textContent = `0 of 0 Officers`;
            if (covNode) covNode.textContent = `0.0% Coverage`;
            if (fillNode) fillNode.style.width = `0%`;
            renderHQTable({}, {});
            return;
        }

        const sample = supRecords[0];
        const officerCol = findColumnName(sample, ['Officer HR Code', 'HR Code', 'Officer Code', 'Officer Name', 'Employee ID']);
        const govCol = findColumnName(sample, ['Gov', 'Governorate', 'Region', 'Branch Governorate']);
        const supCol = findColumnName(sample, ['Supervisor Name', 'Supervisor', 'Direct Manager', 'Manager']);
        
        // Exact matching for HQ Call Result column in CSV
        const hqCol = findColumnName(sample, ['HQ Call Result', 'HQ Call', 'HQ Validation', 'Validation']);

        const totalOfficersSet = new Set();
        const calledOfficersSet = new Set();

        const govMap = {};
        const supMap = {};

        supRecords.forEach(row => {
            const officerId = row[officerCol] ? row[officerCol].trim() : null;
            if (!officerId) return;

            const gov = row[govCol] ? row[govCol].trim() : 'Unknown';
            const sup = row[supCol] ? row[supCol].trim() : 'Unknown';
            const hqVal = hqCol ? row[hqCol] : null;

            totalOfficersSet.add(officerId);

            if (!govMap[gov]) govMap[gov] = { name: gov, totalOfficers: new Set(), calledOfficers: new Set() };
            govMap[gov].totalOfficers.add(officerId);

            if (!supMap[sup]) supMap[sup] = { name: sup, gov: gov, totalOfficers: new Set(), calledOfficers: new Set() };
            supMap[sup].totalOfficers.add(officerId);

            if (isValidHQVal(hqVal)) {
                calledOfficersSet.add(officerId);
                govMap[gov].calledOfficers.add(officerId);
                supMap[sup].calledOfficers.add(officerId);
            }
        });

        const totalOfficersCount = totalOfficersSet.size;
        const calledOfficersCount = calledOfficersSet.size;
        const coveragePct = totalOfficersCount > 0 ? (calledOfficersCount / totalOfficersCount) * 100 : 0;

        if (stmtNode) stmtNode.textContent = `${calledOfficersCount.toLocaleString()} of ${totalOfficersCount.toLocaleString()} Officers`;
        if (covNode) covNode.textContent = `${coveragePct.toFixed(1)}% Coverage`;
        if (fillNode) fillNode.style.width = `${Math.min(coveragePct, 100)}%`;

        const btnGov = document.getElementById('hq-toggle-gov');
        const btnSup = document.getElementById('hq-toggle-sup');

        if (btnGov && btnSup) {
            btnGov.onclick = () => {
                hqBreakdownMode = 'gov';
                hqSortConfig = { key: 'name', dir: 'asc' };
                btnGov.classList.add('active');
                btnSup.classList.remove('active');
                renderHQTable(govMap, supMap);
            };
            btnSup.onclick = () => {
                hqBreakdownMode = 'sup';
                hqSortConfig = { key: 'name', dir: 'asc' };
                btnSup.classList.add('active');
                btnGov.classList.remove('active');
                renderHQTable(govMap, supMap);
            };
        }

        renderHQTable(govMap, supMap);
    }

    function renderHQTable(govMap, supMap) {
        const thead = document.getElementById('hq-table-thead');
        const tbody = document.getElementById('hq-table-tbody');
        if (!thead || !tbody) return;

        let dataList = [];

        if (hqBreakdownMode === 'gov') {
            thead.innerHTML = `
                <tr>
                    <th data-hq-sort="name">Governorate ↕</th>
                    <th data-hq-sort="total">Total Unique Officers ↕</th>
                    <th data-hq-sort="calls">HQ Validation Calls ↕</th>
                    <th data-hq-sort="coverage">Coverage % ↕</th>
                </tr>
            `;

            dataList = Object.values(govMap).map(g => {
                const total = g.totalOfficers.size;
                const calls = g.calledOfficers.size;
                const cov = total > 0 ? (calls / total) * 100 : 0;
                return { name: g.name, total, calls, coverage: cov };
            });

        } else {
            thead.innerHTML = `
                <tr>
                    <th data-hq-sort="name">Supervisor ↕</th>
                    <th data-hq-sort="gov">Governorate ↕</th>
                    <th data-hq-sort="total">Total Unique Officers ↕</th>
                    <th data-hq-sort="calls">HQ Validation Calls ↕</th>
                    <th data-hq-sort="coverage">Coverage % ↕</th>
                </tr>
            `;

            dataList = Object.values(supMap).map(s => {
                const total = s.totalOfficers.size;
                const calls = s.calledOfficers.size;
                const cov = total > 0 ? (calls / total) * 100 : 0;
                return { name: s.name, gov: s.gov, total, calls, coverage: cov };
            });
        }

        const k = hqSortConfig.key;
        const dir = hqSortConfig.dir === 'asc' ? 1 : -1;

        dataList.sort((a, b) => {
            let valA = a[k] !== undefined ? a[k] : '';
            let valB = b[k] !== undefined ? b[k] : '';
            if (typeof valA === 'string') return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * dir;
            return (valA - valB) * dir;
        });

        tbody.innerHTML = '';
        dataList.forEach(item => {
            const tr = document.createElement('tr');
            if (hqBreakdownMode === 'gov') {
                tr.innerHTML = `
                    <td><strong>${item.name}</strong></td>
                    <td>${item.total}</td>
                    <td>${item.calls}</td>
                    <td><strong>${item.coverage.toFixed(1)}%</strong></td>
                `;
            } else {
                tr.innerHTML = `
                    <td><strong>${item.name}</strong></td>
                    <td>${item.gov}</td>
                    <td>${item.total}</td>
                    <td>${item.calls}</td>
                    <td><strong>${item.coverage.toFixed(1)}%</strong></td>
                `;
            }
            tbody.appendChild(tr);
        });

        thead.querySelectorAll('th').forEach(th => {
            th.onclick = () => {
                const sortKey = th.getAttribute('data-hq-sort');
                if (hqSortConfig.key === sortKey) {
                    hqSortConfig.dir = hqSortConfig.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    hqSortConfig.key = sortKey;
                    hqSortConfig.dir = 'asc';
                }
                renderHQTable(govMap, supMap);
            };
        });
    }

    // 3. Performance Map & 4. Analytical Highlights
    function renderSupervisorPerformanceMapAndHighlights(supervisors) {
        const box = document.getElementById('sup-performance-map-container');
        const highlightsBox = document.getElementById('sup-analytical-highlights');
        if (!box) return;

        const validSups = supervisors.filter(s => s.avgFinalResult !== null);
        if (validSups.length === 0) {
            box.innerHTML = '<div style="text-align:center; padding-top:80px; font-size:12px; color:var(--text-muted)">No valid supervisor performance results available for selected month</div>';
            if (highlightsBox) highlightsBox.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:20px 0;">No matching supervisor data</div>';
            return;
        }

        const workloads = validSups.map(s => s.uniqueOfficers);
        const results = validSups.map(s => s.avgFinalResult);

        const workloadMedian = calculateMedian(workloads);
        const resultMedian = calculateMedian(results);

        const maxWorkload = Math.max(...workloads, 1);
        const minResult = Math.min(...results, 0);
        
        const minScaleY = Math.max(0, Math.floor(minResult / 10) * 10 - 5);
        const maxScaleY = 105; 

        const svgW = 600; const svgH = 380;
        const pL = 65; const pR = 35; const pT = 60; const pB = 45;
        const cW = svgW - pL - pR; const cH = svgH - pT - pB;

        const medX = pL + ((workloadMedian / maxWorkload) * cW);
        const medY = pT + cH - (((resultMedian - minScaleY) / (maxScaleY - minScaleY)) * cH);

        let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">`;

        svg += `<line x1="${pL}" y1="${pT + cH}" x2="${pL + cW}" y2="${pT + cH}" stroke="var(--border-color)"/>`;
        svg += `<line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT + cH}" stroke="var(--border-color)"/>`;

        svg += `<line x1="${medX}" y1="${pT}" x2="${medX}" y2="${pT + cH}" stroke="#CBD5E1" stroke-dasharray="4,4"/>`;
        svg += `<line x1="${pL}" y1="${medY}" x2="${pL + cW}" y2="${medY}" stroke="#CBD5E1" stroke-dasharray="4,4"/>`;

        svg += `<text x="${pL + 4}" y="${pT - 28}" fill="#0F172A" font-size="9" font-weight="700">HIGHER RESULT / LOWER WORKLOAD</text>`;
        svg += `<text x="${pL + cW - 4}" y="${pT - 28}" fill="#0F172A" font-size="9" font-weight="700" text-anchor="end">HIGHER RESULT / HIGHER WORKLOAD</text>`;
        svg += `<text x="${pL + 4}" y="${pT + cH + 16}" fill="#0F172A" font-size="8.5" font-weight="700">LOWER RESULT / LOWER WORKLOAD</text>`;
        svg += `<text x="${pL + cW - 4}" y="${pT + cH + 16}" fill="#0F172A" font-size="8.5" font-weight="700" text-anchor="end">LOWER RESULT / HIGHER WORKLOAD</text>`;

        svg += `<text x="${pL + cW/2}" y="${pT + cH + 36}" fill="var(--text-muted)" font-size="9.5" font-weight="700" text-anchor="middle">WORKLOAD: UNIQUE OFFICERS HANDLED</text>`;
        svg += `<text x="${14}" y="${pT + cH/2}" fill="var(--text-muted)" font-size="9.5" font-weight="700" text-anchor="middle" transform="rotate(-90 14 ${pT + cH/2})">AVERAGE FINAL RESULT %</text>`;

        const sortedByWk = [...validSups].sort((a,b) => b.uniqueOfficers - a.uniqueOfficers);
        const sortedByResLow = [...validSups].sort((a,b) => a.avgFinalResult - b.avgFinalResult);

        const highlightSet = new Set();
        if (sortedByWk[0]) highlightSet.add(sortedByWk[0].supervisor);
        if (sortedByWk[1]) highlightSet.add(sortedByWk[1].supervisor);
        if (sortedByResLow[0]) highlightSet.add(sortedByResLow[0].supervisor);

        const pointCoords = [];
        validSups.forEach(s => {
            const cx = pL + ((s.uniqueOfficers / maxWorkload) * cW);
            const cy = pT + cH - (((s.avgFinalResult - minScaleY) / (maxScaleY - minScaleY)) * cH);
            pointCoords.push({ ...s, cx, cy, isHighlight: highlightSet.has(s.supervisor) });
        });

        pointCoords.forEach(item => {
            const ttContent = `
                <div class="tt-title">${item.supervisor}</div>
                <div class="tt-row"><span>Governorate:</span> <strong>${item.governorate}</strong></div>
                <div class="tt-row"><span>Officers:</span> <strong>${item.uniqueOfficers}</strong></div>
                <div class="tt-row"><span>Branches:</span> <strong>${item.uniqueBranches}</strong></div>
                <div class="tt-row"><span>Evaluated Officers:</span> <strong>${item.evaluatedOfficers}</strong></div>
                <div class="tt-row"><span>Evaluation Coverage:</span> <strong>${item.evaluationCoverage.toFixed(1)}%</strong></div>
                <div class="tt-row"><span>Avg Final Result:</span> <strong>${item.avgFinalResult.toFixed(1)}%</strong></div>
            `;

            svg += `
                <circle cx="${item.cx}" cy="${item.cy}" r="${item.isHighlight ? '6' : '4.5'}" 
                        fill="${item.isHighlight ? 'var(--brand-purple)' : '#94A3B8'}" 
                        stroke="#FFFFFF" stroke-width="1.5" class="sup-map-dot"
                        style="cursor:pointer; transition: transform 0.2s, fill 0.2s;"
                        data-tt="${encodeURIComponent(ttContent)}">
                </circle>
            `;

            if (item.isHighlight) {
                let anchor = 'start';
                let dx = 8;
                let dy = 3;

                if (item.cx > pL + cW - 120) {
                    anchor = 'end';
                    dx = -8;
                }
                if (item.cy < pT + 30) {
                    dy = 12;
                }

                svg += `<text x="${item.cx + dx}" y="${item.cy + dy}" font-size="8.5" fill="var(--text-main)" text-anchor="${anchor}" font-weight="700" style="pointer-events:none;" stroke="#FFFFFF" stroke-width="3.5" paint-order="stroke fill" stroke-linejoin="round">${item.supervisor}</text>`;
            }
        });

        const medWkTextX = Math.min(medX + 4, pL + cW - 110);
        svg += `
            <rect x="${medWkTextX - 2}" y="${pT - 12}" width="105" height="11" fill="var(--card-bg)" opacity="0.9" rx="2"/>
            <text x="${medWkTextX}" y="${pT - 4}" font-size="8" fill="var(--brand-purple)" font-weight="700">Workload Median: ${workloadMedian.toFixed(0)}</text>
        `;

        const resMedY = Math.max(pT + 12, Math.min(pT + cH - 15, medY - 4));
        svg += `
            <rect x="${pL + 4}" y="${resMedY - 8}" width="105" height="11" fill="var(--card-bg)" opacity="0.9" rx="2"/>
            <text x="${pL + 6}" y="${resMedY}" font-size="8" fill="var(--brand-purple)" font-weight="700">Result Median: ${resultMedian.toFixed(1)}%</text>
        `;

        svg += `</svg>`;
        box.innerHTML = svg;

        box.querySelectorAll('.sup-map-dot').forEach(dot => {
            const content = decodeURIComponent(dot.getAttribute('data-tt'));
            dot.addEventListener('mouseenter', (e) => {
                dot.setAttribute('r', '8.5');
                dot.setAttribute('fill', 'var(--brand-purple)');
                showTooltip(e, content);
            });
            dot.addEventListener('mousemove', (e) => { showTooltip(e, content); });
            dot.addEventListener('mouseleave', () => {
                dot.setAttribute('r', dot.nextElementSibling && dot.nextElementSibling.tagName === 'text' ? '6' : '4.5');
                dot.setAttribute('fill', dot.nextElementSibling && dot.nextElementSibling.tagName === 'text' ? 'var(--brand-purple)' : '#94A3B8');
                hideTooltip();
            });
            dot.addEventListener('click', (e) => { showTooltip(e, content); });
        });

        if (highlightsBox) {
            const atScale = validSups.filter(s => s.uniqueOfficers >= workloadMedian);

            const highestWk = [...validSups].sort((a,b) => b.uniqueOfficers - a.uniqueOfficers)[0];
            const strongScale = [...atScale].sort((a,b) => b.avgFinalResult - a.avgFinalResult)[0];
            const highLowScale = [...atScale].sort((a,b) => a.avgFinalResult - b.avgFinalResult)[0];
            const highCovScale = [...atScale].sort((a,b) => b.evaluationCoverage - a.evaluationCoverage)[0];

            highlightsBox.innerHTML = `
                <div class="callout-card">
                    <span class="callout-label">Highest Workload</span>
                    <strong class="callout-main-text">${highestWk ? highestWk.supervisor : '-'}</strong>
                    <span class="callout-sub-text">${highestWk ? `${highestWk.uniqueOfficers} officers managed (${highestWk.evaluatedOfficers} evaluated)` : '-'}</span>
                </div>
                <div class="callout-card">
                    <span class="callout-label">Strong Result at Scale</span>
                    <strong class="callout-main-text">${strongScale ? strongScale.supervisor : '-'}</strong>
                    <span class="callout-sub-text">${strongScale ? `${strongScale.avgFinalResult.toFixed(1)}% result across ${strongScale.evaluatedOfficers} evaluated officers` : '-'}</span>
                </div>
                <div class="callout-card">
                    <span class="callout-label">High Workload / Lower Relative Result</span>
                    <strong class="callout-main-text">${highLowScale ? highLowScale.supervisor : '-'}</strong>
                    <span class="callout-sub-text">${highLowScale ? `${highLowScale.avgFinalResult.toFixed(1)}% result across ${highLowScale.evaluatedOfficers} evaluated officers` : '-'}</span>
                </div>
                <div class="callout-card">
                    <span class="callout-label">Highest Evaluation Coverage at Scale</span>
                    <strong class="callout-main-text">${highCovScale ? highCovScale.supervisor : '-'}</strong>
                    <span class="callout-sub-text">${highCovScale ? `${highCovScale.evaluationCoverage.toFixed(1)}% coverage (${highCovScale.evaluatedOfficers}/${highCovScale.uniqueOfficers} officers)` : '-'}</span>
                </div>
            `;
        }
    }

    function renderPerformanceAndWorkloadDistributions(supervisors) {
        const perfBox = document.getElementById('sup-perf-dist-container');
        const workBox = document.getElementById('sup-workload-dist-container');

        if (perfBox) {
            const validSups = supervisors.filter(s => s.avgFinalResult !== null);
            const ranges = [
                { label: '90% – 100%', min: 90, max: 100.01, count: 0 },
                { label: '80% – 89%', min: 80, max: 90, count: 0 },
                { label: '70% – 79%', min: 70, max: 80, count: 0 },
                { label: 'Below 70%', min: 0, max: 70, count: 0 }
            ];

            validSups.forEach(s => {
                const res = s.avgFinalResult;
                for (const r of ranges) {
                    if (res >= r.min && res < r.max) {
                        r.count++;
                        break;
                    }
                }
            });

            const maxC = Math.max(...ranges.map(r => r.count), 1);
            perfBox.innerHTML = ranges.map(r => {
                const pct = (r.count / Math.max(validSups.length, 1)) * 100;
                const fillW = (r.count / maxC) * 100;
                return `
                    <div class="dist-bar-item">
                        <div class="dist-bar-meta">
                            <span>${r.label}</span>
                            <strong>${r.count} sups (${pct.toFixed(0)}%)</strong>
                        </div>
                        <div class="dist-bar-track">
                            <div class="dist-bar-fill" style="width: ${fillW}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (workBox) {
            const officersList = supervisors.map(s => s.uniqueOfficers);
            const med = calculateMedian(officersList);
            const maxW = Math.max(...officersList, 0);

            const wRanges = [
                { label: '1 – 5 Officers', min: 1, max: 6, count: 0 },
                { label: '6 – 15 Officers', min: 6, max: 16, count: 0 },
                { label: '16 – 25 Officers', min: 16, max: 26, count: 0 },
                { label: '26+ Officers', min: 26, max: 999, count: 0 }
            ];

            supervisors.forEach(s => {
                const w = s.uniqueOfficers;
                for (const r of wRanges) {
                    if (w >= r.min && w < r.max) {
                        r.count++;
                        break;
                    }
                }
            });

            const maxWC = Math.max(...wRanges.map(r => r.count), 1);

            let html = wRanges.map(r => {
                const pct = (r.count / Math.max(supervisors.length, 1)) * 100;
                const fillW = (r.count / maxWC) * 100;
                return `
                    <div class="dist-bar-item">
                        <div class="dist-bar-meta">
                            <span>${r.label}</span>
                            <strong>${r.count} sups (${pct.toFixed(0)}%)</strong>
                        </div>
                        <div class="dist-bar-track">
                            <div class="dist-bar-fill" style="width: ${fillW}%; background: var(--primary);"></div>
                        </div>
                    </div>
                `;
            }).join('');

            html += `
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                    Median Workload: <strong>${med.toFixed(0)} Officers/Sup</strong> • Highest Workload: <strong>${maxW} Officers</strong>
                </div>
            `;
            workBox.innerHTML = html;
        }
    }

    function renderSupervisionByGovernorate(supervisors, rawRecords) {
        const tbody = document.getElementById('sup-gov-matrix-tbody');
        if (!tbody) return;

        if (!rawRecords || rawRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No records for selected month</td></tr>';
            return;
        }

        const sample = rawRecords[0];
        const resultCol = findColumnName(sample, ['Final Result', 'KPI Result', 'Average Result', 'Result']);
        const govCol = findColumnName(sample, ['Gov', 'Governorate', 'Region', 'Branch Governorate']);

        const govMap = {};

        supervisors.forEach(s => {
            const g = s.governorate;
            if (!govMap[g]) {
                govMap[g] = {
                    gov: g,
                    supervisorsCount: 0,
                    officersCount: 0,
                    branchesCount: 0,
                    evaluatedCount: 0,
                    supAverages: []
                };
            }
            govMap[g].supervisorsCount++;
            govMap[g].officersCount += s.uniqueOfficers;
            govMap[g].branchesCount += s.uniqueBranches;
            govMap[g].evaluatedCount += s.evaluatedOfficers;
            if (s.avgFinalResult !== null) {
                govMap[g].supAverages.push(s.avgFinalResult);
            }
        });

        const rawGovValids = {};
        rawRecords.forEach(row => {
            const g = row[govCol] ? row[govCol].trim() : 'Unknown';
            const parsed = parseFinalResult(row[resultCol]);
            if (parsed !== null) {
                if (!rawGovValids[g]) rawGovValids[g] = [];
                rawGovValids[g].push(parsed);
            }
        });

        const govList = Object.values(govMap).map(g => {
            const valids = rawGovValids[g.gov] || [];
            const avgFinalResult = valids.length > 0 ? (valids.reduce((a, b) => a + b, 0) / valids.length) : null;
            const coverage = g.officersCount > 0 ? (g.evaluatedCount / g.officersCount) * 100 : 0;

            let gap = null;
            if (g.supAverages.length > 1) {
                const maxAvg = Math.max(...g.supAverages);
                const minAvg = Math.min(...g.supAverages);
                gap = maxAvg - minAvg;
            }

            return {
                ...g,
                avgFinalResult,
                coverage,
                gap
            };
        });

        const k = currentSupGovSort.key;
        const dir = currentSupGovSort.dir === 'asc' ? 1 : -1;

        govList.sort((a, b) => {
            let valA = a[k] !== null ? a[k] : -1;
            let valB = b[k] !== null ? b[k] : -1;
            if (typeof valA === 'string') return valA.localeCompare(valB) * dir;
            return (valA - valB) * dir;
        });

        tbody.innerHTML = '';
        govList.forEach(r => {
            const gapStr = r.gap !== null ? `${r.gap.toFixed(1)}%` : '<span class="text-muted">N/A (1 Sup)</span>';
            const resStr = r.avgFinalResult !== null ? `${r.avgFinalResult.toFixed(1)}%` : 'N/A';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${r.gov}</strong></td>
                <td>${r.supervisorsCount}</td>
                <td>${r.officersCount}</td>
                <td>${r.branchesCount}</td>
                <td>${r.evaluatedCount}</td>
                <td>${r.coverage.toFixed(1)}%</td>
                <td><strong>${resStr}</strong> <span class="sample-size-tag">n=${r.evaluatedCount}</span></td>
                <td>${gapStr}</td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('#sup-gov-matrix-table th').forEach(th => {
            th.onclick = () => {
                const sortKey = th.getAttribute('data-sup-gov-sort');
                if (currentSupGovSort.key === sortKey) {
                    currentSupGovSort.dir = currentSupGovSort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSupGovSort.key = sortKey;
                    currentSupGovSort.dir = 'desc';
                }
                renderSupervisionByGovernorate(supervisors, rawRecords);
            };
        });
    }

    function populateSupervisorGovFilter(supervisors) {
        const select = document.getElementById('sup-table-gov-filter');
        if (!select) return;

        const govSet = new Set(supervisors.map(s => s.governorate));
        const sortedGovs = Array.from(govSet).sort();

        select.innerHTML = '<option value="all">All Governorates</option>';
        sortedGovs.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            select.appendChild(opt);
        });

        select.onchange = () => {
            renderSupervisorDetailsTable(supervisorDataset);
        };
    }

    function renderSupervisorDetailsTable(supervisors) {
        const tbody = document.getElementById('sup-details-tbody');
        const filterSelect = document.getElementById('sup-table-gov-filter');
        if (!tbody) return;

        let scoped = [...supervisors];
        if (filterSelect && filterSelect.value !== 'all') {
            scoped = scoped.filter(s => s.governorate === filterSelect.value);
        }

        const k = currentSupDetailSort.key;
        const dir = currentSupDetailSort.dir === 'asc' ? 1 : -1;

        const keyMap = {
            'supervisor': 'supervisor',
            'gov': 'governorate',
            'officers': 'uniqueOfficers',
            'branches': 'uniqueBranches',
            'evaluated': 'evaluatedOfficers',
            'coverage': 'evaluationCoverage',
            'avgResult': 'avgFinalResult'
        };
        const actualKey = keyMap[k] || k;

        scoped.sort((a, b) => {
            let valA = a[actualKey] !== null && a[actualKey] !== undefined ? a[actualKey] : '';
            let valB = b[actualKey] !== null && b[actualKey] !== undefined ? b[actualKey] : '';

            let primaryCompare = 0;
            if (typeof valA === 'string' || typeof valB === 'string') {
                primaryCompare = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
            } else {
                primaryCompare = (valA - valB) * dir;
            }

            if (actualKey === 'governorate') {
                if (primaryCompare !== 0) return primaryCompare;
                return a.supervisor.localeCompare(b.supervisor, undefined, { numeric: true, sensitivity: 'base' });
            }

            return primaryCompare;
        });

        tbody.innerHTML = '';
        scoped.forEach(s => {
            const resStr = s.avgFinalResult !== null ? `${s.avgFinalResult.toFixed(1)}%` : 'N/A';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.supervisor}</strong></td>
                <td>${s.governorate}</td>
                <td>${s.uniqueOfficers}</td>
                <td>${s.uniqueBranches}</td>
                <td>${s.evaluatedOfficers}</td>
                <td>${s.evaluationCoverage.toFixed(1)}%</td>
                <td><strong>${resStr}</strong> <span class="sample-size-tag">n=${s.evaluatedOfficers}</span></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('#sup-details-table th').forEach(th => {
            th.onclick = () => {
                const sortKey = th.getAttribute('data-sup-detail-sort');
                if (currentSupDetailSort.key === sortKey) {
                    currentSupDetailSort.dir = currentSupDetailSort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSupDetailSort.key = sortKey;
                    currentSupDetailSort.dir = 'asc';
                }
                renderSupervisorDetailsTable(supervisors);
            };
        });
    }

    function renderSupervisorInsights(supervisors, rawRecords) {
        const container = document.getElementById('sup-insights-grid');
        if (!container) return;

        const insights = [];

        const sortedWorkload = [...supervisors].sort((a,b) => b.uniqueOfficers - a.uniqueOfficers);
        const totalOfficers = supervisors.reduce((a,b) => a + b.uniqueOfficers, 0);
        if (sortedWorkload.length >= 5 && totalOfficers > 0) {
            const top5Workload = sortedWorkload.slice(0, 5).reduce((a,b) => a + b.uniqueOfficers, 0);
            const share = ((top5Workload / totalOfficers) * 100).toFixed(1);
            insights.push({
                title: "Workload concentration among top supervisors",
                tag: "Workload Concentration",
                text: `Workload is concentrated among a small group of supervisors. The five busiest supervisors manage ${top5Workload} officers (${share}% of the operational total).`
            });
        }

        const medWorkload = calculateMedian(supervisors.map(s => s.uniqueOfficers));
        const highWkSups = supervisors.filter(s => s.uniqueOfficers >= medWorkload && s.avgFinalResult !== null);
        if (highWkSups.length > 0) {
            const topHighWkResult = highWkSups.sort((a,b) => b.avgFinalResult - a.avgFinalResult)[0];
            insights.push({
                title: `${topHighWkResult.supervisor} records strong results under high workload`,
                tag: "High Volume Performance",
                text: `${topHighWkResult.supervisor} achieves a ${topHighWkResult.avgFinalResult.toFixed(1)}% average Final Result across ${topHighWkResult.evaluatedOfficers} evaluated officers while managing a workload of ${topHighWkResult.uniqueOfficers} officers.`
            });
        }

        const lowCovSups = supervisors.filter(s => s.evaluationCoverage < 50);
        if (lowCovSups.length > 0) {
            const lowest = lowCovSups.sort((a,b) => a.evaluationCoverage - b.evaluationCoverage)[0];
            insights.push({
                title: "Low evaluation coverage in specific supervisory units",
                tag: "Evaluation Completeness",
                text: `${lowest.supervisor} (${lowest.governorate}) records an evaluation coverage of ${lowest.evaluationCoverage.toFixed(1)}%, with only ${lowest.evaluatedOfficers} of ${lowest.uniqueOfficers} officers evaluated.`
            });
        }

        const govMap = {};
        supervisors.forEach(s => {
            if (s.avgFinalResult !== null) {
                if (!govMap[s.governorate]) govMap[s.governorate] = [];
                govMap[s.governorate].push(s.avgFinalResult);
            }
        });

        let maxGapGov = null;
        let maxGapVal = -1;
        for (const g in govMap) {
            if (govMap[g].length > 1) {
                const gap = Math.max(...govMap[g]) - Math.min(...govMap[g]);
                if (gap > maxGapVal) {
                    maxGapVal = gap;
                    maxGapGov = g;
                }
            }
        }

        if (maxGapGov) {
            insights.push({
                title: `Largest Supervisor Result Gap observed in ${maxGapGov}`,
                tag: "Internal Variation",
                text: `${maxGapGov} exhibits a Supervisor Result Gap of ${maxGapVal.toFixed(1)}% between its highest and lowest performing supervisors.`
            });
        }

        const smallSampleSups = supervisors.filter(s => s.evaluatedOfficers > 0 && s.evaluatedOfficers <= 3 && s.avgFinalResult !== null);
        if (smallSampleSups.length > 0) {
            const highSmall = smallSampleSups.sort((a,b) => b.avgFinalResult - a.avgFinalResult)[0];
            insights.push({
                title: "High Final Results recorded on small evaluation samples",
                tag: "Sample Context",
                text: `${highSmall.supervisor} shows a ${highSmall.avgFinalResult.toFixed(1)}% average Final Result, but this metric is based on a sample size of only ${highSmall.evaluatedOfficers} evaluated officers.`
            });
        }

        container.innerHTML = '';
        insights.slice(0, 5).forEach(ins => {
            const card = document.createElement('div');
            card.className = 'insight-card-item';
            card.innerHTML = `
                <div class="insight-head">
                    <span class="insight-title">${ins.title}</span>
                    <span class="insight-tag">${ins.tag}</span>
                </div>
                <p class="insight-body-text">${ins.text}</p>
            `;
            container.appendChild(card);
        });
    }

    // Dynamic Resize Listener for Chart Re-rendering
    window.addEventListener('resize', () => {
        if (globalDataset.length > 0) {
            applyDynamicFiltering();
        }
        if (supervisorDataset.length > 0) {
            renderSupervisorPerformanceMapAndHighlights(supervisorDataset);
        }
    });

    // Dynamic Live Data Loader - Primary Dataset (data.csv)
    fetch('data.csv', { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error("Offline CSV Data");
            return res.text();
        })
        .then(csvText => {
            globalDataset = parseCSVDataEngine(csvText);
            
            populateMonthFilter();
            renderPremiumLineChart(globalDataset);
            applyDynamicFiltering();
            
            if(nodeUpdateBadge) nodeUpdateBadge.textContent = "Data Synced Live";
        })
        .catch(err => {
            console.error("Pipeline Error:", err);
            if(nodeUpdateBadge) {
                nodeUpdateBadge.textContent = "Data File Offline";
                const indicator = nodeUpdateBadge.parentElement.querySelector('.status-indicator');
                if(indicator) indicator.style.backgroundColor = 'var(--red)';
            }
        });

    // Dynamic Live Data Loader - Supervisor KPI Results.csv
    fetch('Supervisor KPI Results.csv', { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error("Offline Supervisor CSV Data");
            return res.text();
        })
        .then(csvText => {
            rawSupervisorRecordsGlobal = parseCSVDataEngine(csvText);
            
            populateMonthFilter();
            applyDynamicFiltering();
        })
        .catch(err => {
            console.warn("Supervisor KPI Results.csv File Offline or Unreachable:", err);
            const supTabNode = document.getElementById('tab-supervisor');
            if (supTabNode) {
                const errCard = document.createElement('div');
                errCard.className = 'metric-card';
                errCard.style.color = 'var(--red)';
                errCard.style.padding = '20px';
                errCard.style.marginTop = '20px';
                errCard.textContent = "Unable to load 'Supervisor KPI Results.csv'. Supervisor Performance tab data is currently unavailable.";
                supTabNode.prepend(errCard);
            }
        });
});
