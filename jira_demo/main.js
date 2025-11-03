// Jira Integration
document.addEventListener('DOMContentLoaded', () => {
    // 原有代码保持不变...

    // Jira元素
    const loginBtn = document.getElementById('login-btn');
    const createIssueBtn = document.getElementById('create-issue-btn');
    const loginStatus = document.getElementById('login-status');
    const createIssueStatus = document.getElementById('create-issue-status');
    const createIssueForm = document.getElementById('create-issue-form');

    // Jira登录
    loginBtn.addEventListener('click', () => {
        const server = document.getElementById('jira-server').value;
        const email = document.getElementById('jira-email').value;
        const apiToken = document.getElementById('jira-api-token').value;

        fetch('/api/jira/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ server, email, api_token: apiToken })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                loginStatus.textContent = data.message;
                loginStatus.className = 'status-message success';
                createIssueForm.classList.remove('hidden'); // 显示创建issue表单
            } else {
                loginStatus.textContent = data.message;
                loginStatus.className = 'status-message error';
            }
        })
        .catch(err => {
            loginStatus.textContent = 'Login failed: Network error';
            loginStatus.className = 'status-message error';
        });
    });

    // 创建Jira Issue
    createIssueBtn.addEventListener('click', () => {
        const projectKey = document.getElementById('project-key').value;
        const summary = document.getElementById('issue-summary').value;
        const description = document.getElementById('issue-description').value;

        fetch('/api/jira/create-issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_key: projectKey, summary, description })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                createIssueStatus.innerHTML = `
                    Issue created successfully! 
                    <br>Key: ${data.issue_key} 
                    <br><a href="${data.issue_url}" target="_blank">View in Jira</a>
                `;
                createIssueStatus.className = 'status-message success';
                // 重置表单
                document.getElementById('project-key').value = '';
                document.getElementById('issue-summary').value = '';
                document.getElementById('issue-description').value = '';
            } else {
                createIssueStatus.textContent = data.message;
                createIssueStatus.className = 'status-message error';
            }
        })
        .catch(err => {
            createIssueStatus.textContent = 'Failed to create issue: Network error';
            createIssueStatus.className = 'status-message error';
        });
    });

    // 初始化状态UI
    updateStateUI();
});
