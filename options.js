// Save the API Key when the save button is clicked
document.getElementById('save').addEventListener('click', () => {
	var apiKey = document.getElementById('apiKey').value;
	chrome.storage.sync.set({
		'apiKey': apiKey
	}, function () {
		var status = document.getElementById('status');
		if (chrome.runtime.lastError) {
			// Show error message
			status.textContent = 'Error saving API Key.';
			status.style.color = 'red';
		} else {
			// Update the UI with a success message
			status.textContent = 'API Key saved successfully.';
			status.style.color = 'green';
		}


		// Optionally, clear the message after a few seconds
		setTimeout(function () {
			status.textContent = '';
		}, 3000); // Clear after 3 seconds
	});
});

document.addEventListener('DOMContentLoaded', function () {
	var clearHistoryButton = document.getElementById('clearHistory');
	clearHistoryButton.addEventListener('click', function () {
		// Clear the message history from storage
		if (confirm('Are you sure you want to clear the message history?')) {
			// Clear the history

			chrome.storage.sync.remove(['messageHistory', 'lastUserQuery'], function () {
				alert('Message history cleared successfully.');
				// Optionally, handle any UI changes needed after clearing the history
			});
		}
	});
});

document.addEventListener('DOMContentLoaded', function () {
	// Load and display current API Key
	chrome.storage.sync.get('apiKey', function (data) {
		if (data.apiKey) {
			document.getElementById('apiKey').value = data.apiKey;
		}
	});

	// Load and display any previously saved background information
	chrome.storage.sync.get('backgroundInfo', function (data) {
		if (data.backgroundInfo) {
			document.getElementById('backgroundInfo').value = data.backgroundInfo;
		}
	});

	// Save the background information
	document.getElementById('save').addEventListener('click', function () {
		var backgroundInfo = document.getElementById('backgroundInfo').value;
		chrome.storage.sync.set({
			'backgroundInfo': backgroundInfo
		}, function () {
			alert('Background information saved successfully.');
		});
	});
});