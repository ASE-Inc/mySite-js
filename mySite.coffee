### @author Abhishek Munie ###
window.jQuery || document.write "\x3Cscript src='https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js'\x3e\x3C/script\x3e"

$('html').addClass if RegExp(" AppleWebKit/").test(navigator.userAgent) then 'applewebkit' else 'not-applewebkit'

mySite_config = $.extend true,
  urls:
    resource: location.protocol + '//' + location.hostname + '/'
    workers:
      ajax: "/modules/ajaxloader.worker.js"
      jsonp: "/modules/jsonploader.worker.js"
  preloads: []
  twitter_streams: []
  flickr_photostreams: []
  facebook: undefined
  #  appid : undefined
  addThis: undefined
  #  id : undefined
  google:
    plus: undefined
    #  lang : undefined
    analytics: undefined
    #  id : undefined
    cse: undefined
    #  id : undefined
    #  autoCompletionId : undefined
  cufon: undefined
, window.mySite_config

# Avoid `console` errors in browsers that lack a console.
(() ->
  noop = () ->
  methods = [
      'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
      'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
      'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
      'timeStamp', 'trace', 'warn'
  ]
  length = methods.length
  console = (window.console = window.console || {})

  while length--
    method = methods[length]

    # Only stub undefined methods.
    unless condition
      console[method] = noop
)()

qualifyURL = (url) ->
  div = document.createElement('div')
  div.innerHTML = "<a></a>"
  div.firstChild.href = url #Ensures that the href is properly escaped
  div.innerHTML = div.innerHTML #Run the current innerHTML back through the parser
  div.firstChild.href

getLevels = (url) ->
  Levels = url.toString().split '/'
  Levels.splice i--, 1 for i in [0...Levels.length] when not Levels[i]
  Levels

class Location

  constructor: (location = window.location) ->
    @href = location.href
    @url = location.href.replace(location.hash, "")
    @hash = location.hash
    @pageChangeLevel = undefined
    @params =
      serviceMode: location.hash is "#?test=true"
    HASH = @hash

    if HASH
      off1 = HASH.indexOf('!')
      off2 = HASH.indexOf('?')

      if off2 >= 0
        params = []
        for p in HASH.slice(off2 + 1).split /&amp|&/g
          param = p.split '='
          try
            param[1] = JSON.parse(param[1])
          catch e
            console.error e
          params[param[0]] = param[1]

        $.extend @params, params
        @hash = HASH.slice(0, off2 - 1)
        if off1 >= 0
          @url = HASH.slice(off1 + 1, off2 - 1)
          @hash = HASH.slice(0, off1 - 1)

      else if off1 >= 0
        @url = mySite.qualifyURL HASH.slice off1 + 1
        @hash = HASH.slice 0, off1 - 1

    @Levels = getLevels @url
    @pageLevel = @Levels.length - 2 || 1
    @is404 = false

class Facebook

  constructor: () ->
    window.fbAsyncInit = ->
      FB.init
        appId: mySite_config.facebook.appid, # App ID
        channelUrl: 'http//' + document.domain + '/channel.html', # Channel File
        status: true, # check login status
        cookie: true, # enable cookies to allow the server to access the session
        xfbml: !!mySite.enhanced, # parse XFBML
        oauth: true,
        frictionlessRequests: true

      $.fn.FBWelcome = (o) ->
        o = $.extend {}, o
        @each ->
          if mySite.user.facebook.currentUser?
            @innerHTML = if /undefined/i.test mySite.user.facebook.currentUser.name then 'Welcome, Guest' else 'Welcome, <img id="FBImage" class="fb_profile_image" src="https://graph.facebook.com/' + mySite.user.facebook.currentUser.id + '/picture"/> ' + mySite.user.facebook.currentUser.name
      # Additional initialization code here
      mySite.user.facebook = new FacebookUser()

      # run once with current status and whenever the status changes
      FB.getLoginStatus mySite.user.facebook.update
      FB.Event.subscribe 'auth.statusChange', mySite.user.facebook.update
      FB.Event.subscribe 'auth.login', (response) ->
      FB.Event.subscribe 'auth.logout', (response) ->

    # Load the SDK Asynchronously
    unless document.getElementById('facebook-jssdk')
      mySite.importScript "//connect.facebook.net/en_US/all.js#appId=#{mySite_config.facebook.appid}", false, 'facebook-jssdk'

