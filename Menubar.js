
"use strict";

//  Menu elements are described by object literals:
//
//    Menu: {
//      type:"menu"
//      name:"name"		// Displayed in the parent
//      items:[{},...]		// Menu, Action, Separator, Radio, Checkbox
//    }
//
//    Action: {
//      type:"action"
//      name:"name"		// What is displayed in the menu
//      setup:			// A function that will init the entry
//      action:action		// What to do when the item is clisked
//    }
//
//    Separator: {
//      type: "sep"
//    }
//
//    Radio: {
//      type:"radio"
//      name:"name"		// Name of the radio group
//      items:["Choice",...]	// List of items
//      checked:		// The items that is checked [0..n]
//      setup:			// A function that will init the group
//      action:			// What to do when a new choice is clicked
//    }
//
//    Checkbox: {
//      type:"checkbox"
//      name:"name"		// Name of the radio group
//      checked:		// The items is checked (true|false)
//      setup:			// A function that will init the entry
//      action:			// What to do when the box is changed
//    }


//  The menu bar displays menu labels and handles menu events.
//    A 'mousedown' event on a label starts a menu session.
//
function Menubar ( div, menus=[] )
{
  this.name = "Menubar";
  this.div = div;
  this.div.classList="menubar";
  this.stack = [];		// Stack of displayed menus
  this.menu = null;
  this.gnd = null ;
  this.timeout = 0 ;
  this.delay = 150 ;		// Delay (ms) before updating menus
  this.install( menus );
};


//  Add a menu to the bar.
//    Create the DOM label.
//
Menubar.prototype.install = function ( menus )
{
  this.menus = []
  for ( let menu of menus ) {
    this.menus.push(menu);
    menu.menubar = this ;

    let e = document.createElement("a");
    e.classList="label";
    e.innerHTML=menu.name;
    this.div.appendChild(e);
    menu.label = e ;

    connect( e, "mousedown", Menubar.prototype.begin, this, menu );
  }
};


//  Begin a menu session.
//    Create a ground and display the menu.
//    There's always a displayed menu until the end of the menu session.
//
Menubar.prototype.begin = function ( menu, ev )
{
  if ( ev.button != 0 )
    return ;

  console.clear();
  trace(menu.name);

  //  Hide application menubar
  //
  this.div.style.visibility = "hidden";

  //  Create a ground for menu elements
  //
  this.gnd = document.createElement("div");
  this.gnd.style.position = "absolute";
  this.gnd.style.left = "0";
  this.gnd.style.top = "0";
  this.gnd.style.width = "100%";
  this.gnd.style.height = "100%";
  // this.gnd.style.backgroundColor = "blue";
  document.body.appendChild(this.gnd);

  //  Mouse clicks outside of menu elements end the session
  //
  connect( this.gnd, "mousedown", Menubar.prototype.end, this );
  connect( this.gnd, "mouseup", Menubar.prototype.end, this );

  //  Key 'Escape' ends the session
  //
  this.gnd.tabIndex = "-1";
  this.gnd.focus();
  connect( this.gnd, "keydown", Menubar.prototype.keyDown, this );

  //  Create a copy of the menubar on the ground.
  //    Note: the copy of the menu label that started the session receives a
  //    'mouseenter' event and calls 'showMenu'.
  //
  const r = this.div.getBoundingClientRect();
  let bar = document.createElement("div");
  bar.classList="menubar";
  bar.style.position = "absolute";
  bar.style.left = r.left+"px" ;
  bar.style.top = r.top+"px" ;
  // bar.style.backgroundColor="#fee";
  this.gnd.appendChild(bar);

  for ( let m of this.menus ) {
    m.level = 0;
    let e = document.createElement("a");
    e.classList="label";
    e.innerHTML=m.name;
    bar.appendChild(e);
    connect( e, "mouseenter", Menubar.prototype.showMenu, this, m );
    connect( e, "mouseup", eatev );
  }

  this.action = null ;
  this.showMenu(menu,ev);
};


//  Key 'Esc' ends the session.
//
Menubar.prototype.keyDown = function ( o, ev )
{
  if ( ev.key === "Escape" )
    this.end();
};


//  End of menu interaction.
//
Menubar.prototype.end = function ( )
{
  trace();

  //  Destroy all the menus elements and the ground
  //
  while ( this.stack.length ) {
    let top = this.stack.pop();
    console.log("  hide:"+this.stack.length+" "+top.name)
    top.div.parentNode.removeChild( top.div );
    top.div = null;
  }

  document.body.removeChild(this.gnd);
  this.gnd = null ;

  //  Show application menubar
  //
  this.div.style.visibility = "visible";

  if ( this.action ) {
    if ( this.action.action ) {
      this.action.action();
    }
    else {
      console.log("Undefined action for \""+this.action.name+"\"");
    }
  }
};


