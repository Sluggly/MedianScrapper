const puppeteer = require('puppeteer');
var express = require('express');
var app = express();
var serv = require('http').createServer(app);
var webio = require('socket.io')(serv, {});
var fs = require('fs');
var ini = require('ini');
app.use(express.static('.'));
app.use(express.static('css'));
app.use(express.static('js'));
app.use(express.static('src'));

var port = 8000; // Modify this port if you're having trouble to acces the web page.


//app.use(express.static(__dirname + '/node_modules')); 
// Page d'accueil
app.get('/',function(req,res) {
	res.sendFile(__dirname + '/index.html');
});

serv.listen(port);
console.log('Server up at http://localhost:' + port);

// Variables
var browser = null;
var page = null;

// Main
webio.sockets.on('connection', function(socket) {
	console.log("User connected to server.");
	var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
	socket.emit('serverFileConfig', config);
	console.log("File configuration sent to user.");
	socket.on('login', function(data) {
		(async () => {
			if (browser == null) {
				console.log("Launching Browser.");
				browser = await puppeteer.launch();
				page = await browser.newPage();
				await page.goto('https://tsw.vn.cz/login.php');
			}
			console.log("Logging in Not Armory.");
			await page.type('[type=text]', data.username);
			await page.type('[type=password]', data.password);
			await Promise.all([
				page.waitForNavigation(),
				page.click('[type=submit]')
			]);
			
			console.log("Checking Character list.");
			await page.goto('https://tsw.vn.cz/acc/');
			var characters = [];
			
			var i = 4;
			while (true) {
				var [characterNom] = await page.$x('/html/body/div/table/tbody/tr[' + i + ']/td[1]/b');
				if (characterNom != null) {
					var fixOnline = await page.$x('/html/body/div/table/tbody/tr[' + i + ']/td/span/span');
					if (fixOnline.length == 0) {
						var characterNomTmp = await characterNom.getProperty('textContent');
						var characterNomTxt = await characterNomTmp.jsonValue();
						var [characterLadder] = await page.$x('/html/body/div/table/tbody/tr[' + i + ']/td[5]');
						var characterLadderTmp = await characterLadder.getProperty('textContent');
						var characterLadderTxt = await characterLadderTmp.jsonValue();
						var [characterLvl] = await page.$x('/html/body/div[1]/table/tbody/tr[' + i + ']/td[2]');
						var characterLvlTmp = await characterLvl.getProperty('textContent');
						var characterLvlTxt = await characterLvlTmp.jsonValue(); 
						var [characterClass] = await page.$x('/html/body/div[1]/table/tbody/tr[' + i + ']/td[3]');
						var characterClassTmp = await characterClass.getProperty('textContent');
						var characterClassTxt = await characterClassTmp.jsonValue(); 
						characters.push([characterNomTxt,characterLvlTxt, characterClassTxt,characterLadderTxt]);
						console.log("Character found : " + characterNomTxt + " lvl " + characterLvlTxt + " on ladder " + characterLadderTxt + ".");
						i++;
					}
					else {
						i = i+2;
					}
				}
				else {
					break;
				}
			}
			if (characters[0] != null) {
				console.log("Log in succesfull.");
				socket.emit('serverLogin', characters);
			}
			else {
				console.log("Log in failed.");
				await page.goto('https://tsw.vn.cz/login.php');
				socket.emit('serverError',{code:"1"});
			}
		})();
	});
	
	socket.on('offline', function() {
		(async () => {
			if (browser == null) {
				console.log("Launching Browser.");
				browser = await puppeteer.launch();
				page = await browser.newPage();
				await page.goto('https://tsw.vn.cz/login.php');
			}
			console.log("Logging in Not Armory.");
			await page.type('[type=text]', 'Lenzzer');
			await page.type('[type=password]', 'Lenzzer');
			await Promise.all([
				page.waitForNavigation(),
				page.click('[type=submit]')
			]);
			console.log("Offline mode succesfull.");
			console.log("Now reading configuration file.");
			var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
			var characters = config.OfflineCharacters;
			var tmpCharacters = [];
			console.log("Checking Character list.");
			for (var i in characters) {
				if (i != "SlugStopLine") {
					await page.goto('https://tsw.vn.cz/acc/char.php?name=' + characters[i]);
					var [characterLvl] = await page.$x('/html/body/div/div[2]/table[1]/tbody/tr[1]/td[1]/b');
					var characterLvlTmp = await characterLvl.getProperty('textContent');
					var characterLvlTxt = await characterLvlTmp.jsonValue(); 
					var [characterClass] = await page.$x('/html/body/div/h1/text()');
					var characterClassTmp = await characterClass.getProperty('textContent');
					var characterClassTxt = await characterClassTmp.jsonValue(); 
					if (characterClassTxt.includes("[Paladin]")) {
						characterClassTxt = "Paladin";
					}
					else if (characterClassTxt.includes("[Druid]")) {
						characterClassTxt = "Druid";
					}
					else if (characterClassTxt.includes("[Sorceress]")) {
						characterClassTxt = "Sorceress";
					}
					else if (characterClassTxt.includes("[Amazon]")) {
						characterClassTxt = "Amazon";
					}
					else if (characterClassTxt.includes("[Necromancer]")) {
						characterClassTxt = "Necromancer";
					}
					else if (characterClassTxt.includes("[Assassin]")) {
						characterClassTxt = "Assassin";
					}
					else if (characterClassTxt.includes("[Barbarian]")) {
						characterClassTxt = "Barbarian";
					}
					var [characterLadder] = await page.$x('/html/body/div/h1');
					var characterLadderTmp = await characterLadder.getProperty('textContent');
					var characterLadderTxt = await characterLadderTmp.jsonValue();
					if (characterLadderTxt.includes("SC Ladder")) {
						characterLadderTxt = "LADDER";
					}
					else {
						characterLadderTxt = "HC LADDER";
					}
					tmpCharacters.push([characters[i],characterLvlTxt, characterClassTxt,characterLadderTxt]);
					console.log("Character found : " + characters[i] + " lvl " + characterLvlTxt + " on ladder " + characterLadderTxt + ".");
				}
			}
			console.log(tmpCharacters.length + " characters found in configuration file.");
			socket.emit('serverOffline',{characters:tmpCharacters});
		})();
	});
	
	socket.on('deleteCharacterConfigRequest', function(nom) {
		console.log("Request to delete character from config file.");
		var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
		var characters = config.OfflineCharacters;
		if (characters != null) {
			if (characters[nom.toLowerCase()] == null) {
				console.log("Character is not in config file.");
				socket.emit('serverError',{code:"4"});
			}
			else {
				console.log("Character deleted from config file.");
				delete config.OfflineCharacters[nom.toLowerCase()];
				fs.writeFileSync('./config.ini', ini.stringify(config));
				socket.emit('serverDeletedCharacterConfig', nom);
			}
		}
		else {
			console.log("Character is not in config file.");
			socket.emit('serverError',{code:"4"});
		}
	});
	
	socket.on('addCharacterConfigRequest', function(nom) {
		(async () => {
			console.log("Request to add character to config file.");
			await page.goto('https://tsw.vn.cz/acc/char.php?name=' + nom);
			var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
			var characters = config.OfflineCharacters;
			var bool = true;
			if (characters != null) {
				if (characters[nom.toLowerCase()] != null) {
					bool = false;
					console.log("Character is already in config file.");
					socket.emit('serverError',{code:"3"});
				}
			}
			if (bool) {
				var character = [];
				var [characterLvl] = await page.$x('/html/body/div/div[2]/table[1]/tbody/tr[1]/td[1]/b');
				if (characterLvl != null) {
					characters[nom.toLowerCase()] = nom;
					fs.writeFileSync('./config.ini', ini.stringify(config));
					var characterLvlTmp = await characterLvl.getProperty('textContent');
					var characterLvlTxt = await characterLvlTmp.jsonValue();
					var [characterClass] = await page.$x('/html/body/div/h1/text()');
					var characterClassTmp = await characterClass.getProperty('textContent');
					var characterClassTxt = await characterClassTmp.jsonValue(); 
					if (characterClassTxt.includes("[Paladin]")) {
						characterClassTxt = "Paladin";
					}
					else if (characterClassTxt.includes("[Druid]")) {
						characterClassTxt = "Druid";
					}
					else if (characterClassTxt.includes("[Sorceress]")) {
						characterClassTxt = "Sorceress";
					}
					else if (characterClassTxt.includes("[Amazon]")) {
						characterClassTxt = "Amazon";
					}
					else if (characterClassTxt.includes("[Necromancer]")) {
						characterClassTxt = "Necromancer";
					}
					else if (characterClassTxt.includes("[Assassin]")) {
						characterClassTxt = "Assassin";
					}
					else if (characterClassTxt.includes("[Barbarian]")) {
						characterClassTxt = "Barbarian";
					}
					var [characterLadder] = await page.$x('/html/body/div/h1');
					var characterLadderTmp = await characterLadder.getProperty('textContent');
					var characterLadderTxt = await characterLadderTmp.jsonValue();
					if (characterLadderTxt.includes("SC Ladder")) {
						characterLadderTxt = "LADDER";
					}
					else {
						characterLadderTxt = "HC LADDER";
					}
					character.push([nom, characterLvlTxt, characterClassTxt,characterLadderTxt]);
					console.log("Character found : " + nom + " lvl " + characterLvlTxt + " on ladder " + characterLadderTxt + ".");
					socket.emit('serverAddedCharacterConfig',character);
				}
				else {
					console.log("Character not found.");
					socket.emit('serverError',{code:"2"});
				}
			}
		})();
	});
	
	socket.on('changeAutoLoadMulesConfig', function(bool) {
		var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
		var autoLoad = config.Options;
		autoLoad["autoMules"] = bool;
		fs.writeFileSync('./config.ini', ini.stringify(config));
		console.log("Change auto load mules config to: " + bool);
		socket.emit('serverAutoLoadMulesConfig');
	});
	
	socket.on('changeAutoLoadAllConfig', function(bool) {
		var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
		var autoLoad = config.Options;
		autoLoad["autoSelectAll"] = bool;
		fs.writeFileSync('./config.ini', ini.stringify(config));
		console.log("Change auto load all characters config to: " + bool);
		socket.emit('serverAutoLoadAllConfig');
	});
	
	socket.on('scrapRequest', function(characters) {
		(async () => {
			console.log("Request to scrap " + characters.length + " characters.");
			for (var i in characters) {
				console.log("Getting Items info from " + characters[i] + ".");
				try {
					await page.goto('https://tsw.vn.cz/acc/char.php?name=' + characters[i]);
				}
				catch(error) {
					console.log(error);
				}
				var j = 1;
				var items = [];
				while (true) {
					const [nomItem] = await page.$x('//*[@id="itemdump"]/tbody/tr[' + j + ']/td[1]/div/span');
					if (nomItem != null) {
						const nomItemTmp = await nomItem.getProperty('textContent');
						const nomItemTxt = await nomItemTmp.jsonValue();
						const [typeItem] = await page.$x('//*[@id="itemdump"]/tbody/tr[' + j + ']/td[2]');
						const typeItemTmp = await typeItem.getProperty('textContent');
						const typeItemTxt = await typeItemTmp.jsonValue();
						const [colorItem] = await page.$x('//*[@id="itemdump"]/tbody/tr[' + j + ']/td[1]/div/span'); 
						const colorItemTmp = await colorItem.getProperty('className');
						const colorItemTxt = await colorItemTmp.jsonValue();
						const [slotItem] = await page.$x('//*[@id="itemdump"]/tbody/tr[' + j + ']/td[3]');
						const slotItemTmp = await slotItem.getProperty('textContent');
						const slotItemTxt = await slotItemTmp.jsonValue();
						const [imgItem] = await page.$x('//*[@id="itemdump"]/tbody/tr[' + j + ']/td[1]/div/div/div/div[1]/img');
						const imgItemTmp = await imgItem.getProperty('src');
						const imgItemTxt = await imgItemTmp.jsonValue();
						const [statsItem] = await page.$x('//*[@id="itemdump"]/tbody/tr[' + j + ']/td[1]/div/div/div/div[2]/span[2]/span[2]');
						var statsItemObj = "";
						var k = 2;
						if (statsItem != null) {
							const tmpColor = await statsItem.getProperty('className');
							const tmpColorTxt = await tmpColor.jsonValue();
							if (tmpColorTxt == 'color-gold') {
								var k = 3;
							}
							var l = 1
							var stats = [];
							while (true) {
								const [statsItem] = await page.$x('//*[@id="itemdump"]/tbody/tr[' + j + ']/td[1]/div/div/div/div[2]/span[2]/span[' + k + ']/text()[' + l + ']');
								if (statsItem != null) {
									const statsItemTmp = await statsItem.getProperty('textContent');
									var statsItemTxt = await statsItemTmp.jsonValue();
									statsItemTxt = statsItemTxt.trim();
									if (statsItemTxt.length > 0) {
										stats.push(statsItemTxt);
									}
									l++;
								}
								else {
									break;
								}
							}
						}
						else {
							var stats = ["Aucune"];
						}
						items[j-1] = [nomItemTxt,typeItemTxt,colorItemTxt,slotItemTxt,imgItemTxt,stats];
						j++;
					}
					else {
						break;
					}
				}
				socket.emit('scrappedInfo',characters[i],items);
			}
			console.log("Scrapping finished.");
		})();
	});
	
	socket.on('disconnect', function() {
		(async () => {
			if (browser != null) {
				await browser.close();
				browser = null;
			}
		})();
	});
});