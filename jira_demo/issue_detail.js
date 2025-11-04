// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    const issueKey = '{{ issue_key }}';
    
    // 状态颜色映射
    const statusColorMap = {
        'To Do': 'bg-gray-100 text-gray-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Done': 'bg-green-100 text-green-800',
        'Review': 'bg-yellow-100 text-yellow-800',
        'Blocked': 'bg-red-100 text-red-800'
    };

    // 处理状态转换
    window.transitionIssue = function(issueKey, transitionId, button) {
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> Processing...';
        
        fetch(`/transition-issue/${issueKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ transition_id: transitionId })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Transition failed');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                updateStatusDisplay(data.current_status);
                updateTransitionsList(data.transitions);
                
                button.innerHTML = '<i class="fa fa-check mr-2"></i> Success!';
                button.classList.remove('border-primary', 'text-primary', 'bg-primary/5', 'hover:bg-primary/10');
                button.classList.add('border-success', 'text-success', 'bg-success/5');
                
                setTimeout(() => button.remove(), 3000);
            }
        })
        .catch(error => {
            button.innerHTML = `<i class="fa fa-times mr-2"></i> Error`;
            button.classList.remove('border-primary', 'text-primary', 'bg-primary/5', 'hover:bg-primary/10');
            button.classList.add('border-danger', 'text-danger', 'bg-danger/5');
            
            document.getElementById('transitions-error').textContent = error.message;
            document.getElementById('transitions-error').classList.remove('hidden');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('border-danger', 'text-danger', 'bg-danger/5');
                button.classList.add('border-primary', 'text-primary', 'bg-primary/5', 'hover:bg-primary/10');
                document.getElementById('transitions-error').classList.add('hidden');
            }, 5000);
        });
    };

    // 手动刷新状态
    document.getElementById('refresh-status').addEventListener('click', function() {
        const button = this;
        const originalText = button.innerHTML;
        
        button.disabled = true;
        button.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> Refreshing...';
        document.getElementById('transitions-loading').classList.remove('hidden');
        document.getElementById('transitions-error').classList.add('hidden');
        
        fetch(`/get-latest-issue-status/${issueKey}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Failed to refresh status');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    updateStatusDisplay(data.current_status);
                    updateTransitionsList(data.transitions);
                    document.getElementById('issue-summary').textContent = data.summary;
                    document.getElementById('last-updated').textContent = `Updated: ${data.updated}`;
                }
            })
            .catch(error => {
                document.getElementById('transitions-error').textContent = error.message;
                document.getElementById('transitions-error').classList.remove('hidden');
            })
            .finally(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                document.getElementById('transitions-loading').classList.add('hidden');
            });
    });

    // 更新状态显示
    function updateStatusDisplay(statusName) {
        const statusElement = document.getElementById('current-status');
        
        // 移除所有状态类
        Object.values(statusColorMap).forEach(className => {
            statusElement.classList.remove(...className.split(' '));
        });
        
        // 添加新状态类
        const newClass = statusColorMap[statusName] || 'bg-purple-100 text-purple-800';
        statusElement.classList.add(...newClass.split(' '));
        statusElement.textContent = statusName;
    }

    // 更新转换列表
    function updateTransitionsList(transitions) {
        const container = document.getElementById('transitions-container');
        
        if (transitions && transitions.length > 0) {
            container.innerHTML = '<div class="flex flex-wrap gap-3"></div>';
            const flexContainer = container.querySelector('div');
            
            transitions.forEach(transition => {
                const button = document.createElement('button');
                button.onclick = () => transitionIssue(issueKey, transition.id, button);
                button.className = 'transition-btn px-4 py-2 border border-primary text-primary bg-primary/5 rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-custom flex items-center';
                button.innerHTML = `<i class="fa fa-exchange mr-2"></i> ${transition.name}`;
                flexContainer.appendChild(button);
            });
        } else {
            container.innerHTML = '<p class="text-gray-500 italic">No available transitions</p>';
        }
    }

    // 自动刷新（30秒一次）
    setInterval(() => {
        document.getElementById('refresh-status').click();
    }, 30000);
});
