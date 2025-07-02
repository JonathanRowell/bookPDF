// Make print file
// Written by Jonathan on 23 June 2025

import fs from 'fs';
import path from 'path';
import { chomp } from './util.js';
import { convertFromLatin } from './util.js';
import { getFileNames } from './util.js';
import { getForwordNames } from './util.js';
import { generateText } from './formatter.js';
import { makeContentPages } from './makeContents.js';
import nReadlines from 'n-readlines';



const FS = '\x1C';
const GS = '\x1D';
const RS = '\x1E';
const US = '\x1F';
const STX = '\x02';
const crlf = '\r\n';

var errCount = 0;
var allFiles = 0;

// This program makes a simple data file to print via a PDF object
// FS + filename (just for comments)
// US plus page number as text
// GS plus JSON of lineData
// The line ends with CR LF and the text is UFT8.
// A blank line in the print file is a blank line in the PDF file
// STX A new page (PDF addPage) is a STX alone on the line
// RS plus JSON for a table
function addPage(writer) {
	writer.write(STX+crlf);
}
	
function renderLine(writer,how,line,attrs) {
	var lineAttrs;
	// clean up the line
//	line = chomp(line);
	line = line.replace(/¬/g,'');
	if(line.length>0) {
		// get the data in the form of a list of write items
		let lineData = generateText(line,how,attrs);
		if(!lineData) {
			errCount++;
			console.log('Cannot generate text data');
			return false;
		}
		writer.write(GS+JSON.stringify(lineData,null,-1)+crlf);
	} else {
		// write a blank line
		writer.write('\r\n');
	}
	return true;
}

function renderForeword(writer,fileName,pageNumber) {
	writer.write(FS+fileName+crlf);
	// add a newpage
	addPage(writer);
	var reader = new nReadlines(path.join('./data',fileName));
	let attrs = {align: 'center'};
	// read each line and prepare for rendering
	let lineNumber = 1;
	do {
		var line = reader.next();
		if(!line) {
			addPageNumber(writer,romanize(pageNumber));
			return;	
		}
		let how = (lineNumber===1? 'l': 'n');
		line = chomp(convertFromLatin(line));
		let testLine = line.toLowerCase();
		if(testLine.startsWith('<nocenter>')) {
			delete attrs.align;
			lineNumber++;
			continue;
		}
		if(testLine.startsWith('<center>')) {
			attrs.align = 'center';
			lineNumber++;
			continue;
		}
		if(line.startsWith('~')) { line = line.slice(1,-1); }
		// render the line
		if(!renderLine(writer,how,line,attrs)) {
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
	// produce the pages - this ought to be a page in data !!
	addPage(writer);
	writer.write(GS + JSON.stringify([['l','Table des matières',{'align': 'center'}]]) + crlf);
	writer.write(crlf);
	writer.write(crlf);
	// now render the pages of index
	console.log(table);
	let i=0; let j=0; let cnt=23;
	while(i<table.length) {
		let printTable = [];
		j=0;
		do {
			printTable.push(table[i+j]);
			j++;
		} while((i+j<table.length)&&(j<=cnt));
		writer.write(RS+JSON.stringify({
			rowStyles: { border: false },
			columnStyles: ["*", 200 ,"*"],
			data: printTable
		})+crlf);
		i=i+1+cnt;
		addPageNumber(writer,romanize(pageNumber));
		if(i<table.length) { addPage(writer); }
		pageNumber++;
		cnt=25;
	}
}

function renderPoem(writer,fileName,pageNumber) {
	writer.write(FS+fileName+crlf);
	console.log('Rendering file '+fileName);
	var reader = new nReadlines(path.join('./data',fileName));
	// read each line and prepare for rendering
	let lineNumber = 1;
	// start by always rendering center
	let attrs = {align: 'center'};
	addPage(writer);
	do {
		var line = reader.next();
		if(!line) {
			addPageNumber(writer,pageNumber.toString());
			return;	
		}
		line = chomp(convertFromLatin(line));
		let testLine = line.toLowerCase();
		if(testLine.startsWith('<nocenter>')) {
			delete attrs.align;
			lineNumber++;
			continue;
		}
		if(testLine.startsWith('<center>')) {
			attrs.align = 'center';
			lineNumber++;
			continue;
		}
		// First line is always in Large Font
		if(lineNumber===1) {
			if(line[0]==='~') { line = line.slice(1,-1); }
			if(line.length>0) { line='<l>'+line+'</l>'; }
		}
		// render the line
		if(!renderLine(writer,'n',line,attrs)) {
			console.log('In file '+fileName+' at line '+lineNumber+': "'+line+'"');
			errCount++;
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
	writer.write(US+pageNumberTxt+'\r\n');
}

// See: https://stackoverflow.com/questions/13156243/event-associated-with-fs-createwritestream-in-node-js
// See also : https://stackoverflow.com/questions/12906694/fs-createwritestream-does-not-immediately-create-file
function getWriter(processFunc,finishFunc) {
	let writer = fs.createWriteStream("./tmp/printfile.txt");
	// setup the finish event
	writer.on("finish", finishFunc);
	// handle the error event
	writer.on("error", function (err) {
		console.log('Error occurred on writing to file tmp/printfile.txt');
		console.log(err);
		finishFunc();
	});
	writer.on('open',function() {
		processFunc(writer);
	});
}

function renderForewords(writer) {
	let fileNames = getForwordNames();
	let pageNumber = 1;
	fileNames.forEach(function(fileName) {
		renderForeword(writer,fileName,pageNumber);
		pageNumber++;
		allFiles++;
	});
	return pageNumber;
}

function renderPoems(writer) {
	let pageNumber = 1;
	let fileNames = getFileNames();
	fileNames.forEach(function(fileName) {
		renderPoem(writer,fileName,pageNumber);
		pageNumber++;
		allFiles++;
	});
}

function finishFunc() {
	if(errCount>0) {
		console.log('Found '+errCount+' errors, processed '+allFiles+' files');
		process.exit(0);
	} else {
		console.log('No errors found. Processed '+allFiles+' files');
		process.exit(0);
	}
}
	
function renderPrintFile(writer) {	
	// iterate over the forword
	let pageNumber = renderForewords(writer);
	// iterate over the content index
	renderIndex(writer,pageNumber);
	// Iterate over the poems
	renderPoems(writer);
	// report any errors and close the file
	writer.end();
}


// Start the program:
getWriter(renderPrintFile,finishFunc);
