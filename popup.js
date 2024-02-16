function loadInitialMessageHistory(callback) {
	chrome.storage.sync.get(['backgroundInfo', 'messageHistory'], function (data) {
		let messageHistory = data.messageHistory || [];
		if (data.backgroundInfo && (!messageHistory.length || messageHistory[0].role !== "system")) {
			// Prepend the system message if background information exists and it's not already the first message
			const systemMessage = {
				role: "system",
				content: data.backgroundInfo
			};
			messageHistory.unshift(systemMessage);
		}
		callback(messageHistory);
	});
}

// Function to load the message history from storage
function loadMessageHistory(callback) {
	chrome.storage.sync.get(['messageHistory'], function (result) {
		callback(result.messageHistory || []);
	});
}

// Function to save the message history to storage
function saveMessageHistory(messageHistory) {
	chrome.storage.sync.set({
		'messageHistory': messageHistory
	});
}

// Function to append a new message to the history and save it
function appendToMessageHistory(newMessage) {
	loadMessageHistory(function (messageHistory) {
		messageHistory.push(newMessage);
		saveMessageHistory(messageHistory);
	});
}

function saveLastUserQuery(query) {
	chrome.storage.sync.set({
		'lastUserQuery': query
	});
}

console.log('popup.js')
document.getElementById('generate').addEventListener('click', function () {
	console.log("get key");
	// Fetch the API Key from storage
	chrome.storage.sync.get('apiKey', function (data) {
		const apiKey = data.apiKey;
		if (!apiKey) {
			// If the API Key hasn't been set, inform the user.
			document.getElementById('response').innerText = 'API Key is not set. Please set it in the options page.';
			return;
		}

		// Proceed to use the API Key in your API call
		makeApiCall(apiKey);
	});
});

function makeApiCall(apiKey, query, continuation = false) {
	loadInitialMessageHistory(function (messageHistory) {
		// If not a continuation, add the user's new query to the history
		if (!continuation) {
			appendToMessageHistory({
				role: "user",
				content: query
			});
		}
		console.log("message history:");
		console.log(messageHistory);
		fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: "gpt-4", // Adjust the model as necessary
					messages: messageHistory
				})
			})
			.then(response => response.json())
			.then(data => {
				const responseContent = data.choices[0].message.content;
				document.getElementById('response').innerText += responseContent;
				appendToMessageHistory({
					role: "assistant",
					content: responseContent
				});

				// Handle the "more" button visibility
				if (data.choices[0].finish_reason === 'length') {
					saveLastUserQuery(query);
					document.getElementById('more').style.display = 'block';
				} else {
					document.getElementById('more').style.display = 'none';
				}
			})
			.catch(error => {
				console.error('Error:', error);
				document.getElementById('response').innerText = 'Error fetching the response. Please check your API Key and internet connection.';
			});
	});
}

document.getElementById('more').addEventListener('click', function () {
	chrome.storage.sync.get(['apiKey', 'lastUserQuery'], function (data) {
		const apiKey = data.apiKey;
		const lastUserQuery = data.lastUserQuery;

		if (!apiKey) {
			document.getElementById('response').innerText = 'API Key is not set. Please set it in the options page.';
			return;
		}

		if (!lastUserQuery) {
			console.error('No last user query found for continuation.');
			return;
		}

		// Now make the API call using the last user query for continuation
		makeApiCall(apiKey, lastUserQuery, true);
	});
});



// function makeApiCall(apiKey, query, continuation = false) {
// 	console.log("make api call");
// 	const query = document.getElementById('query').value;

// 	fetch('https://api.openai.com/v1/chat/completions', {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json',
// 				'Authorization': `Bearer ${apiKey}`
// 			},
// 			body: JSON.stringify({
// 				messages: [{
// 						"role": "system",
// 						"content": "I am running a classic DnD campaign. You will assist me in generating NPCs, locations, plot points, and other relevant content for my campaign."
// 					},
// 					{
// 						"role": "user",
// 						"content": query
// 					}
// 				],
// 				model: "gpt-4",
// 				temperature: 0.7,
// 				max_tokens: 500,
// 				top_p: 1.0,
// 				frequency_penalty: 0.0,
// 				presence_penalty: 0.0
// 			})
// 		})
// 		.then(response => response.json())
// 		.then(data => {
// 			const assistantResponse = data.choices[0].message.content;
// 			document.getElementById('response').innerText = assistantResponse;
// 		})
// 		.catch(error => {
// 			console.error('Error:', error);
// 			document.getElementById('response').innerText = 'Error fetching the response. Please check your API Key and internet connection.';
// 		});
// }