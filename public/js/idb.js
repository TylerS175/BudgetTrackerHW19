let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if(navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    // Log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget');

    // Add record to your store with add method.
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // Open a transaction on your pending db 
    const transaction = db.transaction(['new_budget'], 'readwrite');

    //Access your pending object store 
    const budgetObjectStore = transaction.objectStore('new_budget');

    //Getting all of the records from the store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // Any data in indexedDB's Store, sending it to the api server
        if (getAll.result.length > 0) {
            fetch('/', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_budget'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_budget');
                //Clear all items in your store 
                budgetObjectStore.clear();
            })
            .catch(err => {
                //Set reference to redirect back here 
                console.log(err);
            });
        }
    };
}

//Setting up a listen app coming back online 
window.addEventListener('online', uploadBudget);