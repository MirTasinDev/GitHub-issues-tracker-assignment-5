
const defaultUsername = "admin";
const defaultPassword = "admin123";

// login
function loginUser(event) {

    event.preventDefault();

    const usernameInput = document.querySelector("input[type='text']").value;
    const passwordInput = document.querySelector("input[type='password']").value;

    if (usernameInput === defaultUsername && passwordInput === defaultPassword) {

        alert("Login Successful");

        window.location.href = "dashboard.html";

    } else {

        alert("Invalid Username or Password");

    }

}
// dashboard

var API_BASE = "https://phi-lab-server.vercel.app/api/v1/lab";

var allIssues = [];
var currentFilter = "all";

window.onload = function(){
loadAllIssues();
}

function loadAllIssues(){

showLoader(true);

fetch(API_BASE + "/issues")
.then(function(res){
return res.json();
})
.then(function(data){

if(data.data){
allIssues = data.data;
}else{
allIssues = data;
}

renderIssues(allIssues);

})
.catch(function(err){

console.log(err);

document.getElementById("noResults").innerText = "Failed to load issues";
document.getElementById("noResults").classList.remove("hidden");

})
.finally(function(){
showLoader(false);
})

}

function filterIssues(type){

currentFilter = type;

updateTabStyles(type);

var filtered = [];

if(type == "all"){

filtered = allIssues;

}else{

for(var i=0;i<allIssues.length;i++){

var issue = allIssues[i];

if(issue.status){

if(issue.status.toLowerCase() == type){
filtered.push(issue);
}

}

}

}

renderIssues(filtered);

}

function updateTabStyles(active){

var tabs = ["all","open","closed"];

for(var i=0;i<tabs.length;i++){

var key = tabs[i];
var btn = document.getElementById(key + "Btn");

if(key == active){

btn.classList.add("tab-active");
btn.classList.remove("border-gray-200","text-gray-600");

}else{

btn.classList.remove("tab-active");
btn.classList.add("border-gray-200","text-gray-600");

}

}

}

function searchIssues(){

var q = document.getElementById("searchInput").value.trim();

if(q == ""){
filterIssues(currentFilter);
return;
}

showLoader(true);

fetch(API_BASE + "/issues/search?q=" + encodeURIComponent(q))
.then(function(res){
return res.json();
})
.then(function(data){

var list;

if(data.data){
list = data.data;
}else{
list = data;
}

renderIssues(list);

})
.catch(function(err){
console.log(err);
})
.finally(function(){
showLoader(false);
})

}

function handleSearchKey(e){

if(e.key == "Enter"){
searchIssues();
}

}

function renderIssues(issues){

var container = document.getElementById("issueContainer");
var noResults = document.getElementById("noResults");

container.innerHTML = "";

document.getElementById("issueCount").innerText = issues.length + " Issues";

if(issues.length == 0){

noResults.classList.remove("hidden");
return;

}else{

noResults.classList.add("hidden");

}

for(var i=0;i<issues.length;i++){

var card = createCard(issues[i]);

container.appendChild(card);

}

}

