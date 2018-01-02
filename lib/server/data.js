"use strict";

const isObject  = require("es5-ext/object/is-object")
    , config    = require("../../config")
    , logToMail = require("./log-to-mail")
    , Parser    = require("./parser")
    , webmake   = require("./webmake");

const re = new RegExp(
	"^http:\\/\\/mozilla\\.6506\\.n7\\.nabble\\.com\\/" +
		"[\\0-\\uffff]+-tp(\\d+)(?:p(\\d+))?\\.html$"
);

const prefixes = (config.skipPrefixes || []).concat(["Re: "]);

const sort = function (item1, item2) {
	return Date.parse(item1.date) - Date.parse(item2.date);
};

const log = function (subject, body) {
	if (isObject(body)) {
		body = [body.guid, body.link, body.description].join("\n\n");
	}
	logToMail(subject, body);
};

const parser = new Parser(`http://mozilla.6506.n7.nabble.com/${ config.group }.xml`), data = {};

module.exports = data;

parser.on("article", article => {
	let title;
	const match = article.link.match(re);
	if (!match) {
		log("Could not parse article link", article);
		return;
	}
	const [, thread] = match;
	if (!data[thread]) {
		data[thread] = [];
	}
	title = article.title.toLowerCase();

	const findPrefix = prefix => {
		if (title.startsWith(prefix.toLowerCase())) {
			title = title.slice(prefix.length);
			return true;
		}
		return false;
	};
	while (prefixes.some(findPrefix)) continue;
	article.headTitle = article.title.slice(article.title.length - title.length);
	article.skipTitle = true;
	data[thread].push(article);
	data[thread].sort(sort);

	if (!config.dev) {
		webmake(true);
	}
});

parser.get();
setInterval(parser.get.bind(parser), 15000);