class FacebookUser

  constructor: () ->

  setCurrentUser: ->
    FB.api '/me', (user) ->
      mySite.user.facebook.currentUser = user

  getLoginStatus: ->
    FB.getLoginStatus (response) ->
      if response.status is 'connected'
        # the user is logged in and has authenticated your
        # app, and response.authResponse supplies
        # the user's ID, a valid access token, a signed
        # request, and the time the access token
        # and signed request each expire
        uid = response.authResponse.userID
        accessToken = response.authResponse.accessToken
      else if response.status is 'not_authorized'
        # the user is logged in to Facebook,
        # but has not authenticated your app
      else
        # the user isn't logged in to Facebook.

  getUpdateLoginStatus: ->
    FB.getLoginStatus (response) ->
      if response.status is 'connected'
        # the user is logged in and has authenticated your
        # app, and response.authResponse supplies
        # the user's ID, a valid access token, a signed
        # request, and the time the access token
        # and signed request each expire
        uid = response.authResponse.userID
        accessToken = response.authResponse.accessToken
      else if response.status is 'not_authorized'
        # the user is logged in to Facebook,
        # but has not authenticated your app
      else
        # the user isn't logged in to Facebook.
    , true

  login: (callback, scope) ->
    FB.login callback,
      scope: scope

  logout: (callback) ->
    FB.logout callback
  # run once with current status and whenever the status changes

  update: (response) ->
    if response.authResponse
      #user is already logged in and connected
      console.log 'Welcome!  Fetching your information.... '
      FB.api '/me', (response) ->
        mySite.user.facebook.currentUser = response
        console.log 'We are delighted you, ' + response.name + '.'
    else
      #user is not connected to your app or logged out
      console.log 'User cancelled login or did not fully authorize or logged out.'
      mySite.user.facebook.currentUser = undefined
    mySite.user.facebook.refresh()

  refresh: ->
    $('.FBWelcome').FBWelcome()


class Tweet
  constructor: (data) ->
    @id = data.id_str
    @data = data
    @oEmbedData = undefined
    @worker = undefined
    @loadOEmbed()

  loadOEmbed: ->
    if Modernizr.webworkers
      @worker = new Worker(mySite_config.urls.workers.jsonp)
      @worker.addEventListener 'message', (event) =>
        if event.data.type is "debug"
          console.log event.data.data
        else if event.data.status is 200
          @oEmbedData = event.data.json
      , false
      @worker.addEventListener 'error', (event) ->
        undefined
      , false
      @worker.postMessage "https://api.twitter.com/1/statuses/oembed.json?id=#{data.id_str}&omit_script=true&callback=?"
    else
      jQuery.ajax
        url: "https://api.twitter.com/1/statuses/oembed.json?id=" + data.id_str + "&omit_script=true&callback=?"
        async: true
        dataType: 'json'
        success: (oEmbedData) =>
          @oEmbedData = oEmbedData

class Twitter_Stream
   constructor: (@username) ->
      @count = 30
      @tweets = []
      @updateInterval = 180000
      @loaders =
        update: new SerializedAjaxLoader((current, data) =>
          undefined
        , (responseText, status, data) =>
          responseDOM = null
          window.setTimeout @update, @updateInterval
        , (e)=>
          undefined
        ),
        load: new SerializedAjaxLoader((current, data) =>
          undefined
        , (responseText, status, data) =>
          responseDOM = null
        , (e) =>
          undefined
        )

      @load()
      window.setTimeout(@update, @updateInterval)
      mySite.createTwitterStream = (username) -> new Twitter_Stream(username)

    update: () ->
      $.getJSON "https://twitter.com/status/user_timeline/#{@username}.json?count=9&since_id=#{@tweets[0].id}&callback=?", (data) =>
        $.each data, (index, tweet) =>
          if tweet isnt @tweets[i].data
            @tweets.unshift new Tweet(tweet)

    load: () ->
      $.getJSON "https://twitter.com/status/user_timeline/#{@username}.json?count=9#{if @tweets.length > 0 then "&max_id=" + @tweets[@tweets.length - 1].id else ""}&callback=?", (data) =>
        $.each data, (index, tweet) =>
          @tweets.push new Tweet(tweet)
      #@loader.load.loadTo({url:"https://twitter.com/status/user_timeline/#{@username}.json?count=9"+((@tweets.length>0)?"&max_id="+@tweets[@tweets.length-1].id:"")+"&callback=?"})


