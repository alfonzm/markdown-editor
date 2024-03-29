// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { ipcRenderer, remote, dialog, shell } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
import marked from 'marked';
import $ from 'jquery';
import low from 'lowdb';
import uuid from 'node-uuid';
// import behave from './lib/behave.js';

var db = low(__dirname + '/notesdb.json', {storage:require('lowdb/lib/file-async')})
var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var $editorTextarea, $output;
var notes = [];
var currentNote;
var editor;

$(document).ready(function (){
	// editor = new Behave({
	//     textarea: document.getElementById('editor')
	// });

	initializeAceEditor();

	$editorTextarea = $("#editor");
	$output = $("#output");

	marked.setOptions({
		highlight: function (code) {
			return require('highlight.js').highlightAuto(code).value;
		}
	});

	// console.log(db.setState({})) // CLEAR DB

	fetchNotesFromDB()

	// Input change handler
	$editorTextarea.bind('input propertychange', function(){
		saveNote();
		refreshOutput();
	});

	// Force link clicks to open in default OS browser
	$('#a').bind('click', function(e){
		e.preventDefault();
		shell.openExternal($(this).attr('href'));
	});

	// Toggle notelist button
	$('#toggle-note-list').bind('click', function(e){
		$('#note-list').animate({"margin-left":"-=250"}, 200, 'swing');
	});

	// Select note from note list
	$('#note-list ul li').on('click', function(e){
		selectANoteFromNoteList($(this))
	})
});

function initializeAceEditor() {
	editor = ace.edit("editor");
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode("ace/mode/markdown");
    editor.setOptions({
        showGutter: false,
        fontFamily: 'Menlo',
        showLineNumbers: false,
        fontSize: '9pt',
        wrap: true,
        showPrintMargin: false
    });

    editor.container.style.lineHeight = 1.5;
    editor.container.style.padding = '20px';

    // editor.renderer.setPadding(30);
    // editor.renderer.setScrollMargin(30,30,0,-30);

    editor.on('change', function(){
		saveNote();
		refreshOutput();
    });
}

function fetchNotesFromDB(){
	db.defaults({'notes': []}).value()

	notes = db.get('notes').value()

	if(notes.length == 0){
		db.get('notes').push({'id': uuid.v4(), 'body':'# New Note qwjeqwjlkeqwlk', 'updated_at': new Date().getTime()}).value()
		db.get('notes').push({'id': uuid.v4(), 'body':'# hello!\n\nomg this is really awesome', 'updated_at': new Date().getTime()}).value()
		db.get('notes').push({'id': uuid.v4(), 'body':'aw yiss', 'updated_at': new Date().getTime()}).value()
	} else {
		console.log(notes)
	}

	addNotesToNoteList()
	selectANoteFromNoteList($('#note-list ul li:first'))
}

function displayNote(note){
	currentNote = note;
	editor.setValue(note.body);
	refreshOutput();
}

function addNotesToNoteList(){
	notes.map(function(note){
		$('#note-list ul').prepend('<li id=' + note.id + '><h1>' + note.body.substr(0,15) + '...</h1><span>' + note.updated_at + '</span></li>');
	});
}

function selectANoteFromNoteList($noteElement){
	var id = $noteElement.attr('id')

	var note = notes.find(function (o){
		{ return o.id == id }
	})

	$('.active').removeClass('active')
	$noteElement.addClass('active')

	displayNote(note)
}

function saveNote(){
	currentNote.body = editor.getValue()
	db.get('notes').find({id:currentNote.id}).assign({
		body: currentNote.body,
		updated_at: new Date().getTime()
	}).value()
}

function refreshOutput(){
	$output.html(marked(editor.getValue()));
	// $output.html(marked($editorTextarea.val()));
}

ipcRenderer.on('getEditorContents', function(event){
	ipcRenderer.send('saveFile', $editorTextarea.val())
});

ipcRenderer.on('loadEditorContents', function(event, data){
	$editorTextarea.val(data)
	refreshOutput()
});

ipcRenderer.on('togglePreview', function(event){
	$output.toggle()
	editor.resize(true)
	// $output.remove()
});

ipcRenderer.on('test', function(event, data){
	console.log('test')
	console.log(data)
});