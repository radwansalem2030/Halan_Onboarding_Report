document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // AUTHENTICATION & SESSION MANAGEMENT
    // ==========================================================================
    const SESSION_KEY = 'mnt_halan_dashboard_session';
    const SESSION_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours

    // Auth UI Elements
    const loginOverlay = document.getElementById('login-overlay');
    const appShell = document.getElementById('app-shell');
    const loginForm = document.getElementById('login-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const togglePasswordBtn = document.getElementById('toggle-password');
    
    // Top Bar & Sidebar User Elements
    const topWelcomeMessage = document.getElementById('top-welcome-message');
    const topUserAvatar = document.getElementById('top-user-avatar');
    
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    
    const logoutBtn = document.getElementById('logout-btn');

    // Sidebar Toggle Logic
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (sidebarToggleBtn && appShell) {
        sidebarToggleBtn.addEventListener('click', () => {
            appShell.classList.toggle('sidebar-collapsed');
        });
    }

    // Derived Hash Function for Client-Side Storage Avoidance
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    // Application Users Registry
    const USERS = {
        'radwan': {
            hash: simpleHash('R@123456'),
            displayName: 'Radwan Salem',
            role: 'User'
        },
        'gazar': {
            hash: simpleHash('G@123456'),
            displayName: 'Gazar',
            role: 'Team User'
        },
        'fathallah': {
            hash: simpleHash('F@123456'),
            displayName: 'Fathallah',
            role: 'Team User'
        },
         'ibrahim': {
            hash: simpleHash('@123456'),
            displayName: 'Ibrahim Refaat',
            role: 'Team User'
        },
                 'karen': {
            hash: simpleHash('K@123456'),
            displayName: 'Karen Beshay',
            role: 'Team User'
        }
    };

    function showDashboard(displayName, role) {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (appShell) appShell.style.display = 'flex';
        
        if (sidebarUserName) sidebarUserName.textContent = displayName;
        if (sidebarUserRole) sidebarUserRole.textContent = role;
        if (sidebarAvatar) sidebarAvatar.textContent = displayName.charAt(0).toUpperCase();

        if (topWelcomeMessage) topWelcomeMessage.textContent = displayName;
        if (topUserAvatar) topUserAvatar.textContent = displayName.charAt(0).toUpperCase();
    }

    function handleLogout() {
        localStorage.removeItem(SESSION_KEY);
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (appShell) appShell.style.display = 'none';
        if (loginUsernameInput) loginUsernameInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    }

    function createSession(username) {
        const user = USERS[username];
        const now = new Date().getTime();
        const session = {
            authenticated: true,
            username: username,
            displayName: user.displayName,
            role: user.role,
            loginTimestamp: now,
            expiration: now + SESSION_DURATION_MS
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        showDashboard(user.displayName, user.role);
    }

    function checkSession() {
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                if (session.authenticated && session.expiration > now) {
                    showDashboard(session.displayName, session.role);
                    return true;
                } else {
                    handleLogout(); // Session expired
                }
            } catch (e) {
                handleLogout(); // Malformed session
            }
        } else {
            handleLogout(); // No session exists
        }
        return false;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;
            
            if (USERS[username]) {
                const inputHash = simpleHash(password);
                if (inputHash === USERS[username].hash) {
                    if (loginErrorMsg) loginErrorMsg.style.display = 'none';
                    createSession(username);
                    return;
                }
            }
            if (loginErrorMsg) {
                loginErrorMsg.style.display = 'block';
                loginErrorMsg.textContent = 'Invalid username or password.';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            if (loginPasswordInput.type === 'password') {
                loginPasswordInput.type = 'text';
                togglePasswordBtn.textContent = 'Hide';
            } else {
                loginPasswordInput.type = 'password';
                togglePasswordBtn.textContent = 'Show';
            }
        });
    }

    // Initialize session state on load
    checkSession();

    // ==========================================================================
    // UI ELEMENTS BINDER & GLOBALS
    // ==========================================================================
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
    let supervisorGlobalMetrics = {};
    let rawSupervisorRecordsGlobal = [];
    let turnoverDatasetGlobal = []; // New Tab Dataset

    let currentGovMatrixSort = { key: 'eff', dir: 'desc' };
    let currentSupGovSort = { key: 'officers', dir: 'desc' };
    let currentSupDetailSort = { key: 'gov', dir: 'asc' };
    let currentMosGovSort = { key: 'projRate', dir: 'desc' };

    // Ranking active range filter state
    let activeRankingRangeFilter = 'ALL';

    // Tab 2 Global UI View States
    let resignationGovShowAll = false;
    let govPerfShowAll = false;

    // HQ Validation Globals
    let hqBreakdownMode = 'gov'; // 'gov' | 'sup'
    let hqSortConfig = { key: 'name', dir: 'asc' };

    // Measure of Success Filter State
    const PROJECT_LAUNCH_DATE_STR = '2026-06-18';
    let mosState = {
        currentFrom: '2026-07-01',
        currentTo: toISODateStr(new Date()),
        previousFrom: '2026-05-01',
        previousTo: '2026-06-30',
        comparisonManual: false,
        // Compatibility aliases used by the existing reconciliation logic.
        baseFrom: '2026-05-01',
        baseTo: '2026-06-30',
        projFrom: '2026-07-01',
        projTo: toISODateStr(new Date()),
        gov: 'all',
        businessLines: ['all'],
        titles: ['all']
    };

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

    // Dynamic Filter UI Builder
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

    function applyDynamicFiltering() {
        const chosenValue = monthFilterSelect.value;
        let scopedData = globalDataset;
        let scopedSupRecords = rawSupervisorRecordsGlobal;

        if (chosenValue !== 'all') {
            scopedData = globalDataset.filter(row => parseMonthKey(row['Hiring Date']) === chosenValue);
            scopedSupRecords = rawSupervisorRecordsGlobal.filter(row => parseMonthKey(row['Hiring Date']) === chosenValue);
        }

        const metrics = calculateCentralMetrics(scopedData);

        processMetricsPipeline(scopedData, metrics);
        
        if (typeof processTab2AnalyticsPipeline === 'function') {
            processTab2AnalyticsPipeline(scopedData, metrics);
        }
        if (typeof processTab3SupervisorPipeline === 'function') {
            processTab3SupervisorPipeline(scopedSupRecords);
        }
        if(typeof renderHQValidationSection === 'function') {
            renderHQValidationSection(scopedSupRecords);
        }
        if (typeof processTab4CasesPipeline === 'function') {
            processTab4CasesPipeline(scopedData, metrics);
        }
        if (typeof renderMeasureOfSuccessTab === 'function') {
            renderMeasureOfSuccessTab();
        }
        if (typeof renderResignationAuditTab === 'function') {
            renderResignationAuditTab(); 
        }
        if (typeof renderHRReconciliationGapDiagnostics === 'function') {
            renderHRReconciliationGapDiagnostics();
        }
    }

    monthFilterSelect.addEventListener('change', applyDynamicFiltering);
    if (typeof setupOpControlsListeners === 'function') setupOpControlsListeners();

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

    function renderPremiumLineChart(data) {
        if (!nodeLineChartContainer) return;

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

                <line x1="${pL}" y1="${pT}" x2="${pL + chartW}" y2="${pT}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-opacity="0.5"/>
                <line x1="${pL}" y1="${pT + chartH / 2}" x2="${pL + chartW}" y2="${pT + chartH / 2}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-opacity="0.5"/>
                <line x1="${pL}" y1="${pT + chartH}" x2="${pL + chartW}" y2="${pT + chartH}" stroke="var(--border-color)" stroke-width="1.2"/>

                <path d="${areaD}" fill="url(#premium-area-gradient)"/>
                <path d="${lineD}" fill="none" stroke="var(--brand-purple)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        `;

        const labelInterval = Math.max(1, Math.ceil(totalPoints / 7));

        points.forEach((pt, idx) => {
            const fullD = formatFullDate(pt.dateStr) || { dateStr: pt.dateStr, dayOfWeek: '' };
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

    function attachUniversalTableSorting(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const headers = table.querySelectorAll('th[data-sort], th[data-sup-gov-sort], th[data-sup-detail-sort], th[data-hq-sort], th[data-mos-sort], th[data-audit-sort]');
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
                        <span class="stat-lbl">Session Not Started (${m.notTrainedCount})</span>
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

// ==========================================================================
    // TAB 3: SUPERVISOR PERFORMANCE ENGINE & RENDERING
    // ==========================================================================
    function aggregateSupervisorData(rawRecords) {
        if (rawRecords.length === 0) {
            return { 
                supervisors: [], 
                rawQuestValids: [], raw72hValids: [], rawSlaQuestValids: [], rawHqValids: [],
                globalCoveredOfficers: 0, globalBranches: 0, globalTrainedOfficers: 0 
            };
        }

        const sample = rawRecords[0];
        const supCol = findColumnName(sample, ['Supervisor Name', 'Supervisor', 'Direct Manager', 'Manager']);
        const govCol = findColumnName(sample, ['Gov', 'Governorate', 'Region', 'Branch Governorate']);
        const officerCol = findColumnName(sample, ['Officer HR Code', 'HR Code', 'Officer Code', 'Officer Name', 'Employee ID']);
        const branchCol = findColumnName(sample, ['Branch', 'Branch Name', 'Branch Code']);
        
        const questCol = findColumnName(sample, ['Questionnaire Result', 'Test Result', 'Knowledge Result']);
        const sla72Col = findColumnName(sample, ['72 hours Lateness Result', '72h Lateness Result', '72h SLA Result']);
        const slaQuestCol = findColumnName(sample, ['Questionnaire Lateness Result', 'Quest SLA Result', 'Questionnaire SLA']);
        const hqCol = findColumnName(sample, ['HQ Call Result', 'HQ Call', 'HQ Validation']);
        
        // يعتمد حساب عبء العمل على توفر تاريخ انتهاء التدريب لضمان دقة الأرقام
        const lastDateCol = findColumnName(sample, ['Last Date Training', 'Last Training Date', 'Completion Date']);

        const supMap = {};
        
        const rawQuestValids = [];
        const raw72hValids = [];
        const rawSlaQuestValids = [];
        const rawHqValids = [];
        
        const globalCoveredOfficers = new Set();
        const globalTrainedOfficers = new Set();
        const globalBranches = new Set();

        rawRecords.forEach((row, idx) => {
            const supName = row[supCol] ? row[supCol].trim() : '';
            if (!supName) return;

            const gov = row[govCol] ? row[govCol].trim() : 'Unknown';
            // المعالجة الدائمة لمشكلة اختفاء عمود الـ ID
            const officerId = row[officerCol] ? row[officerCol].trim() : "ROW_" + idx;
            const branchId = row[branchCol] ? row[branchCol].trim() : null;
            
            const parsedQuest = questCol ? parseFinalResult(row[questCol]) : null;
            const parsed72h = sla72Col ? parseFinalResult(row[sla72Col]) : null;
            const parsedSlaQuest = slaQuestCol ? parseFinalResult(row[slaQuestCol]) : null;
            const parsedHq = hqCol ? parseFinalResult(row[hqCol]) : null;
            
            const lastDateVal = lastDateCol ? String(row[lastDateCol]).trim() : '';
            const isTrained = lastDateVal !== '' && lastDateVal.toLowerCase() !== 'nan' && lastDateVal.toLowerCase() !== 'null';

            const hasValidEvaluation = (parsedQuest !== null || parsed72h !== null || parsedSlaQuest !== null || parsedHq !== null);

            if (!supMap[supName]) {
                supMap[supName] = {
                    supervisor: supName,
                    governorate: gov,
                    coveredOfficersSet: new Set(),
                    trainedOfficersSet: new Set(),
                    branchesSet: new Set(),
                    
                    questSum: 0, questCount: 0,
                    sla72Sum: 0, sla72Count: 0,
                    slaQuestSum: 0, slaQuestCount: 0,
                    hqSum: 0, hqCount: 0
                };
            }

            if (hasValidEvaluation) {
                supMap[supName].coveredOfficersSet.add(officerId);
                globalCoveredOfficers.add(officerId);
            }
            if (isTrained) {
                supMap[supName].trainedOfficersSet.add(officerId);
                globalTrainedOfficers.add(officerId);
            }
            
            if (branchId) {
                if (hasValidEvaluation || isTrained) {
                    supMap[supName].branchesSet.add(branchId);
                    globalBranches.add(branchId);
                }
            }

            if (parsedQuest !== null) {
                supMap[supName].questCount++;
                supMap[supName].questSum += parsedQuest;
                rawQuestValids.push({ val: parsedQuest, officerId });
            }
            if (parsed72h !== null) {
                supMap[supName].sla72Count++;
                supMap[supName].sla72Sum += parsed72h;
                raw72hValids.push({ val: parsed72h, officerId });
            }
            if (parsedSlaQuest !== null) {
                supMap[supName].slaQuestCount++;
                supMap[supName].slaQuestSum += parsedSlaQuest;
                rawSlaQuestValids.push({ val: parsedSlaQuest, officerId });
            }
            if (parsedHq !== null) {
                supMap[supName].hqCount++;
                supMap[supName].hqSum += parsedHq;
                rawHqValids.push({ val: parsedHq, officerId });
            }
        });

        const compiledSupervisors = Object.values(supMap).map(s => {
            const coveredOfficers = s.coveredOfficersSet.size;
            const trainedWorkload = s.trainedOfficersSet.size;
            const uniqueBranches = s.branchesSet.size;
            
            const avgQuest = s.questCount > 0 ? (s.questSum / s.questCount) : null;
            const avgSla72 = s.sla72Count > 0 ? (s.sla72Sum / s.sla72Count) : null;
            const avgSlaQuest = s.slaQuestCount > 0 ? (s.slaQuestSum / s.slaQuestCount) : null;
            const avgHq = s.hqCount > 0 ? (s.hqSum / s.hqCount) : null;
            
            let slaPerformance = null;
            let slaPillars = 0;
            let slaTotal = 0;
            if (avgSla72 !== null) { slaTotal += avgSla72; slaPillars++; }
            if (avgSlaQuest !== null) { slaTotal += avgSlaQuest; slaPillars++; }
            if (slaPillars > 0) { slaPerformance = slaTotal / slaPillars; }
            
            let overallTotal = 0;
            let overallPillars = 0;
            if (avgQuest !== null) { overallTotal += avgQuest; overallPillars++; }
            if (slaPerformance !== null) { overallTotal += slaPerformance; overallPillars++; }
            if (avgHq !== null) { overallTotal += avgHq; overallPillars++; }
            
            const overallPerformance = overallPillars > 0 ? (overallTotal / overallPillars) : null;

            return {
                supervisor: s.supervisor,
                governorate: s.governorate,
                coveredOfficers,
                trainedWorkload,
                uniqueBranches,
                avgQuestResult: avgQuest,
                avgSla72: avgSla72,
                avgSlaQuest: avgSlaQuest,
                avgSlaCombined: slaPerformance,
                avgHqResult: avgHq,
                overallPerformance,
                
                questCount: s.questCount,
                sla72Count: s.sla72Count,
                slaQuestCount: s.slaQuestCount,
                hqCount: s.hqCount
            };
        });

        return { 
            supervisors: compiledSupervisors, 
            rawQuestValids, 
            raw72hValids, 
            rawSlaQuestValids, 
            rawHqValids,
            globalCoveredOfficers: globalCoveredOfficers.size,
            globalBranches: globalBranches.size,
            globalTrainedOfficers: globalTrainedOfficers.size
        };
    }

    function processTab3SupervisorPipeline(supRecords) {
        const metricsObj = aggregateSupervisorData(supRecords);
        const { supervisors, rawQuestValids, raw72hValids, rawSlaQuestValids, rawHqValids } = metricsObj;
        
        supervisorDataset = supervisors;
        supervisorGlobalMetrics = metricsObj;

        renderSupervisorOperationalScope(supervisors, metricsObj);
        renderSupervisorPrimaryKPIs(rawQuestValids, raw72hValids, rawSlaQuestValids, rawHqValids, supRecords);
        renderPerformanceWorkloadSegmentation(supervisors);
        renderSupervisorAnalyticalHighlights(supervisors);
        renderSupervisorPerformanceRanking(supervisors, activeRankingRangeFilter);
        renderPerformanceAndWorkloadDistributions(supervisors);
        renderSupervisionByGovernorate(supervisors, supRecords);
        populateSupervisorGovFilter(supervisors);
        renderSupervisorDetailsTable(supervisors);
        renderSupervisorInsights(supervisors, supRecords);
    }

    function renderSupervisorOperationalScope(supervisors, globalMetrics) {
        const container = document.getElementById('sup-op-scope-strip');
        if (!container) return;

        const totalSupervisors = supervisors.length;
        const govSet = new Set(supervisors.map(s => s.governorate));
        const activeGovs = govSet.size;

        const totalCoveredOfficers = globalMetrics.globalCoveredOfficers || 0;
        const totalBranches = globalMetrics.globalBranches || 0;

        const avgOfficersPerSup = totalSupervisors > 0 ? (totalCoveredOfficers / totalSupervisors) : 0;
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
                <span class="sup-card-val">${totalCoveredOfficers.toLocaleString()}</span>
                <span class="sup-card-sub">Avg ${avgOfficersPerSup.toFixed(1)} / Sup</span>
            </div>
        `;
    }

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

    function renderSupervisorPrimaryKPIs(rawQuestValids, raw72hValids, rawSlaQuestValids, rawHqValids, supRecords) {
        const container = document.getElementById('sup-primary-kpi-grid');
        if (!container) return;

        const questAvg = rawQuestValids.length > 0 ? (rawQuestValids.reduce((a, b) => a + b.val, 0) / rawQuestValids.length) : null;
        
        const sla72Avg = raw72hValids.length > 0 ? (raw72hValids.reduce((a, b) => a + b.val, 0) / raw72hValids.length) : null;
        const slaQuestAvg = rawSlaQuestValids.length > 0 ? (rawSlaQuestValids.reduce((a, b) => a + b.val, 0) / rawSlaQuestValids.length) : null;
        
        let slaTotal = 0;
        let slaPillars = 0;
        if (sla72Avg !== null) { slaTotal += sla72Avg; slaPillars++; }
        if (slaQuestAvg !== null) { slaTotal += slaQuestAvg; slaPillars++; }
        const combinedSlaAvg = slaPillars > 0 ? (slaTotal / slaPillars) : null;

        const hqAvg = rawHqValids.length > 0 ? (rawHqValids.reduce((a, b) => a + b.val, 0) / rawHqValids.length) : null;
        
        let overallTotal = 0;
        let overallPillars = 0;
        if (questAvg !== null) { overallTotal += questAvg; overallPillars++; }
        if (combinedSlaAvg !== null) { overallTotal += combinedSlaAvg; overallPillars++; }
        if (hqAvg !== null) { overallTotal += hqAvg; overallPillars++; }
        const overallAvg = overallPillars > 0 ? (overallTotal / overallPillars) : 0;

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
                    <span class="main-value text-purple">${overallPillars > 0 ? overallAvg.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub" style="max-width: 55%; font-size: 10px; line-height: 1.4;">Average across<br>Knowledge, SLA & HQ</div>
                <div class="kpi-exec-denom" style="max-width: 55%; font-size: 9.5px; line-height: 1.4;">Calculated from<br><strong>${overallPillars}</strong> active metrics</div>
                ${card1Spark}
            </div>
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">KNOWLEDGE PERFORMANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-success">${questAvg !== null ? questAvg.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub" style="max-width: 55%; font-size: 10px; line-height: 1.4;">Average Questionnaire<br>or Test result score</div>
                <div class="kpi-exec-denom" style="max-width: 55%; font-size: 9.5px; line-height: 1.4;">Based on<br><strong>${rawQuestValids.length.toLocaleString()}</strong> valid results</div>
                ${card2Spark}
            </div>
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">SLA COMPLIANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-orange-main">${combinedSlaAvg !== null ? combinedSlaAvg.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub" style="max-width: 55%; font-size: 10px; line-height: 1.4;">Combined 72h &<br>Quest. Overdue SLA</div>
                <div class="kpi-exec-denom" style="max-width: 55%; font-size: 9.5px; line-height: 1.4;"><strong>${raw72hValids.length.toLocaleString()}</strong> 72h cases<br><strong>${rawSlaQuestValids.length.toLocaleString()}</strong> Quest cases</div>
                ${card3Spark}
            </div>
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">HQ VALIDATION</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value" style="color: #3B82F6;">${hqAvg !== null ? hqAvg.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub" style="max-width: 55%; font-size: 10px; line-height: 1.4;">Average HQ validation<br>call score result</div>
                <div class="kpi-exec-denom" style="max-width: 55%; font-size: 9.5px; line-height: 1.4;">Based on<br><strong>${rawHqValids.length.toLocaleString()}</strong> valid results</div>
                ${card4Spark}
            </div>
        `;
    }

    function renderPerformanceWorkloadSegmentation(supervisors) {
        const container = document.getElementById('sup-performance-segmentation-container');
        if (!container) return;

        const validSups = supervisors.filter(s => s.overallPerformance !== null);
        if (validSups.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; font-size:12px; color:var(--text-muted)">No valid supervisor performance results available</div>';
            return;
        }

        const workloads = validSups.map(s => s.trainedWorkload);
        const results = validSups.map(s => s.overallPerformance);

        const medWorkload = calculateMedian(workloads);
        const medResult = calculateMedian(results);

        const seg1 = validSups.filter(s => s.overallPerformance >= medResult && s.trainedWorkload >= medWorkload);
        const seg2 = validSups.filter(s => s.overallPerformance >= medResult && s.trainedWorkload < medWorkload);
        const seg3 = validSups.filter(s => s.overallPerformance < medResult && s.trainedWorkload >= medWorkload);
        const seg4 = validSups.filter(s => s.overallPerformance < medResult && s.trainedWorkload < medWorkload);

        const renderSegTopSups = (list) => {
            if (list.length === 0) return '<div class="seg-empty-txt">No supervisors in segment</div>';
            const top3 = [...list].sort((a,b) => b.overallPerformance - a.overallPerformance).slice(0, 3);
            return top3.map(s => `
                <div class="seg-sup-item">
                    <div style="display:flex; flex-direction:column; gap:1px; overflow:hidden;">
                        <span class="seg-sup-name" title="${s.supervisor}">${s.supervisor}</span>
                        <span style="font-size:10px; color:var(--text-muted);">${s.governorate}</span>
                    </div>
                    <span class="seg-sup-val"><strong>${s.overallPerformance.toFixed(1)}%</strong> (${s.trainedWorkload} trained)</span>
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
                    <div class="seg-card-sub">Result ≥ ${medResult.toFixed(1)}% & Workload ≥ ${medWorkload.toFixed(0)} trained officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg1)}</div>
                </div>
                <div class="seg-card seg-card-blue">
                    <div class="seg-card-head">
                        <span class="seg-card-title">STRONG PERFORMANCE / LOWER VOLUME</span>
                        <span class="seg-card-count text-purple">${seg2.length} Supervisors</span>
                    </div>
                    <div class="seg-card-sub">Result ≥ ${medResult.toFixed(1)}% & Workload < ${medWorkload.toFixed(0)} trained officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg2)}</div>
                </div>
                <div class="seg-card seg-card-orange">
                    <div class="seg-card-head">
                        <span class="seg-card-title">HIGH VOLUME / LOWER PERFORMANCE</span>
                        <span class="seg-card-count text-orange-main">${seg3.length} Supervisors</span>
                    </div>
                    <div class="seg-card-sub">Result < ${medResult.toFixed(1)}% & Workload ≥ ${medWorkload.toFixed(0)} trained officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg3)}</div>
                </div>
                <div class="seg-card seg-card-gray">
                    <div class="seg-card-head">
                        <span class="seg-card-title">LOWER PERFORMANCE / LOWER VOLUME</span>
                        <span class="seg-card-count text-muted">${seg4.length} Supervisors</span>
                    </div>
                    <div class="seg-card-sub">Result < ${medResult.toFixed(1)}% & Workload < ${medWorkload.toFixed(0)} trained officers</div>
                    <div class="seg-sup-list">${renderSegTopSups(seg4)}</div>
                </div>
            </div>
        `;
    }

    function renderSupervisorAnalyticalHighlights(supervisors) {
        const highlightsBox = document.getElementById('sup-analytical-highlights');
        if (!highlightsBox) return;

        const validSups = supervisors.filter(s => s.overallPerformance !== null);
        if (validSups.length === 0) {
            highlightsBox.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:20px 0;">No matching supervisor data</div>';
            return;
        }

        const workloads = validSups.map(s => s.trainedWorkload);
        const medWorkload = calculateMedian(workloads);

        const atScale = validSups.filter(s => s.trainedWorkload >= medWorkload);

        const highestWk = [...validSups].sort((a,b) => b.trainedWorkload - a.trainedWorkload)[0];
        const strongScale = [...atScale].sort((a,b) => b.overallPerformance - a.overallPerformance)[0];
        const highLowScale = [...atScale].sort((a,b) => a.overallPerformance - b.overallPerformance)[0];
        const bestKnowledge = [...atScale].filter(s => s.avgQuestResult !== null).sort((a,b) => b.avgQuestResult - a.avgQuestResult)[0];

        highlightsBox.innerHTML = `
            <div class="callout-card">
                <span class="callout-label">Highest Training Workload</span>
                <strong class="callout-main-text">${highestWk ? highestWk.supervisor : '-'}</strong>
                <span class="callout-sub-text">${highestWk ? `${highestWk.governorate} • ${highestWk.overallPerformance.toFixed(1)}% Result · ${highestWk.trainedWorkload} trained officers (${highestWk.coveredOfficers} evaluated)` : '-'}</span>
            </div>
            <div class="callout-card">
                <span class="callout-label">Strongest Performance at Scale</span>
                <strong class="callout-main-text">${strongScale ? strongScale.supervisor : '-'}</strong>
                <span class="callout-sub-text">${strongScale ? `${strongScale.governorate} • ${strongScale.overallPerformance.toFixed(1)}% Result · ${strongScale.coveredOfficers} evaluated officers` : '-'}</span>
            </div>
            <div class="callout-card">
                <span class="callout-label">High Workload / Lower Performance</span>
                <strong class="callout-main-text">${highLowScale ? highLowScale.supervisor : '-'}</strong>
                <span class="callout-sub-text">${highLowScale ? `${highLowScale.governorate} • ${highLowScale.overallPerformance.toFixed(1)}% Result · ${highLowScale.coveredOfficers} evaluated officers` : '-'}</span>
            </div>
            <div class="callout-card">
                <span class="callout-label">Highest Knowledge Result at Scale</span>
                <strong class="callout-main-text">${bestKnowledge ? bestKnowledge.supervisor : '-'}</strong>
                <span class="callout-sub-text">${bestKnowledge ? `${bestKnowledge.governorate} • ${bestKnowledge.avgQuestResult.toFixed(1)}% Knowledge Result · ${bestKnowledge.trainedWorkload} trained officers` : '-'}</span>
            </div>
        `;
    }

    function renderSupervisorPerformanceRanking(supervisors, rangeFilter = 'ALL') {
        const container = document.getElementById('sup-performance-ranking-container');
        const filterBar = document.getElementById('ranking-range-filters');
        if (!container) return;

        activeRankingRangeFilter = rangeFilter;

        const validSups = supervisors.filter(s => s.overallPerformance !== null);
        if (validSups.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; font-size:12px; color:var(--text-muted)">No valid supervisor performance results available</div>';
            if (filterBar) filterBar.innerHTML = '';
            return;
        }

        const counts = {
            'ALL': validSups.length,
            '90-100': validSups.filter(s => s.overallPerformance >= 90).length,
            '80-89': validSups.filter(s => s.overallPerformance >= 80 && s.overallPerformance < 90).length,
            '70-79': validSups.filter(s => s.overallPerformance >= 70 && s.overallPerformance < 80).length,
            'BELOW-70': validSups.filter(s => s.overallPerformance < 70).length
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
        if (activeRankingRangeFilter === '90-100') filtered = filtered.filter(s => s.overallPerformance >= 90);
        else if (activeRankingRangeFilter === '80-89') filtered = filtered.filter(s => s.overallPerformance >= 80 && s.overallPerformance < 90);
        else if (activeRankingRangeFilter === '70-79') filtered = filtered.filter(s => s.overallPerformance >= 70 && s.overallPerformance < 80);
        else if (activeRankingRangeFilter === 'BELOW-70') filtered = filtered.filter(s => s.overallPerformance < 70);

        filtered.sort((a, b) => b.overallPerformance - a.overallPerformance);

        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:30px; font-size:12px; color:var(--text-muted)">No supervisors in selected performance range</div>';
            return;
        }

        let html = '<div class="sup-ranking-list">';
        filtered.forEach((s, idx) => {
            const resPct = s.overallPerformance.toFixed(1);
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
                                <div class="sup-ranking-bar-fill" style="width: ${Math.min(s.overallPerformance, 100)}%;"></div>
                            </div>
                            <span class="sup-ranking-val-pct">${resPct}%</span>
                        </div>
                        <div class="sup-ranking-sample-context">
                            <strong>${s.coveredOfficers} evaluated</strong> • ${s.trainedWorkload} trained officers managed
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    function renderPerformanceAndWorkloadDistributions(supervisors) {
        const perfBox = document.getElementById('sup-perf-dist-container');
        const workBox = document.getElementById('sup-workload-dist-container');

        if (perfBox) {
            const validSups = supervisors.filter(s => s.overallPerformance !== null);
            const ranges = [
                { label: '90% – 100%', rangeKey: '90-100', min: 90, max: 100.01, count: 0 },
                { label: '80% – 89%', rangeKey: '80-89', min: 80, max: 90, count: 0 },
                { label: '70% – 79%', rangeKey: '70-79', min: 70, max: 80, count: 0 },
                { label: 'Below 70%', rangeKey: 'BELOW-70', min: 0, max: 70, count: 0 }
            ];

            validSups.forEach(s => {
                const res = s.overallPerformance;
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
            const officersList = supervisors.map(s => s.trainedWorkload);
            const med = calculateMedian(officersList);
            const maxW = Math.max(...officersList, 0);

            const wRanges = [
                { label: '1 – 5 Trained', min: 1, max: 6, count: 0 },
                { label: '6 – 15 Trained', min: 6, max: 16, count: 0 },
                { label: '16 – 25 Trained', min: 16, max: 26, count: 0 },
                { label: '26+ Trained', min: 26, max: 999, count: 0 }
            ];

            supervisors.forEach(s => {
                const w = s.trainedWorkload;
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
                    Median Workload: <strong>${med.toFixed(0)} Trained Officers/Sup</strong> • Highest Workload: <strong>${maxW} Trained Officers</strong>
                </div>
            `;
            workBox.innerHTML = html;
        }
    }

    function renderSupervisionByGovernorate(supervisors, rawRecords) {
        const tbody = document.getElementById('sup-gov-matrix-tbody');
        if (!tbody) return;

        if (!supervisors || supervisors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No records for selected month</td></tr>';
            return;
        }

        const govMap = {};

        supervisors.forEach(s => {
            const g = s.governorate;
            if (!govMap[g]) {
                govMap[g] = {
                    gov: g,
                    supervisorsCount: 0,
                    trainedWorkload: 0,
                    branchesCount: 0,
                    coveredCount: 0,
                    supAverages: []
                };
            }
            govMap[g].supervisorsCount++;
            govMap[g].trainedWorkload += s.trainedWorkload;
            govMap[g].branchesCount += s.uniqueBranches;
            govMap[g].coveredCount += s.coveredOfficers;
            if (s.overallPerformance !== null) {
                govMap[g].supAverages.push(s.overallPerformance);
            }
        });

        const govList = Object.values(govMap).map(g => {
            const avgFinalResult = g.supAverages.length > 0 ? (g.supAverages.reduce((a, b) => a + b, 0) / g.supAverages.length) : null;
            const coverage = g.trainedWorkload > 0 ? (g.coveredCount / g.trainedWorkload) * 100 : 0;

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
                <td>${r.trainedWorkload}</td>
                <td>${r.branchesCount}</td>
                <td>${r.coveredCount}</td>
                <td>${r.coverage.toFixed(1)}%</td>
                <td><strong>${resStr}</strong> <span class="sample-size-tag">n=${r.coveredCount}</span></td>
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
            'officers': 'trainedWorkload',
            'branches': 'uniqueBranches',
            'evaluated': 'coveredOfficers',
            'coverage': 'evaluationCoverage', 
            'avgResult': 'overallPerformance'
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
            const resStr = s.overallPerformance !== null ? `${s.overallPerformance.toFixed(1)}%` : 'N/A';
            const coverage = s.trainedWorkload > 0 ? (s.coveredOfficers / s.trainedWorkload) * 100 : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.supervisor}</strong></td>
                <td>${s.governorate}</td>
                <td>${s.trainedWorkload}</td>
                <td>${s.uniqueBranches}</td>
                <td>${s.coveredOfficers}</td>
                <td>${coverage.toFixed(1)}%</td>
                <td><strong>${resStr}</strong> <span class="sample-size-tag">n=${s.coveredOfficers}</span></td>
            `;
            tbody.appendChild(tr);
        });

        attachUniversalTableSorting('sup-details-table');
    }

    function renderSupervisorInsights(supervisors, rawRecords) {
        const container = document.getElementById('sup-insights-grid');
        if (!container) return;

        const insights = [];

        const sortedWorkload = [...supervisors].sort((a,b) => b.trainedWorkload - a.trainedWorkload);
        const totalOfficers = supervisors.reduce((a,b) => a + b.trainedWorkload, 0);
        if (sortedWorkload.length >= 5 && totalOfficers > 0) {
            const top5Workload = sortedWorkload.slice(0, 5).reduce((a,b) => a + b.trainedWorkload, 0);
            const share = ((top5Workload / totalOfficers) * 100).toFixed(1);
            insights.push({
                title: "Workload concentration among top supervisors",
                tag: "Workload Concentration",
                text: `Training Workload is concentrated among a small group of supervisors. The five busiest supervisors manage <strong>${top5Workload} trained officers</strong> (${share}% of the operational total).`
            });
        }

        const medWorkload = calculateMedian(supervisors.map(s => s.trainedWorkload));
        const highWkSups = supervisors.filter(s => s.trainedWorkload >= medWorkload && s.overallPerformance !== null);
        if (highWkSups.length > 0) {
            const topHighWkResult = highWkSups.sort((a,b) => b.overallPerformance - a.overallPerformance)[0];
            insights.push({
                title: `${topHighWkResult.supervisor} records strong results under high workload`,
                tag: "High Volume Performance",
                text: `<strong>${topHighWkResult.supervisor}</strong> (${topHighWkResult.governorate}) achieves an <strong>${topHighWkResult.overallPerformance.toFixed(1)}%</strong> Overall Performance across <strong>${topHighWkResult.coveredOfficers} evaluated officers</strong> (${topHighWkResult.trainedWorkload} trained officers managed).`
            });
        }

        const lowCovSups = supervisors.filter(s => s.trainedWorkload > 0 && (s.coveredOfficers / s.trainedWorkload) * 100 < 50);
        if (lowCovSups.length > 0) {
            const lowest = lowCovSups.sort((a,b) => (a.coveredOfficers / a.trainedWorkload) - (b.coveredOfficers / b.trainedWorkload))[0];
            const covPct = (lowest.coveredOfficers / lowest.trainedWorkload) * 100;
            insights.push({
                title: "Low evaluation coverage in specific supervisory units",
                tag: "Evaluation Completeness",
                text: `<strong>${lowest.supervisor}</strong> (${lowest.governorate}) records an evaluation coverage of <strong>${covPct.toFixed(1)}%</strong>, with only <strong>${lowest.coveredOfficers} of ${lowest.trainedWorkload} trained officers evaluated</strong>.`
            });
        }

        const govMap = {};
        supervisors.forEach(s => {
            if (s.overallPerformance !== null) {
                if (!govMap[s.governorate]) govMap[s.governorate] = [];
                govMap[s.governorate].push(s.overallPerformance);
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
                text: `${maxGapGov} exhibits a Supervisor Overall Result Gap of <strong>${maxGapVal.toFixed(1)}%</strong> between its highest and lowest performing supervisors.`
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

        supRecords.forEach((row, idx) => {
            const supName = row[supCol] ? row[supCol].trim() : '';
            if (!supName) return;

            // حل مشكلة اختفاء الـ HR Code عن طريق استخدام رقم الصف كـ ID بديل
            const officerId = row[officerCol] ? String(row[officerCol]).trim() : "ROW_" + idx;
            const gov = row[govCol] ? String(row[govCol]).trim() : 'Unknown';
            const rawHqVal = hqCol ? row[hqCol] : null;
            const parsedHqVal = parseFinalResult(rawHqVal);

            totalOfficersSet.add(officerId);

            if (!govMap[gov]) govMap[gov] = { name: gov, totalOfficers: new Set(), calledOfficers: new Set() };
            govMap[gov].totalOfficers.add(officerId);

            if (!supMap[supName]) supMap[supName] = { name: supName, gov: gov, totalOfficers: new Set(), calledOfficers: new Set() };
            supMap[supName].totalOfficers.add(officerId);

            // لو مسجل ليه نتيجة أو محاولة اتصال (Coverage)
            if (isValidHQVal(rawHqVal)) {
                calledOfficersSet.add(officerId);
                govMap[gov].calledOfficers.add(officerId);
                supMap[supName].calledOfficers.add(officerId);
            }

            // لو النتيجة رقمية وصالحة عشان تدخل في حساب المتوسط (Performance)
            if (parsedHqVal !== null) {
                hqResultRecords.push({ val: parsedHqVal, officerId, sup: supName, gov });
                if (!supHqPerformanceMap[supName]) supHqPerformanceMap[supName] = { sup: supName, gov, scores: [] };
                supHqPerformanceMap[supName].scores.push(parsedHqVal);
            }
        });

        const totalOfficersCount = totalOfficersSet.size;
        const calledOfficersCount = calledOfficersSet.size;
        const coveragePct = totalOfficersCount > 0 ? (calledOfficersCount / totalOfficersCount) * 100 : 0;

        renderHQKPICards(totalOfficersCount, calledOfficersCount, coveragePct, hqResultRecords, supHqPerformanceMap, supRecords);
        renderHQPerformanceDistribution(supHqPerformanceMap);

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

    function renderHQKPICards(totalOfficers, calledOfficers, coveragePct, hqResultRecords, supHqPerfMap, supRecords) {
        const container = document.getElementById('hq-kpi-grid');
        if (!container) return;

        // HQ outcome breakdown is based on UNIQUE Officer HR Code.
        // Coverage = every officer with a recorded HQ outcome (Answer, Not Available,
        // Resigned, or Wrong Number). Blank HQ result = Not Covered.
        const outcomeByOfficer = new Map();
        supRecords.forEach((row, idx) => {
            const officerIdRaw = row['Officer HR Code'] || row['HR Code'] || row['Officer Code'] || row['Officer Name'] || row['Employee ID'];
            const officerId = officerIdRaw ? String(officerIdRaw).trim() : `ROW_${idx}`;
            if (outcomeByOfficer.has(officerId)) return;

            const raw = row['HQ Call Result'];
            const value = raw === undefined || raw === null ? '' : String(raw).trim();
            const lower = value.toLowerCase();

            let outcome = 'Not Covered';
            if (value !== '' && lower !== 'null' && lower !== 'undefined' && lower !== 'nan') {
                if (lower === 'not available') {
                    outcome = 'Not Available';
                } else if (lower === 'wrong number') {
                    outcome = 'Wrong Number';
                } else if (lower.includes('resigned')) {
                    // All resignation statuses are one business category.
                    outcome = 'Resigned';
                } else if (parseFinalResult(value) !== null) {
                    // Any numeric HQ result is a completed/answered call.
                    outcome = 'Answer';
                } else {
                    // Any other non-blank status is still a recorded outcome.
                    outcome = 'Other Outcome';
                }
            }

            outcomeByOfficer.set(officerId, outcome);
        });

        const outcomeCounts = {
            'Answer': 0,
            'Not Available': 0,
            'Resigned': 0,
            'Wrong Number': 0,
            'Other Outcome': 0,
            'Not Covered': 0
        };

        outcomeByOfficer.forEach(outcome => {
            if (Object.prototype.hasOwnProperty.call(outcomeCounts, outcome)) {
                outcomeCounts[outcome]++;
            } else {
                outcomeCounts['Other Outcome']++;
            }
        });

        const uniqueTotal = outcomeByOfficer.size;
        const recordedCoverageCount = uniqueTotal - outcomeCounts['Not Covered'];
        const recordedCoveragePct = uniqueTotal > 0 ? (recordedCoverageCount / uniqueTotal) * 100 : 0;

        const pct = count => uniqueTotal > 0 ? (count / uniqueTotal) * 100 : 0;

        // Performance remains based on NUMERIC HQ answers only, exactly as before.
        const evaluatedOfficersCount = new Set(hqResultRecords.map(r => r.officerId)).size;
        const avgHqPerf = hqResultRecords.length > 0
            ? (hqResultRecords.reduce((sum, r) => sum + r.val, 0) / hqResultRecords.length)
            : 0;

        const validatedSupervisorsCount = Object.keys(supHqPerfMap).length;
        const avgValOfficersPerSup = validatedSupervisorsCount > 0
            ? (evaluatedOfficersCount / validatedSupervisorsCount)
            : 0;

        const outcomeRows = [
            { label: 'Answer', count: outcomeCounts['Answer'], color: '#10B981' },
            { label: 'Not Available', count: outcomeCounts['Not Available'], color: '#F59E0B' },
            { label: 'Resigned', count: outcomeCounts['Resigned'], color: '#EF4444' },
            { label: 'Wrong Number', count: outcomeCounts['Wrong Number'], color: '#64748B' },
            ...(outcomeCounts['Other Outcome'] > 0
                ? [{ label: 'Other Outcome', count: outcomeCounts['Other Outcome'], color: '#8B5CF6' }]
                : []),
            { label: 'Not Covered', count: outcomeCounts['Not Covered'], color: '#CBD5E1' }
        ];

        const outcomeBreakdownHtml = outcomeRows.map(item => `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:10.5px; line-height:1.3;">
                <span style="display:flex; align-items:center; gap:6px; color:var(--text-main);">
                    <span style="width:7px; height:7px; border-radius:50%; background:${item.color}; flex:0 0 auto;"></span>
                    ${item.label}
                </span>
                <strong>${item.count.toLocaleString()} (${pct(item.count).toFixed(1)}%)</strong>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">HQ CALL COVERAGE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value text-purple">${recordedCoveragePct.toFixed(1)}%</span>
                </div>
                <div class="kpi-exec-sub">Recorded HQ call outcomes / unique officers</div>
                <div class="kpi-exec-denom">
                    <strong>${recordedCoverageCount.toLocaleString()}</strong> of <strong>${uniqueTotal.toLocaleString()}</strong> Officers
                </div>

                <div style="margin-top:10px; display:flex; flex-direction:column; gap:5px;">
                    ${outcomeBreakdownHtml}
                </div>

                <div style="margin-top:9px; font-size:10px; color:var(--text-muted);">
                    Answer + Not Available + Resigned + Wrong Number = Covered
                </div>
            </div>

            <div class="metric-card kpi-exec-card hq-performance-combined-card">
                <div class="hq-performance-top">
                    <div class="kpi-exec-title">HQ VALIDATION PERFORMANCE</div>
                <div class="kpi-exec-val-row">
                    <span class="main-value" style="color:#3B82F6;">${avgHqPerf > 0 ? avgHqPerf.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="kpi-exec-sub">Average HQ validation performance score</div>
                <div class="kpi-exec-denom">Based on <strong>${evaluatedOfficersCount.toLocaleString()}</strong> evaluated officers</div>
                </div>
                <div class="hq-performance-bottom">
                    <div class="hq-performance-bottom-block">
                        <div class="kpi-exec-title">SUPERVISORS VALIDATED</div>
                        <div class="kpi-exec-val-row"><span class="main-value text-success">${validatedSupervisorsCount.toLocaleString()}</span></div>
                        <div class="kpi-exec-sub">Supervisors with ≥1 validated officer call</div>
                        <div class="kpi-exec-denom">Active supervisory team unit context</div>
                    </div>
                    <div class="hq-performance-divider"></div>
                    <div class="hq-performance-bottom-block">
                        <div class="kpi-exec-title">AVG VALIDATED / SUPERVISOR</div>
                        <div class="kpi-exec-val-row"><span class="main-value text-orange-main">${avgValOfficersPerSup.toFixed(1)}</span></div>
                        <div class="kpi-exec-sub">Validated officers handled per supervisor</div>
                        <div class="kpi-exec-denom">Based on <strong>${evaluatedOfficersCount.toLocaleString()}</strong> unique officer calls</div>
                    </div>
                </div>
            </div>

        `;
    }

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
                    <td><strong>${item.calls}</strong></td>
                    <td><strong>${item.coverage.toFixed(1)}%</strong></td>
                `;
            } else {
                tr.innerHTML = `
                    <td><strong>${item.name}</strong></td>
                    <td>${item.gov}</td>
                    <td>${item.total}</td>
                    <td><strong>${item.calls}</strong></td>
                    <td><strong>${item.coverage.toFixed(1)}%</strong></td>
                `;
            }
            tbody.appendChild(tr);
        });

        attachUniversalTableSorting('hq-validation-table');
    }
        
    // ==========================================================================
    // TAB 5: OPERATIONAL CASES
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
// ==========================================================================
    // ==========================================================================
    // TAB 6: MEASURE OF SUCCESS ENGINE (Flexible Period Turnover Analysis)
    // ==========================================================================
    function parseDDMMYYYY(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const cleaned = dateStr.trim();
        if (!cleaned) return null;

        const parts = cleaned.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year < 2100) {
                const d = new Date(year, month, day);
                if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
                    return d;
                }
            }
        }
        return null;
    }

    function toISODateStr(dObj) {
        if (!dObj || isNaN(dObj.getTime())) return '';
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function extractGovernorate(siteStr) {
        if (!siteStr || typeof siteStr !== 'string') return 'Unknown';
        return siteStr.split(/\s*-\s*/)[0].trim();
    }

    const MOS_LEAVER_TYPES = new Set(['resignation', 'service termination', 'end of contract']);

    function normalizeEmployeeCode(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }

    function deriveBusinessLine(position) {
        const p = String(position || '').trim().toLowerCase();
        if (p.includes('cf')) return 'CF';
        if (p.includes('investment')) return 'Invest';
        if (p.includes('gamaya')) return 'Gamaya';
        return 'MF';
    }

    function isMosLeaverRecord(record) {
        return !!record.terminationDate && MOS_LEAVER_TYPES.has(record.terminationType.toLowerCase());
    }

    function processTurnoverRecords(rawCsvRecords) {
        const byEmployee = new Map();
        let latestDateFound = null;

        rawCsvRecords.forEach(row => {
            const empCode = normalizeEmployeeCode(row['Employee Code']);
            const hDate = parseDDMMYYYY(row['Hiring Date']);
            const tDate = parseDDMMYYYY(row['Termination Date']);
            const termType = row['Termination Type - English'] ? row['Termination Type - English'].trim() : '';
            const position = row['Position - English'] ? row['Position - English'].trim() : 'Unknown';
            const site = row['Site - English'] || row['Site - Arabic'] || '';
            const gov = extractGovernorate(site);

            if (!empCode || !hDate) return;

            if (hDate && (!latestDateFound || hDate > latestDateFound)) latestDateFound = hDate;
            if (tDate && (!latestDateFound || tDate > latestDateFound)) latestDateFound = tDate;

            const candidate = {
                empCode,
                hiringDate: hDate,
                hiringDateStr: toISODateStr(hDate),
                terminationDate: tDate,
                terminationDateStr: toISODateStr(tDate),
                terminationType: termType,
                position,
                businessLine: deriveBusinessLine(position),
                governorate: gov
            };

            const existing = byEmployee.get(empCode);
            if (!existing) {
                byEmployee.set(empCode, candidate);
                return;
            }

            // Keep the most informative/latest termination state if duplicate Employee Codes ever appear.
            const existingT = existing.terminationDate ? existing.terminationDate.getTime() : -1;
            const candidateT = candidate.terminationDate ? candidate.terminationDate.getTime() : -1;
            if (candidateT > existingT || (!existing.terminationDate && candidate.terminationType && candidate.hiringDate >= existing.hiringDate)) {
                byEmployee.set(empCode, candidate);
            }
        });

        const analysisCutoff = latestDateFound || new Date();
        const records = Array.from(byEmployee.values()).filter(r => r.hiringDate <= analysisCutoff);
        records.forEach(r => {
            r.hasTermination = isMosLeaverRecord(r);
            r.daysToExit = r.hasTermination && r.terminationDate >= r.hiringDate
                ? Math.floor((r.terminationDate.getTime() - r.hiringDate.getTime()) / 86400000)
                : null;
        });

        return { records, analysisCutoff };
    }

    function parseLocalISO(isoStr) {
        if (!isoStr) return null;
        const parts = isoStr.split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function addDaysLocal(dateObj, days) {
        const d = new Date(dateObj.getTime());
        d.setDate(d.getDate() + days);
        return d;
    }

    function formatPeriodLabel(fromD, toD) {
        if (!fromD || !toD) return 'N/A';
        const opts = { day: '2-digit', month: 'short', year: 'numeric' };
        return `${fromD.toLocaleDateString('en-GB', opts)} → ${toD.toLocaleDateString('en-GB', opts)}`;
    }

    function getComparablePeriod(currentFrom, currentTo) {
        const daysInclusive = Math.floor((currentTo - currentFrom) / 86400000) + 1;
        const previousTo = addDaysLocal(currentFrom, -1);
        const previousFrom = addDaysLocal(previousTo, -(daysInclusive - 1));
        return { previousFrom, previousTo, daysInclusive };
    }

    function getMosFilterSelections() {
        const businessChecks = Array.from(document.querySelectorAll('#mos-business-filter input[data-mos-business]'));
        const selectedBusiness = businessChecks.filter(i => i.checked && i.value !== 'all').map(i => i.value);
        return {
            businessLines: selectedBusiness.length ? selectedBusiness : ['all']
        };
    }

    function applyMosBusinessFilterState(container, selectedValues) {
        const boxes = Array.from(container.querySelectorAll('input[data-mos-business]'));
        const allBox = boxes.find(i => i.value === 'all');
        const valueBoxes = boxes.filter(i => i.value !== 'all');
        const allSelected = !Array.isArray(selectedValues) || selectedValues.length === 0 || selectedValues.includes('all');

        if (allBox) allBox.checked = allSelected;
        valueBoxes.forEach(box => {
            box.checked = !allSelected && selectedValues.includes(box.value);
        });
    }

    function renderMosBusinessChecklist(values, selectedValues) {
        const container = document.getElementById('mos-business-filter');
        if (!container) return;

        // Build the checklist once. Do NOT rebuild it on every click; doing so
        // causes the native checkbox interaction to feel unreliable and can
        // visually jump on smaller screens.
        if (!container.querySelector('input[data-mos-business]')) {
            container.innerHTML = `
                <div class="mos-checklist-box mos-business-checklist-box">
                    <label class="mos-check-item mos-check-all">
                        <input type="checkbox" data-mos-business value="all">
                        <span>All</span>
                    </label>
                    ${values.map(v => `
                        <label class="mos-check-item">
                            <input type="checkbox" data-mos-business value="${v}">
                            <span>${v}</span>
                        </label>`).join('')}
                </div>`;

            container.addEventListener('change', (event) => {
                const changed = event.target.closest('input[data-mos-business]');
                if (!changed) return;

                const allBox = container.querySelector('input[data-mos-business="all"]');
                const valueBoxes = Array.from(container.querySelectorAll('input[data-mos-business]')).filter(i => i.value !== 'all');

                if (changed.value === 'all') {
                    if (allBox.checked) {
                        valueBoxes.forEach(i => { i.checked = false; });
                    } else {
                        // Never allow a state with nothing selected. "All" is the
                        // neutral/default state when no business line is selected.
                        allBox.checked = true;
                    }
                } else if (changed.checked) {
                    if (allBox) allBox.checked = false;
                } else if (!valueBoxes.some(i => i.checked)) {
                    if (allBox) allBox.checked = true;
                }

                const selections = getMosFilterSelections();
                mosState.businessLines = selections.businessLines;
                renderMeasureOfSuccessTab(true);
            });
        }

        applyMosBusinessFilterState(container, selectedValues || ['all']);
    }

    function setupMeasureOfSuccessControls(records) {
        const currentFromInp = document.getElementById('mos-current-from');
        const currentToInp = document.getElementById('mos-current-to');
        const previousFromInp = document.getElementById('mos-previous-from');
        const previousToInp = document.getElementById('mos-previous-to');
        const govSelect = document.getElementById('mos-gov-filter');
        const todayIso = toISODateStr(new Date());

        if (!mosState.currentFrom) mosState.currentFrom = '2026-07-01';
        if (!mosState.currentTo) mosState.currentTo = todayIso;

        const currentFrom = parseLocalISO(mosState.currentFrom);
        const currentTo = parseLocalISO(mosState.currentTo);
        if (!mosState.previousFrom || !mosState.previousTo) {
            const cmp = currentFrom && currentTo && currentFrom <= currentTo
                ? getComparablePeriod(currentFrom, currentTo)
                : { previousFrom: parseLocalISO('2026-05-01'), previousTo: parseLocalISO('2026-06-30') };
            mosState.previousFrom = toISODateStr(cmp.previousFrom);
            mosState.previousTo = toISODateStr(cmp.previousTo);
        }

        if (currentFromInp) currentFromInp.value = mosState.currentFrom;
        if (currentToInp) currentToInp.value = mosState.currentTo;
        if (previousFromInp) previousFromInp.value = mosState.previousFrom;
        if (previousToInp) previousToInp.value = mosState.previousTo;

        const govs = Array.from(new Set(records.map(r => r.governorate).filter(Boolean))).sort();
        if (govSelect && govSelect.options.length <= 1) {
            govs.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g;
                opt.textContent = g;
                govSelect.appendChild(opt);
            });
        }
        if (govSelect) govSelect.value = mosState.gov || 'all';

        const lines = ['MF', 'CF', 'Invest', 'Gamaya'];
        renderMosBusinessChecklist(lines, mosState.businessLines || ['all']);

        const syncAliases = () => {
            mosState.baseFrom = mosState.previousFrom;
            mosState.baseTo = mosState.previousTo;
            mosState.projFrom = mosState.currentFrom;
            mosState.projTo = mosState.currentTo;
        };

        const handleFilterChange = (source) => {
            if (currentFromInp) mosState.currentFrom = currentFromInp.value;
            if (currentToInp) mosState.currentTo = currentToInp.value;
            if (previousFromInp) mosState.previousFrom = previousFromInp.value;
            if (previousToInp) mosState.previousTo = previousToInp.value;
            if (govSelect) mosState.gov = govSelect.value;

            const selections = getMosFilterSelections();
            mosState.businessLines = selections.businessLines;

            // Keep the convenient same-length comparison as the default. Once the
            // user edits either comparison date, subsequent current-period changes
            // no longer overwrite the user's manual comparison choice.
            if ((source === 'current-from' || source === 'current-to') && !mosState.comparisonManual) {
                const from = parseLocalISO(mosState.currentFrom);
                const to = parseLocalISO(mosState.currentTo);
                if (from && to && from <= to) {
                    const cmp = getComparablePeriod(from, to);
                    mosState.previousFrom = toISODateStr(cmp.previousFrom);
                    mosState.previousTo = toISODateStr(cmp.previousTo);
                    if (previousFromInp) previousFromInp.value = mosState.previousFrom;
                    if (previousToInp) previousToInp.value = mosState.previousTo;
                }
            }

            if (source === 'previous-from' || source === 'previous-to') {
                mosState.comparisonManual = true;
            }

            syncAliases();
            renderMeasureOfSuccessTab();
        };

        if (currentFromInp) currentFromInp.onchange = () => handleFilterChange('current-from');
        if (currentToInp) currentToInp.onchange = () => handleFilterChange('current-to');
        if (previousFromInp) previousFromInp.onchange = () => handleFilterChange('previous-from');
        if (previousToInp) previousToInp.onchange = () => handleFilterChange('previous-to');
        if (govSelect) govSelect.onchange = () => handleFilterChange('governorate');

        syncAliases();
    }

    function mosRecordMatchesFilters(record) {
        const bl = Array.isArray(mosState.businessLines) && mosState.businessLines.length
            ? mosState.businessLines
            : ['all'];
        const businessOk = bl.includes('all') || bl.includes(String(record.businessLine || '').trim());
        const govOk = !mosState.gov || mosState.gov === 'all' || mosState.gov === record.governorate;
        return businessOk && govOk;
    }

    function getMosPeriodMetrics(records, fromD, toD) {
        const opening = records.filter(r => r.hiringDate <= fromD && (!r.hasTermination || r.terminationDate >= fromD)).length;
        const closing = records.filter(r => r.hiringDate <= toD && (!r.hasTermination || r.terminationDate > toD)).length;
        const hires = records.filter(r => r.hiringDate >= fromD && r.hiringDate <= toD);
        const cohortHires = hires.length;
        const cohortLeavers = hires.filter(r => r.hasTermination && r.terminationDate >= fromD && r.terminationDate <= toD);
        const leavers = records.filter(r => r.hasTermination && r.terminationDate >= fromD && r.terminationDate <= toD).length;
        const average = (opening + closing) / 2;
        const turnoverRate = average > 0 ? (leavers / average) * 100 : null;
        const cohortTurnoverRate = cohortHires > 0 ? (cohortLeavers.length / cohortHires) * 100 : null;

        return {
            opening,
            closing,
            hires: cohortHires,
            cohortLeavers: cohortLeavers.length,
            leaverIds: new Set(cohortLeavers.map(r => r.empCode)),
            leavers,
            average,
            turnoverRate,
            cohortTurnoverRate
        };
    }

    function renderMeasureOfSuccessTab(skipControlRender = false) {
        if (!turnoverDatasetGlobal || turnoverDatasetGlobal.length === 0) return;

        const { records } = processTurnoverRecords(turnoverDatasetGlobal);
        if (!skipControlRender) setupMeasureOfSuccessControls(records);

        const currentFrom = parseLocalISO(mosState.currentFrom);
        const currentTo = parseLocalISO(mosState.currentTo);
        if (!currentFrom || !currentTo || currentFrom > currentTo) {
            const kpi = document.getElementById('mos-kpi-grid');
            if (kpi) kpi.innerHTML = '<div class="op-empty-state">Please select a valid date range.</div>';
            return;
        }

        const previousFrom = parseLocalISO(mosState.previousFrom);
        const previousTo = parseLocalISO(mosState.previousTo);
        if (!previousFrom || !previousTo || previousFrom > previousTo) {
            const kpi = document.getElementById('mos-kpi-grid');
            if (kpi) kpi.innerHTML = '<div class="op-empty-state">Please select a valid comparison date range.</div>';
            return;
        }

        mosState.baseFrom = mosState.previousFrom;
        mosState.baseTo = mosState.previousTo;
        mosState.projFrom = mosState.currentFrom;
        mosState.projTo = mosState.currentTo;

        const cmp = { previousFrom, previousTo, daysInclusive: Math.floor((previousTo - previousFrom) / 86400000) + 1 };
        const scopedRecords = records.filter(mosRecordMatchesFilters);
        const previousMetrics = getMosPeriodMetrics(scopedRecords, previousFrom, previousTo);
        const currentMetrics = getMosPeriodMetrics(scopedRecords, currentFrom, currentTo);

        renderMosExecutiveKPIs(previousMetrics, currentMetrics, cmp);
        renderMosVisualImpact(previousMetrics, currentMetrics, cmp);
        renderMosCohortTrendWeekly(scopedRecords);
        renderMosExitTimingDistribution(scopedRecords, previousFrom, previousTo, currentFrom, currentTo);
        renderMosGovernorateImpactTable(scopedRecords, previousFrom, previousTo, currentFrom, currentTo);
        renderMosCompanyWideTurnover(previousMetrics, currentMetrics, cmp);
    }

    function renderMosExecutiveKPIs(previousMetrics, currentMetrics, cmp) {
        const container = document.getElementById('mos-kpi-grid');
        if (!container) return;

        const currentRate = currentMetrics.cohortTurnoverRate;
        const previousRate = previousMetrics.cohortTurnoverRate;
        const ppChange = (currentRate !== null && previousRate !== null) ? currentRate - previousRate : null;
        const improved = ppChange !== null && ppChange < 0;
        const worsened = ppChange !== null && ppChange > 0;
        const outcomeClass = ppChange === null ? 'text-muted' : (improved ? 'text-success' : (worsened ? 'text-danger' : 'text-muted'));
        const rateText = currentRate === null ? 'N/A' : `${currentRate.toFixed(1)}%`;
        const prevRateText = previousRate === null ? 'N/A' : `${previousRate.toFixed(1)}%`;
        const relativeMagnitude = (currentRate !== null && previousRate !== null && previousRate !== 0)
            ? Math.abs((ppChange / previousRate) * 100)
            : null;
        const relativeText = relativeMagnitude === null
            ? 'N/A'
            : improved
                ? `${relativeMagnitude.toFixed(1)}% relative reduction`
                : worsened
                    ? `${relativeMagnitude.toFixed(1)}% relative increase`
                    : '0.0% relative change';
        const impactText = ppChange === null
            ? 'No comparison data'
            : improved
                ? `Observed improvement: ${Math.abs(ppChange).toFixed(1)} pts`
                : worsened
                    ? `Observed increase: ${Math.abs(ppChange).toFixed(1)} pts`
                    : 'No change';

        container.innerHTML = `
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">COHORT TURNOVER RATE</div>
                <div class="kpi-exec-val-row"><span class="main-value ${outcomeClass}">${rateText}</span></div>
                <div class="kpi-exec-sub">Selected: ${formatPeriodLabel(parseLocalISO(mosState.currentFrom), parseLocalISO(mosState.currentTo))}</div>
                <div class="kpi-exec-denom">
                    <strong>${currentMetrics.cohortLeavers.toLocaleString()}</strong> exited from <strong>${currentMetrics.hires.toLocaleString()}</strong> new hires<br>
                    <strong>${prevRateText}</strong> comparison cohort rate<br>
                    <strong class="${outcomeClass}">${impactText}</strong><br>
                    <strong class="${outcomeClass}">${relativeText}</strong>
                </div>
            </div>
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">NEW HIRES</div>
                <div class="kpi-exec-val-row"><span class="main-value">${currentMetrics.hires.toLocaleString()}</span></div>
                <div class="kpi-exec-sub">Unique Employee IDs hired in selected period</div>
                <div class="kpi-exec-denom">
                    <strong>${previousMetrics.hires.toLocaleString()}</strong> comparison period<br>
                    <strong>${currentMetrics.hires - previousMetrics.hires >= 0 ? '+' : ''}${(currentMetrics.hires - previousMetrics.hires).toLocaleString()}</strong> vs comparison
                </div>
            </div>
            <div class="metric-card kpi-exec-card">
                <div class="kpi-exec-title">SAME-COHORT LEAVERS</div>
                <div class="kpi-exec-val-row"><span class="main-value ${currentMetrics.cohortLeavers > previousMetrics.cohortLeavers ? 'text-danger' : 'text-success'}">${currentMetrics.cohortLeavers.toLocaleString()}</span></div>
                <div class="kpi-exec-sub">Hired in selected period and exited in same period</div>
                <div class="kpi-exec-denom">
                    <strong>${previousMetrics.cohortLeavers.toLocaleString()}</strong> comparison cohort leavers<br>
                    ${currentMetrics.cohortLeavers.toLocaleString()} / ${currentMetrics.hires.toLocaleString()} = <strong>${rateText}</strong>
                </div>
            </div>
            <div class="metric-card kpi-exec-card ${improved ? 'mos-impact-positive' : (worsened ? 'mos-impact-negative' : '')}">
                <div class="kpi-exec-title">OBSERVED IMPACT</div>
                <div class="kpi-exec-val-row"><span class="main-value ${outcomeClass}">${ppChange === null ? 'N/A' : `${Math.abs(ppChange).toFixed(1)} pts`}</span></div>
                <div class="kpi-exec-sub">Selected cohort vs comparison cohort</div>
                <div class="kpi-exec-denom">
                    <strong class="${outcomeClass}">${improved ? 'Positive observed impact' : (worsened ? 'Negative observed impact' : 'No measurable change')}</strong><br>
                    ${relativeText}<br>
                    <span class="stat-subtext">Impact is observed within the selected hire/exit cohorts; it is not a causal proof.</span>
                </div>
            </div>`;
    }

    function renderMosVisualImpact(previousMetrics, currentMetrics, cmp) {
        const container = document.getElementById('mos-impact-visual-container');
        if (!container) return;

        const previousRate = previousMetrics.cohortTurnoverRate;
        const currentRate = currentMetrics.cohortTurnoverRate;
        if (previousRate === null && currentRate === null) {
            container.innerHTML = '<div class="op-empty-state">No new-hire cohort data available for the selected periods.</div>';
            return;
        }

        const maxRate = Math.max(previousRate || 0, currentRate || 0, 1);
        const previousWidth = ((previousRate || 0) / maxRate) * 100;
        const currentWidth = ((currentRate || 0) / maxRate) * 100;
        const pp = (currentRate !== null && previousRate !== null) ? currentRate - previousRate : null;
        const improved = pp !== null && pp < 0;
        const worsened = pp !== null && pp > 0;
        const magnitude = pp === null ? null : Math.abs(pp);
        const relative = (pp !== null && previousRate !== null && previousRate !== 0) ? Math.abs((pp / previousRate) * 100) : null;
        const statusText = pp === null
            ? 'Insufficient comparison data'
            : improved
                ? `Positive observed impact: ${magnitude.toFixed(1)} pts lower`
                : worsened
                    ? `Negative observed impact: ${magnitude.toFixed(1)} pts higher`
                    : 'No change in cohort exit rate';
        const relativeText = relative === null
            ? ''
            : improved
                ? `${relative.toFixed(1)}% relative reduction`
                : worsened
                    ? `${relative.toFixed(1)}% relative increase`
                    : '0.0% relative change';
        const statusColor = improved ? 'var(--primary)' : (worsened ? 'var(--red)' : 'var(--text-main)');
        const statusBg = improved ? 'rgba(16,185,129,.08)' : (worsened ? 'rgba(239,68,68,.08)' : 'rgba(100,116,139,.08)');
        const statusBorder = improved ? 'rgba(16,185,129,.2)' : (worsened ? 'rgba(239,68,68,.2)' : 'rgba(100,116,139,.2)');

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700;">
                        <span>COMPARISON COHORT</span>
                        <span>${previousRate === null ? 'N/A' : previousRate.toFixed(1) + '%'} <span class="sample-size-tag">${previousMetrics.cohortLeavers} exited / ${previousMetrics.hires} hires</span></span>
                    </div>
                    <div class="dist-bar-track" style="height:14px; background:#E2E8F0;"><div class="dist-bar-fill" style="width:${previousWidth}%; background:#64748B;"></div></div>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700;">
                        <span>SELECTED COHORT</span>
                        <span class="${improved ? 'text-success' : (worsened ? 'text-danger' : '')}">${currentRate === null ? 'N/A' : currentRate.toFixed(1) + '%'} <span class="sample-size-tag">${currentMetrics.cohortLeavers} exited / ${currentMetrics.hires} hires</span></span>
                    </div>
                    <div class="dist-bar-track" style="height:14px; background:#E2E8F0;"><div class="dist-bar-fill" style="width:${currentWidth}%; background:${improved ? 'var(--primary)' : (worsened ? 'var(--red)' : 'var(--brand-purple)')};"></div></div>
                </div>
                <div style="background:${statusBg}; border:1px solid ${statusBorder}; padding:12px 16px; border-radius:var(--radius-md); font-size:12.5px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                    <span style="font-weight:700; color:${statusColor};">${statusText}</span>
                    <span style="font-weight:700; color:${statusColor};">${relativeText}</span>
                    <span class="stat-subtext">${formatPeriodLabel(cmp.previousFrom, cmp.previousTo)} vs ${formatPeriodLabel(parseLocalISO(mosState.currentFrom), parseLocalISO(mosState.currentTo))}</span>
                </div>
            </div>`;
    }

    function renderMosCompanyWideTurnover(previousMetrics, currentMetrics, cmp) {
        const container = document.getElementById('mos-company-wide-container');
        if (!container) return;

        const currentRate = currentMetrics.turnoverRate;
        const previousRate = previousMetrics.turnoverRate;
        const pp = (currentRate !== null && previousRate !== null) ? currentRate - previousRate : null;
        const improved = pp !== null && pp < 0;
        const worsened = pp !== null && pp > 0;
        const relative = (pp !== null && previousRate !== null && previousRate !== 0) ? Math.abs((pp / previousRate) * 100) : null;
        const statusText = pp === null ? 'No comparison data' : improved ? `Improved by ${Math.abs(pp).toFixed(1)} pts` : worsened ? `Increased by ${Math.abs(pp).toFixed(1)} pts` : 'No change';
        const statusClass = improved ? 'text-success' : (worsened ? 'text-danger' : 'text-muted');
        const relativeText = relative === null ? 'N/A' : improved ? `${relative.toFixed(1)}% relative reduction` : worsened ? `${relative.toFixed(1)}% relative increase` : '0.0% relative change';
        const netCurrent = currentMetrics.hires - currentMetrics.leavers;
        const netPrevious = previousMetrics.hires - previousMetrics.leavers;

        container.innerHTML = `
            <div class="mos-company-grid">
                <div class="mos-company-period-card">
                    <div class="mos-company-card-label">SELECTED PERIOD</div>
                    <div class="mos-company-card-rate ${statusClass}">${currentRate === null ? 'N/A' : currentRate.toFixed(1) + '%'}</div>
                    <div class="mos-company-card-period">${formatPeriodLabel(parseLocalISO(mosState.currentFrom), parseLocalISO(mosState.currentTo))}</div>
                    <div class="mos-company-stats">
                        <span>Opening HC <strong>${currentMetrics.opening.toLocaleString()}</strong></span>
                        <span>Closing HC <strong>${currentMetrics.closing.toLocaleString()}</strong></span>
                        <span>Average HC <strong>${currentMetrics.average.toLocaleString(undefined,{maximumFractionDigits:1})}</strong></span>
                        <span>Hires <strong>${currentMetrics.hires.toLocaleString()}</strong></span>
                        <span>All qualifying leavers <strong>${currentMetrics.leavers.toLocaleString()}</strong></span>
                        <span>Net workforce change <strong>${netCurrent >= 0 ? '+' : ''}${netCurrent.toLocaleString()}</strong></span>
                    </div>
                </div>
                <div class="mos-company-period-card">
                    <div class="mos-company-card-label">COMPARISON PERIOD</div>
                    <div class="mos-company-card-rate">${previousRate === null ? 'N/A' : previousRate.toFixed(1) + '%'}</div>
                    <div class="mos-company-card-period">${formatPeriodLabel(cmp.previousFrom, cmp.previousTo)}</div>
                    <div class="mos-company-stats">
                        <span>Opening HC <strong>${previousMetrics.opening.toLocaleString()}</strong></span>
                        <span>Closing HC <strong>${previousMetrics.closing.toLocaleString()}</strong></span>
                        <span>Average HC <strong>${previousMetrics.average.toLocaleString(undefined,{maximumFractionDigits:1})}</strong></span>
                        <span>Hires <strong>${previousMetrics.hires.toLocaleString()}</strong></span>
                        <span>All qualifying leavers <strong>${previousMetrics.leavers.toLocaleString()}</strong></span>
                        <span>Net workforce change <strong>${netPrevious >= 0 ? '+' : ''}${netPrevious.toLocaleString()}</strong></span>
                    </div>
                </div>
                <div class="mos-company-summary-card">
                    <div class="mos-company-card-label">WORKFORCE TURNOVER CHANGE</div>
                    <div class="mos-company-card-rate ${statusClass}">${pp === null ? 'N/A' : `${Math.abs(pp).toFixed(1)} pts`}</div>
                    <div class="mos-company-impact ${statusClass}">${statusText}</div>
                    <div class="mos-company-impact-sub">${relativeText}</div>
                    <div class="mos-company-note">Formula: qualifying leavers during period ÷ average headcount during period.</div>
                    <div class="mos-company-note">Leaver types: Resignation, Service Termination, End Of Contract. Transfers and blank termination states remain active.</div>
                </div>
            </div>`;
    }

    function renderMosCohortTrendWeekly(records) {
        const container = document.getElementById('mos-cohort-trend-container');
        if (!container) return;

        const monthKeys = Array.from(new Set(records.flatMap(r => {
            const keys = [];
            const start = new Date(r.hiringDate.getFullYear(), r.hiringDate.getMonth(), 1);
            const end = new Date();
            let d = new Date(start.getTime());
            while (d <= end) {
                keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
                d = new Date(d.getFullYear(), d.getMonth()+1, 1);
            }
            return keys;
        }))).sort();

        if (!monthKeys.length) {
            container.innerHTML = '<div style="text-align:center; padding-top:80px; font-size:12px; color:var(--text-muted)">No turnover history available</div>';
            return;
        }

        const pointsData = monthKeys.map(key => {
            const [y,m] = key.split('-').map(Number);
            const monthStart = new Date(y, m-1, 1);
            const monthEnd = new Date(y, m, 0);
            const opening = records.filter(r => r.hiringDate <= monthStart && (!r.hasTermination || r.terminationDate >= monthStart)).length;
            const closing = records.filter(r => r.hiringDate <= monthEnd && (!r.hasTermination || r.terminationDate > monthEnd)).length;
            const leavers = records.filter(r => r.hasTermination && r.terminationDate >= monthStart && r.terminationDate <= monthEnd).length;
            const average = (opening + closing) / 2;
            const rate = average > 0 ? (leavers / average) * 100 : 0;
            return { key, rate, leavers, average, monthDate: monthStart };
        });

        const maxRate = Math.max(...pointsData.map(p => p.rate), 1);
        const svgW=600, svgH=180, pL=40, pR=30, pT=25, pB=35;
        const cW=svgW-pL-pR, cH=svgH-pT-pB;
        const stepX=pointsData.length>1 ? cW/(pointsData.length-1) : cW;
        const points=pointsData.map((p,idx)=>({ ...p, x:pL+idx*stepX, y:pT+cH-(p.rate/maxRate)*cH }));
        let lineD=`M ${points[0].x} ${points[0].y}`;
        for(let i=0;i<points.length-1;i++){ const a=points[i], b=points[i+1], cx=a.x+(b.x-a.x)/2; lineD+=` C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`; }
        let svg=`<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" style="overflow:visible;">
            <line x1="${pL}" y1="${pT}" x2="${pL+cW}" y2="${pT}" stroke="var(--border-color)" stroke-dasharray="3,3"/>
            <line x1="${pL}" y1="${pT+cH/2}" x2="${pL+cW}" y2="${pT+cH/2}" stroke="var(--border-color)" stroke-dasharray="3,3"/>
            <line x1="${pL}" y1="${pT+cH}" x2="${pL+cW}" y2="${pT+cH}" stroke="var(--border-color)"/>
            <path d="${lineD}" fill="none" stroke="var(--brand-purple)" stroke-width="2.5" stroke-linecap="round"/>`;
        const labelInterval=Math.max(1,Math.ceil(points.length/8));
        points.forEach((pt,idx)=>{
            const tt=encodeURIComponent(`<div class="tt-title">Month: ${pt.key}</div><div class="tt-row"><span>Turnover:</span> <strong>${pt.rate.toFixed(1)}%</strong></div><div class="tt-row"><span>Leavers:</span> <strong>${pt.leavers}</strong></div><div class="tt-row"><span>Average HC:</span> <strong>${pt.average.toLocaleString(undefined,{maximumFractionDigits:1})}</strong></div>`);
            svg+=`<circle cx="${pt.x}" cy="${pt.y}" r="4" fill="var(--card-bg)" stroke="var(--brand-purple)" stroke-width="2.5" class="chart-dot interactive-dot" style="cursor:pointer;" data-tt="${tt}"></circle>`;
            if(idx%labelInterval===0||idx===points.length-1) svg+=`<text x="${pt.x}" y="${pT+cH+16}" fill="var(--text-muted)" font-size="9" text-anchor="middle">${pt.key}</text>`;
        });
        svg+='</svg>';
        container.innerHTML=svg;
        container.querySelectorAll('.interactive-dot').forEach(dot=>{ const content=decodeURIComponent(dot.getAttribute('data-tt')); dot.addEventListener('mouseenter',e=>{dot.setAttribute('r','6');showTooltip(e,content);}); dot.addEventListener('mousemove',e=>showTooltip(e,content)); dot.addEventListener('mouseleave',()=>{dot.setAttribute('r','4');hideTooltip();}); });
    }

    function renderMosExitTimingDistribution(records, previousFrom, previousTo, currentFrom, currentTo) {
        const container = document.getElementById('mos-exit-timing-container');
        if (!container) return;
        const bands = [
            { label: 'Within 30 Days', min: 0, max: 30 },
            { label: '31–60 Days', min: 31, max: 60 },
            { label: '61–90 Days', min: 61, max: 90 },
            { label: 'After 90 Days', min: 91, max: 9999 }
        ];
        const getDist = (from, to) => {
            const exitLogs = records.filter(r => r.hasTermination && r.terminationDate >= from && r.terminationDate <= to && r.daysToExit !== null);
            const counts = Object.fromEntries(bands.map(b => [b.label,0]));
            exitLogs.forEach(r=>{ const b=bands.find(x=>r.daysToExit>=x.min&&r.daysToExit<=x.max); if(b) counts[b.label]++; });
            return { total: exitLogs.length, counts };
        };
        const prev=getDist(previousFrom,previousTo), cur=getDist(currentFrom,currentTo);
        let html='<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:12px;">';
        bands.forEach(b=>{ const prevPct=prev.total?(prev.counts[b.label]/prev.total)*100:0; const curPct=cur.total?(cur.counts[b.label]/cur.total)*100:0; html+=`<div style="background:#F8FAFC;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:12px;display:flex;flex-direction:column;gap:6px;"><span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">${b.label}</span><div style="display:flex;justify-content:space-between;"><span style="font-size:10.5px;color:var(--text-muted);">Previous:</span><strong style="font-size:12px;">${prevPct.toFixed(1)}% (${prev.counts[b.label]})</strong></div><div style="display:flex;justify-content:space-between;"><span style="font-size:10.5px;color:var(--brand-purple);">Selected:</span><strong style="font-size:11px;color:var(--brand-purple);">${curPct.toFixed(1)}% (${cur.counts[b.label]})</strong></div></div>`; });
        html+=`</div><div style="margin-top:10px;font-size:11px;color:var(--text-muted);">Based on leavers recorded by termination date. Previous leavers: ${prev.total.toLocaleString()} • Selected leavers: ${cur.total.toLocaleString()}.</div>`;
        container.innerHTML=html;
    }

    function renderMosGovernorateImpactTable(records, previousFrom, previousTo, currentFrom, currentTo) {
        const tbody = document.getElementById('mos-gov-tbody');
        if (!tbody) return;
        const govMap = {};
        records.forEach(r=>{ const g=r.governorate; if(!govMap[g]) govMap[g]={gov:g, prevHC:0, curHC:0, prevL:0, curL:0};
            if(r.hiringDate<=previousFrom && (!r.hasTermination || r.terminationDate>=previousFrom)) govMap[g].prevHC++;
            if(r.hiringDate<=currentFrom && (!r.hasTermination || r.terminationDate>=currentFrom)) govMap[g].curHC++;
            if(r.hasTermination && r.terminationDate>=previousFrom && r.terminationDate<=previousTo) govMap[g].prevL++;
            if(r.hasTermination && r.terminationDate>=currentFrom && r.terminationDate<=currentTo) govMap[g].curL++;
        });
        const list=Object.values(govMap).map(g=>{ const prevRate=g.prevHC>0?(g.prevL/g.prevHC)*100:null; const curRate=g.curHC>0?(g.curL/g.curHC)*100:null; const pp=prevRate!==null&&curRate!==null?curRate-prevRate:null; const status=pp===null?'-':pp<0?'Improved':pp>0?'Increased':'No Change'; return {...g,prevRate,curRate,pp,status}; });
        const k=currentMosGovSort.key||'projRate', dir=currentMosGovSort.dir==='asc'?1:-1;
        list.sort((a,b)=>{ const map={baseRate:'prevRate',projRate:'curRate'}; const key=map[k]||k; const av=a[key],bv=b[key]; if(typeof av==='string') return av.localeCompare(bv)*dir; return ((av??-999)-(bv??-999))*dir; });
        tbody.innerHTML='';
        list.forEach(r=>{ if(r.prevHC===0&&r.curHC===0)return; const tr=document.createElement('tr'); const prevStr=r.prevRate===null?'<span class="text-muted">N/A</span>':`<strong>${r.prevRate.toFixed(1)}%</strong><br><span class="sample-size-tag" style="margin-left:0;">${r.prevL}/${r.prevHC} HC basis</span>`; const curStr=r.curRate===null?'<span class="text-muted">N/A</span>':`<strong>${r.curRate.toFixed(1)}%</strong><br><span class="sample-size-tag" style="margin-left:0;">${r.curL}/${r.curHC} HC basis</span>`; const ppStr=r.pp===null?'-':`<span class="${r.pp<0?'text-success':r.pp>0?'text-danger':''}">${r.pp>0?'+':''}${r.pp.toFixed(1)} pts</span>`; tr.innerHTML=`<td><strong>${r.gov}</strong></td><td>${prevStr}</td><td>${curStr}</td><td><strong>${ppStr}</strong></td><td><span class="insight-tag" style="background:${r.status==='Improved'?'#D1FAE5':(r.status==='Increased'?'#FEE2E2':'#F1F5F9')}; color:${r.status==='Improved'?'#065F46':(r.status==='Increased'?'#991B1B':'#475569')};">${r.status}</span></td>`; tbody.appendChild(tr); });
        attachUniversalTableSorting('mos-gov-table');
    }

  // ==========================================================================
    // TAB 7: RESIGNATION AUDIT & RECONCILIATION (Master: data.csv)
    // ==========================================================================
    let auditRecordsGlobal = [];
    let auditFilters = { gov: 'all', sup: 'all', status: 'False Resignation Claim', search: '' };
    
    let currentAuditGovSort = { key: 'total', dir: 'desc' };

    function safeKey(key) {
        if (key === null || key === undefined) return '';
        return String(key).trim().toLowerCase().replace(/^0+/, ''); 
    }

    function getWorkingDaysDiff(startDate, endDate) {
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
        if (endDate < startDate) return 0;
        
        let workingDays = 0;
        let currentDate = new Date(startDate);
        currentDate.setHours(0,0,0,0);
        let end = new Date(endDate);
        end.setHours(0,0,0,0);
        
        currentDate.setDate(currentDate.getDate() + 1);
        while (currentDate <= end) {
            const day = currentDate.getDay();
            if (day !== 5 && day !== 6) { // Friday=5, Saturday=6
                workingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return workingDays;
    }

    function renderResignationAuditTab() {
        if (!globalDataset || globalDataset.length === 0) return;
        if (!turnoverDatasetGlobal || turnoverDatasetGlobal.length === 0) return;

        const chosenMonth = monthFilterSelect ? monthFilterSelect.value : 'all';
        let scopedOpData = globalDataset;
        if (chosenMonth !== 'all') {
            scopedOpData = globalDataset.filter(row => parseMonthKey(row['Hiring Date']) === chosenMonth);
        }

        // Build HR Source of Truth Map from turnover.csv
        const systemMap = {};
        turnoverDatasetGlobal.forEach(hrRow => {
            const empCodeRaw = hrRow['Employee Code'];
            const key = safeKey(empCodeRaw);
            if (key && key !== 'nan') {
                const hDate = parseDDMMYYYY(hrRow['Hiring Date']);
                const tDate = parseDDMMYYYY(hrRow['Termination Date']);
                const hasTerm = tDate !== null && !isNaN(tDate.getTime());
                
                let workingDaysToExit = null;
                if (hasTerm && hDate && !isNaN(hDate.getTime())) {
                    workingDaysToExit = getWorkingDaysDiff(hDate, tDate);
                }

                systemMap[key] = {
                    rawRow: hrRow,
                    hasTerm: hasTerm,
                    hiringDateStr: hrRow['Hiring Date'] ? hrRow['Hiring Date'].trim() : 'N/A',
                    termDateStr: hasTerm ? hrRow['Termination Date'].trim() : '',
                    termType: hrRow['Termination Type - English'] ? hrRow['Termination Type - English'].trim() : '',
                    workingDaysToExit: workingDaysToExit
                };
            }
        });

        auditRecordsGlobal = [];
        let opReportedCount = 0;
        let hrTotalLeaversCount = 0;
        let matchedCount = 0;
        let falseResignationCount = 0;
        let earlyExitCount = 0;
        let standardExitCount = 0;

        scopedOpData.forEach(opRow => {
            const hrCodeRaw = opRow['HR Code'];
            const opKey = safeKey(hrCodeRaw);
            if(opKey && systemMap[opKey] && systemMap[opKey].hasTerm) {
                hrTotalLeaversCount++;
            }
        });

        scopedOpData.forEach(opRow => {
            const hrCodeRaw = opRow['HR Code'];
            const opKey = safeKey(hrCodeRaw);
            if(!opKey) return;
            
            const opGov = opRow['Governorate'] ? opRow['Governorate'].trim() : 'Unknown';
            const opBranch = opRow['Branch'] ? opRow['Branch'].trim() : 'Unknown';
            const opSup = opRow['Supervisor'] ? opRow['Supervisor'].trim() : 'Unknown';
            const opName = opRow['Officer Name'] ? opRow['Officer Name'].trim() : 'Unknown';
            const rawComment = opRow['Comment'] && opRow['Comment'].trim() !== '' ? opRow['Comment'].trim() : 'No Comment';
            
            const opStatusRaw = (opRow['Training Status'] || '').trim().toLowerCase();
            const isOpResigned = opStatusRaw === 'resigned';

            if (isOpResigned) {
                opReportedCount++;
            }

            const hrData = systemMap[opKey];

            let auditStatus = '';
            let hrStatusText = '';
            let termDate = '';
            
            if (!hrData) {
                hrStatusText = 'Active (Not Found in HR Exits)';
                termDate = 'N/A';
                if (isOpResigned) {
                    auditStatus = 'False Resignation Claim'; 
                    falseResignationCount++;
                } else {
                    auditStatus = 'ACTIVE MATCH';
                }
            } else {
                termDate = hrData.termDateStr || 'N/A';
                const hasTerm = hrData.hasTerm;

                if (hasTerm) {
                    hrStatusText = `Terminated (${hrData.termType || 'Other'})`;
                } else {
                    hrStatusText = 'Active (No Termination)';
                }

                if (isOpResigned && hasTerm) {
                    auditStatus = 'Matched Resigned';
                    matchedCount++;
                } else if (isOpResigned && !hasTerm) {
                    auditStatus = 'False Resignation Claim'; 
                    falseResignationCount++;
                } else if (!isOpResigned && hasTerm) {
                    if (hrData.workingDaysToExit !== null && hrData.workingDaysToExit <= 3) {
                        auditStatus = 'Early Exit (≤ 3 Working Days)';
                        earlyExitCount++;
                    } else {
                        auditStatus = 'Standard Exit (> 3 Working Days)';
                        standardExitCount++;
                    }
                } else {
                    auditStatus = 'ACTIVE MATCH';
                }
            }

            auditRecordsGlobal.push({
                hrCode: hrCodeRaw || 'N/A',
                empName: opName,
                supervisor: opSup,
                governorate: opGov,
                branch: opBranch,
                opStatus: isOpResigned ? 'Resigned' : 'Active / In Training',
                hrStatus: hrStatusText,
                hiringDate: opRow['Hiring Date'] ? opRow['Hiring Date'].trim() : 'N/A',
                termDate: termDate,
                auditStatus: auditStatus,
                comment: rawComment,
                isException: auditStatus === 'False Resignation Claim' || auditStatus === 'Early Exit (≤ 3 Working Days)' || auditStatus === 'Standard Exit (> 3 Working Days)'
            });
        });

        renderAuditKPIs(opReportedCount, hrTotalLeaversCount, matchedCount, falseResignationCount, earlyExitCount, standardExitCount);
        renderAuditHealthText(falseResignationCount, earlyExitCount, standardExitCount);
        renderAuditTopSummaries(auditRecordsGlobal);
        setupAuditControls();
        renderAuditTable();
    }
    

    // ==========================================================================
    // HR RECONCILIATION GAP DIAGNOSTICS
    // Compares terminated employees in turnover.csv against Dataset B (globalDataset)
    // using Employee Code <-> HR Code. This is supplementary to Resignation Audit.
    // ==========================================================================
    function renderHRReconciliationGapDiagnostics() {
        const badge = document.getElementById('hr-gap-table-badge');
        const tbody = document.getElementById('hr-gap-table-tbody');
        const section = document.getElementById('hr-reconciliation-gap-section');

        if (!badge || !tbody) return;

        // Do not render a false 0 while one of the datasets is still loading.
        if (!Array.isArray(globalDataset) || globalDataset.length === 0 ||
            !Array.isArray(turnoverDatasetGlobal) || turnoverDatasetGlobal.length === 0) {
            badge.textContent = 'Loading…';
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">Loading reconciliation data…</td></tr>`;
            const subtitle = section ? section.querySelector('.section-subtitle') : null;
            if (subtitle) subtitle.textContent = 'Waiting for both operational and HR datasets to load…';
            return;
        }

        /*
         * IMPORTANT BUSINESS LOGIC
         * ------------------------
         * The reconciliation is meant to explain the Measure of Success
         * early-resignation cohort (the post-project cohort), not to compare
         * every employee in turnover.csv when the global onboarding filter
         * happens to be "All Months".
         *
         * If the global month filter has a specific month, we respect it.
         * If it is "All Months", we use the month of the MOS project start
         * (currently 2026-07-01), which is the cohort that produces:
         *
         *     HR Measure of Success = 101
         *     Resignation Audit HR   = 91
         *     Net Difference         = 10
         */
        const globalMonth = monthFilterSelect ? monthFilterSelect.value : 'all';
        let reconciliationMonth = globalMonth;

        if (reconciliationMonth === 'all' || !reconciliationMonth) {
            const projectStart = mosState && mosState.projFrom ? mosState.projFrom : '2026-07-01';
            reconciliationMonth = projectStart.substring(0, 7);
        }

        const isValidDate = d => d instanceof Date && !isNaN(d.getTime());

        // Build the HR termination lookup exactly as the Resignation Audit does:
        // Employee Code -> final HR row's termination state.
        const hrTerminationMap = new Map();
        turnoverDatasetGlobal.forEach(hrRow => {
            const code = safeKey(hrRow['Employee Code']);
            if (!code || code === 'nan') return;
            const termDate = parseDDMMYYYY(hrRow['Termination Date']);
            hrTerminationMap.set(code, isValidDate(termDate));
        });

        // Dataset B cohort for the same hiring month.
        const scopedOperational = globalDataset.filter(row =>
            parseMonthKey(row['Hiring Date']) === reconciliationMonth
        );

        // HR cohort: unique employee codes hired in the same month and terminated.
        const hrCohortLeavers = [];
        const hrCohortCodeSet = new Set();

        turnoverDatasetGlobal.forEach(hrRow => {
            const code = safeKey(hrRow['Employee Code']);
            if (!code || code === 'nan' || hrCohortCodeSet.has(code)) return;

            const hiringDate = parseDDMMYYYY(hrRow['Hiring Date']);
            const terminationDate = parseDDMMYYYY(hrRow['Termination Date']);

            if (!isValidDate(hiringDate) || !isValidDate(terminationDate)) return;

            const hiringMonthKey =
                `${hiringDate.getFullYear()}-${String(hiringDate.getMonth() + 1).padStart(2, '0')}`;

            if (hiringMonthKey !== reconciliationMonth) return;

            hrCohortCodeSet.add(code);
            hrCohortLeavers.push(hrRow);
        });

        // Existing Resignation Audit HR total for the same operational cohort.
        const auditHrLeaverCodes = new Set();
        let auditHrTotal = 0;

        scopedOperational.forEach(row => {
            const code = safeKey(row['HR Code']);
            if (!code || code === 'nan') return;

            if (hrTerminationMap.get(code) === true) {
                auditHrTotal++;
                auditHrLeaverCodes.add(code);
            }
        });

        const measureLeaverCount = hrCohortLeavers.length;
        const netDifference = measureLeaverCount - auditHrTotal;

        const operationalCodeSet = new Set(
            scopedOperational
                .map(row => safeKey(row['HR Code']))
                .filter(code => code && code !== 'nan')
        );

        // Group A: HR cohort leavers absent from Dataset B.
        const hrOnly = hrCohortLeavers.filter(hrRow => {
            const code = safeKey(hrRow['Employee Code']);
            return !operationalCodeSet.has(code);
        });

        // Group B: Dataset B HR leavers whose HR hiring month is outside the cohort.
        const auditOnlyCodes = Array.from(auditHrLeaverCodes)
            .filter(code => !hrCohortCodeSet.has(code));

        const auditOnly = auditOnlyCodes.map(code => {
            const opRow = scopedOperational.find(row => safeKey(row['HR Code']) === code) || {};
            const hrRow = turnoverDatasetGlobal.find(row => safeKey(row['Employee Code']) === code) || {};
            return { opRow, hrRow, code };
        });

        const title = section ? section.querySelector('h3, h2') : null;
        const subtitle = section ? section.querySelector('.section-subtitle') : null;

        if (title) title.textContent = 'Resignation Audit Difference — Case Details';

        const dateObj = new Date(`${reconciliationMonth}-01T00:00:00`);
        const periodLabel = isNaN(dateObj.getTime())
            ? reconciliationMonth
            : dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        if (subtitle) {
            subtitle.textContent =
                `${measureLeaverCount.toLocaleString()} HR cohort leavers − ` +
                `${auditHrTotal.toLocaleString()} Resignation Audit HR leavers = ` +
                `${netDifference.toLocaleString()} net difference • ${periodLabel}`;
        }

        badge.textContent = `${Math.abs(netDifference).toLocaleString()} Net Difference`;
        tbody.innerHTML = '';

        if (hrOnly.length === 0 && auditOnly.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML =
                `<td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">` +
                `No reconciliation cases found for ${periodLabel}.` +
                `</td>`;
            tbody.appendChild(tr);
            return;
        }

        const escapeHtml = value => String(value ?? 'N/A')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const addGroupRow = (label, count, tone) => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                `<td colspan="9" style="padding:12px 10px; font-weight:700; ` +
                `color:${tone}; background:rgba(99,102,241,.04); border-top:1px solid var(--border-color);">` +
                `${escapeHtml(label)} <span style="font-weight:600; color:var(--text-muted);">(${count})</span>` +
                `</td>`;
            tbody.appendChild(tr);
        };

        const addRow = (
            employeeName, employeeCode, branch, specialized, phone,
            hiringDate, terminationDate, currentStatus, reconciliationStatus
        ) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(employeeName)}</strong></td>
                <td>${escapeHtml(employeeCode)}</td>
                <td>${escapeHtml(branch)}</td>
                <td>${escapeHtml(specialized)}</td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(hiringDate)}</td>
                <td>${escapeHtml(terminationDate)}</td>
                <td>${escapeHtml(currentStatus)}</td>
                <td>${escapeHtml(reconciliationStatus)}</td>
            `;
            tbody.appendChild(tr);
        };

        if (hrOnly.length > 0) {
            addGroupRow('HR cohort leavers — not found in Dataset B', hrOnly.length, 'var(--orange)');

            hrOnly.forEach(hrRow => {
                addRow(
                    hrRow['Employee Name - English'] || 'N/A',
                    hrRow['Employee Code'] || 'N/A',
                    hrRow['Site - English'] || 'N/A',
                    hrRow['Position - English'] || 'N/A',
                    hrRow['Mobile'] || 'N/A',
                    hrRow['Hiring Date'] || 'N/A',
                    hrRow['Termination Date'] || 'N/A',
                    'Resigned',
                    'HR cohort leaver — not found in Dataset B'
                );
            });
        }

        if (auditOnly.length > 0) {
            addGroupRow(
                'Resignation Audit HR leavers — outside the HR cohort',
                auditOnly.length,
                'var(--brand-purple)'
            );

            auditOnly.forEach(({ opRow, hrRow, code }) => {
                addRow(
                    opRow['Officer Name'] || hrRow['Employee Name - English'] || 'N/A',
                    opRow['HR Code'] || hrRow['Employee Code'] || code,
                    opRow['Branch'] || hrRow['Site - English'] || 'N/A',
                    opRow['Specialized'] || hrRow['Position - English'] || 'N/A',
                    opRow['Phone #'] || hrRow['Mobile'] || 'N/A',
                    hrRow['Hiring Date'] || opRow['Hiring Date'] || 'N/A',
                    hrRow['Termination Date'] || 'N/A',
                    'Resignation Audit HR Leaver',
                    'Counted by Audit — HR hiring month outside cohort'
                );
            });
        }

        // The net difference is an arithmetic reconciliation:
        // HR-only minus Audit-only. It is intentionally shown separately
        // from the number of detailed rows.
        const note = document.createElement('tr');
        note.innerHTML =
            `<td colspan="9" style="text-align:left; padding:16px; color:var(--text-muted); ` +
            `background:rgba(245,158,11,.06);">` +
            `<strong>Reconciliation:</strong> ${hrOnly.length} HR-only − ${auditOnly.length} ` +
            `Audit-only = <strong>${Math.abs(netDifference)} net difference</strong>. ` +
            `The detailed rows explain the arithmetic; they are not expected to equal the net number.` +
            `</td>`;
        tbody.appendChild(note);
    }

    function renderAuditKPIs(opReported, hrTotal, matched, criticalCount, earlyExit, standardExit) {
        const opEl = document.getElementById('audit-op-reported');
        const hrEl = document.getElementById('audit-hr-total');
        const subMatchedEl = document.getElementById('audit-sub-matched');
        const subEarlyEl = document.getElementById('audit-sub-early');
        const subStandardEl = document.getElementById('audit-sub-standard');
        const matchedEl = document.getElementById('audit-matched');
        const criticalEl = document.getElementById('audit-critical');

        if (opEl) opEl.textContent = opReported.toLocaleString();
        if (hrEl) hrEl.textContent = hrTotal.toLocaleString();
        if (subMatchedEl) subMatchedEl.textContent = matched.toLocaleString();
        if (subEarlyEl) subEarlyEl.textContent = earlyExit.toLocaleString();
        if (subStandardEl) subStandardEl.textContent = standardExit.toLocaleString();
        if (matchedEl) matchedEl.textContent = matched.toLocaleString();
        if (criticalEl) criticalEl.textContent = criticalCount.toLocaleString();
    }

    function renderAuditHealthText(falseRes, earlyExit, standardExit) {
        const falseEl = document.getElementById('audit-insight-false');
        const fakeEl = document.getElementById('audit-insight-fake');
        const normalEl = document.getElementById('audit-insight-normal');

        if (falseEl) {
            falseEl.innerHTML = `There are <strong>${falseRes} employees</strong> active according to HR records, but reported as resigned before training by operational supervisors.`;
        }
        if (fakeEl) {
            fakeEl.innerHTML = `There are <strong>${earlyExit} employees</strong> who resigned after training within their first <strong>3 working days</strong>.`;
        }
        if (normalEl) {
            normalEl.innerHTML = `There are <strong>${standardExit} employees</strong> who resigned after training and completing their initial <strong>3 working days</strong>.`;
        }
    }

    function renderAuditTopSummaries(records) {
        const govContainer = document.getElementById('audit-top-govs');
        const supContainer = document.getElementById('audit-top-sups');
        const summaryTbody = document.getElementById('audit-gov-summary-body');
        
        const govMap = {};
        const supMap = {};

        records.forEach(r => {
            const isFalseRes = r.auditStatus === 'False Resignation Claim';
            const isEarly = r.auditStatus === 'Early Exit (≤ 3 Working Days)';

            if (isFalseRes || isEarly) {
                const g = r.governorate;
                const s = r.supervisor;
                
                if (!govMap[g]) govMap[g] = { gov: g, falseRes: 0, earlyExit: 0, total: 0 };
                if (!supMap[s]) supMap[s] = { name: s, count: 0 };

                if (isFalseRes) govMap[g].falseRes++;
                if (isEarly) govMap[g].earlyExit++;
                
                govMap[g].total++;
                supMap[s].count++;
            }
        });

        const sortedGovs = Object.values(govMap).map(k => ({ name: k.gov, count: k.total })).sort((a, b) => b.count - a.count).slice(0, 5);
        const sortedSups = Object.values(supMap).sort((a, b) => b.count - a.count).slice(0, 5);

        const renderList = (container, list, color) => {
            if(!container) return;
            container.innerHTML = '';
            if (list.length === 0) {
                container.innerHTML = '<div style="font-size:11px; color:var(--text-muted); padding:8px 0;">No discrepancies found</div>';
                return;
            }
            const maxCount = Math.max(...list.map(i => i.count), 1);
            
            list.forEach((item, idx) => {
                const pct = (item.count / maxCount) * 100;
                const row = document.createElement('div');
                row.className = 'leader-row-item';
                row.innerHTML = `
                    <div class="leader-rank-badge">${idx + 1}</div>
                    <div class="leader-region-name" title="${item.name}">${item.name}</div>
                    <div class="leader-track-bar">
                        <div class="leader-fill-bar" style="width: ${pct}%; background-color: ${color};"></div>
                    </div>
                    <div class="leader-pct-value" style="width:auto; min-width:30px;">${item.count}</div>
                `;
                container.appendChild(row);
            });
        };

        renderList(govContainer, sortedGovs, 'var(--red)');
        renderList(supContainer, sortedSups, 'var(--brand-purple)');

        if (summaryTbody) {
            const allGovList = Object.values(govMap).filter(g => g.total > 0);
            
            if (allGovList.length === 0) {
                summaryTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No discrepancies found across all governorates.</td></tr>`;
                return;
            }

            const keyMap = { 0: 'gov', 1: 'falseRes', 2: 'earlyExit', 3: 'total' };
            const sortKey = tableSortStates['audit-gov-summary-table'] ? keyMap[tableSortStates['audit-gov-summary-table'].colIdx] : 'total';
            const dir = tableSortStates['audit-gov-summary-table'] && tableSortStates['audit-gov-summary-table'].dir === 'asc' ? 1 : -1;

            allGovList.sort((a, b) => {
                let valA = a[sortKey];
                let valB = b[sortKey];
                if (typeof valA === 'string') return valA.localeCompare(valB) * dir;
                return (valA - valB) * dir;
            });

            summaryTbody.innerHTML = '';
            allGovList.forEach(g => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${g.gov}</strong></td>
                    <td class="text-danger"><strong>${g.falseRes}</strong></td>
                    <td class="text-warning"><strong>${g.earlyExit}</strong></td>
                    <td><strong>${g.total}</strong></td>
                `;
                summaryTbody.appendChild(tr);
            });
            attachUniversalTableSorting('audit-gov-summary-table');
        }
    }

    function setupAuditControls() {
        const govSel = document.getElementById('audit-filter-gov');
        const supSel = document.getElementById('audit-filter-sup');
        const statSel = document.getElementById('audit-filter-status');
        const searchInp = document.getElementById('audit-search');

        const exceptionRecords = auditRecordsGlobal.filter(r => r.isException);
        const govs = Array.from(new Set(exceptionRecords.map(r => r.governorate).filter(g => g !== 'Unknown'))).sort();
        const sups = Array.from(new Set(exceptionRecords.map(r => r.supervisor).filter(s => s !== 'Unknown'))).sort();

        if (govSel && govSel.options.length <= 1) {
            govs.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g;
                opt.textContent = g;
                govSel.appendChild(opt);
            });
            govSel.onchange = () => { auditFilters.gov = govSel.value; renderAuditTable(); };
        }

        if (supSel && supSel.options.length <= 1) {
            sups.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                supSel.appendChild(opt);
            });
            supSel.onchange = () => { auditFilters.sup = supSel.value; renderAuditTable(); };
        }

        if(statSel) {
            statSel.innerHTML = `
                <option value="False Resignation Claim">False Resignation Claim (Critical Mismatches)</option>
                <option value="Early Exit (≤ 3 Working Days)">Early Exit (Resigned After Training ≤ 3 Days)</option>
                <option value="Standard Exit (> 3 Working Days)">Standard Exit (Resigned After Training > 3 Days)</option>
                <option value="Matched Resigned">Matched Resigned</option>
                <option value="all">All Records</option>
            `;
            if (!auditFilters.status) {
                auditFilters.status = 'False Resignation Claim';
            }
            statSel.value = auditFilters.status;
            statSel.onchange = () => { 
                auditFilters.status = statSel.value; 
                renderAuditTable(); 
            };
        }
        if(searchInp) searchInp.oninput = () => { auditFilters.search = searchInp.value.trim().toLowerCase(); renderAuditTable(); };
    }

    function renderAuditTable() {
        const tbody = document.getElementById('audit-table-body');
        const badge = document.getElementById('audit-table-badge');
        if (!tbody) return;

        let filtered = auditRecordsGlobal.filter(r => {
            if (auditFilters.gov !== 'all' && r.governorate !== auditFilters.gov) return false;
            if (auditFilters.sup !== 'all' && r.supervisor !== auditFilters.sup) return false;
            if (auditFilters.status !== 'all' && r.auditStatus !== auditFilters.status) return false;
            if (auditFilters.status === 'all' && r.auditStatus === 'ACTIVE MATCH') return false; 
            if (auditFilters.search !== '') {
                const s = auditFilters.search;
                return r.hrCode.toLowerCase().includes(s) || r.empName.toLowerCase().includes(s);
            }
            return true;
        });

        if (badge) badge.textContent = `${filtered.length} Cases`;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:var(--text-muted);">No records match the current filters.</td></tr>`;
            return;
        }

        const statusRank = {
            'False Resignation Claim': 1,
            'Early Exit (≤ 3 Working Days)': 2,
            'Standard Exit (> 3 Working Days)': 3,
            'Matched Resigned': 4,
            'ACTIVE MATCH': 5
        };

        filtered.sort((a, b) => {
            const rankA = statusRank[a.auditStatus] || 99;
            const rankB = statusRank[b.auditStatus] || 99;
            if (rankA !== rankB) return rankA - rankB;
            return a.empName.localeCompare(b.empName);
        });

        tbody.innerHTML = filtered.map(r => {
            let statusCls = 'audit-status-neutral';
            if (r.auditStatus === 'False Resignation Claim') statusCls = 'audit-status-conflict';
            else if (r.auditStatus === 'Early Exit (≤ 3 Working Days)') statusCls = 'audit-status-warn';
            else if (r.auditStatus === 'Standard Exit (> 3 Working Days)') statusCls = 'audit-status-neutral';
            else if (r.auditStatus === 'Matched Resigned') statusCls = 'audit-status-match';

            const hrCodeHtml = r.hrCode !== 'N/A' ? `<br><span class="op-hr-code" style="margin-left:0;">(${r.hrCode})</span>` : '';
            const commentHtml = r.comment !== 'No Comment' ? `<span class="op-comment-text">${r.comment}</span>` : `<span class="op-comment-muted">No Comment</span>`;

            return `
                <tr>
                    <td><strong>${r.governorate}</strong></td>
                    <td><b>${r.branch}</b></td>
                    <td>${r.supervisor}</td>
                    <td><strong>${r.empName}</strong>${hrCodeHtml}</td>
                    <td style="color:${r.opStatus==='Resigned'?'var(--red)':'var(--text-main)'}; font-weight:600;">${r.opStatus}</td>
                    <td style="font-weight:600; color:${r.hrStatus.includes('Active') ? 'var(--primary)' : 'var(--orange)'};">${r.hrStatus}</td>
                    <td><strong>${r.hiringDate}</strong></td>
                    <td class="text-danger"><strong>${r.termDate}</strong></td>
                    <td><span class="audit-status-badge ${statusCls}">${r.auditStatus}</span></td>
                    <td>${commentHtml}</td>
                </tr>
            `;
        }).join('');
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
        });

    // Dynamic Live Data Loader - turnover.csv (New Tab Dataset)
    fetch('turnover.csv', { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error("Offline Turnover CSV Data");
            return res.text();
        })
        .then(csvText => {
            turnoverDatasetGlobal = parseCSVDataEngine(csvText);
            renderMeasureOfSuccessTab();
            renderResignationAuditTab();
            renderHRReconciliationGapDiagnostics();
        })
        .catch(err => {
            console.warn("turnover.csv File Offline or Unreachable:", err);
        });
});
// ==========================================================================
    // TAB 8: RED FLAGS MODULE (ROBUST, FILTER-AWARE & FULLY CONNECTED)
    // ==========================================================================
    let redFlagsDatasetGlobal = [];

    function initRedFlagsModule() {
        // بيانات ملف redflags.csv الحقيقية مضمنة هنا لضمان عمل الداشبورد بدون أخطاء CORS أو Fetch
        redFlagsDatasetGlobal = [
            { "HR Code": "20082803", "Officer Name": "Shaymaa Ahmed Mahmoud Ahmed", "Branch": "الاسكندرية - البيطاش - تساهيل", "Hiring Date": "6/14/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20082811", "Officer Name": "Amal Ashraf Moustafa Ebrahim", "Branch": "الاقصر - الزينيه بحري - تساهيل", "Hiring Date": "6/14/2026", "Details": "قامت بالنزول مرتين في مهام تحصيل الأقساط برفقة رئيس المجموعة، وذلك لمتابعة التحصيل ومتابعة العملاء المتأخرين في السداد", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20082849", "Officer Name": "Feryal Elsayed Elshahat Elsayed", "Branch": "كفر الشيخ - سريوه الكبري - تساهيل", "Hiring Date": "6/14/2026", "Details": "قام بالنزول في مهام تحصيل الأقساط برفقة رئيس المجموعة، وذلك لمتابعة التحصيل ومتابعة العملاء المتأخرين في السداد", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20082855", "Officer Name": "Beshoy Gerges Saad Beshay", "Branch": "المنيا - ملوى 2 - تساهيل", "Hiring Date": "6/14/2026", "Details": "قام بالنزول في مهام تحصيل الأقساط برفقة رئيس المجموعة، وذلك لمتابعة التحصيل ومتابعة العملاء المتأخرين في السداد", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20082690", "Officer Name": "Mohamed Elsafi Mohamed Mohamed Shehata", "Branch": "بني سويف - الفشن 2 - تساهيل", "Hiring Date": "6/15/2026", "Details": "قام بالنزول في مهام تحصيل الأقساط برفقة رئيس المجموعة، وذلك لمتابعة التحصيل ومتابعة العملاء المتأخرين في السداد", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083347", "Officer Name": "Karema Esmael Mohamed Ahmed", "Branch": "سوهاج - البلينا 2 - تساهيل", "Hiring Date": "6/27/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Not Valid", "Action Taken": "Action Done" },
            { "HR Code": "20066442", "Officer Name": "mohamed ibrahim mohamed elbahnasawy", "Branch": "الشرقيه - الزقازيق 2 - تساهيل", "Hiring Date": "7/1/2026", "Details": "مكلف بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083138", "Officer Name": "Ibrahim Ahmd MohmdMohmd mohmdOmr", "Branch": "أسيوط - أبار الوقف - تساهيل", "Hiring Date": "7/1/2026", "Details": "مكلف بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Not Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083187", "Officer Name": "hesham khalafallah ali mohamed", "Branch": "أسيوط - منفلوط 2 - تساهيل", "Hiring Date": "7/1/2026", "Details": "مكلف بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083268", "Officer Name": "Eman Mohamed Elsayed Meshrf", "Branch": "المنوفية - شبين الكوم 2 - تساهيل", "Hiring Date": "7/1/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083322", "Officer Name": "yasmin abdallah aboelfitoh abdallah", "Branch": "الجيزة - المنيب - تساهيل", "Hiring Date": "7/1/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20078141", "Officer Name": "hend hamdy mahmood alian", "Branch": "القاهرة - المرج - تساهيل", "Hiring Date": "7/5/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083325", "Officer Name": "katren saed aziz abdallah", "Branch": "سوهاج - طهطا 2 - تساهيل", "Hiring Date": "7/5/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Not Valid", "Action Taken": "Action Done" },
            { "HR Code": "20068911", "Officer Name": "romany marzok wasef aziz", "Branch": "المنيا - سمالوط 2 - تساهيل", "Hiring Date": "7/6/2026", "Details": "مكلف بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Not Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083496", "Officer Name": "zainab hassan ahmed mahmoud", "Branch": "الجيزة - منشأة القناطر - تساهيل", "Hiring Date": "7/9/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083704", "Officer Name": "Yasmen Aeman Kamel Hassen", "Branch": "الاسكندرية - العامرية - تساهيل", "Hiring Date": "7/14/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Not Valid", "Action Taken": "Action Done" },
            { "HR Code": "20083835", "Officer Name": "Nermen Essam Kamal Tolba", "Branch": "الغربية - زفتى 2 - تساهيل", "Hiring Date": "7/15/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Not Valid", "Action Taken": "Action Done" },
            { "HR Code": "20046133", "Officer Name": "Nourhan Tariq Nasr Mofadel", "Branch": "أسيوط - مركز أسيوط - تساهيل", "Hiring Date": "7/16/2026", "Details": "مكلفة بإجراء مكالمات هاتفية للعملاء بغرض متابعة وتحصيل الأقساط المستحقة بالفرع", "Valid": "Not Valid", "Action Taken": "Action Done" }
        ];

        renderRedFlagsDashboard();
    }

    function renderRedFlagsDashboard() {
        const monthFilterEl = document.getElementById('month-filter');
        const chosenMonth = monthFilterEl ? monthFilterEl.value : 'all';
        
        let scopedRecords = redFlagsDatasetGlobal;
        
        // ربط القراءة بفلتر الشهور العلوي بناءً على تاريخ التعيين (Hiring Date)
        if (chosenMonth && chosenMonth !== 'all') {
            scopedRecords = redFlagsDatasetGlobal.filter(row => {
                const hDate = row['Hiring Date'] || '';
                return parseMonthKey(hDate) === chosenMonth;
            });
        }

        const totalCases = scopedRecords.length;
        let validCases = 0;
        let notValidCases = 0;
        let withAction = 0;
        let withoutAction = 0;

        scopedRecords.forEach(r => {
            const validCol = (r['Valid'] || '').trim().toLowerCase();
            if (validCol === 'valid') {
                validCases++;
            } else {
                notValidCases++;
            }

            const actionCol = (r['Action Taken'] || '').trim();
            if (actionCol !== '' && actionCol.toLowerCase() !== 'null' && actionCol.toLowerCase() !== 'nan') {
                withAction++;
            } else {
                withoutAction++;
            }
        });

        // تحديث الكروت العلوية الخمسة
        const totalEl = document.getElementById('rf-total-val');
        const validEl = document.getElementById('rf-valid-val');
        const notValidEl = document.getElementById('rf-notvalid-val');
        const withActionEl = document.getElementById('rf-withaction-val');
        const withoutActionEl = document.getElementById('rf-withoutaction-val');

        if (totalEl) totalEl.textContent = totalCases;
        if (validEl) validEl.textContent = validCases;
        if (notValidEl) notValidEl.textContent = notValidCases;
        if (withActionEl) withActionEl.textContent = withAction;
        if (withoutActionEl) withoutActionEl.textContent = withoutAction;

        const container = document.getElementById('red-flags-cards-container');
        if (!container) return;

        if (scopedRecords.length === 0) {
            container.innerHTML = `<div class="op-empty-state" style="grid-column: span 3;">لا توجد حالات مسجلة في هذا الشهر.</div>`;
            return;
        }

        // بناء كروت الحالات السفلية (3 كروت في الصف، اسم الأوفيسر وتحته الفرع، الوصف، Valid/Not Valid، و Action Taken)
        container.innerHTML = scopedRecords.map(r => {
            const officerName = r['Officer Name'] || 'N/A';
            const branch = r['Branch'] || 'N/A';
            const empCode = r['HR Code'] || '';
            const hiringDate = r['Hiring Date'] || 'N/A';
            const details = r['Details'] || 'لا توجد تفاصيل';
            const validationVal = (r['Valid'] || '').trim();
            const actionTaken = r['Action Taken'] || '';

            const isValid = validationVal.toLowerCase() === 'valid';
            const validationBadgeClass = isValid ? 'rf-badge-valid' : 'rf-badge-invalid';
            const validationText = isValid ? 'VALID CASE' : 'NOT VALID CASE';

            const hasAction = actionTaken && actionTaken.trim() !== '' && actionTaken.toLowerCase() !== 'null';
            const actionDisplay = hasAction ? `Action Taken: ${actionTaken}` : 'No Action Taken';

            return `
                <div class="metric-card rf-individual-card">
                    <div class="rf-card-header">
                        <span class="rf-officer-name">${officerName}</span>
                        <span class="rf-branch-name">${branch}</span>
                    </div>
                    <div class="rf-card-body">
                        <div class="rf-detail-box"><strong>Description:</strong> ${details}</div>
                        <div style="font-size:11.5px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center; margin-top: 4px;">
                            <span>HR Code: <strong>${empCode}</strong></span>
                            <span>Hiring: <strong>${hiringDate}</strong></span>
                        </div>
                    </div>
                    <div class="rf-meta-footer">
                        <span class="rf-status-badge ${validationBadgeClass}">${validationText}</span>
                        <span class="rf-action-taken" style="color: ${hasAction ? 'var(--primary)' : 'var(--orange)'};">${actionDisplay}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // الربط اللحظي بفلتر الشهور العلوي في الداشبورد
    const mainMonthFilter = document.getElementById('month-filter');
    if (mainMonthFilter) {
        mainMonthFilter.addEventListener('change', () => {
            renderRedFlagsDashboard();
        });
    }

    // تشغيل الموديل فوراً
    initRedFlagsModule();
