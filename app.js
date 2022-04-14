const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const {
	uniqueNamesGenerator,
	adjectives,
	animals,
} = require("unique-names-generator");

var usernames = new Array();

const getUser = (id) => {
	return usernames.find((u) => {
		return u.id === id;
	});
};

const getRandomColor = () => {
	// https://javascript.tutorialink.com/how-to-programmatically-calculate-the-contrast-ratio-between-two-colors/
	function luminance(r, g, b) {
		var a = [r, g, b].map(function (v) {
			v /= 255;
			return v <= 0.03928
				? v / 12.92
				: Math.pow((v + 0.055) / 1.055, 2.4);
		});
		return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
	}
	function contrast(rgb) {
		const backgroundLuminance = 0.013692539000033166;

		var lum1 = luminance(rgb[0], rgb[1], rgb[2]);
		var lum2 = backgroundLuminance;
		var brightest = Math.max(lum1, lum2);
		var darkest = Math.min(lum1, lum2);
		return (brightest + 0.05) / (darkest + 0.05);
	}

	colorSearch = true;
	rgb = new Array();
	while (colorSearch) {
		for (let i = 0; i <= 2; i++) {
			rgb[i] = Math.floor(Math.random() * 255);
		}
		if (contrast(rgb, [33, 31, 24]) > 4.5) colorSearch = false;
	}

	return (
		rgb[0].toString(16).padStart(2, "0") +
		rgb[1].toString(16).padStart(2, "0") +
		rgb[2].toString(16).padStart(2, "0")
	);
};

app.use(express.static(__dirname + "/client"));

io.on("connection", (socket) => {
	usernames.forEach((u) => {
		socket.emit("verbindung", u);
	});

	usernames.push({
		id: socket.id,
		name: uniqueNamesGenerator({
			dictionaries: [adjectives, animals],
			separator: " ",
			style: "capital",
		}),
		color: getRandomColor(),
	});

	io.emit("verbindung", getUser(socket.id));

	socket.on("nachricht", (msg) => {
		console.log(usernames);
		io.emit("nachricht", {
			author: getUser(socket.id),
			message: msg,
		});
	});

	socket.on("disconnect", () => {
		console.log("Disconnect");

		try {
			io.emit("trennung", getUser(socket.id));
		} catch {
			console.log("Keine Nutzer mehr im Chat");
		}

		console.log("Gelöscht:");
		console.log(
			usernames.splice(
				usernames.findIndex((u) => {
					return u.id === socket.id;
				}),
				1
			)
		);
	});
});

// Server setup
server.listen(3000, () => {
	console.log("Server is Running");
});
