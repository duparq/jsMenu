
"use strict";

//  Menu elements are described by object literals:
//
//    Menu bar: {
//      type:"bar"
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
//      setup:			// A function that will init the item
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
//      setup:			// A function that will init the item
//      action:			// What to do when the box is changed
//    }


//  The menu displays menu entries and handles menu events. A 'mousedown' event
//  on an item starts a menu session.
//  Return the div element of a menu bar or undefined.
//
function Menu ( menu={} )
{
  this.name = "Menu";
  this.stack = [];		// Stack of displayed menus
  this.gnd = undefined ;	// DOM element that collects events outside menu elements
  this.active = undefined ;	// Current active item
  this.timeout = undefined ;	// Timeout for menu popup
  this.popupDelay = 150 ;	// Delay (ms) between activation and menu popup

  this.install( menu );

  return this.div ;
};


//  Set the items of a menu.
//  Create the DOM elements for the entries of a menu bar.
//
Menu.prototype.install = function ( menu )
{
  this.menu = menu ;
  this.menu.level = 0 ;
  if ( menu.type === "bar" ) {
    //
    //  A menu bar displays menu entries horizontally and handles menu events.
    //  A 'mousedown' event on a label starts a menu session.
    //  This label is not activated, its copy will be.
    //
    this.div = document.createElement("div");
    this.div.classList="menubar";
    for ( let item of menu.items ) {
      let e = document.createElement("a");
      e.classList="item";
      e.innerHTML=item.name;
      this.div.appendChild(e);
      item.dom = e ;		//  DOM element for menu item
      item.parent = menu ;

      Menu.connect( e, "mousedown", Menu.prototype.beginBar, this, item );
    }
  }
  else if ( menu.type === "menu" ) {
  }
  else
    trace("ERROR: unknown type of menus '"+menu.type+"'.");
};


//  Begin a menu session for a menu bar. This is called when an item in the
//  application's menu bar is clicked. The bar is copied on the ground. There's
//  always at least one menu displayed until the end of the menu session.
//    
Menu.prototype.beginBar = function ( item, ev )
{
  //  A menu bar session begins by a left button down
  //
  if ( ev.button != 0 )
    return ;

  ev.stopPropagation();
  ev.preventDefault();

  console.clear();
  trace(item.name);

  //  Hide application's menu bar
  //
  this.div.style.visibility = "hidden";

  //  Create a ground for menu elements
  //
  this.initGround();

  //  Create a copy of the menu bar on the ground.
  //    Note: the copy of the item that started the session receives the
  //    'mouseenter' event when created.
  //
  const r = this.div.getBoundingClientRect();
  let bar = document.createElement("div");
  bar.classList="menubar";
  bar.style.position = "absolute";
  bar.style.left = r.left+"px" ;
  bar.style.top = r.top+"px" ;
  this.gnd.appendChild(bar);

  for ( let item of this.menu.items ) {
    item.level = 0;
    let e = document.createElement("a");
    e.classList="item";
    e.innerHTML=item.name;
    bar.appendChild(e);
    Menu.connect( e, "mouseenter", Menu.prototype.activate, this, item );
    Menu.connect( e, "mouseup", Menu.eatEvent );

    item.dom = e ;		//  DOM element for menu item
  }

  this.action = undefined ;
  this.activate(item,ev);	// Otherwise 'gnd' does not receive keydown events?
};


//  Begin a menu session for a context menu. This is called by the application
//  when the context menu must be displayed. There's always at least one menu
//  displayed until the end of the menu session.
//
Menu.prototype.begin = function ( x, y )
{
  this.initGround();

  this.action = undefined ;
  this.active = undefined ;

  this.showMenu( this.menu, x, y );
};


//  Create a ground that holds the menu elements.
//
Menu.prototype.initGround = function ( )
{
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
};


//  Key 'Esc' ends the session.
//
Menu.prototype.keyDown = function ( o, ev )
{
  trace();

  if ( ev.key === "Escape" )
    this.end();
};


//  End of menu session.
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

  //  Show application's menu bar
  //
  if ( this.div )
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


