/* Author: Abhishek Munie */
window.jQuery || document.write("\x3Cscript src='https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js'\x3e\x3C/script\x3e");

$('html').addClass(RegExp(" AppleWebKit/").test(navigator.userAgent) ?'applewebkit' :'not-applewebkit');

var mySite_config = $.extend(true, {
  urls : {
    resource : location.protocol+'//'+location.hostname+'/',
    workers : {
      ajax  : "/modules/ajaxloader.worker.js",
      jsonp : "/modules/jsonploader.worker.js"
    }
  },
  preloads : [],
  twitter_streams : [],
  flickr_photostreams : [],
  facebook : undefined /*{
    appid : undefined
  }*/,
  addThis: undefined /*{
    id : undefined
  }*/,
  google : {
    plus : undefined /*{
      lang : undefined
    }*/,
    analytics : undefined /*{
      id : undefined
    }*/,
    cse : undefined /*{
      id : undefined,
      autoCompletionId : undefined
    }*/
  },
  cufon : undefined
}, window.mySite_config);

// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
  (function() {
    var noop = function() {};
    var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
    var length = methods.length;
    var console = window.console = {};
    while (length--) {
      console[methods[length]] = noop;
    }
  }());
}

var qualifyURL = function(url) {
  var div = document.createElement('div');
  div.innerHTML = "<a></a>";
  div.firstChild.href = url;//Ensures that the href is properly escaped
  div.innerHTML = div.innerHTML;//Run the current innerHTML back through the parser
  return div.firstChild.href;
};
var getLevels=function(url){
  var Levels=url.toString().split('/');
  for(var i=0;i<Levels.length;i++)
    if(!Levels[i])Levels.splice(i--,1);
  return Levels;
};
function Location(location){
  location=location||window.location;
  this.href=location.href;
  this.url=location.href.replace(location.hash,"");
  this.hash=location.hash;
  this.pageChangeLevel=undefined;
  this.params={
    serviceMode:(location.hash=="#?test=true")
  };
  var HASH=this.hash;
  if(HASH){
    var off1=HASH.indexOf('!');
    var off2=HASH.indexOf('?');
    if(off2>=0){
      var p=HASH.slice(off2+1).split(/&amp;|&/g);
      var params=[];
      var param;
      for(var i in p){
        param=p[i].split('=');
        try{
          param[1]=JSON.parse(param[1]);
        }catch(e){}
        params[param[0]]=param[1];
      }
      $.extend(this.params,params);
      this.hash=HASH.slice(0,off2-1);
      if(off1>=0){
        this.url=HASH.slice(off1+1,off2-1);
        this.hash=HASH.slice(0,off1-1);
      }
    }else if(off1>=0){
      this.url=mySite.qualifyURL(HASH.slice(off1+1));
      this.hash=HASH.slice(0,off1-1);
    }
  }
  this.Levels=getLevels(this.url);
  this.pageLevel=(this.Levels.length-2||1);
  this.is404=false;
}

var mySite=$.extend(true,{
  domain:location.protocol+'//'+location.hostname+'/',
  resource:mySite_config.urls.resource,
  qualifyURL:qualifyURL,
  getLevels:getLevels,
  /* Internal: Parse URL components and returns a Locationish object.
   * url - String URL
   * Returns HTMLAnchorElement that acts like Location.
   */
  parseURL:function(url){
    var a=document.createElement('a');
    a.href=url;
    return a;
  },
  checkString:function(str){
    try{
      str=JSON.parse(str);
    }catch(e){}
    return str;
  },
  location:new Location(),
  pre_location:undefined,
  next_location:null,
  calcLevelChange:function(current,previous){
    previous=previous||mySite.pre_location;
    current=current||mySite.location;
    var len=Math.min(current.Levels.length,previous.Levels.length)-1;
    if(len<2)len=2;
    for(current.pageChangeLevel=1;current.pageChangeLevel<len;current.pageChangeLevel++)
      if(current.Levels[current.pageChangeLevel+1]!=previous.Levels[current.pageChangeLevel+1])
        break;
  },
  ajaxPageLoader:null,
  ajaxTo:null,
  twitter_streams:{},
  flickr_photostreams:{},
  sky:{
    stars:[],
    snow:[],
    starsWorker:undefined,
    snowWorker:undefined
  },
  fireEvent:function(eType,eParams,eExtraParams){
    var e=jQuery.Event(eType,eParams);
    $(document).trigger(e,eExtraParams);
    return e.isDefaultPrevented();
  },
  user:{
    facebook:undefined
  },
  overlayTheater:{
    theater:$('<aside id="overlayTheaterBack" class="overlayTheaterBack" onclick="mySite.overlayTheater.close()"></aside>'+
      '<aside id="overlayTheater" class="overlayTheater">'+
      '<img class="LoadingImg" src="/img/icons/loading.png" alt="Loading..."/>'+
      '<div class="info"><div id="msg"></div></div>'+
      '<div class="warning"><div id="msg"></div></div>'+
      '<div class="error"><div id="msg"></div></div>'+
      '<div class="learnmore"><div id="msg"></div></div>'+
      '</div>'+
      '</aside>'),
    info:function(msg){
      $('html').addClass('info');
      $('.info .msg').html(msg);
    },
    warning:function(msg){
      $('html').addClass('warning');
      $('.warning .msg').html(msg);
    },
    error:function(msg){
      $('html').addClass('error');
      $('.error .msg').html(msg);
    },
    close:function(){
      $('html').removeClass('loading info warning error');
    }
  },
  // ----------------------------------------------------------
  // If you're not in IE (or IE version is less than 5) then:
  //   ie === undefined
  // If you're in IE (>5) then you can determine which version:
  //   ie === 7; // IE7
  // Thus, to detect IE:
  //   if (ie) {}
  // And to detect the version:
  //   ie === 6 // IE6
  //   ie > 7 // IE8, IE9 ...
  //   ie < 9 // Anything less than IE9
  // ----------------------------------------------------------
  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
  ieVersion:(function(){
    var undef,v=3,div=document.createElement('div');
    while(
      div.innerHTML='<!--[if gt IE '+(++v)+']><i></i><![endif]-->',
      div.getElementsByTagName('i')[0]
      ){}
    return v>4?v:undef;
  }()),
  getVisibilityState:function(){
    return document.visibilityState||document.webkitVisibilityState||document.msVisibilityState;
  },
  applyAcrossBrowser:function(fn){
    var browsers=["","webkit","moz","o","ms"];
    for(var len=browsers.length;len;)
      fn(browsers[--len]);
  },
  cloneObject:function(o){
    var newObj=(o instanceof Array)?[]:{};
    for(var i in o){
      if(o[i] && typeof 0[i]=="object") {
        newObj[i]=cloneThis(o[i]);
      }else newObj[i]=o[i];
    }
    return newObj;
  },
  // remove all own properties on obj, effectively reverting it to a new object
  wipeObject: function(obj){
    for(var p in obj)
      if(obj.hasOwnProperty(p))
        delete obj[p];
  },
  relative_time: function prettyDate(rawdate) {
    var date, seconds, formats, i = 0, f;
    date = new Date(rawdate);
    seconds = (new Date() - date) / 1000;
    formats = [
      [60, 'seconds', 1],
      [120, '1 minute ago'],
      [3600, 'minutes', 60],
      [7200, '1 hour ago'],
      [86400, 'hours', 3600],
      [172800, 'Yesterday'],
      [604800, 'days', 86400],
      [1209600, '1 week ago'],
      [2678400, 'weeks', 604800]
    ];

    while (f = formats[i ++]) {
      if (seconds < f[0]) {
        return f[2] ? Math.floor(seconds / f[2]) + ' ' + f[1] + ' ago' :  f[1];
      }
    }
    return 'A while ago';
  },
  safeCallback:function(callback, safeAfter) {
    return function() {
      safeAfter(callback);
    };
  },
  importScript: function(src,defer,id,callback){
    var sp=document.createElement('script');
    sp.type="text/javascript";
    sp.src=src;
    sp.async=true;
    id&&(sp.id=id);
    defer&&(sp.defer="defer");
    callback&&(sp.onload = sp.onreadystatechange = function() {
      var rs = this.readyState;
      if (rs && rs != 'complete' && rs != 'loaded') return;
      try {
        callback();
      } catch (e) {
        console.error(e)
      }
    });
    var s=document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(sp,s);
  }
},window.mySite);

