"use strict";

const forEach = require("es5-ext/object/for-each")
    , config  = require("../../config")
    , data    = require("./data")
    , webmake = require("./webmake")
    , socket  = require("socket.io")(require("./server"));

const actions = {
	read(path) {
		let scope = data;
		const guid = path.pop();

		console.log("READ", path.join("|"), guid);
		path.forEach(name => {
			if (!scope) return;
			scope = scope[name];
		});
		if (!scope) {
			console.error("!NOT FOUND!", path.join("|"), guid);
			return;
		}
		scope.find(art => art.guid === guid).read = true;
		if (!config.dev) webmake(true);
	},
	ignore(path) {
		let scope = data;
		const name = path.pop();

		console.log("IGNORE", path.join("|"), name);
		path.forEach(pathToken => {
			scope = scope[pathToken];
		});
		scope[name] = false;

		if (!config.dev) webmake(true);
	}
};

socket.on("connection", connection => {
	forEach(actions, (listener, name) => {
		connection.on(name, listener);
	});
});
