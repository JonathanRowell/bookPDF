// Make print file
// Written by Jonathan on 23 June 2025

import fs from 'fs';
import path from 'path';
import { chomp } from './util.js';
import { convertFromLatin } from './util.js';
import { getFileNames } from './util.js';
import { generateText } from './formatter.js';
import { makeContentPages } from './makeContents.js';
import nReadlines from 'n-readlines';



const FS = '\x1C';
const GS = '\x1D';
const RS = '\x1E';
const US = '\x1F';
const STX = '\x02';
const crlf = '\r\n';

// This program makes a simple data file to print via a PDF object
// FS + filename (just for comments)
// US plus page number as text
// GS plus JSON of lineData
// The line ends with CR LF and the text is UFT8.
// A blank line in the print file is a blank line in the PDF file
// STX A new page (PDF addPage) is a STX alone on the line
// US plus JSON for a table
function addPage(writer) {
	writer.write(STX+crlf);
}
	
function renderLine(writer,line,attrs) {
	var lineAttrs;
	// clean up the line
//	line = chomp(line);
//	line = line.replace(/¬/g,'');
	if(line.length>0) {
		// get the data in the form of a list of write items
		let lineData = generateText(line);
		if(!lineData) {
			errCount++;
			console.log('Cannot generate text data');
			return false;
		}
		writer.write(GS+JSON.stringify(lineData[i],null,-1)+crlf);
	} else {
		// write a blank line
		writer.write('\r\n');
	}
	return true;
}

function renderForeword(writer,fileName) {
	// add a newpage
	addPage(writer);
	var reader = new nReadlines(path.join('./src',fileName));
	let attrs = {align: 'center'};
	// read each line and prepare for rendering
	let lineNumber = 1;
	do {
		var line = reader.next();
		if(!line) {
			return;	
		}
		line = chomp(convertFromLatin(line));
		let testLine = line.toLowerCase();
		if(testLine.startsWith('<nocenter>')) {
			delete attrs.align;
			continue;
		}
		if(testLine.startsWith('<center>')) {
			attrs.align = 'center';
			continue;
		}
		// render the line
		if(!renderLine(writer,line,attrs)) {
			console.log('In file '+fileName+' at line '+lineNumber+': "'+line+'"');
			return;
		}
		lineNumber++;
	} while(true);
}

function renderIndex(writer,pageNumber) {
	let indexes = makeContentPages(pageNumber);
	// transform to a three column table
	let table =[];
	indexes.forEach(function(entry) {
		let newRow = [];
//		newRow.push((entry.verse? entry.verse : ' '));
		newRow.push((entry.verse? {align: "right",text: entry.verse} : ' '));
		newRow.push(entry.title);
		newRow.push({align: "right", text:entry.page});
		table.push(newRow);
	});
	// produce the pages - this ought to be a page in src !!
	addPage(writer);
	writer.write(GS + JSON.stringify([['l','Table des matières',{'align': 'center'}]]) + crlf);
	writer.write(crlf);
	writer.write(crlf);
	// now render the pages of index
	console.log(table);
	let i=0; let j=0; let cnt=21;
	while(i<table.length) {
		let printTable = [];
		j=0;
		do {
			printTable.push(table[i+j]);
			j++;
		} while((i+j<table.length)&&(j<=cnt));
		writer.write(US+JSON.stringify({
			rowStyles: { border: false },
			columnStyles: ["*", 200 ,"*"],
			data: printTable
		}));
		i=i+cnt;
		addPageNumber(writer,romanize(pageNumber));
		if(i<table.length) { addPage(writer); }
		pageNumber++;
		cnt=23;
	}
}

function renderPoem(writer,fileName,pageNumber) {
	console.log('Rendering file '+fileName);
	var reader = new nReadlines(path.join('./src',fileName));
	// read each line and prepare for rendering
	let lineNumber = 1;
	// start by always rendering center
	let attrs = {align: 'center'};
	addPage(writer);
//	poemStarted(doc,pageNumber);	
	do {
		var line = reader.next();
		if(!line) {
			addPageNumber(doc,pageNumber.toString());
			return;	
		}
		line = chomp(convertFromLatin(line));
		let testLine = line.toLowerCase();
		if(testLine.startsWith('<nocenter>')) {
			delete attrs.align;
			continue;
		}
		if(testLine.startsWith('<center>')) {
			attrs.align = 'center';
			continue;
		}
		// First line is always in Large Font
		if(lineNumber===1) {
			if(line[0]==='~') { line = line.slice(1,-1); }
			if(line.length>0) { line='<l>'+line+'</l>'; }
		}
		// render the line
		if(!renderLine(writer,line,attrs)) {
			console.log('In file '+fileName+' at line '+lineNumber+': "'+line+'"');
			return;
		}
		lineNumber++;
	} while(true);
}

// Taken from : https://stackoverflow.com/questions/9083037/convert-a-number-into-a-roman-numeral-in-javascript
function romanize (num) {
    if (isNaN(num)) { return NaN; }
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--) {
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
	}
    return Array(+digits.join("") + 1).join("M") + roman;
}

function addPageNumber(writer,pageNumberTxt) {
	writer.write(STX+pageNumberTxt+'\r\n');
}

// See: https://stackoverflow.com/questions/13156243/event-associated-with-fs-createwritestream-in-node-js
function getWriter(finishFunc) {
	let writer = fs.createWriteStream("./tmp/printfile.txt");
	// setup the finish event
	writer.on("finish", finishFunc);
	// handle the error event
	writer.on("error", function (err) {
		console.log('Error occurred on writing to file tmp/printfile.txt');
		console.log(err);
	});
	return writer;
}

function renderPoems(writer) {
	let pageNumber = 1;
	let fileNames = getFileNames();
	fileNames.forEach(function(fileName) {
		renderPoem(writer,fileName,pageNumber);
		pageNumber++;
	});
}

function makePrintFile() {
	// open the print file in the tmp directory
	let writer = getWriter(finishFunc);
	// iterate over the forword
	let pageNumber = renderForword(writer);
	// iterate over the content index
	renderIndex(writer);
	// Iterate over the poems
	renderPoems(writer);
	// report any errors and close the file
	finishFunc();
}


