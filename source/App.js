enyo.kind({
	name: "App",
	kind: "FittableRows",
	styles: "background: black",
	fit: true,
	components:[
		{kind: "onyx.Toolbar", content: "Speaker's Clock"},
		{name: "timeDisplay", fit: true, classes: "time-display", allowHtml: true, onresize:"displayResized"},
		{kind: "onyx.ProgressBar", name: "progress", showStripes: false, classes: "app-progress-black", barClasses: "bar-color"},
		{kind: "onyx.Toolbar", components: [
			{kind: "onyx.Button", name: "buttonStart", content: "Start", ontap: "startClock"},
			{kind: "onyx.Button", name: "buttonPlus", content: "+", ontap: "plusOne"},
			{kind: "onyx.Button", name: "buttonMinus", content: "-", ontap: "minusOne"},
			{kind: "onyx.Button", name: "buttonReset", content: "Reset", ontap: "resetClock"}
		]}
	],
	states: { 
		stopped: 0,
		paused: 1,
		running: 2
	},
	theState: 0,
	theTime: 0,
	timeSet: 0,
	timeMax: 5940, // 99 min.
	timeDefault: 1200, //20 min.
	timeOut: 1000,
	timer: null,
	timePercentGreen: 50,
	timePercentYellow: 70,
	timePercentRed: 90,
	barStyle: null,
	
	create: function() {
		this.inherited(arguments);
		this.barStyle = document.createElement('style');
		this.barStyle.type = 'text/css';
		this.barStyle.innerHTML = '.bar-color { background: grey; }';
		this.timeSet = this.timeDefault;
		this.theTime = this.timeDefault;
		this.displayTime(this.theTime);
		this.displayResized();
	},
	
	displayResized: function (inSender, inEvent) {
		var fontSize = 0;
		var paddingTop =0;
		var style = "";
		var timeHeight = window.innerHeight - 176;
		var timeWidth = window.innerWidth - 80;
		fontSize = Math.floor((timeWidth) / 2.5);
		if (fontSize > timeHeight)
			fontSize = timeHeight;
		paddingTop = Math.floor((timeHeight - fontSize) / 2 + 16);
		this.$.timeDisplay.applyStyle("font-size", fontSize + "px");
		this.$.timeDisplay.applyStyle("padding-top", paddingTop + "px");
	},
	
	progressChanged: function () {
		var color = this.changeColor (this.timeSet - this.theTime, this.timeSet, 
			this.timePercentGreen, this.timePercentYellow, this.timePercentRed);
		this.barStyle.innerHTML = ".app-bar-color { background-color: " + color +"; }";
		this.$.progress.$.bar.applyStyle("background", color);
	},
	
	changeColor: function (s, max, pg, py, pr) {
		var gr = 0, gg = 255;
		var yr = 255, yg = 255;
		var rr = 255, rg = 0;
		var color = "";
		var ppg, ppy;
		var r, g;
		var dg = py - pg;
		var dy = pr - py;
		var p = s === 0 ? 0 : Math.floor((s / max * 100));
		if (p <= pg) { // green
			color = "rgb(0,255,0)";
		} else if (p <= py) { //transition to yellow
			ppg = p === pg ? 0 : ((p - pg)/ dg);
			r = Math.floor(yr * ppg);
			color = "rgb(" + r + ",255,0)" ;
		} else if (p <= pr) { // transition to red
			ppy = p === py ? 0 : ((p - py) / dg);
			g = Math.floor(yg * (1 - ppy));
			color = "rgb(255,"+ g +",00)";
		} else { // red
			color = "rgb(255,0,0)";
		}
		return color;
	},
	
	startClock: function() {
		if(this.theTime === 0) 
			return;
		switch(this.theState) {
		case this.states.stopped:
		//fallthrough
		case this.states.paused:
			this.theState = this.states.running;
			this.$.buttonStart.setContent("Pause");
			this.buttonsOff();
			this.timer = setTimeout(this.updateTime.bind(this), this.timeOut);
			break;
		case this.states.running:
			this.theState = this.states.paused;
			this.buttonsOn();
			this.$.buttonStart.setContent("Start");
			break;
		}
	},
	
	updateTime: function() {
		if(this.theTime === 0) 
			return;
		this.theTime--;
		if(this.theTime < 0)
			this.theTime = 0;
		this.displayTime(this.theTime);
		if (this.theTime > 0 && this.theState === this.states.running)
			setTimeout(this.updateTime.bind(this), this.timeOut);
		else if (this.theTime === 0)
			this.stopTime();
		this.progressChanged();
	},
	
	stopTime: function() {
		this.theState = this.states.stopped;
		this.buttonsOn();
		this.$.buttonStart.setContent("Start");
		
	},
	
	buttonsOff: function() {
			this.$.buttonPlus.hide();
			this.$.buttonMinus.hide();
			this.$.buttonReset.hide();
	},
	
	buttonsOn: function() {
			this.$.buttonPlus.show();
			this.$.buttonMinus.show();
			this.$.buttonReset.show();
	},
	
	plusOne: function(inSender, inEvent) {
		if(this.theState !== this.states.running) {
			this.theTime = Math.floor(this.theTime / 60);
			this.theTime += 1;
			this.theTime *= 60;
			if(this.theTime > this.timeMax) {
				this.theTime = this.timeMax;
			}
			this.timeSet = this.theTime;
			this.displayTime(this.theTime);
		}
	},
	
	minusOne: function(inSender, inEvent) {
		if(this.theState !== this.states.running) {
			var plus1 = Math.floor(this.theTime % 60) > 29 ? 1 : 0;
			this.theTime = Math.floor(this.theTime / 60) + plus1;
			this.theTime -= 1;
			this.theTime *= 60;
			if(this.theTime < 0) {
				this.theTime = 0;
			}
			this.timeSet = this.theTime;
			this.displayTime(this.theTime);
		}
	},
	
	resetClock: function(inSender, inEvent) {
		if(this.theState !== this.states.running) {
			this.theTime = this.timeSet;
			this.displayTime(this.theTime);
			this.$.buttonStart.setContent("Start");
		}
	},
	
	displayTime: function(t) {
		var m = Math.floor(t / 60);
		var s = Math.floor(t % 60);
		var p;
		if(m < 10) m = "0"+m;
		if(s < 10) s = "0"+s;
		this.$.timeDisplay.setContent(m + ":" + s);
		p = 100 * (this.timeSet - t) / this.timeSet;
		this.$.progress.animateProgressTo(p);
	}
});
