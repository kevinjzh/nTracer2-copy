// Logo reset home page
function resetView() {
    // Hide the dataset iframe
    var iframe = document.getElementById('datasetFrame');
    iframe.style.display = 'none';
    
    // Optionally, make the hero section visible again if it was hidden
    var heroSection = document.getElementById('heroSection');
    heroSection.style.display = 'flex'; // Or whatever the original display type was
    
    // Reset the iframe source to about:blank to ensure no content is displayed
    iframe.src = 'about:blank';
    
    // Add any other resets here as needed
}

// Load data
function loadDataset(url) {
    // Get the iframe and the hero section
    var iframe = document.getElementById('datasetFrame');
    //var heroSection = document.getElementById('heroSection');
    
    // Change the iframe src and make it visible
    iframe.src = url;
    iframe.style.display = 'block';
}

// Toggle nTracer2 window
let newWindow = null; // This will hold the reference to your new window

// "About" content
/*document.getElementById('aboutButton').addEventListener('click', function() {
    var iframe = document.getElementById('datasetFrame');
    iframe.src = './about.html'; // Adjust the path to your "About" page
    iframe.style.display = 'block'; // Ensure the iframe is visible
    heroSection.style.backgroundImage = 'none';
});*/

// onload
window.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded")
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    var viewer = urlParams.get('viewer');
    var dashboardUrl = urlParams.get('dashboard');

    if (viewer == null || dashboardUrl == null) {
        console.log("No viewer or dashboard URL provided")
        return;
    }

    document.getElementById('dashboardButton').href = dashboardUrl;
    loadDataset(urlParams.get('viewer'));
});
