// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const projectSelect = document.getElementById('project_id');
    const issueTypeSelect = document.getElementById('issue_type');
    const loadingIndicator = document.getElementById('issue_type_loading');
    const errorIndicator = document.getElementById('issue_type_error');

    // 监听项目选择变化
    projectSelect.addEventListener('change', function() {
        const projectId = this.value;
        
        // 重置状态
        issueTypeSelect.innerHTML = '';
        issueTypeSelect.disabled = true;
        errorIndicator.classList.add('hidden');
        
        if (!projectId) {
            issueTypeSelect.innerHTML = '<option value="">Select a project first</option>';
            return;
        }
        
        // 显示加载状态
        loadingIndicator.classList.remove('hidden');
        issueTypeSelect.innerHTML = '<option value="">Loading issue types...</option>';
        
        // 请求项目对应的Issue类型
        fetch(`/get-issue-types/${projectId}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Failed to fetch issue types');
                    });
                }
                return response.json();
            })
            .then(data => {
                loadingIndicator.classList.add('hidden');
                
                if (data.status === 'success' && data.issue_types && data.issue_types.length > 0) {
                    // 填充Issue类型列表
                    issueTypeSelect.innerHTML = '';
                    data.issue_types.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type.id;
                        option.textContent = type.name;
                        issueTypeSelect.appendChild(option);
                    });
                    issueTypeSelect.disabled = false;
                } else {
                    issueTypeSelect.innerHTML = '<option value="">No issue types available</option>';
                    errorIndicator.textContent = data.message || 'No issue types available for this project';
                    errorIndicator.classList.remove('hidden');
                }
            })
            .catch(error => {
                loadingIndicator.classList.add('hidden');
                issueTypeSelect.innerHTML = '<option value="">Error loading types</option>';
                errorIndicator.textContent = error.message;
                errorIndicator.classList.remove('hidden');
                console.error('Error:', error);
            });
    });
});
