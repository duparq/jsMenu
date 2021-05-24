
"use strict";


function connect ( element, eventname, fn, arg1, arg2 )
{
  element.addEventListener(eventname, function(ev) { return fn.call(arg1, arg2, ev); } );
}


function eatev ( o, ev )
{
  ev.stopPropagation();
  ev.preventDefault();
}


//    M a i n
//
function main ( )
{
  let topbar = document.createElement("div");
  topbar.id = "topbar";
  document.body.appendChild( topbar );

  let bottom = document.createElement("div");
  bottom.id = "bottom";
  document.body.appendChild( bottom );

  let appname = document.createElement("span");
  appname.id = "appname";
  appname.innerHTML = "Menus demo" ;
  topbar.appendChild( appname );

  let div = document.createElement("div");
  div.id = "menus";
  topbar.appendChild( div );

  let menubar = new Menubar( div, menus );

  div = document.createElement("div");
  div.id = "console";
  bottom.appendChild( div );

  console.redirect(true);
  trace();
}


//  Load scripts[] one after the other in the specified order.
//  Call fn after the last script is loaded.
//
function loadScripts ( scripts, fn )
{
  function loadNext ( ) {
    let src = scripts.shift();
    if ( src !== undefined ) {
      let script = document.createElement("script");
      script.src = src ;
      script.onload = loadNext ;
      document.head.appendChild(script);
    }
    else
      fn();
  }

  loadNext();
};


//  Load all application scripts.
//  Start application after the last script is loaded.
//
window.addEventListener("load", function() {
  loadScripts(["Menubar.js",
	       "console.js",
	       "menus.js"],
	      main);
} );
