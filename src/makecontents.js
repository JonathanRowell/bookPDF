// Extract titles and make contents pages
// Written by Jonathan on 17 June 2025

// Note - Margin are 2cm. Verse number = 2cm on, text after 2 spaces page number at 8 cm on

// Requires
import fs from 'fs';
import path from 'path';
import nReadlines from 'n-readlines';

const dropCase = ['de','du','un','une','au','la','le'];	// TOTO later

function initCap(title) {
	const words = title.toLowerCase().split(" ");
	for (let i = 0; i < words.length; i++) {
		if((i===0)||(!dropCase.includes(words[i]))) {
			words[i] = words[i][0].toUpperCase() + words[i].substr(1);
		}
	}
	return words.join(' ');
}

function chomp(line) {
	if(line.endsWith('\n')) line = line.slice(0, -1);
	if(line.endsWith('\r')) line = line.slice(0, -1);
	return line;
}

function extractTitle(fileName, verseNumber,pageNumber) {
	var reader = new nReadlines(path.join('./data',fileName));
	// read the first line
	var buff = reader.next();
//	console.log('Buffer length='+buff.length);
//	console.log(buff.toString('hex'));
	// convert to a string
	var str = buff.toString('latin1');
	let noVerse = str[0]==='~';
	if(noVerse) { str = str.slice(1); }
//	console.log("str="+str+" length=",str.length);
	if(str.endsWith('\r')) str = str.slice(0, -1);
	// remove any "no spell" directives
	str = str.replace(/¬/g,'');
	// avoid funny characterSet
	str = str.replace(/\x92/g,"'");
	if(str.length===0) {
		// no title, continuation of previous verse
		return null;
	} else {
		console.log(str);
		// new verse, return the page number and the title init-capped
		if(noVerse) {
			return  {"title": str, "page": pageNumber};
		} else {
			return {"verse": verseNumber, "title": initCap(str), "page": pageNumber};
		}
	}
}

export function makeContentPages(pageNumber) {
	// firstiterate through all the page files
	var fileNames = fs.readdirSync('./data/').filter((word) => word.startsWith('page'));
	// Sort by extracting numbers from file names
	fileNames.sort((a, b) => {
		const numA = parseInt(a.match(/\d+/)[0], 10); // Extract and parse number from 'a'
		const numB = parseInt(b.match(/\d+/)[0], 10); // Extract and parse number from 'b'
		return numA - numB; // Compare numbers
	});
	let verseNumber = 1; let list=[];
	// now process them
	fileNames.forEach(file => {
		console.log(file);
		// the title is ALWAYS in the first line
		let reply = extractTitle(file,verseNumber,pageNumber);
		if(reply) {
			list.push(reply);
			if(reply.verse) { verseNumber++; }
		}
		pageNumber++
	});
	return list;
}


// test
console.log(makeContentPages(3));