class SerializedAjaxLoader

  constructor: (@preprocess, @callback, @onError) ->
    @preprocess = preprocess
    @data = {}
    @queue = {
      current: {
        url: location.href,
        callback: null
      },
      waiting: null
    }
    @ajaxloader = null
    @ajaxCritical = false
    @useWebWorkers = true

    @onComplete = (responseText, status) =>
      if status is 200 or (mySite.location.is404 and status is 404)
        mySite.location.is404 = false
        callback responseText, status, @data
        @queue['current'].callback(responseText, status) if @queue['current'].callback
        @queue['current'] = null
        @load() if @queue['waiting']
      else
        @onError status #$("#error").html(msg + xhr.status + " " + xhr.statusText)

  load: ->
    if not @ajaxCritical  and (@queue['current'] or @queue['waiting'])
      @ajaxloader.terminate() if @ajaxloader
      if @queue['waiting']
        @queue['current'] = @queue['waiting']
        @queue['waiting'] = null

      @preprocess @queue['current']
      if Modernizr.webworkers and @useWebWorkers
        @ajaxloader = new Worker(mySite_config.urls.workers[@queue['current'].dataType or 'ajax'])
        @ajaxloader.addEventListener 'message', (event) =>
          try
            @ajaxCritical = true
            #(jqXHR,status,responseText)
            # If successful, inject the HTML into all the matched elements
            @onComplete event.data.responseText, event.data.status
            @ajaxCritical = false
          catch e
            onError e
        , false
        @ajaxloader.addEventListener 'error', (e) =>
          console.error ['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join ''
          onError event
        , false
        # Take care of vendor prefixes.
        #mySite.webworkers.ajaxloader.postMessage = mySite.webworkers.ajaxloader.webkitPostMessage || mySite.webworkers.ajaxloader.postMessage
        @ajaxloader.postMessage @queue['current'].url
      else
        jQuery.ajax
          url: @queue['current'].url
          type: "GET"
          dataType: @queue['current'].dataType || "html"
          # Complete callback (responseText is used internally)
          complete: (jqXHR, status, responseText) =>
            try
              @ajaxCritical = true
              # Store the response as specified by the jqXHR object
              responseText = jqXHR.responseText
              # If successful, inject the HTML into all the matched elements
              if jqXHR.isResolved()
                # #4825: Get the actual response in case a dataFilter is present in ajaxSettings
                jqXHR.done (r) =>
                  responseText = r
                  @onComplete responseText, status
              else if status is "error"
                onError status
              @ajaxCritical = false
            catch e
              onError e
          error: (jqXHR, textStatus, errorThrown) =>
            onError errorThrown

  loadTo: (queueObj) ->
    @queue['waiting'] = queueObj
    @load()


class BlobWorker
  constructor: () ->

  create: (workerBody, onmessage) ->
    if BlobBuilder
      bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)()
      bb.append workerBody
      # Obtain a blob URL reference to our worker 'file'.
      # Note: window.webkitURL.createObjectURL() in Chrome 10+.
      blobURL = (window.URL || window.webkitURL).createObjectURL bb.getBlob()
      #Blob URLs are unique and last for the lifetime of your application (e.g. until the document is unloaded).
      #If you're creating many Blob URLs, it's a good idea to release references that are no longer needed.
      #You can explicitly release a Blob URLs by passing it to window.URL.revokeObjectURL():
      return new Worker(blobURL)
    else
      console.log 'BlobBuilder is not supported in the browser!'
      return

  release: (blobURL) ->
    (window.URL || window.webkitURL).revokeObjectURL blobURL

