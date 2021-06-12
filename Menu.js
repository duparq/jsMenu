
"use strict";

//  Menu elements are described by object literals:
//
//    Menubar: {
//      type:"menubar"
//      name:""
//      items:[{},...]		// Menu, Action, Separator, Radio, Checkbox
//    }
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
//      checked:		// The item that is checked [0..n]
//      setup:			// A function that will init the group
//      action:			// What to do when a new choice is clicked
//    }
//
//    Checkbox: {
//      type:"checkbox"
//      name:"name"		// Name of the radio group
//      checked:		// The item is checked (true|false)
//      setup:			// A function that will init the entry
//      action:			// What to do when the box is changed
//    }


//  The menu displays menu entries and handles menu events.
//    A 'mousedown' event on an entry starts a menu session.
//
function Menu ( menu={} )
{
  this.name = "Menu";
  this.stack = [];		// Stack of displayed menus
  this.gnd = undefined ;	// DOM element that collects events outside menu elements
  this.active = undefined ;	// Current active entry
  this.timeout = undefined ;	// Timeout for menu popup
  this.popupDelay = 150 ;	// Delay (ms) between activation and menu popup

  this.div = document.createElement("div");
  this.install( menu );

  return this.div ;
};


//  Create a menu.
//    Create the DOM elements for the entries.
//
Menu.prototype.install = function ( menu )
{
  this.menu = menu;
  if ( menu.type === "menubar" ) {
    //
    //  A menu bar displays menu labels and handles menu events.
    //  A 'mousedown' event on a label starts a menu session.
    //  This label is not activated, its copy will be.
    //
    this.div.classList="menubar";
    for ( let m of menu.items ) {
      let e = document.createElement("a");
      e.classList="entry";
      e.innerHTML=m.name;
      this.div.appendChild(e);
      m.dom = e ;		//  DOM element for menu entry
      m.parent = menu ;

      Menu.connect( e, "mousedown", Menu.prototype.begin, this, m );
    }
  }
  else
    trace("ERROR: unknown type of menus '"+menu.type+"'.");
};



//  Begin a menu session. There's always at least one menu displayed until the
//  end of the menu session.
//    
//    Create a ground and display the menu.
//
Menu.prototype.begin = function ( menu, ev )
{
  if ( this.menu.type === "menubar" ) {

    //  A menubar session begins by a left button down
    //
    if ( ev.button != 0 )
      return ;

    console.clear();
    trace(menu.name);

    //  Hide application's menubar
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
    document.body.appendChild(this.gnd);

    //  Mouse clicks outside of menu elements end the session
    //
    Menu.connect( this.gnd, "mousedown", Menu.prototype.end, this );
    Menu.connect( this.gnd, "mouseup", Menu.prototype.end, this );

    //  Receive 'keydown' events
    //
    this.gnd.tabIndex = "-1";
    this.gnd.focus();
    Menu.connect( this.gnd, "keydown", Menu.prototype.keyDown, this );

    //  Create a copy of the menubar on the ground.
    //    Note: the copy of the entry that started the session receives the
    //    'mouseenter' event when created.
    //
    const r = this.div.getBoundingClientRect();
    let bar = document.createElement("div");
    bar.classList="menubar";
    bar.style.position = "absolute";
    bar.style.left = r.left+"px" ;
    bar.style.top = r.top+"px" ;
    this.gnd.appendChild(bar);

    for ( let m of this.menu.items ) {
      m.level = 0;
      let e = document.createElement("a");
      e.classList="entry";
      e.innerHTML=m.name;
      bar.appendChild(e);
      Menu.connect( e, "mouseenter", Menu.prototype.activate, this, m );
      Menu.connect( e, "mouseup", Menu.eatEvent );

      m.dom = e ;		//  DOM element for menu entry
    }

    this.action = undefined ;
    this.activate(menu,ev);	// Otherwise 'gnd' does not receive keydown events?
  }
};


//  Key 'Esc' ends the session.
//
Menu.prototype.keyDown = function ( o, ev )
{
  trace();

  if ( ev.key === "Escape" )
    this.end();
};


