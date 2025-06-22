// Spelling check program for French
// Written by Jonathan on 10 June 2025


// Requires
import fs from 'fs';
import path from 'path';
import nReadlines from 'n-readlines';
import nspell from 'nspell';
import NlpjsTFr from 'nlp-js-tools-french';
import { chomp } from './util.js';

//const dictionary = require('dictionary-fr');
import dictionaryFr from 'dictionary-fr';
// console.log(dictionaryFr);

var config = {
    tagTypes: ['art', 'ver', 'nom'],
    strictness: false,
    minimumLength: 3,
    debug: false
};

var errCount = 0;
var errFiles = 0;
var allFiles = 0;

var stopDictionary;

const isUpperCase = str => str === str.toUpperCase();

function isNumeric(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

function splitWords(string) { 
	return string.split(/\s/).filter(i => i !== '') 
}

function deleteNotSections(line,lineNumner,page) {
	var count = (line.match(/¬/g) || []).length;
	if(count % 2) {
		console.log('Error in file '+page+' line '+lineNumber+' not signs(¬) not even number ('+count+')');
		errCount++;
		return line;
	} else {
		 while(line.includes('¬')) {
			 line = line.replace(/¬.*¬/, '');
		 }
		 return line;
	}
}

function initCap(tokens,index,suggestions) {
	let word = tokens[index].word;
	let test = word[0].toUpperCase() + word.slice(1);
	for(let i=0; i<suggestions.length; i++) {
		let suggestion = suggestions[i];
		if((suggestion.length===test.length)&&(suggestion===test)) { return true; }
//		console.log('Test="'+test+'" suggestion="'+suggestion+'"');
	}
	return false;
}

function countSpaceGaps(line) {
	var count=0;
	var spaceSeen = 0;
	for(let i=0; i<line.length; i++) {
		if(line[i]===' ') {
			spaceSeen++;
		} else {
			if(spaceSeen>1) { count++; }
			 spaceSeen=0;
		}
	}
	return count;
}

function prepareIgnoreWords() {
	var list = []; //perhaps
	// open the ignore.txt file (it is in UTF-8)
	var reader = new nReadlines(path.join('./src','ignore.txt'));
	// read each line and prepare the ListFormat
	do {
		var line = reader.next();
		if(!line) { return list; }
		line = chomp(line.toString());
//		console.log(line);
		if((line.length===0)||(line.startsWith('#'))) { continue; }
		var index = line.indexOf('#');
		if(index!==-1) { line=line.slice(0,index); }
		// now split the line into tokens
		var subList = splitWords(line);
		list = [...new Set([...list ,...subList])]; //   => remove duplication
	} while(true);
}

function createStopDictionary(spell) {
	var stopList = [];
	var words = prepareIgnoreWords();
	words.forEach(function(word) {
		if(word.length>config.minimumLength) {
			if(spell.correct(word)) {
				console.log('Warning processing ignore list: word "'+word+'" is in the dictionary');
			} else {
				stopList[word.toLowerCase()]=word;
			}
		}
	});
	return stopList;
}
function lostUpperAccent(word,suggestion) {
	if((suggestion)&&(suggestion.length>0)&&isUpperCase(word[0])) {
		// check that they are essentiall the same word
		return word.slice(1,-1)===suggestion[0].slice(1,-1);
	} else {
		return false;
	}
}

function ondictionary(dict) {
  var spell = nspell(dict);
  stopDictionary = createStopDictionary(spell);

  // now process the files starting with "page"
  var fileNames = fs.readdirSync('./src/').filter((word) => word.startsWith('page'));
  // Sort by extracting numbers from file names
  fileNames.sort((a, b) => {
	const numA = parseInt(a.match(/\d+/)[0], 10); // Extract and parse number from 'a'
	const numB = parseInt(b.match(/\d+/)[0], 10); // Extract and parse number from 'b'
	return numA - numB; // Compare numbers
  });
  // now process them
  fileNames.forEach(file => {
	console.log(file);
	processFile(file,spell);
	allFiles++;
  });
  // summary
  if(errCount>0) {
	  console.log('Found '+errCount+' errors in '+errFiles+' files, processed '+allFiles+' files');
	  process.exit(1);
  } else {
	  console.log('No errors found. Processed '+allFiles+' files');
	  process.exit(0);
  }
}
 
function processFile(fileName,spellChecker) {
	// read the file into lines
	var reader = new nReadlines(path.join('./src',fileName));
	var lineNumber = 0;
	var fileOK = true;
	do {
		var buff = reader.next();
		if(!buff) {
			if(!fileOK) { errFiles++; }
			// end of this file
			return;
		}
		var line = buff.toString('latin1');
		lineNumber++;
		var gaps = countSpaceGaps(line);
		if(gaps>0) {
			errCount++;
			console.log('"'+line+'"');
			console.log('Error in file "'+fileName+'" at line '+lineNumber+' contains '+gaps+' multiple space gaps');
		}
		if(line[0]===' ') {
			console.log('"'+line+'"');
			console.log('Warning in file "'+fileName+'" at line '+lineNumber+' space at the beginning of the line');
		}
		if(line[line.length-1]===' ') {
			console.log('"'+line+'"');
			console.log('Warning in file "'+fileName+'" at line '+lineNumber+' space at the end of the line');
		}
/* 		if(line.indexOf("\x92")>0) {
			console.log('"'+line+'"');
			console.log('Warning in file "'+fileName+'" at line '+lineNumber+' contains a "92" right quotation mark');
		}
 */		
		// report misplaced - signs
		let minus = line.indexOf('-');
		if((minus!==-1)&&(minus>1)&&(minus+1<line.length)) {
			if( ((line[minus-1]===' ')&&(line[minus+1]!==' ')) ||
			    ((line[minus-1]!==' ')&&(line[minus+1]===' ')) ) {
				console.log('Warning: misplaced "-" sign in line '+lineNumber);
			}
		}
		// delete sections containing countSpaceGaps "¬" signs
 		line = deleteNotSections(line,lineNumber,fileName);
		// tokenize the line
		var done = false;
		var nlpToolsFr = new NlpjsTFr(chomp(line), config);	
		var tokens = nlpToolsFr.posTagger();
		tokens.forEach(function check(token,index) {
			if(isNumeric(token.word)) { return; }
			if(spellChecker.correct(token.word)) { return; }
			// word incorrect - try stopWord
			if(stopDictionary[token.word.toLowerCase()]) { return; }
			var suggestion = spellChecker.suggest(token.word);
			if(lostUpperAccent(token.word,suggestion)) { return; }
			if(initCap(tokens,index,suggestion)) { return; }
			if(!done) {
				console.log(line);
				done=true;
				fileOK=false;
			}
			var suggestion = spellChecker.suggest(token.word);
			var txt = (suggestion&&(suggestion.length>0)?', suggest '+suggestion : '');
			console.log('Error in file "'+fileName+'" at line '+lineNumber+':1 "'+token.word+'"'+txt);
			errCount++;
		});
	} while(true);
}

// START OF PROGRAM
ondictionary(dictionaryFr);