mySite = $.extend true,
  domain: location.protocol + '//' + location.hostname + '/'
  resource: mySite_config.urls.resource
  qualifyURL: qualifyURL
  getLevels: getLevels
  ### Internal: Parse URL components and returns a Locationish object.
   # url - String URL
   # Returns HTMLAnchorElement that acts like Location.
  ###
  parseURL: (url) ->
    a = document.createElement('a')
    a.href = url
    a
  checkString: (str) ->
    try
      str = JSON.parse str
    catch e
      console.error e
    str
  location: new Location()
  pre_location: undefined
  next_location: null
  calcLevelChange: (current = mySite.pre_location, previous = mySite.location) ->
    len = Math.min(current.Levels.length, previous.Levels.length) - 1
    len = 2 if len < 2
    current.pageChangeLevel = 1
    while current.pageChangeLevel < len current.pageChange and current.Levels[current.pageChangeLevel + 1] is previous.Levels[current.pageChangeLevel + 1]
      Levels++
  updateLocation: ->
    mySite.calcLevelChange()
    try
      _gaq.push(['_trackPageview', mySite.location.url])
    catch e
      console.error e
  pushHistory: (stateobj, title, url) ->
    if Modernizr.history
      history.pushState stateobj, title, url
    else
      location.hash = "!" + mySite.qualifyURL(url).replace mySite.domain, ""
    mySite.pre_location = mySite.location
    mySite.location = new Location()
    mySite.updateLocation()
  replaceHistory: (stateobj, title, url) ->
    if Modernizr.history
      history.replaceState stateobj, title, url
    else
      location.hash = "!" + mySite.qualifyURL(url).replace mySite.domain, ""
    mySite.location = new Location()
    mySite.updateLocation()
  ajaxPageLoader: new SerializedAjaxLoader (current) ->
      if mySite.fireEvent('mySite:ajaxstart', relatedTarget: $("#PL" + mySite.location.pageChangeLevel)[0])
        return
      $('html').addClass "PL" + mySite.location.pageChangeLevel + "_ajax"
      mySite.ajaxPageLoader.queue['current'].url = mySite.location.url
    , (responseText, status) ->
      if mySite.fireEvent('mySite:ajaxsuccess', relatedTarget: $("#PL" + mySite.location.pageChangeLevel)[0], [responseText, status])
        return
      # Create a dummy div to hold the results
      responseDOM = jQuery("<div>")
      # inject the contents of the document in, removing the scripts to avoid any 'Permission Denied' errors in IE
      .append responseText.replace /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""
      $("header#MainHeader").replaceWith responseDOM.find "header#MainHeader"
      $("header#MainHeader").updateSocialPlugins()
      $("#PL" + mySite.location.pageChangeLevel).replaceWith responseDOM.find "#PL" + mySite.location.pageChangeLevel
      responseDOM.find('title').replaceAll 'title'
      responseDOM.find('meta').each ->
        $this = $(@)
        if $this.attr 'http-equiv'
          $this.replaceAll $('meta[name~="' + $this.attr('http-equiv') + '"]')
        else if $this.attr 'name'
          $this.replaceAll $('meta[name~="' + $this.attr('name') + '"]')
        else if $this.attr 'property'
          $this.replaceAll $('meta[name~="' + $this.attr('property') + '"]')
        else if $this.attr 'itemprop'
          $this.replaceAll $('meta[name~="' + $this.attr('itemprop') + '"]')

      responseDOM = null
      $("#PL" + mySite.location.pageChangeLevel).drawDoc().updateSocialPlugins()
      mySite.update()
      mySite.refresh()
      $('html').removeClass "PL" + mySite.location.pageChangeLevel + "_ajax"
      if mySite.fireEvent('mySite:ajaxcompleted', relatedTarget: $("#PL" + mySite.location.pageChangeLevel)[0])
        return
    , (e) ->
      unless mySite.fireEvent('mySite:ajaxerror', relatedTarget: $("#PL" + mySite.location.pageChangeLevel)[0])
        document.location.replace mySite.location.url

  ajaxTo: (queueObj) ->
    try
      mySite.ajaxPageLoader.loadTo queueObj
    catch e
      document.location.replace(mySite.location.url)
  ajaxTo: null
  twitter_streams: {}
  flickr_photostreams: {}
  refreshSocial: ->
    try
      mySite.user.facebook.refresh()
    catch e
      console.error e
  refresh: ->
    mySite.refreshSocial()
  update: ->
    # outOfStructure=true
    $("nav").each (i, ele) ->
      selected = undefined
      $("a", @).each ->
        el = $(@)
        if mySite.qualifyURL(@href) is mySite.location.url.substr(0, mySite.qualifyURL(@href).length)
          unless selected and @href < selected[0].href
            el.parent().addClass 'selected'
            selected.parent().removeClass('selected') if selected
            selected = el
        else
          el.parent().removeClass 'selected'
        #if($(el).hasClass("HOME")&&(mySite.location.url.length>(mySite.qualifyURL(@href).length)))$(@).parent().removeClass('selected')
    $('html').removeClass 'loading'
  sky:
    stars: []
    snow: []
    starsWorker: undefined
    snowWorker: undefined
  fireEvent: (eType, eParams, eExtraParams) ->
    e = jQuery.Event eType, eParams
    $(document).trigger e, eExtraParams
    e.isDefaultPrevented()
  user:
    facebook: undefined
  overlayTheater:
    theater: $ """
      <aside id="overlayTheaterBack" class="overlayTheaterBack" onclick="mySite.overlayTheater.close()"></aside>
      <aside id="overlayTheater" class="overlayTheater">
        <img class="LoadingImg" src="/img/icons/loading.png" alt="Loading..."/>
        <div class="info"><div id="msg"></div></div>
        <div class="warning"><div id="msg"></div></div>
        <div class="error"><div id="msg"></div></div>
        <div class="learnmore"><div id="msg"></div></div>
      </aside>
    """
    info: (msg) ->
      $('html').addClass 'info'
      $('.info .msg').html msg
    warning: (msg) ->
      $('html').addClass 'warning'
      $('.warning .msg').html msg
    error: (msg) ->
      $('html').addClass 'error'
      $('.error .msg').html msg
    close: ->
      $('html').removeClass 'loading info warning error'
  # ----------------------------------------------------------
  # If you're not in IE (or IE version is less than 5) then:
  #   ie is undefined
  # If you're in IE (>5) then you can determine which version:
  #   ie is 7 # IE7
  # Thus, to detect IE:
  #   if (ie) {}
  # And to detect the version:
  #   ie is 6 # IE6
  #   ie > 7 # IE8, IE9 ...
  #   ie < 9 # Anything less than IE9
  # ----------------------------------------------------------
  # http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  # http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
  ieVersion: (->
    v = 3
    div = document.createElement('div')
    while (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->') and div.getElementsByTagName('i')[0]
      undefined
    return if v > 4 then v else undefined
  )()
  getVisibilityState: ->
    document.visibilityState || document.webkitVisibilityState || document.msVisibilityState
  applyAcrossBrowser: (fn) ->
    fn browser for browser in browsers = ["", "webkit", "moz", "o", "ms"]
    undefined
  cloneObject: (o) ->
    newObj = if o instanceof Array then [] else {}
    for k,v in o
      if v and typeof(0[k]) is "object"
        newObj[k] = cloneThis v
      else newObj[k] = v
    newObj
  # remove all own properties on obj, effectively reverting it to a new object
  wipeObject: (obj) -> delete obj[k] for k,v in obj when obj.hasOwnProperty(k)
  relative_time: (rawdate) ->
    i = 0
    date = new Date(rawdate)
    seconds = (new Date() - date) / 1000
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
    ]

    while f = formats[i++]
      if seconds < f[0]
        return f[2] ? Math.floor(seconds / f[2]) + ' ' + f[1] + ' ago' : f[1]
    return 'A while ago'
  safeCallback: (callback, safeAfter) ->
    return () ->
      safeAfter(callback)
  importScript: (src, defer, id, callback) ->
    sp = document.createElement('script')
    sp.type = "text/javascript"
    sp.src = src
    sp.async = true
    sp.id = id if id?
    sp.defer = "defer" if defer
    if callback
      sp.onload = sp.onreadystatechange = ->
        rs = @readyState
        return if rs and rs isnt 'complete' && rs isnt 'loaded'
        try
          callback()
        catch e
          console.errore
    s = document.getElementsByTagName('script')[0]
    s.parentNode.insertBefore sp, s
