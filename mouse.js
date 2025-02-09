class MouseListener {
	constructor(canvas, objects) {
		this.canvas = canvas;
		this.objects = objects;
		this.isGrabbing = false;
		this.holdButtons = [];
		this.wireNodes = [];
		
		this.canvas.onmousedown = this.onMouseDown;
		this.canvas.onmousemove = this.onMouseMove;
		this.canvas.onmouseup = this.onMouseUp;
		this.canvas.oncontextmenu = function(event) { return false; };
	}
	onMouseDown(event) {
		listener.holdButtons.push(event.button);
		if(event.button == 2) {
			event.preventDefault();
			
			let ishovered = false;
			let obj = null;
			let rem = false;
			for(var i = 0; i < listener.objects.length; i++) {
				if(listener.objects[i].hovered == true) {
					ishovered = true;
					obj = listener.objects[i];
					break;
				}
			}
			
			if(ishovered) removeMount(obj, event.offsetX, event.offsetY);
		}
		else if(event.button == 0) {
			let ishovered = false;
			let obj = null;
			for(let i = 0; i < listener.objects.length; i++) {
				if(listener.objects[i].hovered == true) {
					ishovered = true;
					obj = listener.objects[i];
					break;
				}
			}
			if(ishovered) {
				listener.XX = obj.X;
				listener.YY = obj.Y;
				listener.MX = event.offsetX;
				listener.MY = event.offsetY;
				listener.grabbedObject = obj;
				listener.isGrabbing = true;
				
				rearrangeObjects(obj);
				
				draggingCable(obj, listener);
			}
		}
	}
	onMouseMove(event) {
		event.preventDefault();
		if(listener.isGrabbing) {
			listener.grabbedObject.X = event.offsetX - listener.MX + listener.XX;
			listener.grabbedObject.Y = event.offsetY - listener.MY + listener.YY;
			
			for(let z = 0; z < listener.wireNodes.length; z++) {
				let wireNode = listener.wireNodes[z];
				let nobj = listener.wireNodes[z].Object;
				nobj.X = event.offsetX - listener.MX + wireNode.OriginalX;
				nobj.Y = event.offsetY - listener.MY + wireNode.OriginalY;
			}
			
			checkMount(listener);
		}
		else {
			let stack = [];
			for(var i = 0; i < listener.objects.length; i++) {
				let obw = listener.objects[i].width;
				let obh = listener.objects[i].height;
				let x = listener.objects[i].X; // - (obw / 2);
				let y = listener.objects[i].Y; // - (obh / 2);
				let xw = x + obw;
				let yh = y + obh;
				let cx = event.offsetX;
				let cy = event.offsetY;
				if((cx > x && cx < xw) && (cy > y && cy < yh)) {
					stack.push(listener.objects[i]);
					listener.objects[i].hovered = false;
				}
				else listener.objects[i].hovered = false;
			}
			if(stack.length > 0) {
				var pip = stack.pop();
				pip.hovered = true;
			}
		}
	}
	onMouseUp(event) {
		
		let but = event.button;
		let butIn = listener.holdButtons.indexOf(but);
		listener.holdButtons.splice(butIn)
		if(but == 0 && listener.isGrabbing) {
			let topObj = arrayObjects[arrayObjects.length - 1];
			listener.isGrabbing = false;
			rearrangeObjects(listener.grabbedObject);
			magnet(listener.grabbedObject);
			rearrangeObjects(topObj);
			listener.wireNodes = [];
		}
	}
}