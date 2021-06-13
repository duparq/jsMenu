
"use strict";

var contextmenudef = {
  type:"menu", name:"contextmenu",
  items:[
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
		items:[ { type:"radiogroup", name:"Radio2",
			  items:[ { type:"radio", name:"Choice 1" },
				  { type:"radio", name:"Choice 2" },
				  { type:"radio", name:"Choice 3" },
				  { type:"radio", name:"Choice 4" } ]
			} ]
	      } ]
    }] };