, window.mySite

mySite.location.is404 = !! $('.container404')[0]
$('html').addClass 'serviceMode' if mySite.location.params.serviceMode

if mySite_config.facebook
  new Facebook()

if mySite_config.google.plus
  window.___gcfg =
    lang: mySite_config.google.plus.lang || 'en-US'
    parsetags: 'explicit'
  mySite.importScript 'https://apis.google.com/js/plusone.js'

###if(!Object.prototype.cloneThis)Object.prototype.cloneThis=function(){
  var newObj=(@ instanceof Array)?[]:{}
  for(i in @){
    if(i=='cloneThis')continue
    if(@[i] && typeof @[i]=="object"){
      newObj[i]=@[i].cloneThis()
    }else newObj[i]=@[i]
  }
  return newObj
}
###
### object.watch
if(!Object.prototype.watch)
  Object.prototype.watch=function(prop,handler){
    var oldval=@[prop],newval=oldval,
    getter=function(){
      return newval
    },
    setter=function(val){
      oldval=newval
      return newval=handler.call(@,prop,oldval,val)
    }
    if(delete @[prop]){//can't watch constants
      if(Object.defineProperty)//ECMAScript 5
        Object.defineProperty(@,prop,{
          get:getter,
          set:setter,
          enumerable:false,
          configurable:true
        })
      else if(Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__){# legacy
        Object.prototype.__defineGetter__.call(@,prop,getter)
        Object.prototype.__defineSetter__.call(@,prop,setter)
      }
    }
  }
# object.unwatch
if (!Object.prototype.unwatch)
  Object.prototype.unwatch=function(prop){
    var val=@[prop]
    delete @[prop]//remove accessors
    @[prop]=val
  }
 ###

### Inline Worker - http://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers###
# Prefixed in Webkit, Chrome 12, and FF6: window.WebKitBlobBuilder, window.MozBlobBuilder


# requestAnimationFrame polyfill by Erik Moller
# fixes from Paul Irish and Tino Zijdel
(->
  lastTime = 0
  vendors = ['ms', 'moz', 'webkit', 'o']

  if not window.requestAnimationFrame
    for vendor in vendors
      window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame']
      window.cancelAnimationFrame = window[vendors + 'CancelAnimationFrame'] or window[vendor + 'CancelRequestAnimationFrame']
      break if window.requestAnimationFrame

  if not window.requestAnimationFrame
    window.requestAnimationFrame = (callback, element) ->
      currTime = new Date().getTime()
      timeToCall = Math.max 0, 16 - (currTime - lastTime)
      id = window.setTimeout ->
        callback(currTime + timeToCall)
      , timeToCall
      lastTime = currTime + timeToCall
      id

  if not window.cancelAnimationFrame
    window.cancelAnimationFrame = (id) ->
      clearTimeout(id)
)()

