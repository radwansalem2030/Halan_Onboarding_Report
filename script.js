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

    // Ranking active range filter state
    let activeRankingRangeFilter = 'ALL';

    // Tab 2 Global UI View States
    let resignationGovShowAll = false;
    let govPerfShowAll = false;

    // HQ Validation Globals
    let hqBreakdownMode = 'gov'; // 'gov' | 'sup'
    let hqSortConfig = { key: 'name', dir: 'asc' };

    // Global Sorting Registry for Data Tables
    const tableSortStates = {};

    // Switch Navigation Tab Functionality
    function navigateToTab(tabId) {
        const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(tabId);
        if (targetBtn && targetContent) {
            document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            targetBtn.classList.add('active');
            targetContent.classList.add('active');
        }
    }

    // Initialize Navigation Tab Switching Logic
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            navigateToTab(targetTab);
        });
    });

    // 72-Hour KPI Action Click Handler -> Jump to Operational Cases
    const card72hAction = document.getElementById('exceeded-72h-action-card');
    if (card72hAction) {
        card72hAction.addEventListener('click', () => {
            navigateToTab('tab-cases');
            const targetAnchor = document.getElementById('sec-72h-anchor') || document.getElementById('sec-72h-title');
            if (targetAnchor) {
                setTimeout(() => {
                    targetAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });
    }

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

        // Reason documentation classification for 72h breach
        const withReasonCount = slaBreachSubset.filter(r => r['Comment'] && r['Comment'].trim() !== '').length;
        const withoutReasonCount = sla72hBreachCount - withReasonCount;

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
            withReasonCount,
            withoutReasonCount,
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

        // Tab 3 Supervisor Performance Pipeline Processing
        processTab3SupervisorPipeline(scopedSupRecords);

        // Tab 4 HQ Validation Calls Pipeline Processing
        renderHQValidationSection(scopedSupRecords);

        // Tab 5 Operational Cases Pipeline Processing
        processTab4CasesPipeline(scopedData, metrics);
    }

    monthFilterSelect.addEventListener('change', applyDynamicFiltering);
    setupOpControlsListeners();

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

        // Update 72h Reason Documentation Breakdown
        const breakdownElem = document.getElementById('exceeded-72-reason-breakdown');
        if (breakdownElem) {
            if (metrics.sla72hBreachCount > 0 && metrics.withoutReasonCount === 0) {
                breakdownElem.innerHTML = `<span class="reason-chip with-reason" style="width:100%; text-align:center;">All cases documented (${metrics.withReasonCount})</span>`;
            } else {
                breakdownElem.innerHTML = `
                    <span class="reason-chip with-reason">With Reason: <strong>${metrics.withReasonCount}</strong></span>
                    <span class="reason-chip without-reason">Without Reason: <strong>${metrics.withoutReasonCount}</strong></span>
                `;
            }
        }

        txtSignedCount.textContent = metrics.signedCount.toLocaleString();
        txtNotSignedCount.textContent = metrics.declPendingCount.toLocaleString();

        renderPureSpecialization(rawRecords);
        calculateGovernorateLeaderboards(rawRecords);
        renderPremiumLineChart(rawRecords);
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

    // REQUIREMENT 1: Daily Performance Trend Engine
// Daily Premium Smooth Area Line Chart Engine — Onboarding Overview
    function renderPremiumLineChart(data) {
        if (!nodeLineChartContainer) return;

        // Daily aggregation from actual Hiring Date records
        const dailyRegistry = {};
        data.forEach(row => {
            const rawDate = row['Hiring Date'] ? row['Hiring Date'].trim() : '';
            if (!rawDate) return;

            let dObj = new Date(rawDate);
            if (isNaN(dObj.getTime())) {
                const parts = rawDate.split(/[-/]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) dObj = new Date(parts[0], parts[1] - 1, parts[2]);
                    else dObj = new Date(parts[2], parts[0] - 1, parts[1]);
                }
            }
            if (isNaN(dObj.getTime())) return;

            const dateKey = dObj.toISOString().split('T')[0];
            dailyRegistry[dateKey] = (dailyRegistry[dateKey] || 0) + 1;
        });

        const sortedDates = Object.keys(dailyRegistry).sort();
        if (sortedDates.length === 0) {
            nodeLineChartContainer.innerHTML = '<div style="text-align:center; padding-top:50px; font-size:12px; color:var(--text-muted)">No hiring date observations found</div>';
            return;
        }

        const countsArray = sortedDates.map(d => dailyRegistry[d]);
        const maxVal = Math.max(...countsArray, 1);

        const svgW = 600; const svgH = 160;
        const pL = 45; const pR = 30; const pT = 25; const pB = 35;
        const chartW = svgW - pL - pR; const chartH = svgH - pT - pB;

        const totalPoints = sortedDates.length;
        const stepX = totalPoints > 1 ? chartW / (totalPoints - 1) : chartW;

        const points = [];
        sortedDates.forEach((dStr, idx) => {
            const val = dailyRegistry[dStr];
            const x = pL + (idx * stepX);
            const y = pT + chartH - ((val / maxVal) * chartH);
            points.push({ x, y, val, dateStr: dStr });
        });

        // Smooth Bezier Curve Path calculation
        let lineD = "";
        let areaD = "";

        if (points.length === 1) {
            lineD = `M ${points[0].x} ${points[0].y} L ${points[0].x + 10} ${points[0].y}`;
            areaD = `M ${points[0].x} ${pT + chartH} L ${points[0].x} ${points[0].y} L ${points[0].x + 10} ${points[0].y} L ${points[0].x + 10} ${pT + chartH} Z`;
        } else {
            lineD = `M ${points[0].x} ${points[0].y}`;
            areaD = `M ${points[0].x} ${pT + chartH} L ${points[0].x} ${points[0].y}`;

            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cpX1 = p0.x + (p1.x - p0.x) / 2;
                const cpY1 = p0.y;
                const cpX2 = p0.x + (p1.x - p0.x) / 2;
                const cpY2 = p1.y;

                lineD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
                areaD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
            }
            areaD += ` L ${points[points.length - 1].x} ${pT + chartH} Z`;
        }

        let svgCode = `
            <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" style="overflow: visible;">
                <defs>
                    <linearGradient id="premium-area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--brand-purple)" stop-opacity="0.32"/>
                        <stop offset="100%" stop-color="var(--brand-purple)" stop-opacity="0.01"/>
                    </linearGradient>
                </defs>

                <!-- Soft Grid Lines -->
                <line x1="${pL}" y1="${pT}" x2="${pL + chartW}" y2="${pT}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-opacity="0.5"/>
                <line x1="${pL}" y1="${pT + chartH / 2}" x2="${pL + chartW}" y2="${pT + chartH / 2}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-opacity="0.5"/>
                <line x1="${pL}" y1="${pT + chartH}" x2="${pL + chartW}" y2="${pT + chartH}" stroke="var(--border-color)" stroke-width="1.2"/>

                <!-- Smooth Gradient Area & Line -->
                <path d="${areaD}" fill="url(#premium-area-gradient)"/>
                <path d="${lineD}" fill="none" stroke="var(--brand-purple)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        `;

        const labelInterval = Math.max(1, Math.ceil(totalPoints / 7));

        points.forEach((pt, idx) => {
            const fullD = formatFullDate(pt.dateStr);
            const ttHtml = `
                <div class="tt-title">${fullD.dateStr} (${fullD.dayOfWeek})</div>
                <div class="tt-row"><span>Daily New Hires:</span> <strong>${pt.val}</strong></div>
            `;

            svgCode += `
                <circle cx="${pt.x}" cy="${pt.y}" r="4" 
                        fill="var(--card-bg)" stroke="var(--brand-purple)" stroke-width="2.5" 
                        class="chart-dot interactive-dot" style="cursor:pointer; transition: transform 0.2s, r 0.2s;" 
                        data-tt="${encodeURIComponent(ttHtml)}"></circle>
            `;

            if (idx % labelInterval === 0 || idx === totalPoints - 1) {
                const shortLabel = formatShortDate(pt.dateStr);
                svgCode += `
                    <text x="${pt.x}" y="${pT + chartH + 18}" class="chart-text-lbl" text-anchor="middle">${shortLabel}</text>
                `;
            }
        });

        svgCode += `</svg>`;
        nodeLineChartContainer.innerHTML = svgCode;

        // Interactive tooltips
        nodeLineChartContainer.querySelectorAll('.interactive-dot').forEach(dot => {
            const content = decodeURIComponent(dot.getAttribute('data-tt'));
            dot.addEventListener('mouseenter', (e) => { 
                dot.setAttribute('r', '6'); 
                showTooltip(e, content); 
            });
            dot.addEventListener('mousemove', (e) => { showTooltip(e, content); });
            dot.addEventListener('mouseleave', () => { 
                dot.setAttribute('r', '4'); 
                hideTooltip(); 
            });
        });
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

    // Universal Type-Aware Table Sorter Engine
    function attachUniversalTableSorting(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const headers = table.querySelectorAll('th[data-sort], th[data-sup-gov-sort], th[data-sup-detail-sort], th[data-hq-sort]');
        headers.forEach((th, colIdx) => {
            th.style.cursor = 'pointer';
            th.onclick = () => {
                const tbody = table.querySelector('tbody');
                if (!tbody) return;
                const rows = Array.from(tbody.querySelectorAll('tr'));
                if (rows.length === 0) return;

                const currentState = tableSortStates[tableId] || {};
                let dir = 'asc';
                if (currentState.colIdx === colIdx) {
                    dir = currentState.dir === 'asc' ? 'desc' : 'asc';
                }
                tableSortStates[tableId] = { colIdx, dir };

                rows.sort((rowA, rowB) => {
                    const cellA = rowA.children[colIdx] ? rowA.children[colIdx].innerText.trim() : '';
                    const cellB = rowB.children[colIdx] ? rowB.children[colIdx].innerText.trim() : '';

                    const extractNum = (s) => {
                        const m = s.match(/[-+]?\d*\.?\d+/);
                        return m ? parseFloat(m[0]) : null;
                    };

                    const isPctA = cellA.includes('%');
                    const isPctB = cellB.includes('%');
                    const numA = extractNum(cellA);
                    const numB = extractNum(cellB);

                    if (numA !== null && numB !== null && (isPctA || isPctB || !isNaN(cellA) || !isNaN(cellB) || /^\d/.test(cellA))) {
                        return dir === 'asc' ? numA - numB : numB - numA;
                    }

                    const dateA = Date.parse(cellA);
                    const dateB = Date.parse(cellB);
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        return dir === 'asc' ? dateA - dateB : dateB - dateA;
                    }

                    return dir === 'asc' ? cellA.localeCompare(cellB, undefined, { numeric: true, sensitivity: 'base' })
                                         : cellB.localeCompare(cellA, undefined, { numeric: true, sensitivity: 'base' });
                });

                headers.forEach(h => {
                    const txt = h.innerText.replace(/[▲▼↕]/g, '').trim();
                    h.innerText = `${txt} ↕`;
                });

                const cleanTxt = th.innerText.replace(/[▲▼↕]/g, '').trim();
                th.innerText = `${cleanTxt} ${dir === 'asc' ? '▲' : '▼'}`;

                rows.forEach(r => tbody.appendChild(r));
            };
        });
    }

    // ==========================================================================
    // TAB 2: ANALYTICS CORE PROCESSING PIPELINE
    // ==========================================================================

    function processTab2AnalyticsPipeline(data, centralMetrics) {
        renderCompactOnboardingFlow(centralMetrics);
        renderDailyHiringAnalysis(data, centralMetrics.totalNewHired);
        renderGovMatrixAndPerformanceVisual(data);
        renderResignationAnalysis(data);
        renderExecutiveInsights(data, centralMetrics);
    }

    function renderCompactOnboardingFlow(m) {
        const wrapper = document.getElementById('flow-strip-wrapper');
        if (!wrapper) return;

        const activePct = m.totalNewHired > 0 ? ((m.effectivePopulation / m.totalNewHired) * 100).toFixed(1) : '0.0';

        wrapper.innerHTML = `
            <div class="flow-step-item">
                <span class="flow-step-pct">${m.totalNewHired.toLocaleString()}</span>
                <span class="flow-step-title">TOTAL HIRED</span>
                <span class="flow-step-sub">Employees</span>
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
                <span class="flow-step-title">ACTIVE EMPLOYEES</span>
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

    function renderGovMatrixAndPerformanceVisual(data) {
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

        renderGovTrainingPerformanceVisual(matrixArray);
        renderPerformanceCallouts(matrixArray, medianVol, medianRate);
        renderGovTableDOM(matrixArray);
    }

    function renderGovTrainingPerformanceVisual(matrixArray) {
        const container = document.getElementById('gov-training-performance-container');
        const toggleBtn = document.getElementById('btn-toggle-gov-perf');
        if (!container) return;

        const activeGovs = matrixArray.filter(item => item.eff > 0);

        activeGovs.sort((a, b) => {
            if (Math.abs(a.trPct - b.trPct) > 0.001) {
                return a.trPct - b.trPct;
            }
            return a.eff - b.eff;
        });

        if (activeGovs.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; font-size:12px; color:var(--text-muted)">No active governorate workforce data available</div>';
            if (toggleBtn) toggleBtn.style.display = 'none';
            return;
        }

        const displayList = govPerfShowAll ? activeGovs : activeGovs.slice(0, 10);

        let html = '<div class="gov-perf-grid">';
        displayList.forEach(g => {
            const isSmall = g.eff < 5;
            const smallBadge = isSmall ? `<span class="small-pop-badge">Small Base</span>` : '';
            const pctDisplay = g.trPct.toFixed(1) + '%';

            html += `
                <div class="gov-perf-card">
                    <div class="gov-perf-card-head">
                        <span class="gov-perf-card-name" title="${g.gov}">${g.gov}</span>
                        ${smallBadge}
                    </div>
                    <div class="gov-perf-card-main">
                        <span class="gov-perf-card-pct">${pctDisplay}</span>
                    </div>
                    <div class="gov-perf-card-track">
                        <div class="gov-perf-card-fill" style="width: ${Math.min(g.trPct, 100)}%;"></div>
                    </div>
                    <span class="gov-perf-card-sub">${g.eff.toLocaleString()} Active Employees</span>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

        if (toggleBtn) {
            if (activeGovs.length > 10) {
                toggleBtn.style.display = 'inline-block';
                toggleBtn.textContent = govPerfShowAll ? 'Show Lowest Completion' : 'View All Governorates';
                toggleBtn.onclick = () => {
                    govPerfShowAll = !govPerfShowAll;
                    renderGovTrainingPerformanceVisual(matrixArray);
                };
            } else {
                toggleBtn.style.display = 'none';
            }
        }
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

        attachUniversalTableSorting('gov-matrix-table');
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

        renderResignationGovLeaderboard(document.getElementById('resignation-gov-list'), govList);
        renderSimpleLeaderboard(document.getElementById('resignation-spec-list'), specList, 'var(--orange)');
    }

    function renderResignationGovLeaderboard(anchor, list) {
        if (!anchor) return;
        anchor.innerHTML = '';
        if (list.length === 0) {
            anchor.innerHTML = `<div style="font-size:11px; color:var(--text-muted); padding:8px 0;">No resignations logged</div>`;
            return;
        }

        const totalResignations = list.reduce((sum, item) => sum + item.cnt, 0);
        const visibleList = resignationGovShowAll ? list : list.slice(0, 5);

        visibleList.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'leader-row-item';
            row.innerHTML = `
                <div class="leader-rank-badge">${idx + 1}</div>
                <div class="leader-region-name" title="${item.name}">${item.name}</div>
                <div class="leader-track-bar">
                    <div class="leader-fill-bar" style="width: ${Math.min(item.rate, 100)}%; background-color: var(--red);"></div>
                </div>
                <div class="leader-pct-value" style="width:70px; text-align:right;">${item.cnt} (${item.rate.toFixed(1)}%)</div>
            `;
            anchor.appendChild(row);
        });

        if (list.length > 5) {
            const top5Sum = list.slice(0, 5).reduce((sum, item) => sum + item.cnt, 0);
            const otherCount = Math.max(0, totalResignations - top5Sum);
            const otherPct = totalResignations > 0 ? (otherCount / totalResignations) * 100 : 0;

            const footerRow = document.createElement('div');
            footerRow.className = 'resignation-other-footer';

            if (!resignationGovShowAll) {
                footerRow.innerHTML = `
                    <div class="resignation-other-info">
                        <span class="resignation-other-title">Other Governorates</span>
                        <span class="resignation-other-val">${otherCount} Resignations (${otherPct.toFixed(1)}%)</span>
                    </div>
                    <button id="btn-toggle-resignations-gov" class="btn-resignation-toggle">View All</button>
                `;
            } else {
                footerRow.innerHTML = `
                    <div></div>
                    <button id="btn-toggle-resignations-gov" class="btn-resignation-toggle">Show Top 5</button>
                `;
            }

            anchor.appendChild(footerRow);

            const toggleBtn = document.getElementById('btn-toggle-resignations-gov');
            if (toggleBtn) {
                toggleBtn.onclick = () => {
                    resignationGovShowAll = !resignationGovShowAll;
                    renderResignationGovLeaderboard(anchor, list);
                };
            }
        }
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
                icon: "📅",
                title: `Hiring concentrated on ${formatShortDate(peakD)}`,
                bullets: [
                    `<strong>${peakC} employees</strong> hired on ${formatShortDate(peakD)}`,
                    `<strong>${peakPct}%</strong> of total hiring intake`,
                    `Over <strong>${(peakC / avg).toFixed(1)}×</strong> the daily average (${avg} hires/day)`
                ]
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
                icon: "🏢",
                title: `${topGovByPop} carries the largest active workforce`,
                bullets: [
                    `Accounts for <strong>${cnt} active employees</strong>`,
                    `Represents <strong>${pct}%</strong> of total active onboarding workforce`,
                    `Primary driver of regional onboarding scale`
                ]
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
                icon: "⚡",
                title: `Not-trained cases concentrated in specific regions`,
                bullets: [
                    `<strong>${ntCnt} not-trained employees</strong> in ${topNtGov}`,
                    `Represents <strong>${share}%</strong> of its active workforce pending training`,
                    `Key focus area for onboarding phase completion`
                ]
            });
        }

        if (metrics.sla72hBreachCount > 0) {
            candidates.push({
                priority: 4,
                icon: "⏳",
                title: `72h SLA breaches impact initial onboarding stage`,
                bullets: [
                    `<strong>${metrics.sla72hBreachCount} recruits</strong> currently in 72h SLA breach state`,
                    `Represents <strong>${metrics.sla72hBreachRate.toFixed(1)}%</strong> of effective population`,
                    `Requires initial stage onboarding workflow follow-up`
                ]
            });
        }

        container.innerHTML = '';
        candidates.slice(0, 4).forEach(ins => {
            const card = document.createElement('div');
            card.className = 'op-insight-card';
            
            const bulletsHtml = ins.bullets.map(b => `<li>${b}</li>`).join('');

            card.innerHTML = `
                <div class="op-insight-header">
                    <span class="op-insight-icon">${ins.icon}</span>
                    <h4 class="op-insight-title">${ins.title}</h4>
                </div>
                <ul class="op-insight-bullets">
                    ${bulletsHtml}
                </ul>
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
        if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === 'تم الاستقالة') return null;
        
        str = str.replace('%', '').trim();
        let num = parseFloat(str);
        if (isNaN(num)) return null;

        if (num <= 1.0 && num > 0) {
            num = num * 100;
        }
        return num;
    }

    function aggregateSupervisorData(rawRecords) {
        if (rawRecords.length === 0) return { supervisors: [], rawValids: [], rawQuestValids: [], raw72hValids: [], rawHqValids: [] };

        const sample = rawRecords[0];
        const supCol = findColumnName(sample, ['Supervisor Name', 'Supervisor', 'Direct Manager', 'Manager']);
        const govCol = findColumnName(sample, ['Gov', 'Governorate', 'Region', 'Branch Governorate']);
        const officerCol = findColumnName(sample, ['Officer HR Code', 'HR Code', 'Officer Code', 'Officer Name', 'Employee ID']);
        const branchCol = findColumnName(sample, ['Branch', 'Branch Name', 'Branch Code']);
        const resultCol = findColumnName(sample, ['Final Result', 'KPI Result', 'Average Result', 'Result']);
        const questCol = findColumnName(sample, ['Questionnaire Result', 'Test Result', 'Knowledge Result']);
        const sla72Col = findColumnName(sample, ['72 hours Lateness Result', '72h Lateness Result', '72h SLA Result']);
        const hqCol = findColumnName(sample, ['HQ Call Result', 'HQ Call', 'HQ Validation']);

        const supMap = {};
        const rawValids = [];
        const rawQuestValids = [];
        const raw72hValids = [];
        const rawHqValids = [];

        rawRecords.forEach(row => {
            const supName = row[supCol] ? row[supCol].trim() : '';
            if (!supName) return;

            const gov = row[govCol] ? row[govCol].trim() : 'Unknown';
            const officerId = row[officerCol] ? row[officerCol].trim() : null;
            const branchId = row[branchCol] ? row[branchCol].trim() : null;
            const rawRes = row[resultCol];
            const parsedRes = parseFinalResult(rawRes);

            const parsedQuest = questCol ? parseFinalResult(row[questCol]) : null;
            const parsed72h = sla72Col ? parseFinalResult(row[sla72Col]) : null;
            const parsedHq = hqCol ? parseFinalResult(row[hqCol]) : null;

            if (parsedRes !== null) rawValids.push({ val: parsedRes, officerId });
            if (parsedQuest !== null) rawQuestValids.push({ val: parsedQuest, officerId });
            if (parsed72h !== null) raw72hValids.push({ val: parsed72h, officerId });
            if (parsedHq !== null) rawHqValids.push({ val: parsedHq, officerId });

            if (!supMap[supName]) {
                supMap[supName] = {
                    supervisor: supName,
                    governorate: gov,
                    officersSet: new Set(),
                    branchesSet: new Set(),
                    evaluatedCount: 0,
                    validResultsSum: 0,
                    questSum: 0,
                    questCount: 0
                };
            }

            if (officerId) supMap[supName].officersSet.add(officerId);
            if (branchId) supMap[supName].branchesSet.add(branchId);

            if (parsedRes !== null) {
                supMap[supName].evaluatedCount++;
                supMap[supName].validResultsSum += parsedRes;
            }

            if (parsedQuest !== null) {
                supMap[supName].questCount++;
                supMap[supName].questSum += parsedQuest;
            }
        });

        const compiledSupervisors = Object.values(supMap).map(s => {
            const uniqueOfficers = s.officersSet.size;
            const uniqueBranches = s.branchesSet.size;
            const evaluatedOfficers = s.evaluatedCount;
            const avgFinalResult = evaluatedOfficers > 0 ? (s.validResultsSum / evaluatedOfficers) : null;
            const avgQuestResult = s.questCount > 0 ? (s.questSum / s.questCount) : null;
            const evaluationCoverage = uniqueOfficers > 0 ? (evaluatedOfficers / uniqueOfficers) * 100 : 0;

            return {
                supervisor: s.supervisor,
                governorate: s.governorate,
                uniqueOfficers,
                uniqueBranches,
                evaluatedOfficers,
                avgFinalResult,
                avgQuestResult,
                evaluationCoverage
            };
        });

        return { supervisors: compiledSupervisors, rawValids, rawQuestValids, raw72hValids, rawHqValids };
    }

    function processTab3SupervisorPipeline(supRecords) {
        const { supervisors, rawValids, rawQuestValids, raw72hValids, rawHqValids } = aggregateSupervisorData(supRecords);
        supervisorDataset = supervisors;

        renderSupervisorOperationalScope(supervisors);
        renderSupervisorPrimaryKPIs(rawValids, rawQuestValids, raw72hValids, rawHqValids, supRecords);
        renderPerformanceWorkloadSegmentation(supervisors);
        renderSupervisorAnalyticalHighlights(supervisors);
        renderSupervisorPerformanceRanking(supervisors, activeRankingRangeFilter);
        renderPerformanceAndWorkloadDistributions(supervisors);
        renderSupervisionByGovernorate(supervisors, supRecords);
        populateSupervisorGovFilter(supervisors);
        renderSupervisorDetailsTable(supervisors);
        renderSupervisorInsights(supervisors, supRecords);
    }

    // Operational Scope Context Strip
    function renderSupervisorOperationalScope(supervisors) {
        const container = document.getElementById('sup-op-scope-strip');
        if (!container) return;

        const totalSupervisors = supervisors.length;
        const govSet = new Set(supervisors.map(s => s.governorate));
        const activeGovs = govSet.size;

        const totalOfficers = supervisors.reduce((acc, s) => acc + s.uniqueOfficers, 0);
        const totalBranches = supervisors.reduce((acc, s) => acc + s.uniqueBranches, 0);

        const avgOfficersPerSup = totalSupervisors > 0 ? (totalOfficers / totalSupervisors) : 0;
        const avgBranchesPerSup = totalSupervisors > 0 ? (totalBranches / totalSupervisors) : 0;

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
        `;
    }

    // Helper: Compute real time cohort trend series for sparklines
    function computeCohortTrendSeries(supRecords, metricColName) {
        if (!supRecords || supRecords.length === 0) return { grain: 'NONE', points: [] };

        const sample = supRecords[0];
        const hDateCol = findColumnName(sample, ['Hiring Date', 'HiringDate']);
        const colName = findColumnName(sample, [metricColName]);

        if (!hDateCol || !colName) return { grain: 'NONE', points: [] };

        const bucketMap = {};
        let minDate = null;
        let maxDate = null;

        supRecords.forEach(r => {
            const dStr = r[hDateCol] ? r[hDateCol].trim() : '';
            if (!dStr) return;
            const parsedVal = parseFinalResult(r[colName]);
            if (parsedVal === null) return;

            let dateObj = new Date(dStr);
            if (isNaN(dateObj.getTime())) {
                const parts = dStr.split(/[-/]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                    else dateObj = new Date(parts[2], parts[0] - 1, parts[1]);
                }
            }
            if (isNaN(dateObj.getTime())) return;

            if (!minDate || dateObj < minDate) minDate = dateObj;
            if (!maxDate || dateObj > maxDate) maxDate = dateObj;

            const timeKey = dateObj.toISOString().split('T')[0];
            if (!bucketMap[timeKey]) bucketMap[timeKey] = [];
            bucketMap[timeKey].push(parsedVal);
        });

        if (!minDate || !maxDate) return { grain: 'NONE', points: [] };

        const spanDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
        let timeGrain = 'DAILY';
        if (spanDays > 90) timeGrain = 'MONTHLY';
        else if (spanDays > 21) timeGrain = 'WEEKLY';

        const groupedMap = {};
        Object.keys(bucketMap).forEach(dateStr => {
            const dateObj = new Date(dateStr);
            let groupKey = dateStr;

            if (timeGrain === 'MONTHLY') {
                groupKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            } else if (timeGrain === 'WEEKLY') {
                const firstJan = new Date(dateObj.getFullYear(), 0, 1);
                const weekNum = Math.ceil((((dateObj - firstJan) / 86400000) + firstJan.getDay() + 1) / 7);
                groupKey = `${dateObj.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
            }

            if (!groupedMap[groupKey]) groupedMap[groupKey] = [];
            groupedMap[groupKey].push(...bucketMap[dateStr]);
        });

        const sortedGroupKeys = Object.keys(groupedMap).sort();
        if (sortedGroupKeys.length < 2) {
            return { grain: 'NONE', points: [] };
        }

        const points = sortedGroupKeys.map(k => {
            const arr = groupedMap[k];
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            return { key: k, value: avg };
        });

        return { grain: timeGrain, points };
    }

    // Executive Sparkline Area Chart SVG Builder
    function buildSparklineSVG(trendData, strokeColor = '#6366F1') {
        if (!trendData || trendData.points.length < 2) {
            return `<div class="kpi-sparkline-wrapper"><span class="sparkline-grain-tag text-muted">Single Period</span></div>`;
        }

        const points = trendData.points;
        const vals = points.map(p => p.value);
        const minV = Math.min(...vals);
        const maxV = Math.max(...vals);
        const range = maxV - minV || 1;

        const svgW = 120;
        const svgH = 34;
        const pT = 4;
        const pB = 4;
        const h = svgH - pT - pB;
        const stepX = svgW / (points.length - 1);

        let lineD = '';
        let areaD = '';

        points.forEach((pt, i) => {
            const x = i * stepX;
            const y = pT + h - (((pt.value - minV) / range) * h);
            if (i === 0) {
                lineD = `M ${x} ${y}`;
                areaD = `M ${x} ${svgH} L ${x} ${y}`;
            } else {
                lineD += ` L ${x} ${y}`;
                areaD += ` L ${x} ${y}`;
            }
        });
        areaD += ` L ${svgW} ${svgH} Z`;

        const gradientId = `grad-${Math.random().toString(36).substring(2, 9)}`;

        return `
            <div class="kpi-sparkline-wrapper" title="Cohort Trend (${trendData.grain})">
                <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="overflow: visible;">
                    <defs>
                        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
                        </linearGradient>
                    </defs>
                    <path d="${areaD}" fill="url(#${gradientId})" />
                    <path d="${lineD}" fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="sparkline-grain-tag" style="color: ${strokeColor};">${trendData.grain}</span>
            </div>
        `;
    }

    // Render 4 Executive Performance KPI Cards
    function renderSupervisorPrimaryKPIs(rawValids, rawQuestValids, raw72hValids, rawHqValids, supRecords) {
        const container = document.getElementById('sup-primary-kpi-grid');
        if (!container) return;

        const uniqueFinalOfficers = new Set(rawValids.map(item => item.officerId).filter(Boolean)).size;
        const uniqueQuestOfficers = new Set(rawQuestValids.map(item => item.officerId).filter(Boolean)).size;
        const unique72hOfficers = new Set(raw72hValids.map(item => item.officerId).filter(Boolean)).size;
        const uniqueHqOfficers = new Set(rawHqValids.map(item => item.officerId).filter(Boolean)).size;

        const overallAvg = rawValids.length > 0 ? (rawValids.reduce((a, b) => a + b.val, 0) / rawValids.length) : 0;
        const questAvg = rawQuestValids.length > 0 ? (rawQuestValids.reduce((a, b) => a + b.val, 0) / rawQuestValids.length) : 0;
        const sla72Avg = raw72hValids.length > 0 ? (raw72hValids.reduce((a, b) => a + b.val, 0) / raw72hValids.length) : 0;
        const hqAvg = rawHqValids.length > 0 ? (rawHqValids.reduce((a, b) => a + b.val, 0) / rawHqValids.length) : 0;

        const overallTrend = computeCohortTrendSeries(supRecords, 'Final Result');
        const questTrend = computeCohortTrendSeries(supRecords, 'Questionnaire Result');
        const sla72Trend = computeCohortTrendSeries(supRecords, '72 hours Lateness Result');
        const hqTrend = computeCohortTrendSeries(supRecords, 'HQ Call Result');

        const card1Spark = buildSparklineSVG(overallTrend, '#6366F1');
        const card2Spark = buildSparklineSVG(questTrend, '#10B981');
        const card3Spark = buildSparklineSVG(sla72Trend, '#F59E0B');
        const card4Spark = buildSparklineSVG(hqTrend, '#3B82F6');

        container.innerHTML = `
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">OVERALL PERFORMANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-purple">${overallAvg.toFixed(1)}%</span>
                </div>
                <div class="kpi-exec-sub">Average Final Result across supervisory evaluations</div>
                <div class="kpi-exec-denom">Based on <strong>${uniqueFinalOfficers.toLocaleString()}</strong> evaluated officers</div>
                ${card1Spark}
            </div>

            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">KNOWLEDGE PERFORMANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-success">${questAvg > 0 ? questAvg.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub">Average Questionnaire / Test result score</div>
                <div class="kpi-exec-denom">Based on <strong>${uniqueQuestOfficers.toLocaleString()}</strong> evaluated officers</div>
                ${card2Spark}
            </div>

            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">SLA COMPLIANCE PERFORMANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-orange-main">${sla72Avg > 0 ? sla72Avg.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub">Initial 72-hour onboarding phase SLA lateness score</div>
                <div class="kpi-exec-denom">Based on <strong>${unique72hOfficers.toLocaleString()}</strong> evaluated officers</div>
                ${card3Spark}
            </div>

            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">HQ VALIDATION PERFORMANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value" style="color: #3B82F6;">${hqAvg > 0 ? hqAvg.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub">Average HQ validation call score result</div>
                <div class="kpi-exec-denom">Based on <strong>${uniqueHqOfficers.toLocaleString()}</strong> evaluated officers</div>
                ${card4Spark}
            </div>
        `;
    }

    // Performance x Workload 4-Segment Classification
    function renderPerformanceWorkloadSegmentation(supervisors) {
        const container = document.getElementById('sup-performance-segmentation-container');
        if (!container) return;

        const validSups = supervisors.filter(s => s.avgFinalResult !== null);
        if (validSups.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; font-size:12px; color:var(--text-muted)">No valid supervisor performance results available</div>';
            return;
        }

        const workloads = validSups.map(s => s.uniqueOfficers);
        const results = validSups.map(s => s.avgFinalResult);

        const medWorkload = calculateMedian(workloads);
        const medResult = calculateMedian(results);

        const seg1 = validSups.filter(s => s.avgFinalResult >= medResult && s.uniqueOfficers >= medWorkload);
        const seg2 = validSups.filter(s => s.avgFinalResult >= medResult && s.uniqueOfficers < medWorkload);
        const seg3 = validSups.filter(s => s.avgFinalResult < medResult && s.uniqueOfficers >= medWorkload);
        const seg4 = validSups.filter(s => s.avgFinalResult < medResult && s.uniqueOfficers < medWorkload);

        const renderSegTopSups = (list) => {
            if (list.length === 0) return '<div class="seg-empty-txt">No supervisors in segment</div>';
            const top3 = [...list].sort((a,b) => b.avgFinalResult - a.avgFinalResult).slice(0, 3);
            return top3.map(s => `
                <div class="seg-sup-item">
                    <div style="display:flex; flex-direction:column; gap:1px; overflow:hidden;">
                        <span class="seg-sup-name" title="${s.supervisor}">${s.supervisor}</span>
                        <span style="font-size:10px; color:var(--text-muted);">${s.governorate}</span>
                    </div>
                    <span class="seg-sup-val"><strong>${s.avgFinalResult.toFixed(1)}%</strong> (${s.evaluatedOfficers}/${s.uniqueOfficers} off.)</span>
                </div>
            `).join('');
        };

        container.innerHTML = `
            <div class="seg-grid-2x2">
                <div class="seg-card seg-card-green">
                    <div class="seg-card-head">
                        <span class="seg-card-title">STRONG PERFORMANCE AT SCALE</span>
                        <span class="seg-card-count text-success">${seg1.length} Supervisors</span>
                    </div>
                    <div class="seg-card-sub">Result ≥ ${medResult.toFixed(1)}% & Workload ≥ ${medWorkload.toFixed(0)} officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg1)}</div>
                </div>

                <div class="seg-card seg-card-blue">
                    <div class="seg-card-head">
                        <span class="seg-card-title">STRONG PERFORMANCE / LOWER VOLUME</span>
                        <span class="seg-card-count text-purple">${seg2.length} Supervisors</span>
                    </div>
                    <div class="seg-card-sub">Result ≥ ${medResult.toFixed(1)}% & Workload < ${medWorkload.toFixed(0)} officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg2)}</div>
                </div>

                <div class="seg-card seg-card-orange">
                    <div class="seg-card-head">
                        <span class="seg-card-title">HIGH VOLUME / LOWER PERFORMANCE</span>
                        <span class="seg-card-count text-orange-main">${seg3.length} Supervisors</span>
                    </div>
                    <div class="seg-card-sub">Result < ${medResult.toFixed(1)}% & Workload ≥ ${medWorkload.toFixed(0)} officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg3)}</div>
                </div>

                <div class="seg-card seg-card-gray">
                    <div class="seg-card-head">
                        <span class="seg-card-title">LOWER PERFORMANCE / LOWER VOLUME</span>
                        <span class="seg-card-count text-muted">${seg4.length} Supervisors</span>
                    </div>
                    <div class="seg-card-sub">Result < ${medResult.toFixed(1)}% & Workload < ${medWorkload.toFixed(0)} officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg4)}</div>
                </div>
            </div>
        `;
    }

    // REQUIREMENT 5: Named Supervisor Insights & Analytical Highlights Context
    function renderSupervisorAnalyticalHighlights(supervisors) {
        const highlightsBox = document.getElementById('sup-analytical-highlights');
        if (!highlightsBox) return;

        const validSups = supervisors.filter(s => s.avgFinalResult !== null);
        if (validSups.length === 0) {
            highlightsBox.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:20px 0;">No matching supervisor data</div>';
            return;
        }

        const workloads = validSups.map(s => s.uniqueOfficers);
        const medWorkload = calculateMedian(workloads);

        const atScale = validSups.filter(s => s.uniqueOfficers >= medWorkload);

        const highestWk = [...validSups].sort((a,b) => b.uniqueOfficers - a.uniqueOfficers)[0];
        const strongScale = [...atScale].sort((a,b) => b.avgFinalResult - a.avgFinalResult)[0];
        const highLowScale = [...atScale].sort((a,b) => a.avgFinalResult - b.avgFinalResult)[0];
        const bestKnowledge = [...atScale].filter(s => s.avgQuestResult !== null).sort((a,b) => b.avgQuestResult - a.avgQuestResult)[0];

        highlightsBox.innerHTML = `
            <div class="callout-card">
                <span class="callout-label">Highest Workload</span>
                <strong class="callout-main-text">${highestWk ? highestWk.supervisor : '-'}</strong>
                <span class="callout-sub-text">${highestWk ? `${highestWk.governorate} • ${highestWk.avgFinalResult.toFixed(1)}% Result · ${highestWk.uniqueOfficers} officers managed (${highestWk.evaluatedOfficers} evaluated)` : '-'}</span>
            </div>
            <div class="callout-card">
                <span class="callout-label">Strongest Performance at Scale</span>
                <strong class="callout-main-text">${strongScale ? strongScale.supervisor : '-'}</strong>
                <span class="callout-sub-text">${strongScale ? `${strongScale.governorate} • ${strongScale.avgFinalResult.toFixed(1)}% Result · ${strongScale.evaluatedOfficers} evaluated officers` : '-'}</span>
            </div>
            <div class="callout-card">
                <span class="callout-label">High Workload / Lower Performance</span>
                <strong class="callout-main-text">${highLowScale ? highLowScale.supervisor : '-'}</strong>
                <span class="callout-sub-text">${highLowScale ? `${highLowScale.governorate} • ${highLowScale.avgFinalResult.toFixed(1)}% Result · ${highLowScale.evaluatedOfficers} evaluated officers` : '-'}</span>
            </div>
            <div class="callout-card">
                <span class="callout-label">Highest Knowledge Result at Scale</span>
                <strong class="callout-main-text">${bestKnowledge ? bestKnowledge.supervisor : '-'}</strong>
                <span class="callout-sub-text">${bestKnowledge ? `${bestKnowledge.governorate} • ${bestKnowledge.avgQuestResult.toFixed(1)}% Knowledge Result · ${bestKnowledge.uniqueOfficers} officers` : '-'}</span>
            </div>
        `;
    }

    // Supervisor Performance Ranking with Range Filter Buttons
    function renderSupervisorPerformanceRanking(supervisors, rangeFilter = 'ALL') {
        const container = document.getElementById('sup-performance-ranking-container');
        const filterBar = document.getElementById('ranking-range-filters');
        if (!container) return;

        activeRankingRangeFilter = rangeFilter;

        const validSups = supervisors.filter(s => s.avgFinalResult !== null);
        if (validSups.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; font-size:12px; color:var(--text-muted)">No valid supervisor performance results available</div>';
            if (filterBar) filterBar.innerHTML = '';
            return;
        }

        const counts = {
            'ALL': validSups.length,
            '90-100': validSups.filter(s => s.avgFinalResult >= 90).length,
            '80-89': validSups.filter(s => s.avgFinalResult >= 80 && s.avgFinalResult < 90).length,
            '70-79': validSups.filter(s => s.avgFinalResult >= 70 && s.avgFinalResult < 80).length,
            'BELOW-70': validSups.filter(s => s.avgFinalResult < 70).length
        };

        if (filterBar) {
            filterBar.innerHTML = `
                <button class="ranking-filter-btn ${activeRankingRangeFilter === 'ALL' ? 'active' : ''}" data-range="ALL">All (${counts['ALL']})</button>
                <button class="ranking-filter-btn ${activeRankingRangeFilter === '90-100' ? 'active' : ''}" data-range="90-100">90–100% (${counts['90-100']})</button>
                <button class="ranking-filter-btn ${activeRankingRangeFilter === '80-89' ? 'active' : ''}" data-range="80-89">80–89% (${counts['80-89']})</button>
                <button class="ranking-filter-btn ${activeRankingRangeFilter === '70-79' ? 'active' : ''}" data-range="70-79">70–79% (${counts['70-79']})</button>
                <button class="ranking-filter-btn ${activeRankingRangeFilter === 'BELOW-70' ? 'active' : ''}" data-range="BELOW-70">Below 70% (${counts['BELOW-70']})</button>
            `;

            filterBar.querySelectorAll('.ranking-filter-btn').forEach(btn => {
                btn.onclick = () => {
                    const r = btn.getAttribute('data-range');
                    renderSupervisorPerformanceRanking(supervisors, r);
                };
            });
        }

        let filtered = [...validSups];
        if (activeRankingRangeFilter === '90-100') filtered = filtered.filter(s => s.avgFinalResult >= 90);
        else if (activeRankingRangeFilter === '80-89') filtered = filtered.filter(s => s.avgFinalResult >= 80 && s.avgFinalResult < 90);
        else if (activeRankingRangeFilter === '70-79') filtered = filtered.filter(s => s.avgFinalResult >= 70 && s.avgFinalResult < 80);
        else if (activeRankingRangeFilter === 'BELOW-70') filtered = filtered.filter(s => s.avgFinalResult < 70);

        filtered.sort((a, b) => b.avgFinalResult - a.avgFinalResult);

        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:30px; font-size:12px; color:var(--text-muted)">No supervisors in selected performance range</div>';
            return;
        }

        let html = '<div class="sup-ranking-list">';
        filtered.forEach((s, idx) => {
            const resPct = s.avgFinalResult.toFixed(1);
            const rankBadge = idx + 1;

            html += `
                <div class="sup-ranking-row">
                    <div class="sup-ranking-rank">${rankBadge}</div>
                    <div class="sup-ranking-main">
                        <div class="sup-ranking-meta">
                            <span class="sup-ranking-name">${s.supervisor}</span>
                            <span class="sup-ranking-gov">${s.governorate}</span>
                        </div>
                        <div class="sup-ranking-bar-group">
                            <div class="sup-ranking-bar-track">
                                <div class="sup-ranking-bar-fill" style="width: ${Math.min(s.avgFinalResult, 100)}%;"></div>
                            </div>
                            <span class="sup-ranking-val-pct">${resPct}%</span>
                        </div>
                        <div class="sup-ranking-sample-context">
                            <strong>${s.evaluatedOfficers} evaluated</strong> • ${s.uniqueOfficers} officers handled
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // Performance Distribution Connected to Ranking
    function renderPerformanceAndWorkloadDistributions(supervisors) {
        const perfBox = document.getElementById('sup-perf-dist-container');
        const workBox = document.getElementById('sup-workload-dist-container');

        if (perfBox) {
            const validSups = supervisors.filter(s => s.avgFinalResult !== null);
            const ranges = [
                { label: '90% – 100%', rangeKey: '90-100', min: 90, max: 100.01, count: 0 },
                { label: '80% – 89%', rangeKey: '80-89', min: 80, max: 90, count: 0 },
                { label: '70% – 79%', rangeKey: '70-79', min: 70, max: 80, count: 0 },
                { label: 'Below 70%', rangeKey: 'BELOW-70', min: 0, max: 70, count: 0 }
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
                    <div class="dist-bar-item clickable-dist-bar" data-range="${r.rangeKey}" style="cursor:pointer;" title="Click to filter ranking by ${r.label}">
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

            perfBox.querySelectorAll('.clickable-dist-bar').forEach(item => {
                item.onclick = () => {
                    const r = item.getAttribute('data-range');
                    renderSupervisorPerformanceRanking(supervisors, r);
                    const rankElem = document.getElementById('ranking-range-filters');
                    if (rankElem) rankElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                };
            });
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

        attachUniversalTableSorting('sup-gov-matrix-table');
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

        attachUniversalTableSorting('sup-details-table');
    }

    // REQUIREMENT 5: PERFORMANCE INSIGHTS WITH FULL SUPERVISOR & SAMPLE CONTEXT
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
                text: `Workload is concentrated among a small group of supervisors. The five busiest supervisors manage <strong>${top5Workload} officers</strong> (${share}% of the operational total).`
            });
        }

        const medWorkload = calculateMedian(supervisors.map(s => s.uniqueOfficers));
        const highWkSups = supervisors.filter(s => s.uniqueOfficers >= medWorkload && s.avgFinalResult !== null);
        if (highWkSups.length > 0) {
            const topHighWkResult = highWkSups.sort((a,b) => b.avgFinalResult - a.avgFinalResult)[0];
            insights.push({
                title: `${topHighWkResult.supervisor} records strong results under high workload`,
                tag: "High Volume Performance",
                text: `<strong>${topHighWkResult.supervisor}</strong> (${topHighWkResult.governorate}) achieves a <strong>${topHighWkResult.avgFinalResult.toFixed(1)}%</strong> Final Result across <strong>${topHighWkResult.evaluatedOfficers} evaluated officers</strong> (${topHighWkResult.uniqueOfficers} officers managed).`
            });
        }

        const lowCovSups = supervisors.filter(s => s.evaluationCoverage < 50);
        if (lowCovSups.length > 0) {
            const lowest = lowCovSups.sort((a,b) => a.evaluationCoverage - b.evaluationCoverage)[0];
            insights.push({
                title: "Low evaluation coverage in specific supervisory units",
                tag: "Evaluation Completeness",
                text: `<strong>${lowest.supervisor}</strong> (${lowest.governorate}) records an evaluation coverage of <strong>${lowest.evaluationCoverage.toFixed(1)}%</strong>, with only <strong>${lowest.evaluatedOfficers} of ${lowest.uniqueOfficers} officers evaluated</strong>.`
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
                text: `${maxGapGov} exhibits a Supervisor Result Gap of <strong>${maxGapVal.toFixed(1)}%</strong> between its highest and lowest performing supervisors.`
            });
        }

        container.innerHTML = '';
        insights.slice(0, 4).forEach(ins => {
            const card = document.createElement('div');
            card.className = 'op-insight-card';
            card.innerHTML = `
                <div class="op-insight-header">
                    <span class="insight-tag">${ins.tag}</span>
                    <h4 class="op-insight-title">${ins.title}</h4>
                </div>
                <p class="explanation-text" style="font-size:12px; color:var(--text-main); margin-top:6px; line-height:1.4;">${ins.text}</p>
            `;
            container.appendChild(card);
        });
    }

    // ==========================================================================
    // REQUIREMENT 6: HQ VALIDATION CALLS TAB ENRICHMENT ENGINE
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
        const hqCol = findColumnName(sample, ['HQ Call Result', 'HQ Call', 'HQ Validation', 'Validation']);

        const totalOfficersSet = new Set();
        const calledOfficersSet = new Set();
        const hqResultRecords = [];

        const govMap = {};
        const supMap = {};
        const supHqPerformanceMap = {};

        supRecords.forEach(row => {
            const officerId = row[officerCol] ? row[officerCol].trim() : null;
            if (!officerId) return;

            const gov = row[govCol] ? row[govCol].trim() : 'Unknown';
            const sup = row[supCol] ? row[supCol].trim() : 'Unknown';
            const rawHqVal = hqCol ? row[hqCol] : null;
            const parsedHqVal = parseFinalResult(rawHqVal);

            totalOfficersSet.add(officerId);

            if (!govMap[gov]) govMap[gov] = { name: gov, totalOfficers: new Set(), calledOfficers: new Set() };
            govMap[gov].totalOfficers.add(officerId);

            if (!supMap[sup]) supMap[sup] = { name: sup, gov: gov, totalOfficers: new Set(), calledOfficers: new Set() };
            supMap[sup].totalOfficers.add(officerId);

            if (isValidHQVal(rawHqVal)) {
                calledOfficersSet.add(officerId);
                govMap[gov].calledOfficers.add(officerId);
                supMap[sup].calledOfficers.add(officerId);
            }

            if (parsedHqVal !== null) {
                hqResultRecords.push({ val: parsedHqVal, officerId, sup, gov });
                if (!supHqPerformanceMap[sup]) supHqPerformanceMap[sup] = { sup, gov, scores: [] };
                supHqPerformanceMap[sup].scores.push(parsedHqVal);
            }
        });

        const totalOfficersCount = totalOfficersSet.size;
        const calledOfficersCount = calledOfficersSet.size;
        const coveragePct = totalOfficersCount > 0 ? (calledOfficersCount / totalOfficersCount) * 100 : 0;

        // Render 6A: HQ Top KPI Cards
        renderHQKPICards(totalOfficersCount, calledOfficersCount, coveragePct, hqResultRecords, supHqPerformanceMap, supRecords);

        // Render 6C: HQ Performance Distribution
        renderHQPerformanceDistribution(supHqPerformanceMap);

        // Render 6E: Existing Activity Statement
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

    // REQUIREMENT 6A & 6B: HQ KPI Cards & Real Sparklines
    function renderHQKPICards(totalOfficers, calledOfficers, coveragePct, hqResultRecords, supHqPerfMap, supRecords) {
        const container = document.getElementById('hq-kpi-grid');
        if (!container) return;

        const evaluatedOfficersCount = new Set(hqResultRecords.map(r => r.officerId)).size;
        const avgHqPerf = hqResultRecords.length > 0 ? (hqResultRecords.reduce((sum, r) => sum + r.val, 0) / hqResultRecords.length) : 0;
        
        const validatedSupervisorsCount = Object.keys(supHqPerfMap).length;
        const avgValOfficersPerSup = validatedSupervisorsCount > 0 ? (evaluatedOfficersCount / validatedSupervisorsCount) : 0;

        const hqTrend = computeCohortTrendSeries(supRecords, 'HQ Call Result');
        const hqSparkSVG = buildSparklineSVG(hqTrend, '#3B82F6');

        container.innerHTML = `
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">HQ CALL COVERAGE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-purple">${coveragePct.toFixed(1)}%</span>
                </div>
                <div class="kpi-exec-sub">Ratio of officers with HQ validation calls</div>
                <div class="kpi-exec-denom"><strong>${calledOfficers.toLocaleString()}</strong> of <strong>${totalOfficers.toLocaleString()}</strong> Officers</div>
                ${hqSparkSVG}
            </div>

            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">HQ VALIDATION PERFORMANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value" style="color:#3B82F6;">${avgHqPerf > 0 ? avgHqPerf.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub">Average HQ validation performance score</div>
                <div class="kpi-exec-denom">Based on <strong>${evaluatedOfficersCount.toLocaleString()}</strong> evaluated officers</div>
                ${hqSparkSVG}
            </div>

            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">SUPERVISORS VALIDATED</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-success">${validatedSupervisorsCount.toLocaleString()}</span>
                </div>
                <div class="kpi-exec-sub">Supervisors with ≥1 validated officer call</div>
                <div class="kpi-exec-denom">Active supervisory team unit context</div>
            </div>

            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">AVG VALIDATED / SUPERVISOR</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-orange-main">${avgValOfficersPerSup.toFixed(1)}</span>
                </div>
                <div class="kpi-exec-sub">Validated officers handled per supervisor</div>
                <div class="kpi-exec-denom">Based on <strong>${evaluatedOfficersCount.toLocaleString()}</strong> unique officer calls</div>
            </div>
        `;
    }

    // REQUIREMENT 6C: HQ Validation Performance Distribution
    function renderHQPerformanceDistribution(supHqPerfMap) {
        const container = document.getElementById('hq-perf-dist-container');
        if (!container) return;

        const supList = Object.values(supHqPerfMap).map(item => {
            const avg = item.scores.reduce((a, b) => a + b, 0) / item.scores.length;
            return { sup: item.sup, avg, count: item.scores.length };
        });

        const totalHqSups = supList.length;

        const ranges = [
            { label: '90% – 100%', min: 90, max: 100.01, count: 0 },
            { label: '80% – 89.99%', min: 80, max: 90, count: 0 },
            { label: '70% – 79.99%', min: 70, max: 80, count: 0 },
            { label: 'Below 70%', min: 0, max: 70, count: 0 }
        ];

        supList.forEach(s => {
            for (const r of ranges) {
                if (s.avg >= r.min && s.avg < r.max) {
                    r.count++;
                    break;
                }
            }
        });

        if (totalHqSups === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; font-size:12px; color:var(--text-muted)">No HQ validation supervisor performance scores logged</div>';
            return;
        }

        const maxC = Math.max(...ranges.map(r => r.count), 1);

        container.innerHTML = ranges.map(r => {
            const pct = (r.count / totalHqSups) * 100;
            const fillW = (r.count / maxC) * 100;
            return `
                <div class="dist-bar-item">
                    <div class="dist-bar-meta">
                        <span>${r.label}</span>
                        <strong>${r.count} Supervisors (${pct.toFixed(1)}%)</strong>
                    </div>
                    <div class="dist-bar-track">
                        <div class="dist-bar-fill" style="width: ${fillW}%; background: #3B82F6;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // REQUIREMENT 6D: HQ Table with Sample Size Context
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
                    <td>${item.calls} <span class="sample-size-tag">${item.calls} Calls</span></td>
                    <td><strong>${item.coverage.toFixed(1)}%</strong></td>
                `;
            } else {
                tr.innerHTML = `
                    <td><strong>${item.name}</strong></td>
                    <td>${item.gov}</td>
                    <td>${item.total}</td>
                    <td>${item.calls} <span class="sample-size-tag">${item.calls} Calls</span></td>
                    <td><strong>${item.coverage.toFixed(1)}%</strong></td>
                `;
            }
            tbody.appendChild(tr);
        });

        attachUniversalTableSorting('hq-validation-table');
    }

    // ==========================================================================
    // TAB 5: OPERATIONAL CASES CORE PIPELINE
    // ==========================================================================

    let opFilters = {
        '72h': { gov: 'all', sup: 'all', search: '' },
        'quest': { gov: 'all', sup: 'all', search: '' },
        'decl': { gov: 'all', sup: 'all', search: '' }
    };

    function setupOpControlsListeners() {
        ['72h', 'quest', 'decl'].forEach(sec => {
            const govSel = document.getElementById(`filter-${sec}-gov`);
            const supSel = document.getElementById(`filter-${sec}-sup`);
            const searchInp = document.getElementById(`search-${sec}`);

            if (govSel) {
                govSel.addEventListener('change', () => {
                    opFilters[sec].gov = govSel.value;
                    opFilters[sec].sup = 'all';
                    renderTab4OperationalCases(currentScopedGlobalDataset);
                });
            }

            if (supSel) {
                supSel.addEventListener('change', () => {
                    opFilters[sec].sup = supSel.value;
                    renderTab4OperationalCases(currentScopedGlobalDataset);
                });
            }

            if (searchInp) {
                searchInp.addEventListener('input', () => {
                    opFilters[sec].search = searchInp.value.trim().toLowerCase();
                    renderTab4OperationalCases(currentScopedGlobalDataset);
                });
            }
        });
    }

    let currentScopedGlobalDataset = [];

    function processTab4CasesPipeline(scopedData, metrics) {
        currentScopedGlobalDataset = scopedData;
        renderTab4OperationalCases(scopedData);
    }

    function renderTab4OperationalCases(scopedData) {
        const cases72h = scopedData.filter(r => 
            (!r['Training Status'] || r['Training Status'].trim() === '') && 
            r['72 hours'] && r['72 hours'].includes('Exceeded')
        );

        const casesQuest = scopedData.filter(r => isQuestionnaireExceeded(r));

        const casesDecl = scopedData.filter(r => {
            const status = (r['Training Status'] || '').trim();
            if (!status.includes('100%')) return false;
            const signed = r['Survey Result'] && r['Survey Result'].trim().toLowerCase() === 'signed';
            return !signed;
        });

        renderOpSection('72h', cases72h, '72H EXCEEDED', 'sec-72h-badge', 'container-72h-cases', true);
        renderOpSection('quest', casesQuest, 'QUESTIONNAIRE OVERDUE', 'sec-quest-badge', 'container-quest-cases', false);
        renderOpSection('decl', casesDecl, 'DECLARATION PENDING', 'sec-decl-badge', 'container-decl-cases', false);
    }

    // REQUIREMENT 4: Display Comment in Operational Cases
    function renderOpSection(secKey, population, titlePrefix, badgeId, containerId, includeHiringDate) {
        const badgeNode = document.getElementById(badgeId);
        const containerNode = document.getElementById(containerId);
        const govSel = document.getElementById(`filter-${secKey}-gov`);
        const supSel = document.getElementById(`filter-${secKey}-sup`);

        if (!containerNode) return;

        const totalCount = population.length;
        if (badgeNode) {
            badgeNode.textContent = `${totalCount} ${totalCount === 1 ? 'Case' : 'Cases'}`;
        }

        const govsInSec = Array.from(new Set(population.map(r => (r['Governorate'] || '').trim()).filter(g => g !== ''))).sort((a,b) => a.localeCompare(b));
        
        let currentGov = opFilters[secKey].gov;
        if (currentGov !== 'all' && !govsInSec.includes(currentGov)) {
            currentGov = 'all';
            opFilters[secKey].gov = 'all';
        }

        if (govSel) {
            govSel.innerHTML = '<option value="all">All Governorates</option>';
            govsInSec.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g;
                opt.textContent = g;
                govSel.appendChild(opt);
            });
            govSel.value = currentGov;
        }

        let supPopulation = population;
        if (currentGov !== 'all') {
            supPopulation = population.filter(r => (r['Governorate'] || '').trim() === currentGov);
        }
        const supsInSec = Array.from(new Set(supPopulation.map(r => (r['Supervisor'] || '').trim()).filter(s => s !== ''))).sort((a,b) => a.localeCompare(b));

        let currentSup = opFilters[secKey].sup;
        if (currentSup !== 'all' && !supsInSec.includes(currentSup)) {
            currentSup = 'all';
            opFilters[secKey].sup = 'all';
        }

        if (supSel) {
            supSel.innerHTML = '<option value="all">All Supervisors</option>';
            supsInSec.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                supSel.appendChild(opt);
            });
            supSel.value = currentSup;
        }

        const searchVal = opFilters[secKey].search;
        let filteredCases = population.filter(r => {
            const g = (r['Governorate'] || '').trim();
            const s = (r['Supervisor'] || '').trim();
            const name = (r['Officer Name'] || '').trim().toLowerCase();
            const hrCode = (r['HR Code'] || '').trim().toLowerCase();

            if (currentGov !== 'all' && g !== currentGov) return false;
            if (currentSup !== 'all' && s !== currentSup) return false;

            if (searchVal !== '') {
                const matchesName = name.includes(searchVal);
                const matchesHR = hrCode.includes(searchVal);
                if (!matchesName && !matchesHR) return false;
            }

            return true;
        });

        if (population.length === 0) {
            containerNode.innerHTML = `<div class="op-empty-state">No cases found for the selected period.</div>`;
            return;
        }

        if (filteredCases.length === 0) {
            containerNode.innerHTML = `<div class="op-empty-state">No cases match the selected filters.</div>`;
            return;
        }

        filteredCases.sort((a, b) => {
            const govA = (a['Governorate'] || '').trim();
            const govB = (b['Governorate'] || '').trim();
            const cGov = govA.localeCompare(govB);
            if (cGov !== 0) return cGov;

            const supA = (a['Supervisor'] || '').trim();
            const supB = (b['Supervisor'] || '').trim();
            const cSup = supA.localeCompare(supB);
            if (cSup !== 0) return cSup;

            const brA = (a['Branch'] || '').trim();
            const brB = (b['Branch'] || '').trim();
            const cBr = brA.localeCompare(brB);
            if (cBr !== 0) return cBr;

            const nameA = (a['Officer Name'] || '').trim();
            const nameB = (b['Officer Name'] || '').trim();
            return nameA.localeCompare(nameB);
        });

        const govGroups = {};
        filteredCases.forEach(r => {
            const g = (r['Governorate'] || '').trim() || 'Unknown';
            if (!govGroups[g]) govGroups[g] = [];
            govGroups[g].push(r);
        });

        const sortedGroupGovs = Object.keys(govGroups).sort((a,b) => a.localeCompare(b));

        let html = '';
        sortedGroupGovs.forEach(govName => {
            const groupList = govGroups[govName];
            const count = groupList.length;
            const countText = `${count} ${count === 1 ? 'Case' : 'Cases'}`;

            html += `
                <div class="op-gov-group">
                    <div class="op-gov-header">
                        <div class="op-gov-title-wrapper">
                            <span class="op-gov-name">${govName}</span>
                            <span class="op-gov-chip">${countText}</span>
                        </div>
                    </div>
                    <div class="op-table-wrapper">
                        <table class="op-cases-table">
                            <thead>
                                <tr>
                                    <th>Officer Name</th>
                                    <th>Specialization</th>
                                    <th>Branch</th>
                                    <th>Supervisor</th>
                                    ${includeHiringDate ? '<th>Hiring Date</th>' : '<th>Training Status</th>'}
                                    <th>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            groupList.forEach(r => {
                const name = r['Officer Name'] ? r['Officer Name'].trim() : 'N/A';
                const hrCode = r['HR Code'] ? r['HR Code'].trim() : '';
                const spec = r['Specialized'] ? r['Specialized'].trim() : 'N/A';
                const branch = r['Branch'] ? r['Branch'].trim() : 'N/A';
                const supervisor = r['Supervisor'] ? r['Supervisor'].trim() : 'N/A';
                const dateOrStatus = includeHiringDate 
                    ? (r['Hiring Date'] ? r['Hiring Date'].trim() : 'N/A')
                    : (r['Training Status'] ? r['Training Status'].trim() : '100% - Trained');

                const rawComment = r['Comment'] ? r['Comment'].trim() : '';
                const commentHtml = rawComment 
                    ? `<span class="op-comment-text">${rawComment}</span>`
                    : `<span class="op-comment-muted">No comment recorded</span>`;

                const hrCodeHtml = hrCode ? `<span class="op-hr-code">(${hrCode})</span>` : '';

                html += `
                    <tr>
                        <td><strong>${name}</strong> ${hrCodeHtml}</td>
                        <td>${spec}</td>
                        <td>${branch}</td>
                        <td>${supervisor}</td>
                        <td>${dateOrStatus}</td>
                        <td>${commentHtml}</td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        containerNode.innerHTML = html;
    }

    // Dynamic Resize Listener
    window.addEventListener('resize', () => {
        if (globalDataset.length > 0) {
            applyDynamicFiltering();
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