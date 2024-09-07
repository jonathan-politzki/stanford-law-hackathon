(function () {
    "use strict";

    let analyzeButton;
    let loadingElement;
    let resultsContainer;
    let errorContainer;
    let summaryElement;
    let suggestionsElement;

    // The initialize function must be run each time a new page is loaded.
    Office.onReady(function (info) {
        if (info.host === Office.HostType.Word) {
            analyzeButton = document.getElementById("analyze-button");
            loadingElement = document.getElementById("loading");
            resultsContainer = document.getElementById("results-container");
            errorContainer = document.getElementById("error-container");
            summaryElement = document.getElementById("summary");
            suggestionsElement = document.getElementById("suggestions");

            // Add a click event handler for the analyze button.
            analyzeButton.addEventListener("click", analyzeDocument);
        }
    });

    async function analyzeDocument() {
        try {
            showLoading(true);
            // Get the current document content
            const documentContent = await getDocumentContent();

            // Send the content to your Flask backend for analysis
            const response = await fetch('https://{{REPL_SLUG}}.{{REPL_OWNER}}.repl.co/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: documentContent }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Display the results
            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            showError();
        } finally {
            showLoading(false);
        }
    }

    function getDocumentContent() {
        return new Promise((resolve, reject) => {
            Word.run(function (context) {
                const body = context.document.body;
                context.load(body, 'text');
                return context.sync().then(function () {
                    resolve(body.text);
                });
            }).catch(reject);
        });
    }

    function displayResults(data) {
        summaryElement.innerHTML = data.summary;
        
        suggestionsElement.innerHTML = '';
        data.suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsElement.appendChild(li);
        });

        resultsContainer.style.display = "block";
        errorContainer.style.display = "none";
    }

    function showLoading(isLoading) {
        loadingElement.style.display = isLoading ? "block" : "none";
        analyzeButton.disabled = isLoading;
    }

    function showError() {
        errorContainer.style.display = "block";
        resultsContainer.style.display = "none";
    }
})();
