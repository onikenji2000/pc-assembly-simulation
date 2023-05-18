var canv = document.getElementById("MainCanvas");
var screen = null;
var objArr = [];
var listener = new MouseListener(canv, objArr);
var ticker = null;
var parser = new DOMParser();
var docer = '';
var timerdoc = document.getElementById('rahat');
var xhttp = new XMLHttpRequest();
canv.width = (window.innerWidth - 120);
canv.height = (window.innerHeight - 10);

// document.getElementById('xml_text').value = "<components>\n<parts>\n<type></type>\n<src></src>\n<width></width>\n<height></height>\n</parts>\n</components>";
// document.getElementById('magnify').onclick = function(event) {
	// let lit = document.getElementsByClassName('texter')[0];
	// switch(lit.style.display) {
		// case 'none':
		// case '':
		// lit.style.display = 'block';
		// break;
		// case 'block':
		// lit.style.display = 'none';
	// }
// }

document.getElementById("btnSubmit").onclick = function(event) {
	window.close();
}

document.getElementById("parseMe").onclick = function(event) {
	let docStr = document.getElementById('xml_text').value;
	let xmlDoc = parser.parseFromString(docStr, 'text/xml');
	
	if(ticker) clearInterval(ticker);
	screen = null;
	objArr = [];
	
	docer = xmlDoc.getElementsByTagName('components')[0];
	removeWhitespace(docer);
	addFromXML(docer, objArr);
	checkWires(objArr);
	screen = new Screen(objArr, canv);
	listener.objects = objArr;
	ticker = setInterval(function() { tick(); }, 1000 / 60)
}

xhttp.onreadystatechange = function() {
	if(this.readyState == 4 && this.status == 200) {
		let docStr = this.responseText;
		let xmlDoc = parser.parseFromString(docStr, 'text/xml');
		
		if(ticker) clearInterval(ticker);
		objArr = [];
		
		docer = xmlDoc.getElementsByTagName('components')[0];
		removeWhitespace(docer);
		addFromXML(docer, objArr);
		checkWires(objArr);
		screen = new Screen(objArr, canv);
		listener.objects = objArr;
		ticker = setInterval(function() { tick(); }, 1000 / 60)
	}
}

window.onresize = function(event) {
	canv.width = (window.innerWidth - 120);
	canv.height = (window.innerHeight - 15);
}

function removeWhitespace(xml) {
	var loopIndex;
	for (loopIndex = 0; loopIndex < xml.childNodes.length; loopIndex++) {
		var currentNode = xml.childNodes[loopIndex];
		if (currentNode.nodeType == 1) {
				removeWhitespace(currentNode);
		}
		if (!(/\S/.test(currentNode.nodeValue)) && (currentNode.nodeType == 3)) {
			xml.removeChild(xml.childNodes[loopIndex--]);
		}
	}
}

function tick() {
	screen.repaint();
	let timer = localStorage.getItem('timer');
	let mins = parseInt(timer / 60);
	let secs = timer % 60;
	if(secs < 10) secs = '0' + secs;
	timerdoc.innerHTML = 'Timer: ' + mins + ':' + secs;
}

xhttp.open("GET", "images/data.xml", true);
xhttp.send();
localStorage.setItem('simDataAnswer', '');