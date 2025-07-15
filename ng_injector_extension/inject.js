// Detect which page we're on
const isWrapperPage = window.location.href.startsWith('http://localhost:8085/viewer/');
const isDashboardPage = window.location.href.startsWith('http://localhost:8085/dashboard/');
const isNeuroglancerPage = window.location.origin === 'http://localhost:8050';

// Only inject on the viewer wrapper page, not dashboard
if (isWrapperPage && window.self === window.top) {
    // We're on the wrapper page (main frame)
    console.log('Neuroglancer Extension: Wrapper page detected');
    initWrapperPage();
} else if (isDashboardPage) {
    // We're on dashboard - do nothing
    console.log('Neuroglancer Extension: Dashboard page detected - no injection');
} else if (isNeuroglancerPage) {
    // We're inside the neuroglancer iframe
    console.log('Neuroglancer Extension: Neuroglancer iframe detected');
    initNeuroglancerPage();
}

function initWrapperPage() {
    // Create floating button on wrapper page
    const button = document.createElement('button');
    button.id = 'neuroglancer-import-btn';
    button.textContent = '📁';
    button.style.cssText = `
        position: fixed;
        top: 40px;
        right: 150px;
        z-index: 10000;
        padding: 0px 3px;
        background:rgb(25, 25, 25);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    button.title = 'Import Viewer State'
    button.onmouseover = () => button.style.background = 'rgba(255, 0, 0, 0.75)';
    button.onmouseout = () => button.style.background = 'rgb(25, 25, 25)';
    
    button.onclick = function() {
        console.log('Import button clicked on wrapper');
        handleFileImport();
    };
    
    document.body.appendChild(button);
    
    window.addEventListener('message', function(event) {
        if (event.origin !== 'http://localhost:8050') return;
        
        if (event.data.type === 'NEUROGLANCER_IMPORT_RESPONSE') {
            console.log('Received response from neuroglancer:', event.data);
        }
    });
}

function initNeuroglancerPage() {
    // Wait for neuroglancer to fully load
    setTimeout(() => {
        injectIntoNeuroglancer();
    }, 3000);
    
    // Listen for import commands from wrapper
    window.addEventListener('message', function(event) {
        if (event.origin !== 'http://localhost:8085') return;
        
        if (event.data.type === 'NEUROGLANCER_IMPORT' && event.data.action === 'trigger_import') {
            console.log('Received import command from wrapper');
            handleFileImport();
        }
    });
}

function handleFileImport() {
    // Create file input that only accepts JSON files
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
                showNotification('Please select a JSON file only', 'error');
                return;
            }
            uploadFileToServer(file);
        }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

function injectIntoNeuroglancer() {
    // Try to find a good spot in neuroglancer UI
    const possibleContainers = [
        '.neuroglancer-viewer',
        '.ng-viewer', 
        '.neuroglancer-ui-panel',
        'body'
    ];
    
    let container = null;
    for (const selector of possibleContainers) {
        container = document.querySelector(selector);
        if (container) break;
    }
    
    if (container) {
        // Create button inside neuroglancer
        const button = document.createElement('button');
        button.id = 'ng-internal-import-btn';
        button.textContent = 'Import';
        button.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 1000;
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        button.onclick = handleFileImport;
        container.appendChild(button);
        
        console.log('Button injected into neuroglancer interface');
    }
}

function handleFileImport() {
    // Create file input that only accepts JSON files
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
                showNotification('Please select a JSON file only', 'error');
                return;
            }
            uploadFileToServer(file);
        }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}


async function uploadFileToServer(file) {
    try {
        // Create FormData to send file
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Uploading file to server...');
        
        // Send POST request to your server
        const response = await fetch('http://localhost:8085/import_viewer', {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header - let browser set it with boundary for FormData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Upload successful:', result);
        
        // If the server returns a new URL, you could redirect or reload
        // if (result.url) {
        //     console.log('New viewer URL:', result.url);
            
        //     // Option 1: Refresh the current page to load new state
        //     setTimeout(() => {
        //         window.location.reload();
        //     }, 2000);
            
        //     // Option 2: Or navigate to the new URL
        //     // setTimeout(() => {
        //     //     window.location.href = result.url;
        //     // }, 2000);
        // }
        
    } catch (error) {
        console.error('Upload failed:', error);
        showNotification(`❌ Upload failed: ${error.message}`, 'error');
    }
}
  