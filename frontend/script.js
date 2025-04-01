document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const userIdInput = document.getElementById('userId');
    const jobIdInput = document.getElementById('jobId');
    const loadDataBtn = document.getElementById('loadData');
    const responseArea = document.getElementById('responseArea');
    const outputContent = document.getElementById('outputContent');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const periodicOptions = document.getElementById('periodicOptions');
    const periodButtons = document.querySelectorAll('.period-btn');
    
    // API base URL
    const apiBaseUrl = 'http://localhost:3000';
    
    // Current selections
    let currentTab = 'status';
    let currentPeriod = 'day';
    
    // Add event listeners to tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update current tab
            currentTab = this.getAttribute('data-tab');
            
            // Show/hide period selector for periodic tab
            if (currentTab === 'periodic') {
                periodicOptions.style.display = 'block';
            } else {
                periodicOptions.style.display = 'none';
            }
        });
    });
    
    // Add event listeners to period buttons
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active period
            periodButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update current period
            currentPeriod = this.getAttribute('data-period');
            
            // If data is already loaded, refresh with new period
            if (responseArea.textContent.trim() !== '') {
                loadData();
            }
        });
    });
    
    // Add event listener to load data button
    loadDataBtn.addEventListener('click', loadData);
    
    // Function to load data based on current selections
    function loadData() {
        const userId = userIdInput.value.trim();
        const jobId = jobIdInput.value.trim();
        
        if (!userId) {
            showError('User ID is required');
            return;
        }
        
        let endpoint;
        
        // Build endpoint based on current tab and inputs
        switch (currentTab) {
            case 'status':
                endpoint = jobId ? `/api/status/${jobId}` : '/api/status/all';
                break;
            case 'stats':
                endpoint = jobId ? `/api/stats/${jobId}` : '/api/stats/all';
                break;
            case 'periodic':
                endpoint = jobId 
                    ? `/api/periodic/${jobId}?period=${currentPeriod}` 
                    : `/api/periodic/all?period=${currentPeriod}`;
                break;
            case 'recent':
                endpoint = jobId ? `/api/recent/${jobId}` : '/api/recent/all';
                break;
            case 'shifts':
                endpoint = jobId ? `/api/shifts/${jobId}` : '/api/shifts/all';
                break;
            case 'jobs':
                endpoint = '/api/jobs/list';
                break;
            default:
                endpoint = '/health';
        }
        
        const url = `${apiBaseUrl}${endpoint}`;
        
        // Show loading
        responseArea.innerHTML = 'Loading...';
        outputContent.innerHTML = '<div class="placeholder">Loading...</div>';
        
        // Fetch data from API
        fetch(url, {
            headers: {
                'X-User-Id': userId
            }
        })
        .then(response => response.json())
        .then(data => {
            // Display raw JSON response
            responseArea.textContent = JSON.stringify(data, null, 2);
            
            // Display formatted output based on the tab
            if (data.success) {
                renderFormattedOutput(data.data, currentTab);
            } else {
                showError(data.message || 'An error occurred');
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            responseArea.textContent = 'Error fetching data: ' + error.message;
            showError('Error fetching data. Make sure the backend server is running.');
        });
    }
    
    // Function to show error message
    function showError(message) {
        outputContent.innerHTML = `<div class="error">${message}</div>`;
    }
    
    // Function to render formatted output based on the tab and data
    function renderFormattedOutput(data, tab) {
        let html = '';
        
        switch (tab) {
            case 'status':
                html = renderStatusOutput(data);
                break;
            case 'stats':
                html = renderStatsOutput(data);
                break;
            case 'periodic':
                html = renderPeriodicOutput(data);
                break;
            case 'recent':
                html = renderRecentOutput(data);
                break;
            case 'shifts':
                html = renderShiftsOutput(data);
                break;
            case 'jobs':
                html = renderJobsOutput(data);
                break;
            default:
                html = '<div class="placeholder">No data to display</div>';
        }
        
        outputContent.innerHTML = html;
    }
    
    // Function to render job status output
    function renderStatusOutput(data) {
        if (data.jobs) {
            // Multiple jobs
            let html = `
                <div class="section">
                    <h3>Overall Summary</h3>
                    <div class="summary">
                        <p><strong>Total Jobs:</strong> ${data.overall_summary.total_jobs}</p>
                        <p><strong>Weekly Hours:</strong> ${data.overall_summary.weekly_hours}</p>
                        <p><strong>Weekly Earnings:</strong> $${data.overall_summary.weekly_earnings}</p>
                        <p><strong>Weekly Shifts:</strong> ${data.overall_summary.weekly_shifts}</p>
                    </div>
                </div>
            `;
            
            html += '<div class="section"><h3>Jobs</h3>';
            
            data.jobs.forEach(job => {
                html += `
                    <div class="job-card">
                        <h4>${job.job_title} (ID: ${job.job_id})</h4>
                        <p><strong>Status:</strong> ${job.is_active ? 'Active' : 'Inactive'}</p>
                        
                        <div class="section">
                            <h5>Weekly Summary</h5>
                            <p><strong>Hours:</strong> ${job.weekly_summary.total_hours}</p>
                            <p><strong>Earnings:</strong> $${job.weekly_summary.total_earnings}</p>
                            <p><strong>Shifts:</strong> ${job.weekly_summary.total_shifts}</p>
                        </div>
                        
                        ${job.latest_shift ? `
                            <div class="section">
                                <h5>Latest Shift</h5>
                                <p><strong>Start:</strong> ${formatDateTime(job.latest_shift.start_time)}</p>
                                <p><strong>End:</strong> ${formatDateTime(job.latest_shift.end_time)}</p>
                                <p><strong>Hours:</strong> ${job.latest_shift.total_hours}</p>
                                <p><strong>Earnings:</strong> $${job.latest_shift.total_earnings}</p>
                            </div>
                        ` : '<p>No recent shifts</p>'}
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        } else {
            // Single job
            let html = `
                <div class="job-card">
                    <h4>${data.job_title} (ID: ${data.job_id})</h4>
                    <p><strong>Status:</strong> ${data.is_active ? 'Active' : 'Inactive'}</p>
                    
                    <div class="section">
                        <h5>Weekly Summary</h5>
                        <p><strong>Hours:</strong> ${data.weekly_summary.total_hours}</p>
                        <p><strong>Earnings:</strong> $${data.weekly_summary.total_earnings}</p>
                        <p><strong>Shifts:</strong> ${data.weekly_summary.total_shifts}</p>
                    </div>
                    
                    ${data.latest_shift ? `
                        <div class="section">
                            <h5>Latest Shift</h5>
                            <p><strong>Start:</strong> ${formatDateTime(data.latest_shift.start_time)}</p>
                            <p><strong>End:</strong> ${formatDateTime(data.latest_shift.end_time)}</p>
                            <p><strong>Hours:</strong> ${data.latest_shift.total_hours}</p>
                            <p><strong>Earnings:</strong> $${data.latest_shift.total_earnings}</p>
                        </div>
                    ` : '<p>No recent shifts</p>'}
                </div>
            `;
            return html;
        }
    }
    
    // Function to render stats output
    function renderStatsOutput(data) {
        if (data.jobs) {
            // Multiple jobs
            let html = `
                <div class="section">
                    <h3>Overall Summary</h3>
                    <div class="summary">
                        <p><strong>Total Jobs:</strong> ${data.overall_summary.total_jobs}</p>
                        <p><strong>Total Hours:</strong> ${data.overall_summary.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.overall_summary.total_earnings}</p>
                        <p><strong>Last Updated:</strong> ${formatDateTime(data.overall_summary.last_updated)}</p>
                    </div>
                </div>
            `;
            
            html += '<div class="section"><h3>Jobs</h3>';
            
            data.jobs.forEach(job => {
                html += `
                    <div class="job-card">
                        <h4>${job.job_title} (ID: ${job.job_id})</h4>
                        <p><strong>Status:</strong> ${job.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        } else {
            // Single job
            let html = `
                <div class="job-card">
                    <h4>${data.job_title} (ID: ${data.job_id})</h4>
                    <p><strong>Status:</strong> ${data.is_active ? 'Active' : 'Inactive'}</p>
                    
                    <div class="section">
                        <h5>Lifetime Stats</h5>
                        <p><strong>Total Hours:</strong> ${data.stats.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.stats.total_earnings}</p>
                        <p><strong>Last Updated:</strong> ${formatDateTime(data.stats.last_updated)}</p>
                    </div>
                </div>
            `;
            return html;
        }
    }
    
    // Function to render periodic output
    function renderPeriodicOutput(data) {
        let html = `
            <div class="section">
                <h3>${capitalizeFirstLetter(data.period_type)} Totals</h3>
                <p><strong>Period Start:</strong> ${data.period_start}</p>
                <p><strong>Period End:</strong> ${data.period_end}</p>
            </div>
        `;
        
        if (data.jobs) {
            // Multiple jobs
            html += `
                <div class="section">
                    <h3>Overall Summary</h3>
                    <div class="summary">
                        <p><strong>Total Jobs:</strong> ${data.overall_summary.total_jobs}</p>
                        <p><strong>Total Hours:</strong> ${data.overall_summary.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.overall_summary.total_earnings}</p>
                        <p><strong>Total Shifts:</strong> ${data.overall_summary.total_shifts}</p>
                    </div>
                </div>
            `;
            
            data.jobs.forEach(job => {
                html += `
                    <div class="job-card">
                        <h4>${job.job_title} (ID: ${job.job_id})</h4>
                        <p><strong>Status:</strong> ${job.is_active ? 'Active' : 'Inactive'}</p>
                        
                        <div class="section">
                            <h5>Summary</h5>
                            <p><strong>Total Hours:</strong> ${job.summary.total_hours}</p>
                            <p><strong>Total Earnings:</strong> $${job.summary.total_earnings}</p>
                            <p><strong>Total Shifts:</strong> ${job.summary.total_shifts}</p>
                        </div>
                        
                        <div class="section">
                            <h5>Periodic Breakdown</h5>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Hours</th>
                                        <th>Earnings</th>
                                        <th>Shifts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${job.periodic_totals.map(entry => `
                                        <tr>
                                            <td>${entry.period}</td>
                                            <td>${entry.total_hours}</td>
                                            <td>$${entry.total_earnings}</td>
                                            <td>${entry.total_shifts}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
        } else {
            // Single job
            html += `
                <div class="job-card">
                    <h4>${data.job_title} (ID: ${data.job_id})</h4>
                    <p><strong>Status:</strong> ${data.is_active ? 'Active' : 'Inactive'}</p>
                    
                    <div class="section">
                        <h5>Summary</h5>
                        <p><strong>Total Hours:</strong> ${data.summary.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.summary.total_earnings}</p>
                        <p><strong>Total Shifts:</strong> ${data.summary.total_shifts}</p>
                    </div>
                    
                    <div class="section">
                        <h5>Periodic Breakdown</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Hours</th>
                                    <th>Earnings</th>
                                    <th>Shifts</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.periodic_totals.map(entry => `
                                    <tr>
                                        <td>${entry.period}</td>
                                        <td>${entry.total_hours}</td>
                                        <td>$${entry.total_earnings}</td>
                                        <td>${entry.total_shifts}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    // Function to render recent activities output
    function renderRecentOutput(data) {
        if (data.jobs) {
            // Multiple jobs
            let html = `
                <div class="section">
                    <h3>Overall Summary</h3>
                    <div class="summary">
                        <p><strong>Total Jobs:</strong> ${data.overall_summary.total_jobs}</p>
                        <p><strong>Total Hours:</strong> ${data.overall_summary.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.overall_summary.total_earnings}</p>
                        <p><strong>Total Shifts:</strong> ${data.overall_summary.total_shifts}</p>
                    </div>
                </div>
            `;
            
            data.jobs.forEach(job => {
                html += `
                    <div class="job-card">
                        <h4>${job.job_title} (ID: ${job.job_id})</h4>
                        
                        <div class="section">
                            <h5>Summary</h5>
                            <p><strong>Total Hours:</strong> ${job.summary.total_hours}</p>
                            <p><strong>Total Earnings:</strong> $${job.summary.total_earnings}</p>
                            <p><strong>Total Shifts:</strong> ${job.summary.total_shifts}</p>
                        </div>
                        
                        <div class="section">
                            <h5>Recent Activities</h5>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Hours</th>
                                        <th>Earnings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${job.activities.map(activity => `
                                        <tr>
                                            <td>${formatDate(activity.start_time)}</td>
                                            <td>${formatTime(activity.start_time)}</td>
                                            <td>${formatTime(activity.end_time)}</td>
                                            <td>${activity.total_hours}</td>
                                            <td>$${activity.total_earnings}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
            
            return html;
        } else {
            // Single job
            let html = `
                <div class="job-card">
                    <h4>${data.job_title} (ID: ${data.job_id})</h4>
                    
                    <div class="section">
                        <h5>Summary</h5>
                        <p><strong>Total Hours:</strong> ${data.summary.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.summary.total_earnings}</p>
                        <p><strong>Total Shifts:</strong> ${data.summary.total_shifts}</p>
                    </div>
                    
                    <div class="section">
                        <h5>Recent Activities</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Hours</th>
                                    <th>Earnings</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.activities.map(activity => `
                                    <tr>
                                        <td>${formatDate(activity.start_time)}</td>
                                        <td>${formatTime(activity.start_time)}</td>
                                        <td>${formatTime(activity.end_time)}</td>
                                        <td>${activity.total_hours}</td>
                                        <td>$${activity.total_earnings}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            return html;
        }
    }
    
    // Function to render shifts output
    function renderShiftsOutput(data) {
        if (data.jobs) {
            // Multiple jobs
            let html = `
                <div class="section">
                    <h3>Overall Summary</h3>
                    <div class="summary">
                        <p><strong>Total Jobs:</strong> ${data.overall_summary.total_jobs}</p>
                        <p><strong>Total Hours:</strong> ${data.overall_summary.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.overall_summary.total_earnings}</p>
                        <p><strong>Total Shifts:</strong> ${data.overall_summary.total_shifts}</p>
                    </div>
                </div>
            `;
            
            data.jobs.forEach(job => {
                html += `
                    <div class="job-card">
                        <h4>${job.job_title} (ID: ${job.job_id})</h4>
                        
                        <div class="section">
                            <h5>Summary</h5>
                            <p><strong>Total Hours:</strong> ${job.summary.total_hours}</p>
                            <p><strong>Total Earnings:</strong> $${job.summary.total_earnings}</p>
                            <p><strong>Total Shifts:</strong> ${job.summary.total_shifts}</p>
                        </div>
                        
                        <div class="section">
                            <h5>Shifts</h5>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Date</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Hours</th>
                                        <th>Earnings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${job.shifts.map(shift => `
                                        <tr>
                                            <td>${shift.shift_id}</td>
                                            <td>${formatDate(shift.start_time)}</td>
                                            <td>${formatTime(shift.start_time)}</td>
                                            <td>${formatTime(shift.end_time)}</td>
                                            <td>${shift.total_hours}</td>
                                            <td>$${shift.total_earnings}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
            
            return html;
        } else {
            // Single job
            let html = `
                <div class="job-card">
                    <h4>${data.job_title} (ID: ${data.job_id})</h4>
                    
                    <div class="section">
                        <h5>Summary</h5>
                        <p><strong>Total Hours:</strong> ${data.summary.total_hours}</p>
                        <p><strong>Total Earnings:</strong> $${data.summary.total_earnings}</p>
                        <p><strong>Total Shifts:</strong> ${data.summary.total_shifts}</p>
                    </div>
                    
                    <div class="section">
                        <h5>Shifts</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Hours</th>
                                    <th>Earnings</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.shifts.map(shift => `
                                    <tr>
                                        <td>${shift.shift_id}</td>
                                        <td>${formatDate(shift.start_time)}</td>
                                        <td>${formatTime(shift.start_time)}</td>
                                        <td>${formatTime(shift.end_time)}</td>
                                        <td>${shift.total_hours}</td>
                                        <td>$${shift.total_earnings}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            return html;
        }
    }
    
    // Function to render jobs output
    function renderJobsOutput(data) {
        return `
            <div class="section">
                <h3>Jobs</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(job => `
                            <tr>
                                <td>${job.job_id}</td>
                                <td>${job.job_title}</td>
                                <td>${job.is_current ? 'Active' : 'Inactive'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Helper function to format date and time
    function formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    }
    
    // Helper function to format date only
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    // Helper function to format time only
    function formatTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString();
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}); 