//  End of menu interaction.
//
Menu.prototype.end = function ( )
{
  trace();

  //  Destroy all the menus elements and the ground
  //
  while ( this.stack.length ) {
    let top = this.stack.pop();
    console.log("  hide:"+this.stack.length+" "+top.name)
    top.div.parentNode.removeChild( top.div );
    top.div = undefined ;
  }

  document.body.removeChild(this.gnd);
  this.gnd = undefined ;

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


//  Activate an entry.
//
//    All other menus of the same or higher level are destroyed.
//
Menu.prototype.activate = function ( entry, ev )
{
  trace(entry.type+" "+entry.name);

  //  Clear any pending timeout action
  //
  if ( this.timeout ) {
    console.log("  clearTimeout("+this.timeout+")");
    clearTimeout(this.timeout);
    this.timeout = undefined ;
  }

  //  Deactivate any active action
  //
  if ( this.active ) {
    console.log("  deactivate "+this.active.type+" "+this.active.name);
    this.active.dom.classList.remove("active");
  }

  //  Remove unwanted menus
  //
  if ( entry.type === "menu" ) {
    console.log("  menu level: "+entry.level+", stack height: "+this.stack.length);

    //  Nothing more to do if the entry is on the path of open menus
    //
    if ( this.stack.length > entry.level ) {
      if ( this.stack[entry.level] == entry ) {
      	console.log("  nothing to do.");
      	return ;
      }
      this.unstack(entry.level);
    }
  }
  else {
    console.log("  menu level: "+entry.parent.level+", stack height: "+this.stack.length);
    this.unstack(entry.parent.level+1);
  }

  //  Record active entry
  //
  console.log("  activate "+entry.type+" "+entry.name);
  entry.dom.classList.add("active");
  this.active = entry ;

  //  Open activated menu
  //
  if ( entry.type === "menu" ) {
    if ( this.popupDelay && entry.level > 0 ) {
      this.timeout = setTimeout( Menu.prototype.showMenu.bind(this,entry,ev), this.popupDelay );
      console.log("  timeout="+this.timeout);
    }
    else
      this.showMenu(entry,ev);
  }
}


//  Reduce the stack height to level (destroy menus of higher level)
//
Menu.prototype.unstack = function ( level )
{
  while ( this.stack.length > level ) {
    let top = this.stack.pop();
    console.log("  hide:"+this.stack.length+" "+top.name);
    top.div.parentNode.removeChild( top.div );
    top.div = undefined ;
    top.dom.classList.remove("active");
  }
}


//  Open a menu
//
Menu.prototype.showMenu = function ( entry, ev )
{
  trace(entry.name+", "+entry.level);

  ev.stopPropagation();
  ev.preventDefault();

  if ( this.active != entry )
    return ;
    
  //  The entry is already active. Clear 'active' so that the label will not
  //  be deactivated when another entry is activated.
  //
  this.active = undefined ;
  this.timeout = undefined ;

  //  Set new top-level menu
  //
  this.stack.push(entry) ;

  let label = ev.target;

  let div = document.createElement("div");
  div.classList="menu";
  let t = document.createElement("table");
  let tb = document.createElement("tbody");

  if ( entry.parent.type == "menubar" ) {
    //
    //  Place the menu under the menubar label
    //
    let r = label.getBoundingClientRect();
    div.style.left = r.left+"px";
    div.style.top = r.top+label.offsetHeight+"px";
  }
  else {
    //
    //  Place the menu beside its label in a parent menu
    //
    let r = label.getBoundingClientRect();
    let t = label.parentNode.getBoundingClientRect();
    div.style.left = t.right+"px";
    div.style.top = r.top+"px";
  }

  //  Populate the menu
  //
  for ( let i of entry.items ) {
    i.parent = entry ;
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

      i.dom = tr ;		// DOM element for menu entry

      //  Catch mousedown events (trigger action at mouseup over the label).
      //  Record action for execution after the menus are closed.
      //
      Menu.connect( tr, "mousedown", Menu.eatEvent, this, i );
      Menu.connect( tr, "mouseup", function(action,ev){this.action=action;}, this, i );
      Menu.connect( tr, "mouseenter", Menu.prototype.activate, this, i );
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
      i.level = entry.level+1 ;
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

      Menu.connect( tr, "mousedown", Menu.eatEvent );
      Menu.connect( tr, "mouseup", Menu.eatEvent );
      Menu.connect( tr, "mouseenter", Menu.prototype.activate, this, i );

      i.dom = tr ;		// DOM element for menu entry
    }
    else if ( i.type === "radiogroup" ) {
      //
      //  Radio group: create one entry per radio item
      //    Icon is made with SVG.
      //    The entry element has the "checked" class when the icon is checked.
      //
      if ( i.setup )	i.setup(i);	// Setup function for the group

      if ( !(i.checked >= 0 && i.checked < i.items.length) )
	i.checked = 0 ;

      let n=0 ;
      for ( let choice of i.items ) {
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
	label.innerHTML = choice.name ;
	td.appendChild( label );
	tr.appendChild( td );
	tb.append( tr );

	if ( i.checked == n )
	  tr.classList="entry radiobox checked";
	else
	  tr.classList="entry radiobox";

	choice.parent = entry ;
	choice.group = i ;
	choice.n = n ;
	choice.dom = tr ;

	Menu.connect( tr, "mousedown", Menu.eatEvent );
	Menu.connect( tr, "mouseup", Menu.radioMouseUp, this, choice );
	Menu.connect( tr, "mouseenter", Menu.prototype.activate, this, choice );

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

      i.dom = tr ;		// DOM element for menu entry

      Menu.connect( tr, "mousedown", Menu.eatEvent );
      Menu.connect( tr, "mouseup", Menu.checkboxMouseUp, this, i );
      Menu.connect( tr, "mouseenter", Menu.prototype.activate, this, i );
    }
    else
      console.log("Unknown menu entry type \""+i.type+"\"");
  }

  t.appendChild( tb );
  div.appendChild( t );
  this.gnd.appendChild( div );
  entry.div = div ;
};


Menu.connect = function ( element, eventname, fn, arg1, arg2 )
{
  element.addEventListener(eventname, function(ev){ return fn.call(arg1, arg2, ev); } );
};


Menu.eatEvent = function ( o, ev )
{
  ev.stopPropagation();
  ev.preventDefault();
};


//  'mouseup' on a radiobox entry.
//
Menu.radioMouseUp = function ( entry, ev )
{
  //  Process left button only
  //
  if ( ev.button != 0 )
    return ;

  ev.stopPropagation();
  ev.preventDefault();

  console.log("  radio \""+entry.name+"\":"+entry.n);

  if ( entry.group.checked != entry.n ) {
    entry.group.items[entry.group.checked].dom.classList.remove("checked") ;
    entry.group.checked = entry.n ;
    entry.group.items[entry.group.checked].dom.classList.add("checked") ;

    if ( entry.group.action )
      entry.group.action( entry );
  }
};


//  'mouseup' on a checkbox entry.
//
Menu.checkboxMouseUp = function ( entry, ev )
{
  //  Process left button only
  //
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
};