mySite.location.is404=!!$('.container404')[0];
if(mySite.location.params.serviceMode)$('html').addClass('serviceMode');
//navigator.registerProtocolHandler("abhishekmunie","http://abhishekmunie.com/","abhishekmunie Protocol");

if(mySite_config.facebook){
  window.fbAsyncInit=function(){
    FB.init({
      appId   :mySite_config.facebook.appid, // App ID
      channelUrl:'http//'+document.domain+'/channel.html', // Channel File
      status  :true, // check login status
      cookie  :true, // enable cookies to allow the server to access the session
      xfbml   :!!mySite.enhanced,// parse XFBML
      oauth   :true,
      frictionlessRequests:true
    });

    $.fn.FBWelcome=function(o){
      o=$.extend({},o);
      return this.each(function(){
        if((mySite.user.facebook.currentUser)!=null)this.innerHTML=(/undefined/i.test(mySite.user.facebook.currentUser.name))?'Welcome, Guest':'Welcome, <img id="FBImage" class="fb_profile_image" src="https://graph.facebook.com/'+mySite.user.facebook.currentUser.id+'/picture"/> '+mySite.user.facebook.currentUser.name;
      });
    };
    // Additional initialization code here
    mySite.user.facebook={
      setCurrentUser:function(){
        FB.api('/me',function(user){
          mySite.user.facebook.currentUser=user;
        });
      },
      getLoginStatus:function(){
        FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            // the user is logged in and has authenticated your
            // app, and response.authResponse supplies
            // the user's ID, a valid access token, a signed
            // request, and the time the access token 
            // and signed request each expire
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
          } else if (response.status === 'not_authorized') {
          // the user is logged in to Facebook, 
          // but has not authenticated your app
          } else {
          // the user isn't logged in to Facebook.
          }
        });
      },
      getUpdateLoginStatus:function(){
        FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            // the user is logged in and has authenticated your
            // app, and response.authResponse supplies
            // the user's ID, a valid access token, a signed
            // request, and the time the access token 
            // and signed request each expire
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
          } else if (response.status === 'not_authorized') {
          // the user is logged in to Facebook, 
          // but has not authenticated your app
          } else {
          // the user isn't logged in to Facebook.
          }
        },true);
      },
      login:function(callback,scope){
        FB.login(callback,{
          scope:scope
        });
      },
      logout:function(callback){
        FB.logout(callback);
      },
      // run once with current status and whenever the status changes
      update:function(response){
        if (response.authResponse) {
          //user is already logged in and connected
          console.log('Welcome!  Fetching your information.... ');
          FB.api('/me', function(response) {
            mySite.user.facebook.currentUser=response;
            console.log('Good to see you, '+response.name+'.');
          });
        } else {
          //user is not connected to your app or logged out
          console.log('User cancelled login || did not fully authorize || logged out.');
          mySite.user.facebook.currentUser=undefined;
        }
        mySite.user.facebook.refresh();
      },
      refresh:function(){
        $('.FBWelcome').FBWelcome();
      },
      publishPost:function(msg){
        FB.api('/me/feed','post',{
          message:msg
        },function(response){
          if(!response||response.error){
            alert('Error occured');
          }else{
            alert('Post ID: '+response.id);
          }
        });
      },
      deletePost:function(postId){
        FB.api(postId,'delete',function(response){
          if(!response||response.error){
            alert('Error occured');
          }else{
            alert('Post was deleted');
          }
        });
      },
      getPost:function(n){
        FB.api('/me/posts',{
          limit: n
        },function(response){
          for (var i=0,l=response.length;i<l;i++){
            var post=response[i];
            if(post.message){
              alert('Message: '+post.message);
            }else if(post.attachment&&post.attachment.name){
              alert('Attachment: '+post.attachment.name);
            }
          }
        });
      },
      post:function(o){
        FB.ui(
          $.extend({
            method: 'feed',
            name: mySite.domain,
            link: mySite.location.url,
            picture: '',
            caption: ".",
            description: 'Dialogs provide a simple, consistent interface for applications to interface with users.',
            message: "I like this Website!"
          },o),
          function(response){
            if (response&&response.post_id) {
              alert('Post was published.');
            } else {
              alert('Post was not published.');
            }
          }
          );
      },
      /*canvas methods*/
      sendRequestViaMultiFriendSelector:function(){
        FB.ui({
          method:'apprequests',
          message:'Use this app to get personalized experience on '+mySite.domain
        },requestCallback);
      },
      sendRequestToRecipients:function(ids,requestCallback){
        FB.ui({
          method:'apprequests',
          message:'Use this app to get personalized experience on '+mySite.domain,
          to:ids
        },requestCallback);
      }
    };

    // run once with current status and whenever the status changes
    FB.getLoginStatus(mySite.user.facebook.update);
    FB.Event.subscribe('auth.statusChange',mySite.user.facebook.update);
    FB.Event.subscribe('auth.login',function(response){});
    FB.Event.subscribe('auth.logout',function(response){});
  };
  // Load the SDK Asynchronously
  if(!document.getElementById('facebook-jssdk'))mySite.importScript("//connect.facebook.net/en_US/all.js#appId="+mySite_config.facebook.appid,false,'facebook-jssdk');
}

