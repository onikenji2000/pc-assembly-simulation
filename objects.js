class ComputerPart {
	constructor (X, Y, width, height, img, mountPoints, type = null) {
		this.X = X;
		this.Y = Y;
		this.width = width;
		this.height = height;
		this.image = img;
		this.sloted_image = null;
		this.hovered = false;
		this.mountPoints = mountPoints;
		this.mounts = [];
		this.usedmounts = [];
		this.parent = null;
		this.fixed_mount = false;
		this.type = type;
		this.z = 0;
		this.rotations = [];
		this.id = 'blank';
	}
}

class MountPoint {
	constructor(x, y, width, height) {
		this.type = 'mountpoint';
		this.lineTo = null;
		this.x = x;
		this.y = y;
		this.z = 0;
		this.width = width;
		this.height = height;
		this.isConnecting = false;
		this.connectedTo = null;
		this.parent = null;
		this.color = 'RED';
		this.id = 'blank';
	}
}

//This function checks the mountpoints if they are connecting with each other
function checkMount(listen) {
	let top = objArr[objArr.length - (1 + listen.wireNodes.length)];
	let bottom = null;
	for(var i =  0; i < objArr.length - 1; i++) {
		let bot = objArr[i];
		let botX = bot.X + bot.width;
		let topX = top.X + top.width;
		let botY = bot.Y + bot.height;
		let topY = top.Y + top.height;
		
		let horizontal = false;
		let vertical = false;
		if(top.width > bot.width) horizontal = ((bot.X > top.X && bot.X < topX) || (botX > top.X  && botX < topX));
		else horizontal = ((top.X > bot.X && top.X < botX) || (topX > bot.X  && topX < botX));
		if(top.height > bot.height) vertical = (bot.Y > top.Y && bot.Y < topY) || (botY > top.Y  && botY < topY);
		else vertical = (top.Y > bot.Y && top.Y < botY) || (topY > bot.Y  && topY < botY);
		if(horizontal && vertical) {
			bottom = bot;
		}
	}
	if(bottom) {
		let tx = top.X;
		let ty = top.Y;
		let bx = bottom.X;
		let by = bottom.Y;
		for(var ti = 0; ti < top.mountPoints.length; ti++) {
			let tmx = tx + top.mountPoints[ti].x;
			let tmw = tx + top.mountPoints[ti].x + top.mountPoints[ti].width;
			let tmy = ty + top.mountPoints[ti].y;
			let tmh = ty + top.mountPoints[ti].y + top.mountPoints[ti].height;
			let isCable = top.mountPoints[ti].type == 'cable';
			if(isCable) continue;
			else {
				for(var bi = 0; bi < bottom.mountPoints.length; bi++) {
					let botOff = parentTraversal(bottom.mountPoints[bi].parent, bottom);
					let bmx = bx + bottom.mountPoints[bi].x;
					let bmw = bx + bottom.mountPoints[bi].x + bottom.mountPoints[bi].width;
					let bmy = by + bottom.mountPoints[bi].y;
					let bmh = by + bottom.mountPoints[bi].y + bottom.mountPoints[bi].height;
					
					bmx += botOff.x;
					bmw += botOff.x;
					bmy += botOff.y;
					bmh += botOff.y;
					
					let horizontal = (tmx > bmx && tmx < bmw) || (tmw > bmx && tmw < bmw);
					let vertical = (tmy > bmy && tmy < bmh) || (tmh > bmy && tmh < bmh);
					if(horizontal && vertical) {
						top.mountPoints[ti].isConnecting = true;
						top.mountPoints[ti].connectedTo = [bottom.mountPoints[bi].parent, bottom.mountPoints[bi]];
						break;
					}
					else {
						top.mountPoints[ti].isConnecting = false;
						top.mountPoints[ti].connectedTo = null;
					}
				}
			}
		}
	}
}

function parentTraversal(mtParent, currParent) {
	let pot = new MountPoint(0, 0, null, null);
	if(mtParent != currParent) {
		pot.x = mtParent.X;
		pot.y = mtParent.Y;
		if(mtParent.parent) {
			let zed = parentTraversal(mtParent.parent, currParent);
			pot.x += zed.x;
			pot.y += zed.y;
		}
	}
	return pot;
}

