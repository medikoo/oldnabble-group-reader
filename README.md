# Google Group Reader

_Rough quick implementation for own purposes, tested with Node v0.6 and Google Chrome browser_

Groups topics and provides Google Reader like interface.
Individual topics can be unsubscribed.

## Installation

Download and setup application:

	$ git clone https://github.com/medikoo/google-group-reader.git
	$ cd google-group-reader
	$ npm install

Create `config.json` in project path with following settings:

* `port` - Port for application server
* `group` - Group name

Start server:

	$ npm start

Wait for _Client application updated_ message and enjoy your Reader on configured port