if(mySite_config.google.plus){
  window.___gcfg={
    lang : mySite_config.google.plus.lang || 'en-US',
    parsetags :'explicit'
  };
  mySite.importScript('https://apis.google.com/js/plusone.js');
}

/*if(!Object.prototype.cloneThis)Object.prototype.cloneThis=function(){
  var newObj=(this instanceof Array)?[]:{};
  for(i in this){
    if(i=='cloneThis')continue;
    if(this[i] && typeof this[i]=="object"){
      newObj[i]=this[i].cloneThis();
    }else newObj[i]=this[i];
  }
  return newObj;
}
http://ajaxian.com/archives/cor-blimey-cross-domain-ajax-is-really-here
 function createCORSRequest(method,url){
  var xhr=new XMLHttpRequest();
  if("withCredentials" in xhr){
    xhr.open(method,url,true);
  }else if(typeof XDomainRequest != "undefined"){
    xhr=new XDomainRequest();
    xhr.open(method,url);
  }else{
    xhr=null;
  }
  return xhr;
}

var request=createCORSRequest("get","http://abhishekmunie.com/");
if(request){
  request.onload=function(){
    //do something with request.responseText
  };
  request.send();
}*/
//https://gist.github.com/384583 Cross-browser object.watch and object.unwatch
/*/ object.watch
if(!Object.prototype.watch)
  Object.prototype.watch=function(prop,handler){
    var oldval=this[prop],newval=oldval,
    getter=function(){
      return newval;
    },
    setter=function(val){
      oldval=newval;
      return newval=handler.call(this,prop,oldval,val);
    };
    if(delete this[prop]){//can't watch constants
      if(Object.defineProperty)//ECMAScript 5
        Object.defineProperty(this,prop,{
          get:getter,
          set:setter,
          enumerable:false,
          configurable:true
        });
      else if(Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__){// legacy
        Object.prototype.__defineGetter__.call(this,prop,getter);
        Object.prototype.__defineSetter__.call(this,prop,setter);
      }
    }
  };
// object.unwatch
if (!Object.prototype.unwatch)
  Object.prototype.unwatch=function(prop){
    var val=this[prop];
    delete this[prop];//remove accessors
    this[prop]=val;
  };
 */

/* Inline Worker - http://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers*/
// Prefixed in Webkit, Chrome 12, and FF6: window.WebKitBlobBuilder, window.MozBlobBuilder
mySite.BlobWorker={};
mySite.BlobWorker.prototype=function(){
  return{
    create: function(workerBody, onmessage){
      if(BlobBuilder){
        var bb=new (window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder)();
        bb.append(workerBody);
        // Obtain a blob URL reference to our worker 'file'.
        // Note: window.webkitURL.createObjectURL() in Chrome 10+.
        var blobURL=(window.URL||window.webkitURL).createObjectURL(bb.getBlob());
        //Blob URLs are unique and last for the lifetime of your application (e.g. until the document is unloaded).
        //If you're creating many Blob URLs, it's a good idea to release references that are no longer needed.
        //You can explicitly release a Blob URLs by passing it to window.URL.revokeObjectURL():
        return new Worker(blobURL);
      }else{
        console.log('BlobBuilder is not supported in the browser!');
        return;
      }
    },
    release: function(blobURL){
      (window.URL||window.webkitURL).revokeObjectURL(blobURL);
    }
  };
} ();