(($) ->


  mySite.flickr_photostreams[mySite_config.flickr_photostreams[0]] =
    photos: []

  $.getJSON "http://api.flickr.com/services/feeds/photos_public.gne?ids=40168771@N07&lang=en-us&format=json&jsoncallback=?", (data) ->
    $.each data.items, (index, item) ->
      mySite.flickr_photostreams[mySite_config.flickr_photostreams[0]].photos.push item

  ###
   # Chris Coyier
   # http://css-tricks.com
  ###
  $.fn.flickrGallery = (o) ->
    o = $.extend {}, o
    @each (i, block) ->
      $.getJSON "http://api.flickr.com/services/feeds/photos_public.gne?ids=40168771@N07&lang=en-us&format=json&jsoncallback=?", (data) ->
        $.each data.items, (index, item) ->
          $("<img/>").attr('src', item.media.m).appendTo(block).wrap '<a href="' + item.link + '"></a>'

  ###* End Chris Coyier - http://css-tricks.com ###

  $.fn.lavaLamp = (o) ->
    o = $.extend {}, o
    @each ->
      $leftPad = $('<li id="leftPad" class="lavalampback topbar-inner"></li>').appendTo @
      $hoverPad = $('<li id="hoverPad" class="lavalampback"></li>').appendTo @
      $rightPad = $('<li id="rightPad" class="lavalampback topbar-inner"></li>').appendTo @

      styletag = $('<style type="text/css" class="lavalampStyle"/>').appendTo 'head'
      classN = "ll" + Math.floor(Math.random() * 1000)

      $leftPad.addClass  classN + 'leftPad'
      $hoverPad.addClass classN + 'hoverPad'
      $rightPad.addClass classN + 'rightPad'

      @setCurrent = (el = $("li.selected", @) or $("li:first", @)) =>
        styletag.remove() if styletag

        el_OL = el[0].offsetLeft
        el_OW = el[0].offsetWidth
        el_parent = el.parent()[0]
        el_parent_OL = el_parent.offsetLeft
        el_parent_OW = el_parent.offsetWidth
        styletag.html '.' + classN + 'leftPad {' + 'left:' + el_parent_OL + 'px' + 'width:' + (el_OL - el_parent_OL) + 'px' + '}' + ' .' + classN + 'hoverPad {' + 'left:' + el_OL + 'px' + 'width:' + el_OW + 'px' + '}' + ' .' + classN + 'rightPad {' + 'width:' + Math.max(0, el_parent_OL + el_parent_OW - el_OL - el_OW) + 'px' + 'left:' + (el_OL + el_OW) + 'px' + '}'

      $(">li>a", @).hover =>
        @setCurrent $(@parentElement)
      , =>
        undefined

      $(@).hover =>
        undefined
      , =>
        @setCurrent $("li.selected", @)

      $("li>a", @).not(".lavalampback").click =>
        @setCurrent $(@parentElement)

      @setCurrent()

      $(document).on 'mySite:ajaxcompleted', =>
        @setCurrent()

  if Modernizr.canvas

    class ParticleWorker extends Worker

      constructor: (dataHandler) ->
        super('/modules/particleSystems/particle.worker.transferable.js')

        @addEventListener 'message', (event) =>
          dataHandler event
        , false
        @addEventListener 'error', (event) =>
          console.log "Particle Worker Error: "
          console.log event
        , false

      postMessage: @webkitPostMessage || @postMessage

   class ParticleCanvas extends HTMLCanvasElement

    $.fn.paintParticles = (o) ->
      o = $.extend
        speed: 300,
        noOfParticles: 99,
        batchSize: 1000,
        rint: 60,
        id: undefined,
        className: "particle_canvas",
        particleScript: undefined,
        mouseMoveHandler: undefined,
        drawParticles: undefined,
        relativeto: undefined,
        autofit: true
      , o

      @each ->
        if @tagName is 'CANVAS'
          THIS = @
          $THIS = $(THIS)
          THIS.relativeto = $THIS.parent() unless o.relativeto
        else
          THIS = $('<canvas ' + (o.id ? 'id="' + o.id + '" ' : '') + 'class="' + o.className + '">').insertAfter(@)[0]
          $THIS = $(THIS)
          THIS.relativeto = $(@) unless o.relativeto

        THIS.relativeto = $(o.relativeto) if o.relativeto
        THIS.drawParticles = o.drawParticles
        THIS.particles = new Array()
        THIS.noOfParticles = o.noOfParticles
        THIS.particleWorker = new ParticleWorker (event) =>
          switch event.data.type
            when "status"
              console.log event.data.status
            else
              THIS.particles.unshift if event.data.buffer then event.data else new Float32Array(event.data)
              if THIS.particles.length > 1000
                THIS.particleWorker.worker.postMessage
                  action: "pause"
              if THIS.particles.length > 5999
                THIS.particles.splice 1000

        setWIDTH = (n) =>
          if n isnt width
            $THIS.attr 'width', n
            THIS.particleWorker.worker.postMessage
              action: "update"
              property: "width"
              value: n
            THIS.particles.splice 18
            width = n
        width = 1600

        setHEIGHT = (n) =>
          if n isnt height
            $THIS.attr 'height', n
            THIS.particleWorker.worker.postMessage
              action: "update"
              property: "height"
              value: n
            THIS.particles.splice 12
            height = n
        height = 900

        pxs = new Array()
        THIS.update = ->
          setWIDTH THIS.relativeto.width()
          setHEIGHT THIS.relativeto.height()


        ab = new Uint8Array(1).buffer
        try
          THIS.particleWorker.worker.postMessage(ab)
          THIS.particleWorker.worker.postMessage(ab, [ab])
        catch e
          console.error e
        transferableSupported = not ab.byteLength

        THIS.particleWorker.worker.postMessage
          action: "importParticleScript"
          script: o.particleScript
        THIS.particleWorker.worker.postMessage
          action: "update"
          property: "rint"
          value: o.rint
        THIS.particleWorker.worker.postMessage
          action: "update"
          property: "noOfParticles"
          value: o.noOfParticles
        THIS.particleWorker.worker.postMessage
          action: "update"
          property: "batchSize"
          value: o.batchSize
        THIS.particleWorker.worker.postMessage
          action: "update"
          property: "useTransferable"
          value: transferableSupported

        THIS.update()
        THIS.particleWorker.worker.postMessage
          action: "initialize"

        context = THIS.getContext '2d'
        fps = 0 #,drawing,countF=9
        draw = () =>
          ###if(drawing){
            if(!countF--){
              clearInterval(THIS.draw_interval_id)
              console.log("Alert: Unable to maintain frame rate!")
            }
          }else{
            countF=9
            drawing=true###
          context.clearRect 0, 0, width, height
          THIS.drawParticles(popped, context) if popped = THIS.particles.pop()
          #drawing=false
          fps++
          if THIS.particles.length is 75 or THIS.particles.length is 3
            THIS.particleWorker.worker.postMessage
              action: "resume"
          #}
          THIS.draw_interval_id = window.requestAnimationFrame draw

        THIS.onmousemove = o.mouseMoveHandler if o.mouseMoveHandler
        THIS.draw_interval_id = window.requestAnimationFrame draw

        window.addEventListener "resize", THIS.update, false # setInterval(THIS.update,3000) if o.autofit
        mySite.applyAcrossBrowser (bro) =>
          document.addEventListener bro + "visibilitychange", =>
            if document[(bro) ? bro + 'Hidden' : 'hidden']
              window.cancelAnimationFrame THIS.draw_interval_id
            else
              THIS.draw_interval_id = window.requestAnimationFrame draw
          , false

        setInterval ->
          THIS.fps = fps
          fps = 0
        , 1000

        $(document).on 'mySite:ajaxcompleted', =>
          unless document.body.contains THIS
            window.cancelAnimationFrame THIS.draw_interval_id
            mySite.wipeObject THIS

    $.fn.paintTwinklingStars = (o) ->
      @paintParticles $.extend
        particleScript: "twinkler.js",
        drawParticles: (frame, context) =>
          twoPI = Math.PI * 2
          len = frame.length / 6
          while len
            pLen = --len * 6
            x = frame[pLen]
            y = frame[pLen + 1]
            r = frame[pLen + 2]
            newo = frame[pLen + 4]
            context.beginPath()
            context.arc x, y, r, 0, twoPI, true
            context.closePath()
            g = context.createRadialGradient x, y, 0, x, y, frame[pLen + 5]
            g.addColorStop 0.0, 'rgba(255,255,255,' + newo + ')'
            g.addColorStop frame[pLen + 3], 'rgba(77,101,181,' + (newo * .6) + ')'
            g.addColorStop 1.0, 'rgba(77,101,181,0)'
            context.fillStyle = g
            context.fill()
      , o

    $.fn.paintMSSnowFlakes = (o) ->
      @paintParticles $.extend
        particleScript: "ms.snowflakes.js",
        drawParticles: (frame, context) =>
          len = frame.length / 6
          while len
            pLen = --len * 6
            context.globalAlpha = frame[pLen]
            context.drawImage(
              snowflakeSprites[frame[pLen + 1]], # image
              0, # source x
              0, # source y
              o.spriteWidth, # source width
              o.spriteHeight, # source height
              frame[pLen + 2], # target x
              frame[pLen + 3], # target y
              frame[pLen + 4], # target width
              frame[pLen + 5] # target height
            )
      , o


  $.fn.pasteEvents = (delay = 20) ->
    $(@).each ->
      $el = $(@)
      $el.on "paste", ->
        $el.trigger "prepaste"
        setTimeout =>
          $el.trigger "postpaste"
        , delay


  ###
   # @author Alexander Farkas
   # v. 1.02
  ###
  $.extend $.fx.step,
    backgroundPosition: (fx) ->
      toArray = (strg) ->
        strg = strg.replace(/left|top/g, '0px')
        strg = strg.replace(/right|bottom/g, '100%')
        strg = strg.replace(/([0-9\.]+)(\s|\)|$)/g, "$1px$2")
        res = strg.match(/(-?[0-9\.]+)(px|\%|em|pt)\s(-?[0-9\.]+)(px|\%|em|pt)/)
        return [parseFloat(res[1], 10), res[2], parseFloat(res[3], 10), res[4]]

      if fx.state is 0 and typeof fx.end is 'string'
        start = $.curCSS fx.elem, 'backgroundPosition'
        start = toArray start
        fx.start = [start[0], start[2]]
        end = toArray fx.end
        fx.end = [end[0], end[2]]
        fx.unit = [end[1], end[3]]

      nowPosX = []
      nowPosX[0] = ((fx.end[0] - fx.start[0]) * fx.pos) + fx.start[0] + fx.unit[0]
      nowPosX[1] = ((fx.end[1] - fx.start[1]) * fx.pos) + fx.start[1] + fx.unit[1]
      fx.elem.style.backgroundPosition = nowPosX[0] + ' ' + nowPosX[1]
  ### End @author Alexander Farkas ###

  ###
   * $.preload() function for jQuery
   * Preload images, CSS and JavaScript files without executing them
   * Script by Stoyan Stefanov - http://www.phpied.com/preload-cssjavascript-without-execution/
   * Slightly rewritten by Mathias Bynens - http://mathiasbynens.be/
   * Demo: http://mathiasbynens.be/demo/javascript-preload
   * Note that since @ script relies on jQuery, the preloading process will not start until jQuery has finished loading.
   ###
  $.extend
    preload: (arr) ->
      i = arr.length
      while i--
        if $.browser.msie
          new Image().src = arr[i]
          continue

        o = document.createElement('object')
        o.data = arr[i]
        o.width = o.height = 0
        o.style.position = 'absolute'
        document.getElementById('preloads').appendChild(o)

  $.fn.updateSocialPlugins = (o) ->
    o = $.extend {}, o
    @each ->
      try
        gapi.plusone.go @
      catch e
        console.error e
      try
        FB.XFBML.parse @
      catch e
        console.error e

  $.fn.drawDoc = (o) ->
    o = $.extend {}, o
    @each ->
      $this = $(@)
      $this.find("a.ajaxedNav").ajaxLinks()
      try
        $this.find(".alert-message").alert()
      catch e
        console.error e
      $this.find(".lavaLamp").lavaLamp()
      $this.find("a.scroll").click (e) ->
        $.scrollTo @hash || 0, 1500
        e.preventDefault()
      try
        $this.find("a.lightbox").lightBox()
      catch e
        console.error e
      try
        if Modernizr.canvas
          $this.find("#TopBanner").paintTwinklingStars
            className: "SnowFall"
      catch e
        console.error e
      try
        Cufon.refresh()
      catch e
        console.error e

  $.fn.ajaxLinks = (o) ->
    o = $.extend {}, o
    @each ->
      $(@).on 'click', (e) ->
        link = event.currentTarget

        throw "requires an anchor element" if link.tagName.toUpperCase() isnt 'A'
        return if location.protocol isnt link.protocol or location.host isnt link.host
        return if event.which > 1 or event.metaKey
        #return if link.hash and link.href.replace(link.hash, '') is location.href.replace(location.hash, '')

        $('html').removeClass 'PoppedBack'
        mySite.pushHistory null, '', @href
        mySite.ajaxTo
          url: @href
          callback: (responseText, status) ->

        e.preventDefault()
        return false

)(jQuery)

