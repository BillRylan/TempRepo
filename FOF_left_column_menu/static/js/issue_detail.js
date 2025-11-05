document.addEventListener('DOMContentLoaded', function() {
    const issueKey = window.issueKey;
    const statusColorMap = window.statusColorMap;

    window.transitionIssue = function(transitionId, button) {
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

    function updateStatusDisplay(statusName) {
        const statusElement = document.getElementById('current-status');
        
        Object.values(statusColorMap).forEach(className => {
            statusElement.classList.remove(...className.split(' '));
        });
        
        const newClass = statusColorMap[statusName] || 'bg-purple-100 text-purple-800';
        statusElement.classList.add(...newClass.split(' '));
        statusElement.textContent = statusName;
    }

    function updateTransitionsList(transitions) {
        const container = document.getElementById('transitions-container');
        
        if (transitions && transitions.length > 0) {
            container.innerHTML = '<div class="flex flex-wrap gap-3"></div>';
            const flexContainer = container.querySelector('div');
            
            transitions.forEach(transition => {
                const button = document.createElement('button');
                button.onclick = () => transitionIssue(transition.id, button);
                button.className = 'transition-btn px-4 py-2 border border-primary text-primary bg-primary/5 rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-custom flex items-center';
                button.innerHTML = `<i class="fa fa-exchange mr-2"></i> ${transition.name}`;
                flexContainer.appendChild(button);
            });
        } else {
            container.innerHTML = '<p class="text-gray-500 italic">No available transitions</p>';
        }
    }

    setInterval(() => {
        document.getElementById('refresh-status').click();
    }, 30000);
});