// requestAnimationFrame polyfill by Erik Moller
// fixes from Paul Irish and Tino Zijdel
(function() {
  var lastTime=0;
  var vendors=['ms','moz','webkit','o'];
  if(!window.requestAnimationFrame)for(var x=0;x<vendors.length&&!window.requestAnimationFrame;++x){
    window.requestAnimationFrame=window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame=window[vendors[x]+'CancelAnimationFrame']||window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  if(!window.requestAnimationFrame)
    window.requestAnimationFrame=function(callback,element){
      var currTime=new Date().getTime();
      var timeToCall=Math.max(0,16-(currTime-lastTime));
      var id=window.setTimeout(function(){
        callback(currTime+timeToCall);
      },timeToCall);
      lastTime=currTime+timeToCall;
      return id;
    };
  if(!window.cancelAnimationFrame)
    window.cancelAnimationFrame=function(id){
      clearTimeout(id);
    };
}());

(function($){
  try{
    function Tweet(data){
      this.id=data.id_str;
      this.data=data;
      this.oEmbedData=undefined;
      this.worker=undefined;
      var THIS=this;
      this.loadOEmbed=function(){
        if(Modernizr.webworkers){
          this.worker=new Worker(mySite_config.urls.workers.jsonp);
          this.worker.addEventListener('message',function(event){
            if(event.data.type=="debug"){
              console.log(JSON.stringify(event.data.data));
            }else if(event.data.status==200){
              THIS.oEmbedData=event.data.json;
            }
          },false);
          this.worker.addEventListener('error', function(event){
            },false);
          this.worker.postMessage("https://api.twitter.com/1/statuses/oembed.json?id="+data.id_str+"&omit_script=true&callback=?");
        }else{
          jQuery.ajax({
            url:"https://api.twitter.com/1/statuses/oembed.json?id="+data.id_str+"&omit_script=true&callback=?",
            async: true,
            dataType: 'json',
            success: function(oEmbedData) {
              THIS.oEmbedData=oEmbedData;
            }
          });
        }
      }
      this.loadOEmbed();
    }
    function Twitter_Stream(username){
      this.username=username;
      this.count=30;
      this.tweets=[];
      this.updateInterval=180000;
      var THIS=this;
      this.loaders={
        update:new SerializedAjaxLoader(
          function(current,data){

          },function(responseText,status,data){
            responseDOM=null;
            window.setTimeout(THIS.update,THIS.updateInterval);
          },function(e){}
          ),
        load:new SerializedAjaxLoader(
          function(current,data){

          },function(responseText,status,data){
            responseDOM=null;
          },function(e){}
          )
      }
      this.update=function(){
        $.getJSON("https://twitter.com/status/user_timeline/"+THIS.username+".json?count=9&since_id="+THIS.tweets[0].id+"&callback=?", function(data){
          $.each(data, function(index, tweet){
            if(tweet!=THIS.tweets[i].data)
              THIS.tweets.unshift(new Tweet(tweet));
          });
        });
      }
      this.load=function(){
        $.getJSON("https://twitter.com/status/user_timeline/"+THIS.username+".json?count=9"+((THIS.tweets.length>0)?"&max_id="+THIS.tweets[THIS.tweets.length-1].id:"")+"&callback=?", function(data){
          $.each(data, function(index, tweet){
            THIS.tweets.push(new Tweet(tweet));
          });
        });
      //THIS.loader.load.loadTo({url:"https://twitter.com/status/user_timeline/"+THIS.username+".json?count=9"+((THIS.tweets.length>0)?"&max_id="+THIS.tweets[THIS.tweets.length-1].id:"")+"&callback=?"})
      }
      this.load();
      window.setTimeout(this.update,this.updateInterval);
    }
    mySite.createTwitterStream=function(username){
      return new Twitter_Stream(username);
    }
  }catch(e){}

  mySite.flickr_photostreams[mySite_config.flickr_photostreams[0]]={
    photos:[]
  };
  $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?ids=40168771@N07&lang=en-us&format=json&jsoncallback=?", function(data){
    $.each(data.items,function(index,item){
      mySite.flickr_photostreams[mySite_config.flickr_photostreams[0]].photos.push(item);
    });
  });

  /**
   *Chris Coyier
   *http://css-tricks.com*/
  $.fn.flickrGallery=function(o){
    o=$.extend({},o);
    return this.each(function(i,block){
      $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?ids=40168771@N07&lang=en-us&format=json&jsoncallback=?", function(data){
        $.each(data.items, function(index, item){
          $("<img/>").attr("src", item.media.m).appendTo(block).wrap("<a href='" + item.link + "'></a>");
        });
      });
    });
  };
  /** End Chris Coyier - http://css-tricks.com */

  $.fn.lavaLamp=function(o){
    o=$.extend({},o);
    return this.each(function(){
      var $leftPad=$('<li id="leftPad" class="lavalampback topbar-inner"></li>').appendTo($(this));
      var $hoverPad=$('<li id="hoverPad" class="lavalampback"></li>').appendTo($(this));
      var $rightPad=$('<li id="rightPad" class="lavalampback topbar-inner"></li>').appendTo($(this));
      
      var styletag = $('<style type="text/css" class="lavalampStyle"/>').appendTo('head');
      var THIS=this;
      var classN = "ll" + Math.floor(Math.random() * 1000);
      $leftPad.addClass(classN + 'leftPad');
      $hoverPad.addClass(classN + 'hoverPad');
      $rightPad.addClass(classN + 'rightPad');
      
      this.setCurrent=function(el){
        el=el||$("li.selected",THIS);
        if(!el[0])el=$("li:first",THIS);
        if(styletag) styletag.remove();
        var el_OL = el[0].offsetLeft;
        var el_OW = el[0].offsetWidth;
        var el_parent = el.parent()[0];
        var el_parent_OL = el_parent.offsetLeft;
        var el_parent_OW = el_parent.offsetWidth;
        styletag.html('.'+classN+'leftPad {'
          + 'left:' + el_parent_OL + 'px;'
          + 'width:' + (el_OL - el_parent_OL) + 'px'
          +'}' + ' .' + classN + 'hoverPad {'
          + 'left:' + el_OL + 'px;'
          + 'width:'+ el_OW + 'px'
          +'}' + ' .' + classN + 'rightPad {'
          + 'width:'+ Math.max(0, el_parent_OL+el_parent_OW-el_OL-el_OW) + 'px;'
          + 'left:' + (el_OL + el_OW) + 'px'
          +'}');
      };
      
      $(">li>a",this).hover(function(){
        THIS.setCurrent($(this.parentElement));
      },function(){});
      
      $(this).hover(function(){},function(){
        THIS.setCurrent($("li.selected",this));
      });
      
      $("li>a",this).not(".lavalampback").click(function(){
        THIS.setCurrent($(this.parentElement));
      });
      
      this.setCurrent();
      
      $(document).on('mySite:ajaxcompleted',function(){
        THIS.setCurrent();
      });
    });
  };
  if(Modernizr.canvas){
    function ParticleWorker(dataHandler){
      this.worker=new Worker('/modules/particleSystems/particle.worker.transferable.js');
      this.worker.postMessage=this.worker.webkitPostMessage||this.worker.postMessage;
      this.worker.addEventListener('message',function(event){
        dataHandler(event);
      },false);
      this.worker.addEventListener('error',function(event){
        console.log("Particle Worker Error: ");
        console.log(event);
      },false);
    }
    $.fn.paintParticles=function(o){
      o=$.extend({
        speed:300,
        noOfParticles:99,
        batchSize:1000,
        rint:60,
        id:undefined,
        className:"particle_canvas",
        particleScript:undefined,
        mouseMoveHandler:undefined,
        drawParticles:undefined,
        relativeto:undefined,
        autofit:true
      },o);
      return this.each(function() {
        var THIS,$THIS;
        if (this.tagName=='CANVAS') {
          THIS=this;
          $THIS=$(THIS);
          if(!o.relativeto)THIS.relativeto=$THIS.parent();
        } else {
          THIS=jQuery('<canvas '+(o.id?'id="'+o.id+'" ':'')+'class="'+o.className+'">').insertAfter(this)[0];
          $THIS=$(THIS);
          if(!o.relativeto)THIS.relativeto=$(this);
        }
        if(o.relativeto) THIS.relativeto=$(o.relativeto);
        THIS.drawParticles=o.drawParticles;
        THIS.particles=new Array();
        THIS.noOfParticles=o.noOfParticles;
        THIS.particleWorker=new ParticleWorker(function(event){
          switch(event.data.type){
            case "status":
              console.log(event.data.status);
              break;
            default:
              THIS.particles.unshift(event.data.buffer?event.data:new Float32Array(event.data));
              if(THIS.particles.length>1000)THIS.particleWorker.worker.postMessage({
                action:"pause"
              });
              if(THIS.particles.length>5999)
                THIS.particles.splice(1000);
              break;
          }
        });
        var setWIDTH = function(n) {
          if(n!=width) {
            $THIS.attr('width', n);
            THIS.particleWorker.worker.postMessage({
              action:"update",
              property:"width",
              value:n
            });
            THIS.particles.splice(18);
            width = n;
          }
        },
        width=1600,
        setHEIGHT=function(n){
          if(n!=height){
            $THIS.attr('height',n);
            THIS.particleWorker.worker.postMessage({
              action:"update",
              property:"height",
              value:n
            });
            THIS.particles.splice(12);
            height=n;
          }
        },
        height=900;
        var pxs=new Array();
        THIS.update=function(){
          setWIDTH(THIS.relativeto.width());
          setHEIGHT(THIS.relativeto.height());
        }
        var ab = new Uint8Array(1).buffer,transferableSupported;
        try{
          THIS.particleWorker.worker.postMessage(ab);
          THIS.particleWorker.worker.postMessage(ab,[ab]);
        }catch(e){}
        transferableSupported=!ab.byteLength;
        THIS.particleWorker.worker.postMessage({
          action:"importParticleScript",
          script:o.particleScript
        });
        THIS.particleWorker.worker.postMessage({
          action:"update",
          property:"rint",
          value:o.rint
        });
        THIS.particleWorker.worker.postMessage({
          action:"update",
          property:"noOfParticles",
          value:o.noOfParticles
        });
        THIS.particleWorker.worker.postMessage({
          action:"update",
          property:"batchSize",
          value:o.batchSize
        });
        THIS.particleWorker.worker.postMessage({
          action:"update",
          property:"useTransferable",
          value:transferableSupported
        });
        THIS.update();
        THIS.particleWorker.worker.postMessage({
          action:"initialize"
        });
        var context=THIS.getContext('2d');
        var fps;//,drawing,countF=9;
        var popped;
        var draw=function(){
          /*if(drawing){
            if(!countF--){
              clearInterval(THIS.draw_interval_id);
              console.log("Alert: Unable to maintain frame rate!");
            }
          }else{
            countF=9;
            drawing=true;*/
          context.clearRect(0, 0, width, height);
          if(popped = THIS.particles.pop())
            THIS.drawParticles(popped,context);
          //drawing=false;
          fps++;
          if(THIS.particles.length==75||THIS.particles.length==3)
            THIS.particleWorker.worker.postMessage({
              action:"resume"
            });
          //}
          THIS.draw_interval_id=window.requestAnimationFrame(draw);
        }
        if(o.mouseMoveHandler)THIS.onmousemove=o.mouseMoveHandler;
        THIS.draw_interval_id=window.requestAnimationFrame(draw);
        window.addEventListener("resize",THIS.update,false);//if(o.autofit)setInterval(THIS.update,3000);
        mySite.applyAcrossBrowser(function(bro){
          document.addEventListener(bro+"visibilitychange",function(){
            if(document[(bro)?bro+'Hidden':'hidden'])window.cancelAnimationFrame(THIS.draw_interval_id);
            else THIS.draw_interval_id=window.requestAnimationFrame(draw);
          },false);
        });
        setInterval(function(){
          THIS.fps=fps;
          fps=0;
        },1000);
        $(document).on('mySite:ajaxcompleted',function(){
          if(!document.body.contains(THIS)){
            window.cancelAnimationFrame(THIS.draw_interval_id);
            mySite.wipeObject(THIS);
          }
        });
      });
    };
    $.fn.paintTwinklingStars=function(o){
      var x,y,r,newo,twoPI=Math.PI*2,len,pLen;
      this.paintParticles($.extend({
        particleScript:"twinkler.js",
        drawParticles:function(frame,context){
          for(len=frame.length/6;len;){
            pLen=--len*6;
            x=frame[pLen];
            y=frame[pLen+1];
            r=frame[pLen+2];
            newo=frame[pLen+4];
            context.beginPath();
            context.arc(x,y,r,0,twoPI,true);
            context.closePath();
            g=context.createRadialGradient(x,y,0,x,y,frame[pLen+5]);
            g.addColorStop(0.0,'rgba(255,255,255,'+newo+')');
            g.addColorStop(frame[pLen+3],'rgba(77,101,181,'+(newo*.6)+')');
            g.addColorStop(1.0,'rgba(77,101,181,0)');
            context.fillStyle=g;
            context.fill();
          }
        }
      },o));
    }
    $.fn.paintMS_SnowFlakes=function(o){
      var len,pLen;
      this.paintParticles($.extend({
        particleScript:"ms.snowflakes.js",
        drawParticles:function(frame,context){
          for (len=frame.length/6;len;){
            pLen=--len*6;
            context.globalAlpha=frame[pLen];
            context.drawImage(
              snowflakeSprites[frame[pLen+1]],// image
              0,// source x
              0,// source y
              o.spriteWidth,// source width
              o.spriteHeight,// source height
              frame[pLen+2],// target x
              frame[pLen+3],// target y
              frame[pLen+4],// target width
              frame[pLen+5]);// target height
          }
        }
      },o));
    }
  }

  $.fn.pasteEvents=function(delay){
    if(delay==undefined)delay=20;
    return $(this).each(function(){
      var $el=$(this);
      $el.on("paste", function() {
        $el.trigger("prepaste");
        setTimeout(function() {
          $el.trigger("postpaste");
        }, delay);
      });
    });
  };

  /**
   * @author Alexander Farkas
   * v. 1.02
   */
  $.extend($.fx.step,{
    backgroundPosition:function(fx){
      if(fx.state===0&&typeof fx.end=='string'){
        var start=$.curCSS(fx.elem,'backgroundPosition');
        start=toArray(start);
        fx.start=[start[0],start[2]];
        var end=toArray(fx.end);
        fx.end=[end[0],end[2]];
        fx.unit=[end[1],end[3]];
      }
      var nowPosX=[];
      nowPosX[0]=((fx.end[0]-fx.start[0])*fx.pos)+fx.start[0]+fx.unit[0];
      nowPosX[1]=((fx.end[1]-fx.start[1])*fx.pos)+fx.start[1]+fx.unit[1];
      fx.elem.style.backgroundPosition=nowPosX[0]+' '+nowPosX[1];
      function toArray(strg){
        strg=strg.replace(/left|top/g,'0px');
        strg=strg.replace(/right|bottom/g,'100%');
        strg=strg.replace(/([0-9\.]+)(\s|\)|$)/g,"$1px$2");
        var res = strg.match(/(-?[0-9\.]+)(px|\%|em|pt)\s(-?[0-9\.]+)(px|\%|em|pt)/);
        return [parseFloat(res[1],10),res[2],parseFloat(res[3],10),res[4]];
      }
    }
  });
  /** End @author Alexander Farkas */

  /*!
   * $.preload() function for jQuery
   * Preload images, CSS and JavaScript files without executing them
   * Script by Stoyan Stefanov - http://www.phpied.com/preload-cssjavascript-without-execution/
   * Slightly rewritten by Mathias Bynens - http://mathiasbynens.be/
   * Demo: http://mathiasbynens.be/demo/javascript-preload
   * Note that since this script relies on jQuery, the preloading process will not start until jQuery has finished loading.
   */
  $.extend({
    preload:function(arr){
      var i=arr.length,o;
      while(i--){
        if($.browser.msie){
          new Image().src=arr[i];
          continue;
        }
        o=document.createElement('object');
        o.data=arr[i];
        o.width=o.height=0;
        o.style.position='absolute';
        document.getElementById('preloads').appendChild(o);
      }
    }
  });

  mySite.updateLocation=function(){
    mySite.calcLevelChange();
    try{
      _gaq.push(['_trackPageview',mySite.location.url]);
    }catch(e){}
  }
  mySite.pushHistory=function(stateobj,title,url){
    if(Modernizr.history)history.pushState(stateobj,title,url);
    else location.hash="!"+mySite.qualifyURL(url).replace(mySite.domain,"");
    mySite.pre_location=mySite.location;
    mySite.location=new Location();
    mySite.updateLocation();
  }
  mySite.replaceHistory=function(stateobj,title,url){
    if(Modernizr.history)history.replaceState(stateobj,title,url);
    else location.hash="!"+mySite.qualifyURL(url).replace(mySite.domain,"");
    mySite.location=new Location();
    mySite.updateLocation();
  }
  $.fn.updateSocialPlugins=function(o){
    o=$.extend({},o);
    return this.each(function(){
      try{
        gapi.plusone.go(this);
      }catch(e){}
      try{
        FB.XFBML.parse(this);
      }
      catch(e){}
    });
  }
  $.fn.drawDoc=function(o){
    o=$.extend({},o);
    return this.each(function(){
      var $this=$(this);
      if(Modernizr.history){
        $this.find("a.ajaxedNav").ajaxLinks();
      }
      try{
        $this.find(".alert-message").alert();
      }catch(e){}
      $this.find(".lavaLamp").lavaLamp();
      $this.find("a.scroll").click(function(e){
        $.scrollTo(this.hash||0,1500);
        e.preventDefault();
      });
      try {
        $this.find("a.lightbox").lightBox();
      } catch(e){}
      try{
        if(Modernizr.canvas){
          $this.find("#TopBanner").paintTwinklingStars({
            className:"SnowFall"
          });
        }
      }catch(e){}
      try{
        Cufon.refresh();
      }catch(e){}
    });
  }
  mySite.refreshSocial=function(){
    try {
      mySite.user.facebook.refresh();
    }catch(e){}
  }
  mySite.refresh=function(){
    mySite.refreshSocial();
  }
  mySite.update=function(){
    //var outOfStructure=true;
    $("nav").each(function(i,ele){
      var selected, el;
      $("a",this).each(function(){
        el=$(this);
        if(mySite.qualifyURL(this.href)==mySite.location.url.substr(0,mySite.qualifyURL(this.href).length)){
          if(!(selected&&(this.href<selected[0].href))){
            el.parent().addClass('selected');
            if(selected)selected.parent().removeClass('selected');
            selected=el;
          }
        }
        else el.parent().removeClass('selected');
      //if($(el).hasClass("HOME")&&(mySite.location.url.length>(mySite.qualifyURL(this.href).length)))$(this).parent().removeClass('selected');
      });
    });
    $('html').removeClass('loading');
  }
  function SerializedAjaxLoader(preprocess,callback,onError){
    this.preprocess=preprocess;
    this.data={};
    this.queue={
      current:{
        url:location.href,
        callback:null
      },
      waiting:null
    };
    this.ajaxloader=null;
    this.ajaxCritical=false;
    this.useWebWorkers=true;
    var THIS=this;
    function onComplete(responseText,status){
      if (status==200||(mySite.location.is404&&status==404)){
        mySite.location.is404=false;
        callback(responseText,status,THIS.data);
        if(THIS.queue['current'].callback)THIS.queue['current'].callback(responseText,status);
        THIS.queue['current']=null;
        if(THIS.queue['waiting'])THIS.load();
      }
      else{
        onError(status);//$("#error").html(msg + xhr.status + " " + xhr.statusText);
      }
    }
    this.load=function(){
      if((!this.ajaxCritical)&&(this.queue['current']||this.queue['waiting'])){
        if(this.ajaxloader)this.ajaxloader.terminate();
        if(this.queue['waiting']){
          this.queue['current']=this.queue['waiting'];
          this.queue['waiting']=null;
        }
        preprocess(this.queue['current']);
        if(Modernizr.webworkers&&this.useWebWorkers){
          this.ajaxloader=new Worker(mySite_config.urls.workers[this.queue['current'].dataType||'ajax']);
          this.ajaxloader.addEventListener('message',function(event){
            try{
              THIS.ajaxCritical=true;
              //(jqXHR,status,responseText)
              // If successful, inject the HTML into all the matched elements
              onComplete(event.data.responseText,event.data.status);
              THIS.ajaxCritical=false;
            }catch(e){
              onError(e);
            }
          },false);
          this.ajaxloader.addEventListener('error',function(e){
            console.log(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''));
            onError(event);
          },false);
          // Take care of vendor prefixes.
          //mySite.webworkers.ajaxloader.postMessage = mySite.webworkers.ajaxloader.webkitPostMessage || mySite.webworkers.ajaxloader.postMessage;
          this.ajaxloader.postMessage(THIS.queue['current'].url);
        }else{
          jQuery.ajax({
            url:THIS.queue['current'].url,
            type:"GET",
            dataType:THIS.queue['current'].dataType||"html",
            // Complete callback (responseText is used internally)
            complete:function(jqXHR,status,responseText) {
              try{
                THIS.ajaxCritical=true
                // Store the response as specified by the jqXHR object
                responseText=jqXHR.responseText;
                // If successful, inject the HTML into all the matched elements
                if (jqXHR.isResolved()){
                  // #4825: Get the actual response in case a dataFilter is present in ajaxSettings
                  jqXHR.done(function(r){
                    responseText=r;
                    onComplete(responseText,status);
                  });
                }else if(status=="error")onError(status);
                THIS.ajaxCritical=false;
              }catch(e){
                onError(e);
              }
            },
            error:function(jqXHR,textStatus,errorThrown){
              onError(errorThrown);
            }
          });
        }
      }
    }
    this.loadTo=function(queueObj){
      THIS.queue['waiting']=queueObj;
      THIS.load();
    }
  }
  if(Modernizr.history){
    mySite.ajaxPageLoader=new SerializedAjaxLoader(
      function(current){
        if(mySite.fireEvent('mySite:ajaxstart',{
          relatedTarget:$("#PL"+mySite.location.pageChangeLevel)[0]
        }))
          return;
        $('html').addClass("PL"+mySite.location.pageChangeLevel+"_ajax");
        mySite.ajaxPageLoader.queue['current'].url=mySite.location.url;
      },function(responseText,status){
        if(mySite.fireEvent('mySite:ajaxsuccess',{
          relatedTarget:$("#PL"+mySite.location.pageChangeLevel)[0]
        },[responseText,status]))
          return;
        // Create a dummy div to hold the results
        var responseDOM=jQuery("<div>")
        // inject the contents of the document in, removing the scripts to avoid any 'Permission Denied' errors in IE
        .append(responseText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,""));
        $("header#MainHeader").replaceWith(responseDOM.find("header#MainHeader"));
        $("header#MainHeader").updateSocialPlugins();
        $("#PL"+mySite.location.pageChangeLevel).replaceWith(responseDOM.find("#PL"+mySite.location.pageChangeLevel));
        responseDOM.find('title').replaceAll('title');
        responseDOM.find('meta').each(function(){
          var THIS=$(this);
          if(THIS.attr('http-equiv'))THIS.replaceAll($('meta[name~="'+THIS.attr('http-equiv')+'"]'));
          else if(THIS.attr('name'))THIS.replaceAll($('meta[name~="'+THIS.attr('name')+'"]'));
          else if(THIS.attr('property'))THIS.replaceAll($('meta[name~="'+THIS.attr('property')+'"]'));
          else if(THIS.attr('itemprop'))THIS.replaceAll($('meta[name~="'+THIS.attr('itemprop')+'"]'));
        });
        responseDOM=null;
        $("#PL"+mySite.location.pageChangeLevel).drawDoc().updateSocialPlugins();
        mySite.update();
        mySite.refresh();
        $('html').removeClass("PL"+mySite.location.pageChangeLevel+"_ajax");
        if(mySite.fireEvent('mySite:ajaxcompleted',{
          relatedTarget:$("#PL"+mySite.location.pageChangeLevel)[0]
        }))
          return;
      },function(e){
        if(!mySite.fireEvent('mySite:ajaxerror',{
          relatedTarget:$("#PL"+mySite.location.pageChangeLevel)[0]
        }))
          document.location.replace(mySite.location.url);
      });
    mySite.ajaxTo=function(queueObj){
      try{
        mySite.ajaxPageLoader.loadTo(queueObj);
      }
      catch(e){
        document.location.replace(mySite.location.url);
      }
    }
    $.fn.ajaxLinks=function(o) {
      o=$.extend({},o);
      return this.each(function(){
        $(this).on('click', function(e){
          var link=event.currentTarget;
          if (link.tagName.toUpperCase()!=='A')
            throw "requires an anchor element";
          if(location.protocol!==link.protocol||location.host!==link.host){
            return;
          }
          if(event.which>1||event.metaKey){
            return;
          }
          if(link.hash&&link.href.replace(link.hash,'')===location.href.replace(location.hash,'')){
          //return;
          }
          $('html').removeClass('PoppedBack');
          mySite.pushHistory(null,'',this.href);
          mySite.ajaxTo({
            url:this.href,
            callback:function(responseText,status){}
          });
          e.preventDefault();
          return false;
        });
      });
    };
  }
})(jQuery);

