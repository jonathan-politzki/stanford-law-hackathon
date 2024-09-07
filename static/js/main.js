document.addEventListener('DOMContentLoaded', () => {
    const originalFileInput = document.getElementById('originalFileInput');
    const revisedFileInput = document.getElementById('revisedFileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const comparison = document.getElementById('comparison');
    const originalText = document.getElementById('originalText');
    const revisedText = document.getElementById('revisedText');
    const diffView = document.getElementById('diffView');
    const summary = document.getElementById('summary');
    const changeManagement = document.getElementById('changeManagement');

    uploadBtn.addEventListener('click', async () => {
        const originalFile = originalFileInput.files[0];
        const revisedFile = revisedFileInput.files[0];
        if (!originalFile || !revisedFile) {
            alert('Please select both original and revised files.');
            return;
        }

        const formData = new FormData();
        formData.append('originalFile', originalFile);
        formData.append('revisedFile', revisedFile);

        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#8987;</span> Analyzing...';

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            displayComparison(data);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during upload and analysis.');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = 'Upload and Analyze';
        }
    });

    function displayComparison(data) {
        comparison.classList.remove('hidden');
        comparison.classList.add('animate-fade-in');
        
        // Display original and revised texts
        originalText.innerHTML = data.original.map(p => `<p>${p}</p>`).join('');
        revisedText.innerHTML = data.revised.map(p => `<p>${p}</p>`).join('');
        
        // Display diff view with reduced whitespace
        diffView.innerHTML = data.differences.map(diff => {
            return `<span class="${getDiffClass(diff.type)} p-1 rounded transition-all duration-300" style="margin-left: ${diff.indent || 0}px;">${diff.text}</span>`;
        }).join('');

        // Display summary
        summary.innerHTML = `<p class="text-gray-700">${data.summary}</p>`;

        // Display change management options with improved grouping
        changeManagement.innerHTML = data.linked_edits.map((group, groupIndex) => {
            return `
                <div class="change-group mb-4 border border-gray-300 rounded-lg p-3 transition-all duration-300 hover:shadow-md">
                    <h4 class="font-semibold mb-2 cursor-pointer flex items-center" onclick="toggleChangeGroup(${groupIndex})">
                        <span class="toggle-icon mr-2">▼</span>
                        Change Group ${groupIndex + 1}
                    </h4>
                    <div id="changeGroup${groupIndex}" class="change-content">
                        ${group.map(edit => `
                            <div class="change-item ${getDiffClass(edit.type)} p-2 rounded-md mb-1 transition-all duration-300">
                                <p class="text-sm">${edit.text}</p>
                            </div>
                        `).join('')}
                        <div class="change-actions mt-2 flex space-x-2">
                            <button onclick="acceptChangeGroup(${groupIndex})" class="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600 transition-colors duration-300">Accept</button>
                            <button onclick="rejectChangeGroup(${groupIndex})" class="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600 transition-colors duration-300">Reject</button>
                            <button onclick="proposeCounterChangeGroup(${groupIndex})" class="bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors duration-300">Propose Counter</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add toggle functionality
        comparison.querySelectorAll('.change-group').forEach(group => {
            group.querySelector('.change-content').style.display = 'none';
        });

        // Smooth scroll to comparison section
        comparison.scrollIntoView({ behavior: 'smooth' });
    }

    function getDiffClass(type) {
        switch (type) {
            case 'added':
                return 'bg-green-100 text-green-800';
            case 'removed':
                return 'bg-red-100 text-red-800 line-through';
            default:
                return 'text-gray-700';
        }
    }

    window.toggleChangeGroup = (groupIndex) => {
        const content = document.getElementById(`changeGroup${groupIndex}`);
        const icon = content.parentElement.querySelector('.toggle-icon');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '▼';
        } else {
            content.style.display = 'none';
            icon.textContent = '▶';
        }
    };

    window.acceptChangeGroup = (groupIndex) => {
        console.log('Accept change group:', groupIndex);
        // Implement logic to accept change group
    };

    window.rejectChangeGroup = (groupIndex) => {
        console.log('Reject change group:', groupIndex);
        // Implement logic to reject change group
    };

    window.proposeCounterChangeGroup = async (groupIndex) => {
        const changeGroup = document.querySelectorAll('.change-group')[groupIndex];
        const originalText = Array.from(changeGroup.querySelectorAll('.change-item p'))
            .map(p => p.textContent)
            .join('\n');
        
        const counterProposal = prompt('Enter your counter-proposal for the entire group:', originalText);
        if (counterProposal) {
            try {
                const response = await fetch('/suggest', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        context: originalText,
                        proposed_change: counterProposal
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to get suggestion');
                }

                const data = await response.json();
                alert(`AI Suggestion: ${data.suggestion}`);
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while getting a suggestion.');
            }
        }
    };
});

// Add this CSS for fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .animate-fade-in {
        animation: fadeIn 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);