//Pulls the dragged component to the clipping mount point of another component
function magnet(grabObj) {
	let x = grabObj.X;
	let y = grabObj.Y;
	let hasofst = false;
	let mpts = grabObj.mountPoints;
	let strMounts = grabObj.id;
	let simData = localStorage.getItem('simDataAnswer');
	let zPar = null;
	let mtd = false;
	for(let i = 0; i < mpts.length; i++) {
		let parent = null;
		let mounting = null;
		if(mpts[i].isConnecting && mpts[i].type == 'mountpoint') {
			let temp;
			parent = mpts[i].connectedTo[0];
			mounting = mpts[i].connectedTo[1];
			if(!hasofst) {
				let pmt = parent.mounts;
				let index = pmt.length;
				x = mounting.x - mpts[i].x;
				y = mounting.y - mpts[i].y;
				grabObj.X = x;
				grabObj.Y = y;
				for(let z = index - 1; z >= 0; z--) {
					if(pmt[z].z > grabObj.z) index--;
					else break;
				}
				pmt.splice(index, 0, grabObj);
				objArr.pop();
				grabObj.parent = parent;
				grabObj.hovered = false;
				hasofst = true;
			}
			parent.usedmounts.push(mounting);
			temp = parent.mountPoints.indexOf(mounting);
			parent.mountPoints.splice(temp, 1);
			mtd = true;
			zPar = parent.id;
		}
	}
	
	if(hasofst) {
		let mtpts = grabObj.mountPoints;
		for(let i = 0; i < mtpts.length; i++) {
			if(!mtpts[i].isConnecting && mtpts[i].type == 'mountpoint') {
				grabObj.parent.mountPoints.push(mtpts[i]);
			}
		}
	}
	
	strMounts = strMounts + '.' + zPar;
	if(simData.length > 0) simData = simData + ',' + strMounts;
	else simData = strMounts;
	if(mtd) localStorage.setItem('simDataAnswer', simData);
}

//Pop the component that the user right clicked on the table
function removeMount(parent, mouseX, mouseY, offsetX = 0, offsetY = 0) {
	let removable = false;
	let x = parent.X;
	let y = parent.Y;
	let zpar = parent.id;
	let zmount = null;
	for(let i = parent.mounts.length - 1; i >= 0; i--) {
		let curobj = parent.mounts[i];
		let horizontal = mouseX > (x + curobj.X + offsetX) && mouseX < (x + curobj.X + curobj.width + offsetX);
		let vertical = mouseY > (y + curobj.Y + offsetY) && mouseY < (y + curobj.Y + curobj.height + offsetY);
		let isnotfixed = !curobj.fixed_mount;
		let rem = !removeMount(curobj, mouseX, mouseY, offsetX +  x, offsetY +  y);
		if(horizontal && vertical && isnotfixed && rem) {
			parent.mounts.splice(i, 1);
			curobj.X = parent.X + curobj.X + offsetX;
			curobj.Y = parent.Y + curobj.Y + offsetY;
			zmount = curobj.id;
			objArr.push(curobj);
			
			removable = true;
			
			let mtpts = curobj.mountPoints;
			zmount = curobj.id;
			for(let t = mtpts.length - 1; t >= 0; t--) {
				if(mtpts[t].isConnecting && mtpts[t].type == 'mountpoint') {
					let mtofP = mtpts[t].connectedTo[1];
					let mtIndex = parent.usedmounts.indexOf(mtofP);
					
					parent.usedmounts.splice(mtIndex, 1);
					parent.mountPoints.push(mtofP);
					
					zpar = mtpts[t].connectedTo[0].id;
					addPointToParent(mtofP, parent);
					mtpts[t].isConnecting = false;
					mtpts[t].connectedTo = null;
				}
				else if(mtpts[t].type == 'mountpoint'){
					let mIndex = parent.mountPoints.indexOf(mtpts[t]);
					parent.mountPoints.splice(mIndex, 1);
				}
			}
			curobj.parent = null;
			
			if(zmount) {
				let strObj = zmount + '.' + zpar;
				let strAns = localStorage.getItem('simDataAnswer');
				let newStr = '';
				let index = -1;
				
				strAns = strAns.split(',');
				index = strAns.indexOf(strObj);
				if(index >= 0) strAns.splice(index, 1);
				
				for(let i = 0; i < strAns.length; i++) {
					if(i == 0) {
						newStr = strAns[i];
					}
					else {
						newStr = newStr + ',' + strAns[i];
					}
				}
				localStorage.setItem('simDataAnswer', newStr);
			}
			
			break;
		}
	}
	// if(zmount) {
		// let strObj = zmount + '.' + zpar;
		// let strAns = localStorage.getItem('simDataAnswer');
		// let newStr = '';
		// let index = -1;
		
		// strAns = strAns.split(',');
		// index = strAns.indexOf(strObj);
		// if(index >= 0) strAns.splice(index, 1);
		
		// for(let i = 0; i < strAns.length; i++) {
			// if(i == 0) {
				// newStr = strAns[i];
			// }
			// else {
				// newStr = newStr + ',' + strAns;
			// }
		// }
		// localStorage.setItem('simDataAnswer', newStr);
	// }
	
	return removable;
}

function addPointToParent(mtpoints, parent, offsetX = 0, offsetY) {
	if(parent.parent) {
		addPointToParent(mtpoints, parent.parent, parent.X + offsetX, parent.Y + offsetY);
	}
	else {
		let pIndex = parent.mountPoints.indexOf(mtpoints);
		if(pIndex >= 0) return;
		else {
			parent.mountPoints.push(mtpoints);
		}
	}
}