jQuery(document).ready(function($){
  $('html').removeClass('loading');
  $('html').addClass('interactive');
  var enID,enhance=function(){
    mySite.enhanced=true;
    $(document).updateSocialPlugins();
    mySite.refresh();
    if(mySite_config.cufon)mySite.importScript('//js.abhishekmunie.com/libs/cufon-yui.basicfonts.js',true);
    for(var i=0;i<mySite_config.twitter_streams.length;i++)
      mySite.twitter_streams[mySite_config.twitter_streams[i]]=mySite.createTwitterStream(mySite_config.twitter_streams[i]);
    setTimeout("$.preload(mySite_config.preloads)",5000);
    $('html').addClass('enhanced');
  }
  $(window).load(function(){
    $('html').removeClass('interactive');
    $('html').addClass('complete');
    window.clearTimeout(enID);
    enhance();
  });
  window.addEventListener('hashchange',function(event){
      
    });
  window.addEventListener('popstate',function(event){
    $('html').addClass('PoppedBack');
    mySite.pre_location=mySite.location;
    mySite.location=new Location();
    mySite.updateLocation();
    if(mySite.location.is404||(mySite.location.href.replace(mySite.location.hash,'')===mySite.pre_location.href.replace(mySite.pre_location.hash,''))){
      mySite.refresh();
      return;
    }
    mySite.ajaxTo({
      url:location.pathname
    });
  });
  $(window).unload(function(){
    
    });
  $(document.body).on('online',function(){
    console.log("Online");
  });
  $(document.body).on('offine',function(){
    console.log("Offline");
  });
  // orientation on firefox
  function handleOrientation(orientData){
    mySite.orientation=true;
    mySite.orientX=orientData.x;
    mySite.orientY=orientData.y;
  }
  window.addEventListener("MozOrientation",handleOrientation,true);
  // orientation on mobile safari
  if (window.DeviceMotionEvent!=undefined){
    mySite.orientation=true;
    window.ondevicemotion=function(event){
      mySite.orientX=event.accelerationIncludingGravity.x;
      mySite.orientY=event.accelerationIncludingGravity.y;
    };
  }

  if(location.hash){
    if((/!/g).test(location.hash)){
      if(Modernizr.history){
        history.replaceState(null,'',location.hash.toString().substring(2));
        mySite.ajaxTo({
          url:location.hash.toString().substring(2)
        });
      } else {
        document.location.href=location.hash.toString().substring(2);
      }
    }
  }
  $(document).ajaxSuccess(function(){

    });
  $('body').append(mySite.overlayTheater.theater);
  if(mySite_config.google.cse)mySite.importScript("https://www.google.com/jsapi?callback=loadGoogleJSApi",true);
  mySite.update();
  $('body').drawDoc();
  $('html').addClass('initialized');
  enID=window.setTimeout(enhance,3000);
  setTimeout("$('html').addClass('startup');",500);
  setTimeout("$('html').removeClass('startup');",5000);
});

