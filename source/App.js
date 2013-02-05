enyo.kind({
	name: "App",
	kind: "FittableRows",
	styles: "background: black",
	fit: true,
	components:[
		{kind: "onyx.Toolbar", content: "Speaker's Clock"},
//		{kind: "enyo.Scroller", fit: true, classes: "time-display", components: [
			{name: "time", fit: true, classes: "time-display", allowHtml: true},
//		]},
		{kind: "onyx.ProgressBar", name: "progress", showStripes: false},
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
	timeMax: 5940, // 99min
	timer: null,
	
	create: function() {
		this.inherited(arguments);
		this.timeSet = 1200;
		this.theTime = 1200;
		this.displayTime(this.theTime);
	},
	
	startClock: function() {
		switch(this.theState) {
		case this.states.stopped:
			this.theState = this.states.running;
			this.$.buttonStart.setContent("Pause");
			this.timer = setTimeout(this.updateTime.bind(this), 1000);
			break;
		case this.states.paused:
			this.theState = this.states.running;
			this.$.buttonStart.setContent("Pause");
			this.timer = setTimeout(this.updateTime.bind(this), 1000);
			break;
		case this.states.running:
			this.theState = this.states.paused;
			this.$.buttonStart.setContent("Start");
			break;
		}
	},
	
	updateTime: function() {
		if(this.theTime === 0) 
			return;
		this.theTime--;
		if(this.theTime < 0)
			this.theTime === 0
		this.displayTime(this.theTime);
		if (this.theTime > 0 && this.theState === this.states.running)
			setTimeout(this.updateTime.bind(this), 1000);
		else if (this.theTime === 0)
			this.stopTime();
	},
	
	stopTime: function() {
		this.theState = this.states.stopped;
		this.$.buttonStart.setContent("Start");
		
	},
	
	buttonsOff: function() {
	},
	
	buttonsOn: function() {
	},
	
	plusOne: function(inSender, inEvent) {
		if(this.theState !== this.states.running) {
			this.theTime /= 60;
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
			this.theTime /= 60;
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
		this.$.time.setContent(m + ":" + s);
		p = 100 * (this.timeSet - t) / this.timeSet;
		if(p < 70) { 
			this.$.progress.barClasses += "background: green;";
		} else if(p < 90) {
			this.$.progress.barClasses = ".bar-yellow";
		} else {
			this.$.progress.barClasses = ".bar-red";
		}
		this.$.progress.animateProgressTo(p);
	}
});
