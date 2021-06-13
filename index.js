
"use strict";


//  Load scripts[] one after the other in the specified order.
//  Call fn after the last script is loaded.
//
function loadScripts ( scripts, fn )
{
  function next ( ) {
    let src = scripts.shift();
    if ( src !== undefined ) {
//      console.log("Load "+src);
      let script = document.createElement("script");
      script.src = src ;
      script.onload = next ;
      document.head.appendChild(script);
    }
    else
      if ( fn ) fn();
  }

  next();
};


//  Load all application scripts.
//  Start application after the last script is loaded.
//
window.addEventListener("load", function() {
  loadScripts(["Menu.js",
	       "console.js",
	       "main.js"]);
} );
