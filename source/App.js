enyo.kind({
	name: "App",
	kind: "FittableRows",
	styles: "background: black",
	fit: true,
	components:[
		{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", components: [
			{name: "appTitle", content: "Speaker's Clock"},
			{fit: "true"},
			{kind: "onyx.Button", name: "buttonAbout", content: "?", ontap: "aboutButton"} /*,
			{kind: "onyx.WebAppButton", alwaysShow: false, onInstallSuccess: "installSuccess", onInstallError: "installError", 
				webAppUrl: "manifest.webapp"}*/
		]},
		{name: "timeDisplay", fit: true, classes: "time-display", allowHtml: true, onresize:"displayResized", ontap: "startClock"},
		{kind: "onyx.ProgressBar", name: "progress", showStripes: false, classes: "app-progress-black", barClasses: "bar-color"},
		{kind: "onyx.Toolbar", components: [
			{name: "space0", allowHtml: true, content: "&nbsp;"},
			{kind: "onyx.IconButton", name: "buttonStart", src: "assets/Play.png", ontap: "startClock"},
			{name: "space1", allowHtml: true, content: "&nbsp;&nbsp;&nbsp;"},
			{kind: "onyx.IconButton", name: "buttonPlus", src: "assets/Plus.png", ondown: "plusButtonDown", ontap: "plusButtonUp"},
			{name: "space2", allowHtml: true, content: "&nbsp;"},
			{kind: "onyx.IconButton", name: "buttonMinus", src: "assets/Minus.png", ondown: "minusButtonDown", ontap: "minusButtonUp"},
			{name: "space3", allowHtml: true, content: "&nbsp;&nbsp;&nbsp;"},
			{kind: "onyx.IconButton", name: "buttonReset", src: "assets/Reroute.png", ontap: "resetClock"}
		]},
		{kind: "onyx.Popup", name: "aboutPopup", allowHtml: "true", centered: true, floating: true, style: "background: #eee;color: black;padding: 3px; font-size: small;", content: "Popup...", ontap: "popupHide"},
	],
	states: { 
		stopped: 0,
		paused: 1,
		running: 2
	},
	overtime: false,
	theState: 0,
	theTime: 0,
	timeSet: 0,
	timeMax: 5940, // 99 min.
	timeDefault: 1200, //20 min.
	timeStored: "1200",
	timeOut: 1000,
	plusMinusTimeout: 150,
	timer: null,
	plusTimer: null,
	minusTimer: null,
	timePercentGreen: 60,
	timePercentYellow: 80,
	timePercentRed: 95,
	barStyle: null,
	screenlock: null,
	
	create: function() {
		if(window.PalmSystem) {
			window.PalmSystem.setWindowOrientation("free");
		}
		this.inherited(arguments);
		this.$.progress.$.bar.applyStyle("border-radius", "3px 3px 3px 3px");
		this.timeStored = localStorage.getItem("timeStored");
		if (this.timeStored === null || this.timeStored === "") {
			this.timeStored = "1200"; // default time = 20 min
			localStorage.setItem("timeStored", this.timeStored);
		}
		this.timeDefault = parseInt(this.timeStored);
		this.timeSet = this.timeDefault;
		this.theTime = this.timeDefault;
		this.displayTime(this.theTime);
		this.displayResized();
		this.$.aboutPopup.setContent(document.getElementById("about").innerHTML);
	},

	aboutButton: function(inSender, inEvent) {
		this.$.aboutPopup.show();
		setTimeout(this.popupHide.bind(this), 16383);
	},
	
	popupHide: function() {
		this.$.aboutPopup.hide();
	},
	
	displayResized: function (inSender, inEvent) {
		var fontSize = 0;
		var paddingTop =0;
		var style = "";
		var timeHeight = window.innerHeight - 176;
		var timeWidth = window.innerWidth - 80;
		fontSize = Math.floor((timeWidth) / 3.15);
		if (fontSize > timeHeight)
			fontSize = timeHeight;
		paddingTop = Math.floor((timeHeight - fontSize) / 2 + 16);
		this.$.timeDisplay.applyStyle("font-size", fontSize + "px");
		this.$.timeDisplay.applyStyle("padding-top", paddingTop + "px");
	},
	
	progressChanged: function () {
		var color = this.changeColor (this.timeSet - this.theTime, this.timeSet, 
			this.timePercentGreen, this.timePercentYellow, this.timePercentRed);
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
			color = "rgb(255,"+ g +",0)";
		} else { // red
			color = "rgb(255,0,0)";
		}
		return color;
	},
	
	startClock: function() {
		if ((this.theTime === 0) && !this.overtime)
			return;
		switch(this.theState) {
		case this.states.stopped:
		// fallthrough
		case this.states.paused:
			this.theState = this.states.running;
			this.$.buttonStart.setSrc("assets/Pause.png");
			this.buttonsOff();
			this.timer = setInterval(this.updateTime.bind(this), this.timeOut);
			if(window.PalmSystem) {
				window.PalmSystem.setWindowProperties({"blockScreenTimeout":true});
			} else {
				this.screenlock = window.navigator.requestWakeLock('screen');
			}
			break;
		case this.states.running:
			clearInterval(this.timer);
			this.theState = this.states.paused;
			this.buttonsOn();
			this.$.buttonStart.setSrc("assets/Play.png");
			if(window.PalmSystem) {
				window.PalmSystem.setWindowProperties({"blockScreenTimeout":false});
			} else {
				this.screenlock.unlock();
			}
			break;
		}
	},
	
	updateTime: function() {
		this.theTime--;
		if((this.theTime < 0) && !this.overtime) {
			this.overtime = true;
			this.$.timeDisplay.addClass("overtime");
		}
		this.displayTime(this.theTime);
	},
	
	stopTime: function() {
		this.theState = this.states.stopped;
		this.buttonsOn();
		this.$.buttonStart.setSrc("assets/Play.png");
	},
	
	buttonsOff: function() {
			this.$.buttonPlus.hide();
			this.$.buttonMinus.hide();
			this.$.buttonReset.hide();
			this.$.buttonAbout.disabled = true;
	},
	
	buttonsOn: function() {
			this.$.buttonPlus.show();
			this.$.buttonMinus.show();
			this.$.buttonReset.show();
			this.$.buttonAbout.disabled = false;
	},
	
	plusButtonDown: function(inSender, inEvent) {
		this.$.progress.animateProgressTo(0);
		clearTimeout(this.minusTimer);
		clearTimeout(this.plusTimer);
		this.plusTimer = setTimeout(this.plusOne.bind(this), this.plusMinusTimeout);
		return true;
	},
	
	plusButtonUp: function(inSender, inEvent) {
		this.plusOne(true);
		return true;
	},
	
	plusOne: function(up) {
		up = up || false;
		if (this.overtime) {
			this.recoverFromOvertime();
		}
		if(this.theState !== this.states.running) {
			this.theTime = Math.floor(this.theTime / 60);
			this.theTime += 1;
			this.theTime *= 60;
			if (this.theTime < 60) {
				this.theTime = 60;
				clearTimeout(this.plusTimer);
			}
			if (this.theTime > this.timeMax) {
				this.theTime = this.timeMax;
				clearTimeout(this.plusTimer);
			}
			if (up) {
				clearTimeout(this.plusTimer);
				localStorage.setItem("timeStored", this.theTime);
			} else {
				this.plusTimer = setTimeout(this.plusOne.bind(this), this.plusMinusTimeout);
			}
			this.timeSet = this.theTime;
			this.displayTime(this.theTime);
		}
	},
	
	minusButtonDown: function(inSender, inEvent) {
		this.$.progress.animateProgressTo(0);
		clearTimeout(this.plusTimer);
		clearTimeout(this.minusTimer);
		this.minusTimer = setTimeout(this.minusOne.bind(this), this.plusMinusTimeout);
		return true;
	},
	
	minusButtonUp: function(inSender, inEvent) {
		this.minusOne(true);
		return true;
	},
	
	minusOne: function(up) {
		up = up || false;
		if (this.overtime) {
			this.recoverFromOvertime();
		}
		if(this.theState !== this.states.running) {
			var plus1 = Math.floor(this.theTime % 60) > 29 ? 1 : 0;
			this.theTime = Math.floor(this.theTime / 60) + plus1;
			this.theTime -= 1;
			this.theTime *= 60;
			if (this.theTime < 60) {
				this.theTime = 60;
				clearTimeout(this.minusTimer);
			}
			if (up) {
				clearTimeout(this.minusTimer);
				localStorage.setItem("timeStored", this.theTime);
			} else {
				this.minusTimer = setTimeout(this.minusOne.bind(this), this.plusMinusTimeout);
			}
			this.timeSet = this.theTime;
			this.displayTime(this.theTime);
		}
	},
	
	resetClock: function(inSender, inEvent) {
		if(this.theState !== this.states.running) {
			this.theTime = this.timeSet;
			this.displayTime(this.theTime);
			this.$.buttonStart.setSrc("assets/Play.png");
			this.recoverFromOvertime();
		}
	},
	
	recoverFromOvertime: function() {
		this.overtime = false;
		this.$.timeDisplay.removeClass("overtime");
		this.$.progress.animateProgressTo(0);
	},

	displayTime: function(t) {
		if(t >= 0) {
			this.progressChanged();
		} else { // negative means overtime
			t *= -1;
		}
		var m = Math.floor(t / 60);
		var s = Math.floor(t % 60);
		var p;
		if(m < 10) m = "0"+m;
		if(s < 10) s = "0"+s;
		if (!this.overtime && (this.theState === this.states.running)) {
			p = 100 * (this.timeSet - t) / this.timeSet;
			this.$.progress.animateProgressTo(p);
		}
		this.$.timeDisplay.setContent(m + ":" + s);
	},
/*	
	installSuccess: function(response) {
		enyo.log("install Success", response);
	},
	
	installError: function(err) {
		enyo.log("install Error", err);
	}
*/	
});
