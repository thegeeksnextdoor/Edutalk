var PeerConnection = require('./PeerConnection');
var Indicator = require('./Indicator');

function AllConnection(){
	var configuration = {
			"iceServers": [{ "url": "stun:stun.1.google.com:19302"
			}]
	};
	var local;
	var stream;
	this.connection = {};
	this.indicator = new Indicator();
	this.localVideo = document.getElementById("localVideo");
	this.localVideo.autoplay = true;
}

AllConnection.prototype.init = function(user, socket, cb){
	var self = this;
	this.local = user;
	this.socket = socket;
	if (this.indicator.hasUserMedia()) {
		navigator.getUserMedia({ video: true, audio: true }, function (stream) {
			self.localVideo.src = window.URL.createObjectURL(stream);
			self.stream = stream;
			console.log(stream);
			cb();
		}, function (error) {
			console.log(error);
		});
	} else {
		alert("Sorry, your browser does not support WebRTC.");
	}
}

AllConnection.prototype.initConnection = function(peer){
	var self = this;
	self.connection[peer] = new PeerConnection(self.local, peer, self.socket, self.stream);
	console.log("local is " + self.local + " and peer is " + peer);
	self.connection[peer].createVideo(peer, function(){
		self.connection[peer].startConnection(peer, function(){
			self.connection[peer].setupPeerConnection(peer, function(){
				self.connection[peer].makeOffer( function(offer){
					console.log("send offer to " + peer);
					console.log(offer);
					self.socket.emit("SDPOffer", {
						type: "SDPOffer",
						local: self.local,
						remote: peer,
						offer: offer
					});
				})
			})
		})
	})
}

AllConnection.prototype.buildEnvironment = function(data, cb){
	var self = this;
	console.log(data);
	self.connection[data] = new PeerConnection(self.local, data, self.socket, self.stream);
	console.log("local is " + self.local + " and peer is " + data);
	self.connection[data].createVideo(data, function(){
		self.connection[data].startConnection(data, function(){
			self.connection[data].setupPeerConnection(data, function(){
				cb();
			});
		});
	});
}

AllConnection.prototype.onOffer = function(data){
	var self = this;
	console.log(data.remote);
	self.connection[data.remote].receiveOffer(data, function(answer){
		self.socket.emit("SDPAnswer", {
			type: "SDPAnswer",
			local: self.local,
			remote: data.remote,
			answer: answer
		});
		console.log(self.connection[data.remote].p2pConnection.localDescription);
		console.log(self.connection[data.remote].p2pConnection.remoteDescription);
	}) 
}

AllConnection.prototype.onAnswer = function(data){
	this.connection[data.remote].receiveAnswer(data);
}

AllConnection.prototype.onCandidate = function(data){
	console.log("ice candidate is ");
	console.log(data.candidate);
	console.log("from ");
	console.log(data.remote);
	this.connection[data.remote].addCandidate(data);
}

module.exports = AllConnection;