function loadGoogleJSApi(){
  google.load('search', '1', {
    language : 'en', 
    style : google.loader.themes.V2_DEFAULT,
    callback:function() {
      var customSearchOptions={};
      var imageSearchOptions={};
      imageSearchOptions['layout']=google.search.ImageSearch.LAYOUT_POPUP;
      customSearchOptions['enableImageSearch']=true;
      customSearchOptions['imageSearchOptions']=imageSearchOptions;
      var customSearchControl=new google.search.CustomSearchControl(mySite_config.googleCSEId,customSearchOptions);
      customSearchControl.setResultSetSize(google.search.Search.FILTERED_CSE_RESULTSET);
      var options=new google.search.DrawOptions();
      options.setSearchFormRoot('Google_CS_Box');
      options.setAutoComplete(true);
      customSearchControl.setAutoCompletionId(mySite_config.googleCSEAutoCompletionId);
      customSearchControl.draw('cse_result', options);
      //Page Search
      if(document.getElementById('Google_Page_CS_Box')){
        var customSearchOptions = {};
        var imageSearchOptions = {};
        imageSearchOptions['layout']=google.search.ImageSearch.LAYOUT_POPUP;
        customSearchOptions['enableImageSearch']=true;
        customSearchOptions['imageSearchOptions']=imageSearchOptions;
        var customSearchControl = new google.search.CustomSearchControl(mySite_config.googleCSEId,customSearchOptions);
        customSearchControl.setResultSetSize(google.search.Search.FILTERED_CSE_RESULTSET);
        var options = new google.search.DrawOptions();
        options.setSearchFormRoot('Google_Page_CS_Box');
        options.setAutoComplete(true);
        customSearchControl.setAutoCompletionId(mySite_config.googleCSEAutoCompletionId);
        customSearchControl.draw('cse_Page_result', options);
        customSearchControl.execute(document.getElementById('goog-wm-qt').value);
      }
    }
  });
}