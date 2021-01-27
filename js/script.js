var socket = io();

// Classes
class Item {
	constructor(aname, atype, acolor, aslot, asrc, adesc, aowner, acategorie) {
		this.name = aname;
		this.type = atype;
		this.color = acolor;
		this.slot = aslot;
		this.src = asrc;
		this.desc = adesc;
		this.owner = aowner;
		this.categorie = acategorie;
	}
}

class Character {
	constructor(aname, alvl, aladder, aclasse) {
		this.name = aname;
		this.lvl = alvl;
		this.ladder = aladder;
		this.classe = aclasse;
		this.src = null;
		this.items = [];
	}
	
	addItem(item) {
		this.items.push(item);
	}
	
	refreshItems() {
		for (var i in this.items) {
			var divItem = document.getElementsByClassName(this.items[i].name);
			var affRemoved = 0;
			if (divItem.length != 0) {
				var divItem2 = document.getElementsByClassName(this.items[i].owner.name);
				var valeurDiv1 = divItem[0].getAttribute('data-value');
				var totalDiv1 = divItem[0].getAttribute('total');
				for (var j in divItem2) {
					if (j != "length") {
						var nomItemDiv = divItem2[j].getAttribute('data-value');
						if (nomItemDiv == this.items[i].name) {
							if (divItem2[j].style.display != "none") {
								affRemoved++;
							}
							totalDiv1--;
							divItem2[j].remove();
							break;
						}
					}
					else {
						break;
					}
				}
				valeurDiv1 = valeurDiv1 - affRemoved;
				divItem[0].setAttribute('data-value', valeurDiv1);
				divItem[0].setAttribute('total', totalDiv1);
				if (totalDiv1 <= 1) {
					divItem[0].remove();
				}
				else if (valeurDiv1 <= 1) {
					divItem[0].style.display = "none";
				}
			}
			var index = DictItem[this.items[i].name].indexOf(i);
			DictItem[this.items[i].name].splice(index, 1);
			delete this.items[i];
		}
		var sacredLastChild = document.getElementById('duplicate-sacred-div').lastChild;
		var setLastChild = document.getElementById('duplicate-sets-div').lastChild;
		var charmLastChild = document.getElementById('duplicate-charms-div').lastChild;
		if (sacredLastChild != null) {
			while ((sacredLastChild != null) && (sacredLastChild.tagName == "BR")) {
				sacredLastChild.remove();
				sacredLastChild = document.getElementById('duplicate-sacred-div').lastChild;
			}
		}
		if (setLastChild != null) {
			while ((setLastChild != null) && (setLastChild.tagName == "BR")) {
				setLastChild.remove();
				setLastChild = document.getElementById('duplicate-sets-div').lastChild;
			}
		}
		if (charmLastChild != null) {
			while ((charmLastChild != null) && (charmLastChild.tagName == "BR")) {
				charmLastChild.remove();
				charmLastChild = document.getElementById('duplicate-charms-div').lastChild;
			}
		}
	}
}

// Fin Classes

// Boutons
var boutonLogin = document.getElementById('bouton-login');
var boutonOffline = document.getElementById('bouton-offline');
var boutonScrap = document.getElementById('bouton-scrap');
var boutonRetourPageConfig = document.getElementById('bouton-retour-page-config');
var boutonShowPageConfig = document.getElementById('bouton-config');
var boutonAddCharacterConfig = document.getElementById('bouton-add-character-config');
var boutonDeleteCharacterConfig = document.getElementById('bouton-delete-character-config');

// Pages
var PageMenu = document.getElementById('page-menu');
var PageItem = document.getElementById('page-item');
var PageConfig = document.getElementById('page-config');

// Div
var DivLogin = document.getElementById('login-div');
var DivLoggedIn = document.getElementById('logged-in-div');
var DivLoadingText = document.getElementById('loading-text-div');
var DivDuplicateFilters = document.getElementById('duplicate-filters-div');
var DivDuplicateItems = document.getElementById('duplicate-items-div');
var DivDuplicateSets = document.getElementById('duplicate-sets-div');
var DivDuplicateSacred = document.getElementById('duplicate-sacred-div');
var DivDuplicateCharms = document.getElementById('duplicate-charms-div');

// Texte
var TexteErreurLogin = document.getElementById('error-login');
var TexteLoggedIn = document.getElementById('text-logged-in');
var TexteCharactersList = document.getElementById('characters-list');

// Tableaux/Dict
var TableauBouton = [];
var TableauCharacter = [];
var DictCharacter = [];
var DictItem = [];

