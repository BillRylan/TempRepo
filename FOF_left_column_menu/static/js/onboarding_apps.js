document.addEventListener('DOMContentLoaded', function() {
    // 为每个issue添加点击展开/折叠时间线的功能
    document.querySelectorAll('.issue-row').forEach(row => {
        row.addEventListener('click', function() {
            const timelineId = this.getAttribute('data-timeline');
            const timeline = document.getElementById(timelineId);
            
            if (timeline.classList.contains('hidden')) {
                timeline.classList.remove('hidden');
                this.querySelector('.toggle-icon').classList.remove('fa-chevron-down');
                this.querySelector('.toggle-icon').classList.add('fa-chevron-up');
            } else {
                timeline.classList.add('hidden');
                this.querySelector('.toggle-icon').classList.remove('fa-chevron-up');
                this.querySelector('.toggle-icon').classList.add('fa-chevron-down');
            }
        });
    });

    // 刷新按钮功能
    document.getElementById('refresh-issues').addEventListener('click', function() {
        const button = this;
        const originalText = button.innerHTML;
        
        button.disabled = true;
        button.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> Refreshing...';
        
        fetch('/onboarding-apps')
            .then(response => {
                if (!response.ok) throw new Error('Failed to refresh');
                window.location.reload();
            })
            .catch(error => {
                alert('Error refreshing issues: ' + error.message);
                button.innerHTML = originalText;
                button.disabled = false;
            });
    });
});