//  Activate an item.
//
//    All other menus of the same or higher level are destroyed.
//
Menu.prototype.activate = function ( item, ev )
{
  trace(item.type+" "+item.name);

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
  if ( item.type === "menu" ) {
    console.log("  menu level: "+item.level+", stack height: "+this.stack.length);

    //  Nothing more to do if the item is on the path of open menus
    //
    if ( this.stack.length > item.level ) {
      if ( this.stack[item.level] == item ) {
      	console.log("  nothing to do.");
      	return ;
      }
      this.unstack(item.level);
    }
  }
  else {
    console.log("  menu level: "+item.parent.level+", stack height: "+this.stack.length);
    this.unstack(item.parent.level+1);
  }

  //  Record active item
  //
  console.log("  activate "+item.type+" "+item.name);
  item.dom.classList.add("active");
  this.active = item ;

  //  Open activated menu
  //
  let x, y ;
  if ( item.type === "menu" ) {
    let label = ev.target;
    if ( item.parent.type == "bar" ) {
      //
      //  Place the menu under the bar item
      //
      let r = label.getBoundingClientRect();
      x = r.left ;
      y = r.top+label.offsetHeight ;
    }
    else {
      //
      //  Place the menu beside its label in a parent menu
      //
      let r = label.getBoundingClientRect();
      let t = label.parentNode.getBoundingClientRect();
      x = t.right ;
      y = r.top ;
    }

    if ( this.popupDelay && item.level > 0 ) {
      this.timeout = setTimeout( Menu.prototype.showMenu.bind(this,item,x,y), this.popupDelay );
      console.log("  timeout="+this.timeout);
    }
    else
      this.showMenu(item,x,y);
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


//  Open a menu at position (x,y)
//
Menu.prototype.showMenu = function ( item, x, y )
{
  trace(item.name+", "+item.level);

  //  Abort if another item has been activated.
  //
  if ( this.active != undefined && this.active != item )
    return ;

  //  Clear 'active' so that the item will not be deactivated by another item of
  //  higher level.
  //
  this.active = undefined ;
  this.timeout = undefined ;

  //  New top-level menu
  //
  this.stack.push(item) ;

  let t = document.createElement("table");
  let tb = document.createElement("tbody");
  this.populate( tb, item );

  t.appendChild( tb );
  item.div = document.createElement("div");
  item.div.classList="menu";
  item.div.style.left = x+"px";
  item.div.style.top = y+"px";
  item.div.appendChild( t );
  this.gnd.appendChild( item.div );
};


//  Populate a menu
//
Menu.prototype.populate = function ( tb, item )
{
  for ( let i of item.items ) {
    i.parent = item ;
    if ( i.type === "action" ) {
      //
      //  Action
      //
      if ( i.setup )	i.setup(i);	// Setup function (enable/disable action)

      let tr = document.createElement("tr");
      tr.classList="item action";

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

      i.dom = tr ;		// DOM element for menu item

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
      i.level = item.level+1 ;
      let tr = document.createElement("tr");
      tr.classList="item menu";

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

      i.dom = tr ;		// DOM element for menu item
    }
    else if ( i.type === "radiogroup" ) {
      //
      //  Radio group: create one item per radio item
      //    Icon is made with SVG.
      //    The item element has the "checked" class when the icon is checked.
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
	  tr.classList="item radiobox checked";
	else
	  tr.classList="item radiobox";

	choice.parent = item ;
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
      //    The item element has the "checked" class when the icon is checked.
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
	tr.classList="item checkbox checked";
      else
	tr.classList="item checkbox";

      i.dom = tr ;		// DOM element for menu item

      Menu.connect( tr, "mousedown", Menu.eatEvent );
      Menu.connect( tr, "mouseup", Menu.checkboxMouseUp, this, i );
      Menu.connect( tr, "mouseenter", Menu.prototype.activate, this, i );
    }
    else
      console.log("Unknown menu item type \""+i.type+"\"");
  }
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


//  'mouseup' on a radiobox item.
//
Menu.radioMouseUp = function ( item, ev )
{
  //  Process left button only
  //
  if ( ev.button != 0 )
    return ;

  ev.stopPropagation();
  ev.preventDefault();

  console.log("  radio \""+item.name+"\":"+item.n);

  if ( item.group.checked != item.n ) {
    item.group.items[item.group.checked].dom.classList.remove("checked") ;
    item.group.checked = item.n ;
    item.group.items[item.group.checked].dom.classList.add("checked") ;

    if ( item.group.action )
      item.group.action( item );
  }
};


//  'mouseup' on a checkbox item.
//
Menu.checkboxMouseUp = function ( item, ev )
{
  //  Process left button only
  //
  if ( ev.button != 0 )
    return ;

  ev.stopPropagation();
  ev.preventDefault();

  if ( item.checked ) {
    item.checked = false ;
    item.dom.classList.remove("checked");
  }
  else {
    item.checked = true ;
    item.dom.classList.add("checked");
  }
  
  console.log("  checkboxChange \""+item.name+"\":"+item.checked);

  if ( item.action )
    item.action(item);
};