// Variables user
var username = document.getElementById('input-username');
var password = document.getElementById('input-password');
var nbCharToScrap = 0;
var nbCharScrapped = 0;
var charsAdded = [];
var loadingChars = [];
var tmpNameGlobal = "unknown";

// Tentative de login
boutonLogin.onclick = function(){
	TexteErreurLogin.style.display = 'none';
	if ((document.getElementById('input-username').value.length < 3) || (document.getElementById('input-password').value.length < 3)) {
		TexteErreurLogin.style.display = 'inline-block';
	}
	else {
		socket.emit("login",{username:document.getElementById('input-username').value, password:document.getElementById('input-password').value});
		username = document.getElementById('input-username').value;
	}
}

// Mode offline
boutonOffline.onclick = function(){
	TexteErreurLogin.style.display = 'none';
	DivLoadingText.innerHTML = "loading characters from config file...";
	socket.emit("offline");
}

// Demande de scrap
boutonScrap.onclick = function(){
	var charToScrap = [];
	for (var i in TableauCharacter) {
		if (TableauBouton[i].value == "true") {
			charToScrap.push(TableauCharacter[i].name);
			TableauCharacter[i].refreshItems();
			loadingChars.push(TableauCharacter[i].name);
		}
	}
	if (charToScrap.length > 0) {
		nbCharToScrap = charToScrap.length;
		socket.emit("scrapRequest",charToScrap);
		for (var i in charToScrap) {
			var tmpSpan = document.createElement('span');
			tmpSpan.style.display = "inline-block";
			tmpSpan.id = 'loading-' + charToScrap[i];
			tmpSpan.innerHTML = 'waiting for server to load items from ' + charToScrap[i] + '...';
			DivLoadingText.appendChild(tmpSpan);
			var tmpBr = document.createElement('br');
			DivLoadingText.appendChild(tmpBr);
		}
	}
}

// Ajout de character au config file
boutonAddCharacterConfig.onclick = function() {
	var nom = document.getElementById('add-character-input').value;
	var txt = document.getElementById('error-addc-config');
	txt.style.display = "none";
	if (nom.length > 0) {
		txt.innerHTML = "Waiting for server...";
		txt.style.color = "white";
		txt.style.display = "inline-block";
		tmpNameGlobal = nom;
		socket.emit("addCharacterConfigRequest",nom);
	}
	else {
		txt.innerHTML = "Character name is too short.";
		txt.style.color = "red";
		txt.style.display = "inline-block";
	}
}

// Suppression de character au config file
boutonDeleteCharacterConfig.onclick = function() {
	var nom = document.getElementById('add-character-input').value;
	var txt = document.getElementById('error-addc-config');
	txt.style.display = "none";
	if (nom.length > 0) {
		txt.innerHTML = "Waiting for server...";
		txt.style.color = "white";
		txt.style.display = "inline-block";
		tmpNameGlobal = nom;
		socket.emit("deleteCharacterConfigRequest",nom);
	}
	else {
		txt.innerHTML = "Character name is too short.";
		txt.style.color = "red";
		txt.style.display = "inline-block";
	}
}

// Changement page config -> menu
boutonRetourPageConfig.onclick = function() {
	PageConfig.style.display = "none";
	PageMenu.style.display = "block";
	PageItem.style.display = "block";
}

// Changement page menu -> config
boutonShowPageConfig.onclick = function() {
	PageItem.style.display = "none";
	PageMenu.style.display = "none";
	PageConfig.style.display = "block";
}

// Fonction bouton bool scrap
function changeScrapValue(btn) {
	if (btn.value == "true") {
		btn.value = "false";
		btn.style.background = "gray";
	}
	else {
		btn.value = "true";
		btn.style.background = "white";
	}
}