jQuery(document).ready ($) ->
  $('html').removeClass 'loading'
  $('html').addClass 'interactive'
  enhance = ->
    mySite.enhanced = true
    $(document).updateSocialPlugins()
    mySite.refresh()
    mySite.importScript '//js.abhishekmunie.com/libs/cufon-yui.basicfonts.js', true if mySite_config.cufon
    for twitter_stream in mySite_config.twitter_streams
      mySite.twitter_streams[twitter_stream] = mySite.createTwitterStream twitter_stream
    setTimeout "$.preload(mySite_config.preloads)", 5000
    $('html').addClass 'enhanced'

  $(window).load ->
    $('html').removeClass 'interactive'
    $('html').addClass 'complete'
    window.clearTimeout enID
    enhance()

  window.addEventListener 'hashchange', (event) ->

  window.addEventListener 'popstate', (event) ->
    $('html').addClass 'PoppedBack'
    mySite.pre_location = mySite.location
    mySite.location = new Location()
    mySite.updateLocation()
    if mySite.location.is404 or mySite.location.href.replace(mySite.location.hash, '') is mySite.pre_location.href.replace(mySite.pre_location.hash, '')
      mySite.refresh()
      return
    mySite.ajaxTo
      url: location.pathname

  $(window).unload ->

  $(document.body).on 'online', ->
    console.log "Online"
  $(document.body).on 'offine', ->
    console.log "Offline"

  # orientation on firefox
  handleOrientation =
  window.addEventListener "MozOrientation", (orientData) ->
    mySite.orientation = true
    mySite.orientX = orientData.x
    mySite.orientY = orientData.y
  , true
  # orientation on mobile safari
  if window.DeviceMotionEvent?
    mySite.orientation = true
    window.ondevicemotion = (event) ->
      mySite.orientX = event.accelerationIncludingGravity.x
      mySite.orientY = event.accelerationIncludingGravity.y

  if location.hash
    if /!/g.test location.hash
      if Modernizr.history
        history.replaceState null, '', location.hash.toString().substring(2)
        mySite.ajaxTo
          url: location.hash.toString().substring(2)
      else
        document.location.href = location.hash.toString().substring(2)

  $(document).ajaxSuccess ->

  $('body').append mySite.overlayTheater.theater

  mySite.importScript "https://www.google.com/jsapi?callback=loadGoogleJSApi", true if mySite_config.google.cse

  mySite.update()
  $('body').drawDoc()
  $('html').addClass 'initialized'
  enID = window.setTimeout enhance, 3000
  setTimeout ->
    $('html').addClass('startup')
  , 500
  setTimeout ->
    $('html').removeClass('startup')
  , 5000

