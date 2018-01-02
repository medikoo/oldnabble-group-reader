"use strict";

const { isArray } = Array, { call } = Function.prototype, { max } = Math, { keys } = Object;

const last       = require("es5-ext/array/#/last")
    , format     = require("es5-ext/date/#/format")
    , memoize    = require("memoizee/lib/regular")
    , pluck      = require("es5-ext/function/pluck")
    , not        = require("es5-ext/function/#/not")
    , count      = require("es5-ext/object/count")
    , mapToArray = require("es5-ext/object/to-array")
    , lcSort     = call.bind(require("es5-ext/string/#/case-insensitive-compare"))
    , domjs      = require("domjs/lib/html5")(document)
    , data       = require("./data");

const articleDOM = memoize(
	function (article) {
		let body;
		const el = this.li(
			{ class: "article" },
			!article.skipTitle &&
				this.h2(this.a({ href: article.link, target: "_blank" }, article.title)),
			!article.skipAuthor &&
				this.div(
					{ class: "author" },
					this.a({ href: article.link }, article.author),
					` at ${ format.call(new Date(Date.parse(article.date)), "%Y-%m-%d %H:%M:%S") }`
				),
			body = this.div({ class: "body" })()
		)();
		body.innerHTML = article.description
			? article.description.replace(/<a href=/g, "<a target=\"_blank\" href=")
			: "";
		return el;
	}.bind(domjs.map)
);

const sort = function (item1, item2) {
	return lcSort(last.call(data[item1]).headTitle, last.call(data[item2]).headTitle);
};

document.body.appendChild(
	domjs.build(() => {
		let nest = 0, container = null, content, selected, offsets = [], current, scope, articles;

		const load = function () {
			current = this;
			const els = this.map(articleDOM);
			articles().innerHTML = "";
			if (!els.length) return;
			articles(els);
			if (!els[0].offsetTop) {
				setTimeout(load.bind(this), 10);
				return;
			}
			this.emit("select");
			this.some((el, i) => {
				if (!el.read) {
					container.scrollTop = max(els[i].offsetTop - (i === 0 ? 50 : 20), 0);
					return true;
				}
				return false;
			});
			offsets = els.map(el => el.offsetTop + 60);
		};

		const reset = function () {
			scope = data;
			while (!isArray(scope)) {
				if (!(scope = scope[keys(scope).sort(sort)[0]])) {
					return;
				}
			}
			load.call(scope);
		};

		const ignore = function () {
			if (current) current.emit("ignore");
		};

		const fixPadding = function () {
			content.style.paddingBottom = `${ max(
				document.body.scrollHeight,
				document.body.offsetHeight,
				document.documentElement.clientHeight,
				document.documentElement.scrollHeight,
				document.documentElement.offsetHeight
			) }px`;
		};

		section(
			{ class: "aside" },
			ul(
				{ class: `nest-${ nest }` },
				mapToArray(
					data,
					function generateItem(value, key) {
						let el, len;
						if (isArray(value)) {
							el = li(
								{ class: "feed" },
								a(
									{ onclick: load.bind(value) },
									`${ last.call(value).headTitle || key }\u00a0(`,
									len = _text(value.filter(not.call(pluck("read"))).length),
									")"
								)
							)();
							value.on("select", () => {
								if (selected) {
									selected.classList.remove("selected");
								}
								el.classList.add("selected");
								selected = el;
							});
							value.on("update", function () {
								const rlen = this.filter(not.call(pluck("read"))).length;
								len.data = rlen;
								if (!rlen && el.parentNode) {
									el.parentNode.removeChild(el);
								}
							});
							value.on("ignore", () => {
								if (el.parentNode) el.parentNode.removeChild(el);
								reset();
							});
						} else {
							el = li(
								h3(key),
								ul(
									{ class: `nest-${ ++nest }` },
									mapToArray(value, generateItem, null, lcSort)
								)
							)();
							--nest;
							value.on("update", function () {
								if (!count(this) && el.parentNode) {
									el.parentNode.removeChild(el);
								}
							});
						}
						return el;
					},
					null,
					sort
				)
			)
		);
		container = section(
			{ class: "content" },
			content = div(
				p(
					{ class: "controls" },
					input({ type: "button", value: "Unsubscribe", onclick: ignore })
				),
				articles = ul(),
				p(
					{ class: "controls" },
					input({ type: "button", value: "Unsubscribe", onclick: ignore })
				)
			)()
		)();

		fixPadding();
		window.onresize = fixPadding;

		container.onscroll = function () {
			const pos = container.scrollTop;
			offsets.every((offset, i) => {
				if (pos > offset) {
					current[i].markRead();
					return true;
				}
				return false;
			});
		};

		// Show first
		reset();
	})
);