// Fonction qui compare des items et les rajoute a la div html
function compareItem(nom, categorie) {
	var tmpDiv = document.getElementsByClassName(DictItem[nom][0].name);
	var divItem;
	var DivToAdd;
	var nbItem = 0;
	var total = 0;
	var tmpDivExisted = false;
	if (tmpDiv.length > 0) {
		divItem = tmpDiv[0];
		nbItem = divItem.getAttribute('data-value');
		total = divItem.getAttribute('total');
		tmpDivExisted = true;
	}
	else {
		var source = DictItem[nom][0].src;
		divItem = document.createElement('div');
		divItem.style.display = "block";
		divItem.className = DictItem[nom][0].name;
		var DivToAdd = null;
		if (categorie == "Sacred") {
			DivToAdd = DivDuplicateSacred;
		}
		else if (categorie == "Set") {
			DivToAdd = DivDuplicateSets;
		}
		else if (categorie == "Charm") {
			DivToAdd = DivDuplicateCharms;
		}
		DivToAdd.appendChild(divItem);
		var img = document.createElement('img');
		img.src = source;
		img.style.top = "50%";
		img.style.transform = "translateY(-200%)";
		img.style.display = "inline-block";
		divItem.appendChild(img);
	}
	for (var i in DictItem[nom]) {
		var item = DictItem[nom][i];
		var tmpOwner = item.owner.name;
		if ((tmpDivExisted == false) || (charsAdded.includes(tmpOwner))) {
			var div = document.createElement('div');
			div.style.display = "inline-block";
			div.className = item.owner.name;
			div.setAttribute('data-value',item.name)
			var tmp = document.createElement('span');
			tmp.innerHTML = nom;
			tmp.style.marginLeft = "2.5em";
			if (item.color == "color-gold") {
				tmp.style.color = '#a09169';
			}
			else if (item.color == "color-green") {
				tmp.style.color = 'green';
			}
			div.appendChild(tmp);
			var br = document.createElement('br');
			div.appendChild(br);
			var tmp = document.createElement('span');
			tmp.innerHTML = "OWNER: " + item.owner.name;
			tmp.style.marginLeft = "2.5em";
			div.appendChild(tmp);
			for (var j in item.desc) {
				var br = document.createElement('br');
				div.appendChild(br);
				var tmp = document.createElement('span');
				tmp.style.color = '#5050c8';
				tmp.style.marginLeft = "2.5em";
				tmp.innerHTML = item.desc[j];
				div.appendChild(tmp);
			}
			divItem.appendChild(div);
			nbItem++;
			total++;
		}
	}
	divItem.setAttribute('data-value',nbItem);
	divItem.setAttribute('total',total);
	if (tmpDiv != null) {
		if (nbItem >= 2) {
			divItem.style.display = "block";
		}
	}
}

// Fonction qui show/hide les items des persos
function showHideItemChar(btn) {
	if (loadingChars.includes(btn.value) == false) {
		var items = document.getElementsByClassName(btn.value);
		var disp = null;
		if (btn.style.background == "white") {
			btn.style.background = "gray";
			disp = "none";
		}
		else {
			btn.style.background = "white";
			disp = "inline-block";
		}
		for (var i in items) {
			if (i != "length") {
				var nomItem = items[i].getAttribute('data-value');
				var div = document.getElementsByClassName(nomItem);
				var valeur = div[0].getAttribute('data-value');
				if (disp == "none") {
					valeur--;
				}
				else {
					valeur++;
				}
				div[0].setAttribute('data-value', valeur);
				if (valeur > 1) {
					div[0].style.display = "block";
				}
				else {
					div[0].style.display = "none";
				}
				items[i].style.display = disp;
			}
			else {
				break;
			}
		}
	}
}

// Fonction Filtre affichage item dupe
function applyFilterDupeItem(btn) {
	var disp = null;
	if (btn.value == "true") {
		btn.value = "false";
		btn.style.background = "gray";
		disp = "none";
	}
	else {
		btn.value = "true";
		btn.style.background = "white";
		disp = "inline-block";
	}
	if (btn.id == "bouton-dupe-sets") {
		DivDuplicateSets.style.display = disp;
	}
	else if (btn.id == "bouton-dupe-sacred"){
		DivDuplicateSacred.style.display = disp;
	}
	else if (btn.id == "bouton-dupe-charms"){
		DivDuplicateCharms.style.display = disp;
	}
}

// Fonction qui ajoute un bouton pour les char a scrap
function addButtonScrapCharacter(characters) {
	for (var i in characters) {
		var tmp = document.createElement("button");
		tmp.id = "char" + characters[i][0];
		tmp.value = true;
		tmp.innerHTML = characters[i][0];
		tmp.style.background = "white";
		tmp.onclick = function() { changeScrapValue(this); };
		TexteCharactersList.appendChild(tmp);
		TableauBouton.push(tmp);
		var tmpChar = new Character(characters[i][0],characters[i][1],characters[i][2],characters[i][3]);
		TableauCharacter.push(tmpChar);
		DictCharacter[characters[i][0]] = tmpChar;
	}
	TexteCharactersList.style.display = 'inline-block';
	boutonScrap.style.display = 'inline-block';
}

