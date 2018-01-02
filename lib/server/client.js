"use strict";

let find    = require("es5-ext/lib/Array/prototype/find")
  , forEach = require("es5-ext/lib/Object/for-each")
  , config  = require("../../config")
  , data    = require("./data")
  , webmake = require("./webmake")
  , socket  = require("socket.io").listen(require("./server")).sockets

  , actions;

actions = {
	read(path) {
		let scope = data
		  , guid    = path.pop();

		console.log("READ", path.join("|"), guid);
		path.forEach(name => {
			if (!scope) return;
			scope = scope[name];
		});
		if (!scope) {
			console.error("!NOT FOUND!", path.join("|"), guid);
			return;
		}
		find.call(scope, art => art.guid === guid).read = true;
		if (!config.dev) webmake(true);
	},
	ignore(path) {
		let scope = data
		  , name  = path.pop();

		console.log("IGNORE", path.join("|"), name);
		path.forEach(name => {
			scope = scope[name];
		});
		scope[name] = false;

		if (!config.dev) webmake(true);
	}
};

socket.on("connection", socket => {
	forEach(actions, (listener, name) => {
		socket.on(name, listener);
	});
});
