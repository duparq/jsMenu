
"use strict";


function setup1 ( radio )
{
  console.log("setup1: "+radio.checked);

  if ( radio.checked == undefined )
    radio.checked = 0 ;

  console.log("setup1: "+radio.checked);
}


function apply1 ( radio )
{
  console.log("apply1: "+radio.checked);
}


let sub2 = { type:"menu", name:"Sub2",
	     items:[ { type:"action", name:"Sub21" },
		     { type:"action", name:"Sub22" } ]
	   };

let radio1 = { type:"radio", name:"Radio1", setup:setup1, action:apply1,
	       items:["Choice 1",
		      "Choice 2",
		      "Choice 3" ]
	     };

var menus = [
  { type:"menu", name:"File",
    items:[ { type:"action", name:"New" },
	    { type:"action", name:"Open" },
	    { type:"separator" },
	    { type:"action", name:"Save" } ]
  },
  
  { type:"menu", name:"Edit",
    items:[ { type:"action", name:"Undo" },
	    { type:"action", name:"Redo" } ]
  },

  { type:"menu", name:"Console",
    items:[ { type:"action", name:"Clear", action:function(){console.clear();} },
	    { type:"checkbox", name:"Redirect", setup:console.cbSetup, action:console.cbChange } ]
  },

  { type:"menu", name:"Subs",
    items:[ { type:"menu", name:"Sub1",
	      items:[ { type:"action", name:"Sub11" },
		      { type:"action", name:"Sub12" } ]
	    },
	    sub2,
	    { type:"checkbox", name:"Check" }
	  ]
  },

  { type:"menu", name:"Radios",
    items:[ radio1,
	    { type:"separator" },
	    { type:"action", name:"Action" },
	    { type:"separator" },
	    { type:"menu", name:"Radio 2",
	      items:[ { type:"radio", name:"Radio2",
			items:[ "Choice 1",
				"Choice 2",
				"Choice 3",
				"Choice 4" ]
		      } ]
	    } ]
  }
];
