class Screen {
	constructor(objs, canvas) {
		this.objects = objs;
		this.canvas = canvas;
		this.lineStack = [];
	}
	
	repaint() {
		let ctx = this.canvas.getContext("2d");
		
		this.lineStack = [];
		ctx.clearRect(0, 0, canv.width, canv.height);
		
		let stack = [];
		stack.push(this.objects);
		this.traverse(ctx, stack);
		
		ctx.beginPath();
		ctx.moveTo(1, 1);
		ctx.lineTo(1, canv.height - 1);
		ctx.lineTo(canv.width - 1, canv.height - 1);
		ctx.lineTo(canv.width - 1, 1);
		ctx.lineTo(1, 1);
		ctx.stroke();
	}
	
	drawObject(ctx, obj, offX, offY) {
		let x = obj.X + offX;
		let y = obj.Y + offY;
		let width = obj.width;
		let height = obj.height;
		let img = obj.image;
		let hovered = obj.hovered;
		let mtpts = obj.mountPoints;
		
		ctx.translate(x, y);
		if(obj.parent && obj.sloted_image) img = obj.sloted_image;
		ctx.drawImage(img, 0, 0, width, height);
		if(hovered) {
			ctx.fillStyle = "GREEN";
			ctx.beginPath();
			ctx.rect(offX, offY, width, height);
			ctx.stroke();
			
			for(var ii = 0; ii < mtpts.length; ii++) {
				ctx.fillStyle = "RED";
				if(mtpts[ii].isConnecting) ctx.fillRect(mtpts[ii].x, mtpts[ii].y, mtpts[ii].width, mtpts[ii].height);
			}
		}
		ctx.translate(-x, -y);
	}
	
	traverse(ctx, stack, offsetX = 0, offsetY = 0) {
		let arr = stack.pop();
		for(let i = 0; i < arr.length; i++) {
			let mountpts = arr[i].mountPoints;
			this.drawObject(ctx, arr[i], offsetX, offsetY);
			for(let z = 0; z < mountpts.length; z++) {
				if(mountpts[z].type == 'cable') {
					let mIndex = this.lineStack.findIndex(obj => obj.mountPoint === mountpts[z].connectedTo[1]);
					if(mIndex >= 0) {
						let lineStack = this.lineStack[mIndex];
						let lineWidth = ctx.lineWidth;
						let strokeStyle = ctx.strokeStyle;
						ctx.lineWidth = 7;
						ctx.strokeStyle = mountpts[z].color;
						ctx.beginPath();
						ctx.moveTo(offsetX + arr[i].X + mountpts[z].x + (mountpts[z].width / 2), offsetY + arr[i].Y + mountpts[z].y + (mountpts[z].height / 2));
						ctx.bezierCurveTo(lineStack.X + lineStack.mountPoint.x + (lineStack.mountPoint.width / 2), offsetY + arr[i].Y + mountpts[z].y + (mountpts[z].height / 2),
						                  offsetX + arr[i].X + mountpts[z].x + (mountpts[z].width / 2), lineStack.Y + lineStack.mountPoint.y + (lineStack.mountPoint.height),
										  lineStack.X + lineStack.mountPoint.x + (lineStack.mountPoint.width / 2), lineStack.Y + lineStack.mountPoint.y + (lineStack.mountPoint.height));
						ctx.stroke();
						ctx.lineWidth = lineWidth;
						ctx.strokeStyle = strokeStyle;
						this.lineStack.splice(mIndex, 1);
					}
					else {
						this.lineStack.push({mountPoint: mountpts[z], X: offsetX + arr[i].X, Y: offsetY + arr[i].Y});
					}
				}
			}
			if(arr[i].mounts.length > 0) {
				let newStack = [];
				let offX = arr[i].X + offsetX;
				let offY = arr[i].Y + offsetY;
				newStack.push(arr[i].mounts);
				this.traverse(ctx, newStack, offX, offY);
			}
		}
	}
}