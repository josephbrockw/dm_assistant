// function loadInitialMessageHistory(callback) {
// 	chrome.storage.sync.get(['backgroundInfo', 'messageHistory'], function (data) {
// 		let messageHistory = data.messageHistory || [];
// 		if (!messageHistory.length || messageHistory[0].role !== "system") {
// 			// Prepend the system message if background information exists
// 			if (data.backgroundInfo) {
// 				const backgroundInfo = {
// 					role: "system",
// 					content: data.backgroundInfo
// 				};
// 				messageHistory.unshift(backgroundInfo);
// 			}
// 			// Prepend DM Assistant system info
// 			const systemInfo = {
// 				role: "system",
// 				content: "You are an assistant for a Dungeons and Dragons Dungeon Master. Help generate unique and useful content for the DM to build a more immersive world."
// 			}
// 			messageHistory.unshift(systemInfo);
// 		}
// 		callback(messageHistory);
// 	});
// }

// // Function to load the message history from storage
// function loadMessageHistory(callback) {
// 	chrome.storage.sync.get(['messageHistory'], function (result) {
// 		callback(result.messageHistory || []);
// 	});
// }

// // Function to save the message history to storage
// function saveMessageHistory(messageHistory) {
// 	chrome.storage.sync.set({
// 		'messageHistory': messageHistory
// 	});
// }

// // Function to append a new message to the history and save it
// function appendToMessageHistory(newMessage) {
// 	loadInitialMessageHistory(function (messageHistory) {
// 		messageHistory.push(newMessage);
// 		saveMessageHistory(messageHistory);
// 	});
// }

// function saveLastUserQuery(query) {
// 	chrome.storage.sync.set({
// 		'lastUserQuery': query
// 	});
// }

// document.getElementById('generate').addEventListener('click', function () {
// 	console.log("get key");
// 	// Fetch the API Key from storage
// 	chrome.storage.sync.get('apiKey', function (data) {
// 		const apiKey = data.apiKey;
// 		if (!apiKey) {
// 			// If the API Key hasn't been set, inform the user.
// 			document.getElementById('response').innerText = 'API Key is not set. Please set it in the options page.';
// 			return;
// 		}

// 		// Proceed to use the API Key in your API call
// 		makeApiCall(apiKey);
// 	});
// });

// function makeApiCall(apiKey, query, continuation = false) {
// 	loadInitialMessageHistory(function (messageHistory) {
// 		// If not a continuation, add the user's new query to the history
// 		if (!continuation) {
// 			appendToMessageHistory({
// 				role: "user",
// 				content: query
// 			});
// 		}
// 		console.log("message history:");
// 		console.log(messageHistory);
// 		fetch('https://api.openai.com/v1/chat/completions', {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'Authorization': `Bearer ${apiKey}`
// 				},
// 				body: JSON.stringify({
// 					model: "gpt-4", // Adjust the model as necessary
// 					messages: messageHistory
// 				})
// 			})
// 			.then(response => response.json())
// 			.then(data => {
// 				const responseContent = data.choices[0].message.content;
// 				document.getElementById('response').innerText += responseContent;
// 				appendToMessageHistory({
// 					role: "assistant",
// 					content: responseContent
// 				});

// 				// Handle the "more" button visibility
// 				if (data.choices[0].finish_reason === 'length') {
// 					saveLastUserQuery(query);
// 					document.getElementById('more').style.display = 'block';
// 				} else {
// 					document.getElementById('more').style.display = 'none';
// 				}
// 			})
// 			.catch(error => {
// 				console.error('Error:', error);
// 				document.getElementById('response').innerText = 'Error fetching the response. Please check your API Key and internet connection.';
// 			});
// 	});
// }

// document.getElementById('more').addEventListener('click', function () {
// 	chrome.storage.sync.get(['apiKey', 'lastUserQuery'], function (data) {
// 		const apiKey = data.apiKey;
// 		const lastUserQuery = data.lastUserQuery;

// 		if (!apiKey) {
// 			document.getElementById('response').innerText = 'API Key is not set. Please set it in the options page.';
// 			return;
// 		}

// 		if (!lastUserQuery) {
// 			console.error('No last user query found for continuation.');
// 			return;
// 		}

// 		// Now make the API call using the last user query for continuation
// 		makeApiCall(apiKey, lastUserQuery, true);
// 	});
// });

// Add Events on document load
document.addEventListener('DOMContentLoaded', function() {
	// Add event to generate button
	document.getElementById('generate').addEventListener('click', function() {
		const userQuery = document.getElementById('query').value;
		// Update messages and then make API call
		appendMessageAndSave('user', userQuery);
		setTimeout(() => {
			makeApiCall(userQuery);
		}, 500);
		// appendMessageAndSave('user', userQuery).then(() => {
		// 	return makeApiCall(userQuery);
		// }).catch(error => {
		// 	console.log('Error: ', error);
		// });
	});

	// Add event to more button
	document.getElementById('more').addEventListener('click', function() {
		// Assuming the last query is still relevant for continuation
		chrom.storage.sync.get(['lastUserQuery'], function(data) {
			const lastUserQuery = data.lastUserQuery;
			makeApiCall(lastUserQuery, true);
		});
	});
});

// Append a message to the history and save it
function appendMessageAndSave(role, content) {
	displayMessage(role, content);
	chrome.storage.sync.get(['messageHistory', 'game'], function(result) {
		const messageHistory = result.messageHistory || [];
		const newMessage = { role, content };
		const game = result.game || "Dungeons and Dragons 5e";

		if (messageHistory.length === 0) {
			messageHistory.unshift({
					role: "system",
					content: `You are the Dungeon Master assistant using ${game}. Make responses bullet point lists with as few words as possible for easy reading formatted in HTML.`
			});
		}

		if (role === 'user') {
			// Save the last user query for potential continuation
			chrome.storage.sync.set({ 'lastUserQuery': content });
		}

		// Add to message history list and save it
		messageHistory.push(newMessage);
		chrome.storage.sync.set({ 'messageHistory': messageHistory });
	});
}

function displayMessage(role, content) {
	const container = document.getElementById('historyContainer');
	const card = document.createElement('div');
	card.classList.add('card');
	
	// Depending on the role, format the card content
	if (role === 'user') {
			card.innerHTML = `<div class="query">User: ${content}</div>`;
	} else if (role === 'assistant') {
			card.innerHTML = `<div class="response">Assistant: ${content}</div>`;
	}

	container.appendChild(card);

	// Scroll to the bottom of the container to show the latest message
	container.scrollTop = container.scrollHeight;
}

function makeApiCall(query, isContinuation = false) {
	chrome.storage.sync.get(['apiKey', 'messageHistory'], function(data) {
		const apiKey = data.apiKey;
		const messageHistory = data.messageHistory || [];

		fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: messageHistory,
				max_tokens: 250
			})
		})
		.then(response => response.json())
		.then(data => {
			const responseContent = data.choices[0].message.content;
			appendMessageAndSave('assistant', responseContent);


			// Update the "More" button visibility based on finish_reason
			document.getElementById('more').style.display = data.choices[0].finish_reason === 'length' ? 'block' : 'none';
		})
		.catch(error => {
			console.error('Error:', error);
			displayMessage("error", 'Error fetch the response. Please check your API Key and internet connection.');
		});
	});
}

// Initially hide the "More" button
document.getElementById('more').style.display = 'none';