// Erreur serveur
socket.on('serverError', function(data){
	var txt;
	if (data.code == "1") { // Login error
		TexteErreurLogin.style.display = 'inline-block';
	}
	else if (data.code == "2") { //Personnage a ajouter au config file introuvable
		txt = document.getElementById('error-addc-config');
		txt.style.color = "red";
		txt.innerHTML = "No character found with the name " + tmpNameGlobal;
		txt.style.display = "inline-block";
	}
	else if (data.code == "3") { //Personnage deja present dans config file
		txt = document.getElementById('error-addc-config');
		txt.style.color = "red";
		txt.innerHTML = "This character is already in the config file";
		txt.style.display = "inline-block";
	}
	else if (data.code == "4") { //Personnage n'existe pas dans config file
		txt = document.getElementById('error-addc-config');
		txt.style.color = "red";
		txt.innerHTML = "This character is not in the config file";
		txt.style.display = "inline-block";
	}
});

// Requetes serveur
socket.on('serverLogin', function(data){
	DivLogin.style.display = 'none';
	TexteLoggedIn.innerHTML = "Logged in on account " + username;
	TexteLoggedIn.style.display = 'inline-block';
	DivLoggedIn.style.display = 'inline-block';
	addButtonScrapCharacter(data);
});

// Requetes serveur mode offline
socket.on('serverOffline', function(data){
	DivLogin.style.display = 'none';
	DivLoadingText.innerHTML = "";
	TexteLoggedIn.innerHTML = "Not logged in, using offline mode.";
	TexteLoggedIn.style.display = 'inline-block';
	DivLoggedIn.style.display = 'inline-block';
	addButtonScrapCharacter(data.characters);
});

// Ajout character config file réussi
socket.on('serverAddedCharacterConfig', function(character) {
	var txt = document.getElementById('error-addc-config');
	txt.style.color = "yellow";
	txt.innerHTML = "Character added to the config file succesfully!";
	txt.style.display = "inline-block";
	var tmp = document.getElementById("char" + character[0][0]);
	if (tmp == null) {
		addButtonScrapCharacter(character);
	}
});

// Supression character config file réussi
socket.on('serverDeletedCharacterConfig', function(nom) {
	var txt = document.getElementById('error-addc-config');
	txt.style.color = "yellow";
	txt.innerHTML = "Character deleted from the config file succesfully!";
	txt.style.display = "inline-block";
})

// Reception d'info scrap
socket.on('scrappedInfo', function(character,items){
	var cha = DictCharacter[character];
	for (var i in items) {
		var nom = items[i][0];
		var type = items[i][1];
		var color = items[i][2];
		if (((color == "color-gold") && (type != "Quest Item") && (type != "Jewel")) || (color == "color-green")){
			var categorie = "unknown pls tell Sluggly";
			if (color == "color-green") {
				categorie = "Set";
			}
			else if (color == "color-gold") {
				if ((type == "Charm") || (type == "Relic")) {
					categorie = type;
				}
				else if (type.includes("(Sacred)")) {
					categorie = "Sacred";
				}
			}
			var tmpItem = new Item(nom,type,color,items[i][3],items[i][4],items[i][5],cha,categorie)
			cha.addItem(tmpItem);
			if (DictItem[nom] != null) {
				DictItem[nom].push(tmpItem);
			}
			else {
				DictItem[nom] = [tmpItem];
			}
		}
	}
	var tmpExist = document.getElementById("dupe-" + cha.name);
	if (tmpExist == null) {
		var tmp = document.createElement("button");
		tmp.id = "dupe-" + cha.name;
		tmp.value = cha.name;
		tmp.innerHTML = cha.name;
		tmp.style.background = "white";
		tmp.onclick = function() { showHideItemChar(this); };
		DivDuplicateFilters.appendChild(tmp);
	}
	var tmpLoadingTxt = document.getElementById('loading-' + character);
	tmpLoadingTxt.style.color = "yellow";
	tmpLoadingTxt.innerHTML = 'Finished loading items from ' + character + '.';
	nbCharScrapped++;
	charsAdded.push(character);
	if (nbCharToScrap == nbCharScrapped) {
		for (var j in DictItem) {
			if (DictItem[j].length > 1) {
				var categorie = DictItem[j][0].categorie;
				if ((categorie == 'Sacred') || (categorie == 'Set') || (categorie == 'Charm')) {
					compareItem(j, categorie);
				}
			}
		}
		DivDuplicateFilters.style.display = "inline-block";
		DivDuplicateItems.style.display = "inline-block";
		nbCharToScrap = 0;
		nbCharScrapped = 0;
		charsAdded = [];
		loadingChars = [];
		DivLoadingText.innerHTML = '';
	}
});