function checkLayers(layers) {
	for(let i = 0; i < layers.length; i++) {
		for(let c = i + 1; c < layers.length; c++) {
			if(layers[i].z > layers[c].z) {
				let temp = layers[i];
				layers[i] = layers[c];
				layers[c] = temp;
			}
		}
	}
}

//Rearrange the objects that are on top of another object
function rearrangeObjects(first) {
	for(let i = 0; i < objArr.length; i++) {
		if(objArr[i] == first) {
			objArr.splice(i, 1);
			objArr.push(first);
		}
	}
}

//Adds components to the canvas
function addFromXML(xml, comps) {
	for(let i = 0; i < xml.childNodes.length; i++) {
		let mounts = [];
		let mtpoints = [];
		let str = xml.childNodes[i].nodeName;
		let id, src, src2, compType, x, y, w, h, z, setxml, color = 'RED', mtbl = false;
		switch(str) {
			case 'part':
			setxml = xml.childNodes[i];
			
			for(let c = 0; c < setxml.childNodes.length; c++) {
				switch(setxml.childNodes[c].nodeName) {
					case 'id':
					id = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
					case 'src':
					src = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
					case 'src2':
					src2 = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
					case 'type':
					compType = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
					case 'x':
					x = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'y':
					y = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'width':
					w = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'height':
					h = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'z':
					z = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'fixed':
					mtbl = true;
					break;
					case 'mounts':
					addFromXML(setxml.childNodes[c], mounts);
					break;
					case 'mountpoints':
					addFromXML(setxml.childNodes[c], mtpoints);
					break;
				}
			}
			
			let scimg = new Image(src);
			scimg.src = src;
			
			let comp = new ComputerPart(x, y, w, h, scimg, mtpoints, compType);
			comp.mounts = mounts;
			comp.id = id;
			if(z) comp.z = z;
			
			if(src2) {
				let s2img = new Image(src2);
				s2img.src = src2;
				comp.sloted_image = s2img;
			}
			
			for(let c = 0; c < mounts.length; c++) mounts[c].parent = comp;
			for(let c = 0; c < mtpoints.length; c++) mtpoints[c].parent = comp;
			
			if(mtbl) comp.fixed_mount = true;
			comps.push(comp);
			break;
			
			case 'points':
			setxml = xml.childNodes[i];
			
			for(let c = 0; c < setxml.childNodes.length; c++) {
				switch(setxml.childNodes[c].nodeName) {
					case 'id':
					id = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
					case 'x':
					x = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'y':
					y = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'width':
					case 'w':
					w = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'height':
					case 'h':
					h = parseInt(setxml.childNodes[c].childNodes[0].nodeValue);
					break;
					case 'type':
					compType = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
					case 'con':
					case 'isConnecting':
					src = true;
					break;
					case 'wireTo':
					src2 = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
					case 'color':
					color = setxml.childNodes[c].childNodes[0].nodeValue;
					break;
				}
			}
			
			let mountpt = new MountPoint(x, y, w, h);
			mountpt.id = id;
			if(compType == 'cable') {
				mountpt.type = compType;
				mountpt.lineTo = src2;
			}
			if(z) mountpt.z = z;
			if(src) mountpt.isConnecting = true;
			mountpt.color = color;
			comps.push(mountpt);
			break;
		}
	}
}

function checkWires(objs) {
	let wireStack = [];
	for(let i = 0; i < objs.length; i++) {
		for(let z = 0; z < objs[i].mountPoints.length; z++) {
			if(objs[i].mountPoints[z].type == 'cable' && typeof(objs[i].mountPoints[z].lineTo) == 'string') {
				let objIndex = objs.findIndex(obj => obj.type === objs[i].mountPoints[z].lineTo);
				let objP = objs[objIndex];
				let objmount = null;
				for(let x = 0; x < objP.mountPoints.length; x++) {
					if(objP.mountPoints[x].type == 'cable' && objP.mountPoints[x].lineTo == objs[i].type && objP.mountPoints[x].color == objs[i].mountPoints[z].color) {
						objP.mountPoints[x].lineTo = objs[i];
						objmount = objP.mountPoints[x];
						objmount.connectedTo = [objs[i], objs[i].mountPoints[z]];
						break;
					}
				}
				objs[i].mountPoints[z].connectedTo = [objP, objmount];
			}
		}
	}
}

function draggingCable(object, listen, offsetX = 0, offsetY = 0) {
	for(let i = 0; i < object.mounts.length; i++) {
		draggingCable(object.mounts[i], listen, offsetX + object.X, offsetY + object.Y);
	}
	for(let t = 0; t < object.mountPoints.length; t++) {
		let cable = object.mountPoints[t];
		if(cable.type == 'cable') {
			let cabObj = cable.connectedTo[0];
			let oIndex = listen.wireNodes.findIndex(obj => obj.Object === cabObj);
			if(oIndex >= 0) {
				continue;
			}
			else if(cabObj.parent == null) {
				listen.wireNodes.push({Object: cabObj, OriginalX: cabObj.X, OriginalY: cabObj.Y});
				rearrangeObjects(cabObj);
			}
		}
	}
}