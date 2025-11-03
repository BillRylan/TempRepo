document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentStateEl = document.getElementById('current-state');
    const stateDescriptionEl = document.getElementById('state-description');
    const transitionButtonsEl = document.getElementById('transition-buttons');
    const historyListEl = document.getElementById('history-list');
    const flowNodes = document.querySelectorAll('.flow-node');

    // Get current state and update UI
    function updateStateUI() {
        fetch('/api/state')
            .then(response => response.json())
            .then(data => {
                // Update state display
                currentStateEl.textContent = data.state;
                currentStateEl.className = `state-badge ${data.state}`;
                stateDescriptionEl.textContent = data.description;

                // Update flow diagram active state
                flowNodes.forEach(node => {
                    if (node.dataset.state === data.state) {
                        node.classList.add('active');
                    } else {
                        node.classList.remove('active');
                    }
                });

                // Update available action buttons
                renderTransitionButtons(data.available_transitions);
            })
            .catch(error => console.error('Failed to fetch state:', error));
    }

    // Render transition buttons
    function renderTransitionButtons(transitions) {
        transitionButtonsEl.innerHTML = '';
        
        if (transitions.length === 0) {
            transitionButtonsEl.innerHTML = '<p>No available actions for current state</p>';
            return;
        }

        transitions.forEach(transition => {
            const button = document.createElement('button');
            button.className = 'transition-btn';
            button.innerHTML = `<i class="fa fa-arrow-right"></i> ${transition.label}`;
            button.addEventListener('click', () => triggerTransition(transition.trigger, transition.label));
            transitionButtonsEl.appendChild(button);
        });
    }

    // Trigger state transition
    function triggerTransition(trigger, label) {
        const previousState = currentStateEl.textContent;
        
        fetch('/api/transition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ trigger: trigger })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Update history
                addToHistory(`Transitioned from ${previousState} to ${data.new_state} (Action: ${label})`);
                // Update UI
                updateStateUI();
            } else {
                alert(`Operation failed: ${data.message}`);
            }
        })
        .catch(error => console.error('Transition failed:', error));
    }

    // Add to history
    function addToHistory(message) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span style="color: var(--secondary); font-size: 0.8rem;">${timeString}</span> ${message}`;
        historyListEl.prepend(listItem);
    }

    // Initialize
    updateStateUI();
});