loadGoogleJSApi = ->
  google.load 'search', '1',
    language: 'en'
    style: google.loader.themes.V2_DEFAULT
    callback: ->
      customSearchOptions = {}
      imageSearchOptions = {}
      imageSearchOptions['layout'] = google.search.ImageSearch.LAYOUT_POPUP
      customSearchOptions['enableImageSearch'] = true
      customSearchOptions['imageSearchOptions'] = imageSearchOptions
      vcustomSearchControl = new google.search.CustomSearchControl mySite_config.googleCSEId, customSearchOptions
      customSearchControl.setResultSetSize google.search.Search.FILTERED_CSE_RESULTSET
      options = new google.search.DrawOptions()
      options.setSearchFormRoot 'Google_CS_Box'
      options.setAutoComplete true
      customSearchControl.setAutoCompletionId mySite_config.googleCSEAutoCompletionId
      customSearchControl.draw 'cse_result', options
      #Page Search
      if document.getElementById('Google_Page_CS_Box')
        customSearchOptions = {}
        imageSearchOptions = {}
        imageSearchOptions['layout'] = google.search.ImageSearch.LAYOUT_POPUP
        customSearchOptions['enableImageSearch'] = true
        customSearchOptions['imageSearchOptions'] = imageSearchOptions
        customSearchControl = new google.search.CustomSearchControl mySite_config.googleCSEId, customSearchOptions
        customSearchControl.setResultSetSize google.search.Search.FILTERED_CSE_RESULTSET
        options = new google.search.DrawOptions()
        options.setSearchFormRoot 'Google_Page_CS_Box'
        options.setAutoComplete true
        customSearchControl.setAutoCompletionId mySite_config.googleCSEAutoCompletionId
        customSearchControl.draw 'cse_Page_result', options
        customSearchControl.execute document.getElementById('goog-wm-qt').valu