//  Remove all menus of higher level that 'menu'.
//
Menubar.prototype.delayTopMenu = function ( menu, ev )
{
  if ( this.delay ) {
    if ( this.timeout ) {
      console.log("  clearTimeout("+this.timeout+")");
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout( Menubar.prototype.topMenu.bind(this,menu,ev), this.delay );
    console.log("  timeout="+this.timeout);
  }
  else
    this.topMenu(menu,ev);
}

Menubar.prototype.topMenu = function ( menu, ev )
{
  trace(menu.name+", "+menu.level);

  if ( this.timeout )
    this.timeout = 0 ;

  while ( this.stack.length > menu.level+1 ) {
    let top = this.stack.pop();
    console.log("  hide:"+this.stack.length+" "+top.name)
    top.div.parentNode.removeChild( top.div );
    top.div = null;
  }
}


//  Ensure a menu is displayed.
//    If there is a different menu at the same level, all the menus of this
//    level or higher are first destroyed.
//
Menubar.prototype.delayShowMenu = function ( menu, ev )
{
  if ( this.delay ) {
    if ( this.timeout ) {
      console.log("  clearTimeout("+this.timeout+")");
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout( Menubar.prototype.showMenu.bind(this,menu,ev), this.delay );
    console.log("  timeout="+this.timeout);
  }
  else
    this.showMenu(menu,ev);
}

Menubar.prototype.showMenu = function ( menu, ev )
{
  trace(menu.name+", "+menu.level);

  if ( this.timeout )
    this.timeout = 0 ;

  ev.stopPropagation();
  ev.preventDefault();

  if ( this.stack.length > menu.level ) {
    if ( this.stack[menu.level] == menu )
      return ;

    //  Remove all higher-level menus
    //
    while ( this.stack.length > menu.level ) {
      let top = this.stack.pop();
      console.log("  hide:"+this.stack.length+" "+top.name)
      top.div.parentNode.removeChild( top.div );
      top.div = null;
    }
  }

  //  Set new top-level menu
  //
  this.stack.push(menu) ;

  let label = ev.target;

  let div = document.createElement("div");
  div.classList="menu";
  let t = document.createElement("table");
  let tb = document.createElement("tbody");

  if ( label.parentNode.classList == "menubar" ) {
    //
    //  Place the menu under the menubar label
    //
    let r = label.getBoundingClientRect();
    div.style.left = r.left+"px";
    div.style.top = r.top+label.offsetHeight+"px";
  }
  else if ( label.parentNode.tagName == "TBODY" ) {
    //
    //  Place the menu beside its label in a parent menu
    //
    let r = label.getBoundingClientRect();
    let t = label.parentNode.getBoundingClientRect();
    div.style.left = t.right+"px";
    div.style.top = r.top+"px";
  }
  else
    console.log("  label.parentNode.tagName="+label.parentNode.tagName+
		", label.parentNode.classList="+label.parentNode.classList);

  //  Populate the menu
  //
  for ( let i of menu.items ) {
    if ( i.type === "action" ) {
      //
      //  Action
      //
      if ( i.setup )	i.setup(i);	// Setup function (enable/disable action)

      let tr = document.createElement("tr");
      tr.classList="entry action";

      let td = document.createElement("td");
      td.classList="icon";
      tr.appendChild( td );

      td = document.createElement("td");
      td.classList="label";
      td.innerHTML = i.name;
      tr.appendChild( td );

      td = document.createElement("td");
      td.classList="accel";
      tr.appendChild( td );
      tb.appendChild( tr );

      //  Catch mousedown events (trigger action at mouseup over the label).
      //  Record action for execution after the menus are closed.
      //
      connect( tr, "mousedown", eatev, this, i );
      connect( tr, "mouseup", function(action,ev){this.action=action;}, this, i );
      connect( tr, "mouseenter", Menubar.prototype.delayTopMenu, this, menu );
    }
    else if ( i.type === "separator" ) {
      //
      //  Separator
      //
      let tr = document.createElement("tr");
      tr.classList="separator";

      let td = document.createElement("td");
      td.setAttribute('colSpan', '3');

      let hr = document.createElement('hr');
      hr.setAttribute('size', '1');
      td.appendChild(hr);

      tr.appendChild( td );
      tb.appendChild( tr );
    }
    else if ( i.type === "menu" ) {
      //
      //  Menu (submenu)
      //
      i.level = menu.level+1 ;
      let tr = document.createElement("tr");
      tr.classList="entry menu";

      let td = document.createElement("td");
      td.classList="icon";
      tr.appendChild( td );

      td = document.createElement("td");
      td.classList="label";
      td.innerHTML = i.name;
      tr.appendChild( td );

      td = document.createElement("td");
      td.classList="sub";
      td.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">'+
	'<path d="M 10,3 15,8 10,13" />'+
	'</svg>';

      tr.appendChild( td );
      tb.appendChild( tr );

      connect( tr, "mousedown", eatev );
      connect( tr, "mouseup", eatev );
      connect( tr, "mouseenter", Menubar.prototype.delayShowMenu, this, i );
    }
    else if ( i.type === "radio" ) {
      //
      //  Radio group: create one entry per input
      //    Icon is made with SVG.
      //    The entry element has the "checked" class when the icon is checked.
      //
      if ( i.setup )	i.setup(i);	// Setup function for the group

      if ( !(i.checked >= 0 && i.checked < i.items.length) )
	i.checked = 0 ;

      i.dom = [];
      let n=0 ;
      for ( let entry of i.items ) {
	let tr = document.createElement("tr");
	let td = document.createElement("td");
	td.classList="icon";
	td.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">'+
	  '<circle class="box" cx="10" cy="10" r="9" />'+
	  '<circle class="check" cx="10" cy="10" r="4" />'+
	  '</svg>';
	tr.appendChild( td );

	td = document.createElement("td");
	td.classList="label";
	td.setAttribute('colSpan', '2');
	let label = document.createElement("label");
	label.innerHTML = entry ;
	td.appendChild( label );
	tr.appendChild( td );
	tb.append( tr );

	if ( i.checked == n )
	  tr.classList="entry radiobox checked";
	else
	  tr.classList="entry radiobox";

	i.dom.push(tr);

	connect( tr, "mousedown", eatev );
	connect( tr, "mouseup", Menubar.radioMouseUp, this, {radio:i,n:n} );
	connect( tr, "mouseenter", Menubar.prototype.delayTopMenu, this, menu );

	n++ ;
      }
    }
    else if ( i.type === "checkbox" ) {
      //
      //  Checkbox
      //    Icon is made with SVG.
      //    The entry element has the "checked" class when the icon is checked.
      //
      if ( i.setup )	i.setup(i);	// Setup function (check/uncheck)

      let tr = document.createElement("tr");
      let td = document.createElement("td");
      td.classList="icon";
      td.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" class="checkbox" viewBox="0 0 20 20">'+
      	'<rect class="box" x="1" y="1" width="18" height="18" rx="4" ry="4" />'+
      	'<path class="check" d="M 5,10 10,15 15,5" /> '+'</svg>';
      tr.appendChild( td );

      td = document.createElement("td");
      td.classList="label";
      td.setAttribute('colSpan', '2');
      let label = document.createElement("label");
      label.innerHTML = i.name ;
      td.appendChild( label );
      tr.appendChild( td );
      tb.append( tr );

      if ( i.checked )
	tr.classList="entry checkbox checked";
      else
	tr.classList="entry checkbox";

      i.dom = tr;

      connect( tr, "mousedown", eatev );
      connect( tr, "mouseup", Menubar.checkboxMouseUp, this, i );
      connect( tr, "mouseenter", Menubar.prototype.delayTopMenu, this, menu );
    }
    else
      console.log("Unknown menu entry type \""+i.type+"\"");
  }

  t.appendChild( tb );
  div.appendChild( t );
  this.gnd.appendChild( div );
  menu.div = div ;
};


//  'mouseup' on a radiobox entry.
//
Menubar.radioMouseUp = function ( args, ev )
{
  if ( ev.button != 0 )
    return ;

  ev.stopPropagation();
  ev.preventDefault();

  console.log("  radio \""+args.radio.name+"\":"+args.n);

  if ( args.radio.checked != args.n ) {
    args.radio.dom[args.radio.checked].classList.remove("checked") ;
    args.radio.checked = args.n ;
    args.radio.dom[args.radio.checked].classList.add("checked") ;

    if ( args.radio.action )
      args.radio.action( args.radio );
  }
}


//  'mouseup' on a checkbox entry.
//
Menubar.checkboxMouseUp = function ( entry, ev )
{
  if ( ev.button != 0 )
    return ;

  ev.stopPropagation();
  ev.preventDefault();

  if ( entry.checked ) {
    entry.checked = false ;
    entry.dom.classList.remove("checked");
  }
  else {
    entry.checked = true ;
    entry.dom.classList.add("checked");
  }
  
  console.log("  checkboxChange \""+entry.name+"\":"+entry.checked);

  if ( entry.action )
    entry.action(entry);
}
