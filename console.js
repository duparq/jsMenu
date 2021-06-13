
"use strict";


console.cbSetup = function ( entry )
{
  entry.checked = (console.org_log != undefined);
};


console.cbChange = function ( entry )
{
  console.redirect(entry.checked);
};


//  Replace log and clear functions.
//
console.redirect = function ( v )
{
  if ( v==true ) {
    console.org_log = console.log ;
    console.log = function ( s ) {
      let c = document.getElementById("console");
      c.textContent += s+"\n" ;
      c.scrollTop = c.scrollHeight ;
    };

    console.org_clear = console.clear ;
    console.clear = function ( ) {
      let c = document.getElementById("console");
      c.textContent="";
    };
  }
  else {
    console.log = console.org_log ;
    console.org_log = undefined ;
    console.clear = console.org_clear ;
    console.org_clear = undefined ;
  }
};
