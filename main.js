
"use strict";

let contextmenu ;


function trace ( msg=null )
{
  if ( msg == null )
    msg = "";
  else
    msg="("+msg+")";
  // console.log(new Error().stack.split('\n')[1].replace('@','	'));
  console.log(new Error().stack.split('\n')[1].split('@')[0]+msg);
}


//    M a i n
//
function main ( )
{
  let topbar = document.createElement("div");
  topbar.id = "topbar";
  document.body.appendChild( topbar );

  let appname = document.createElement("span");
  appname.id = "appname";
  appname.innerHTML = "Menu demo" ;
  topbar.appendChild( appname );

  let div = new Menu( menubar );
  div.id = "menubar";
  topbar.appendChild( div );

  let bottom = document.createElement("div");
  bottom.id = "bottom";
  document.body.appendChild( bottom );

  div = document.createElement("div");
  div.id = "console";
  bottom.appendChild( div );
  div.addEventListener("mousedown", mouseDown );
  document.addEventListener("contextmenu", eatEvent );

  contextmenu = new Menu( contextmenudef );

  console.clear();
  console.redirect(true);
  trace();
}


function eatEvent ( ev )
{
  trace(ev.x+", "+ev.y);
  ev.stopPropagation();
  ev.preventDefault();
}


function mouseDown ( ev )
{
  ev.stopPropagation();
  ev.preventDefault();

  trace(ev.x+", "+ev.y);

  //  Process right button only
  //
  if ( ev.button == 2 )
    contextmenu.begin(ev.x,ev.y);
}


loadScripts(["menubar.js","contextmenu.js"], main);