function createCard(issue){

var div = document.createElement("div");

var isOpen = false;

if(issue.status){
if(issue.status.toLowerCase() == "open"){
isOpen = true;
}
}

var title = issue.title ? issue.title : "Untitled Issue";
var desc = issue.description ? issue.description : issue.body;

if(!desc){
desc = "No description available.";
}

var author = issue.author;

if(!author){
if(issue.user && issue.user.login){
author = issue.user.login;
}else{
author = "unknown";
}
}

var priority = issue.priority ? issue.priority.toUpperCase() : "N/A";

var date = formatDate(issue.created_at || issue.createdAt);

div.className = "issue-card bg-white rounded-xl shadow-sm p-5 cursor-pointer";

div.onclick = function(){
openModal(issue.id);
}

div.innerHTML = `
<div class="flex justify-between items-center mb-3">

<span class="${isOpen ? 'text-green-500' : 'text-purple-500'}">
${isOpen
? `<img src="./assets/Open-Status.png" class="w-5 h-5">`
: `<img src="./assets/Closed-Status.png" class="w-5 h-5">`
}
</span>

<span class="${getPriorityClass(issue.priority)} text-xs font-semibold px-3 py-1 rounded-full">
${priority}
</span>

</div>

<h3 class="font-semibold text-gray-800 text-sm mb-2">${title}</h3>

<p class="text-gray-500 text-xs mb-4">${desc}</p>

<div class="flex flex-wrap gap-1.5 mb-4">

<span class="bg-red-100 text-red-500 border border-red-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
<img src="./assets/BugDroid.png" class="w-3 h-3"> BUG
</span>

<span class="bg-orange-100 text-orange-500 border border-orange-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
<img src="./assets/Lifebuoy.png" class="w-3 h-3"> HELP WANTED
</span>

</div>

<hr class="border-gray-100 mb-3">

<div class="text-xs text-gray-400">

<span>#${issue.id} by <span class="text-gray-600">${author}</span></span>

<br>

<span>${date}</span>

</div>
`;

return div;

}

function openModal(id){

var modal = document.getElementById("modal");

modal.classList.remove("hidden");
modal.classList.add("flex");

document.getElementById("modalContent").innerHTML = "Loading...";

fetch(API_BASE + "/issue/" + id)
.then(function(res){
return res.json();
})
.then(function(data){

var issue;

if(data.data){
issue = data.data;
}else{
issue = data;
}

renderModal(issue);

})
.catch(function(){
document.getElementById("modalContent").innerHTML = "Failed to load issue";
})

}

function renderModal(issue){

var isOpen = false;

if(issue.status){
if(issue.status.toLowerCase() == "open"){
isOpen = true;
}
}

var title = issue.title ? issue.title : "Untitled";
var desc = issue.description ? issue.description : issue.body;

if(!desc){
desc = "No description available.";
}

var author = issue.author;

if(!author){
if(issue.user && issue.user.login){
author = issue.user.login;
}else{
author = "Unknown";
}
}

var date = formatDate(issue.created_at || issue.createdAt);

var priority = issue.priority ? issue.priority.toUpperCase() : "N/A";

var priorityClass = getPriorityModalClass(issue.priority);

document.getElementById("modalContent").innerHTML = `
<h2 class="font-bold text-lg mb-3">${title}</h2>

<div class="text-xs text-gray-500 mb-4">

<span class="${isOpen ? 'bg-green-500' : 'bg-purple-500'} text-white px-2 py-1 rounded">
${isOpen ? "Opened" : "Closed"}
</span>

<span> • Opened by <b>${author}</b></span>

<span> • ${date}</span>

</div>

<p class="text-sm text-gray-600 mb-4">${desc}</p>

<div class="mb-4">

<span class="${priorityClass} text-xs font-semibold px-3 py-1 rounded-full">
${priority}
</span>

</div>

<button onclick="closeModal()" class="bg-purple-600 text-white px-6 py-2 rounded-lg">
Close
</button>
`;

}

function closeModal(){

var modal = document.getElementById("modal");

modal.classList.add("hidden");
modal.classList.remove("flex");

}

function showLoader(show){

var loader = document.getElementById("loader");

if(show){
loader.classList.remove("hidden");
}else{
loader.classList.add("hidden");
}

}

function getPriorityModalClass(p){

if(!p) return "bg-gray-200 text-gray-600";

var v = p.toLowerCase();

if(v == "high") return "bg-red-500 text-white";
if(v == "medium") return "bg-yellow-400 text-white";
if(v == "low") return "bg-green-500 text-white";

return "bg-gray-200 text-gray-600";

}

function getPriorityClass(p){

if(!p) return "bg-gray-100 text-gray-500";

var v = p.toLowerCase();

if(v == "high") return "priority-high";
if(v == "medium") return "priority-medium";
if(v == "low") return "priority-low";

return "bg-gray-100 text-gray-500";

}

function formatDate(d){

if(!d) return "N/A";

var dt = new Date(d);

if(isNaN(dt)){
return d;
}

return dt.toLocaleDateString("en-US");

}