YUI.add("nlight-feed-widget", function(Y) {
  Y.namespace("nlight")
  var isUndefined = Y.Lang.isUndefined // Shortcut

  var feedWidget = function() {}
  feedWidget.NAME = "feedWidget"
  feedWidget.ATTRS = {
    streamId: {
      writeOnce: true
    },
    itemsNode: {},
    stream: {
      readOnly: true,
      getter: function() {
	return Y.grapi.stream(this.get("streamId"))
      }
    }
  }
  feedWidget.TEMPLATES = {
    headerContent: "<h1 class='title'></h1><h2 class='unread'></h2>",
    bodyContent: "<div class='itemlist'></div>",
    footerContent: "<a href='' class='loadmore'>load more items</a>"
  }
  feedWidget.prototype = {
    renderUI: function() {
      this.setAttrs(feedWidget.TEMPLATES)
      this.get("contentBox").addClass("rendering")      
    },
    bindUI: function() {
      this.get("stream").on("contentLoadStart", this.syncLoading, this)
      this.get("stream").after("contentLoadSuccess", this.syncFeed, this)
      this.get("stream").after("itemsChange", this.syncItems, this)
      this.bindKeys()
    },
    bindKeys: function() {
      Y.on('key', this.toggleCurrentItem, window, 'press:13', this) // ENTER
      Y.on('key', this.selectNext, window, 'down:78', this) // n
      Y.on('key', this.selectPrevious, window, 'down:80', this) // p
      Y.on('key', this.toggleNext, window, 'down:74', this) // j
      Y.on('key', this.togglePrevious, window, 'down:75', this) // k
    },
    _toggle: function(node) {
      if(!node.hasClass("expanded")) {
	var content = Y.grapi.item(node.getData("itemid")).get("contents");
	if(node.one("div.content")._node.innerHTML == "") {
	  node.one("div.content")._node.innerHTML = content;
	}
	if(this.itemsNode.one('.expanded')) this.itemsNode.one('.expanded').removeClass("expanded");
	node.addClass("expanded")
      } else {
	node.removeClass("expanded")
      }
    },
    toggleItem: function(event) {
      event.halt()
      var current = this.bodyNode.one(".selected");
      if(current) current.removeClass("selected")
      event.target.get("parentNode").addClass("selected")
      this._toggle(event.target.get("parentNode"))
    },
    closeCurrentItem: function() {
      if(this.itemsNode.one('.expanded')) this.itemsNode.one('.expanded').removeClass("expanded");
    },
    toggleCurrentItem: function(event) {
	  var current = this.bodyNode.one(".selected")
	  this._toggle(current)
    },
    toggleNext: function(event) {
	  var current = this.bodyNode.one(".selected") || this.itemsNode.one(".item")
	  if(current.next()) {
	    this.selectNext()
	    if(current.get('offsetTop') > window.scrollY) {
	      // this.animScrollTo(current.get('offsetTop') - current.get('offsetHeight'))
	      window.scrollTo(0, current.get('offsetTop') - current.get('offsetHeight'))
	    } else {
	      window.scrollTo(0, current.get('offsetTop') - current.get('offsetHeight'))
	    }
	    this.toggleCurrentItem()
	  }
    },
    togglePrevious: function(event) {
	  var current = this.bodyNode.one(".selected")
	  if(current.previous()) {
	    this.selectPrevious()
	    // this.animScrollTo(current.previous().get('offsetTop') - current.get('offsetHeight'))
	    window.scrollTo(0, current.previous().get('offsetTop') - current.previous().get('offsetHeight'))
	    this.toggleCurrentItem()
	  }
    },
    animScrollTo: function(scrollY) {
	  if(this._scroll_anim) this._scroll_anim.stop()
	  this._scroll_anim = new Y.Anim({
	    node: window,
	    duration: 1.5,
	    to: {
		scroll: [window.scrollX, scrollY]
	    },
	    easing: Y.Easing.easeOut
	  })
	  this._scroll_anim.run()
    },
    selectPrevious: function(event) {
	  var current = this.bodyNode.one(".selected")
	  this.closeCurrentItem();
	  if (!current) var current = this.itemsNode.one(".item")
	  if(current.previous()) {
	    current.removeClass("selected")
	    current.previous().addClass("selected")
	  }
	  if(current.get('offsetTop') - current.get('offsetHeight') < window.scrollY) {
	    window.scrollTo(0, current.get('offsetTop') - current.get('offsetHeight')*1.5);
	  }
    },
    selectNext: function(event) {
	  var current = this.bodyNode.one(".selected")
	  this.closeCurrentItem();
	  if (!current) var current = this.itemsNode.one(".item")
	  if(current.next()) {
	    current.removeClass("selected")
	    current.next().addClass("selected")
	  }
	  if(current.get('offsetTop') + current.get('offsetHeight')*2 > window.scrollY + current.get('winHeight')) {
	    window.scrollTo(0, window.scrollY + current.get('offsetHeight'));
	  }
    },
    syncUI: function() {
      this.itemsNode = this.bodyNode.one('.itemlist')
      this.bodyNode.delegate('click', Y.bind(this.toggleItem, this), '.item a.title' )
      this.bodyNode.delegate('click', Y.bind(this.toggleItem, this), '.item a.panel' )
      this.footerNode.one('.loadmore').on('click', this.loadMore, this)
      var scope = this
      var onScroll = function() {
	var node = scope.footerNode.one(".loadmore")
	var y = node.get("region").top
	var top = document.documentElement.scrollTop
	var vpH = Y.DOM.winHeight()
	var view = parseInt( vpH + top )
	if ( view >= y ) {
	  if(!scope.footerNode.one(".loadmore").hasClass("loading")) {
	    scope.load()
	  }
	}
      }
      Y.Event.purgeElement(window, false, "scroll")
      Y.get(window).on("scroll", onScroll)
    },
    syncLoading: function() {
      this.get("contentBox").addClass('loading');
      this.footerNode.one('.loadmore').set('innerHTML', 'loading...')
    },
    syncFeed: function(event) {
      var stream = this.get("stream");
      this.headerNode.one(".title").set("innerHTML", stream.get("title"));
      this.footerNode.one('.loadmore').set('innerHTML', 'load more items');
      this.get("contentBox").removeClass('loading')
      this.get("contentBox").removeClass("rendering")
    },
    syncItems: function(event) {
      if( Y.Lang.isUndefined(event.prevVal) ) event.prevVal = [];
      var oldsize = event.prevVal.length,
          newsize = event.newVal.length,
          items = this.get("stream").get("items")
      for (var i = oldsize; i < items.length; i++) {
	  this.itemsNode.append( itemNode(items[i]) )
      }
    },
    slideOut: function() {
	  if(this._slide_anim) this._slide_anim.stop()
	  this._slide_anim = new Y.Anim({
	    node: this.get("srcNode"),
	    duration: 2,
	    to: {
		xy: [ 0 - this.get("srcNode").get("offsetWidth"), this.get("srcNode").getY ]
	    },
	    easing: Y.Easing.easeOut
	  })
	  this._slide_anim.run()    
    },
    slideIn: function() {
	  var node = this.get("srcNode")
	  var center = (node.get("winWidth") - node.get("offsetWidth"))/2
	  if(this._slide_anim) this._slide_anim.stop()
	  this._slide_anim = new Y.Anim({
	    node: this.get("srcNode"),
	    duration: 2,
	    to: {
		xy: [ center, this.get("srcNode").getY ]
	    },
	    easing: Y.Easing.easeOut
	  })
	  this._slide_anim.run()  
    },
    loadMore: function(event) {
      event.preventDefault();
      this.load();
    },
    load: function(number) {
      if(isUndefined(number)) number = 20;
      this.get("stream").load(number);      
    }
  }


  var itemNode = function(item) {
    var node = itemNode.NODE.cloneNode(true)
    node.one('a.title').set('href', item.get('url'));
    node.one('a.title').set('innerHTML', item.get('title'));
    var time = new Date(item.get('crawlTime'))
    node.one('h2.date').set('innerHTML', Y.toRelativeTime(time));
    node.setData('itemid', item.get('id'))
    if(item.get("read")) node.addClass("read");
    if(item.get("starred")) node.addClass("starred");
    return node;
  }
  itemNode.TEMPLATE = "<div class='item'><a class='panel' href=''></a><a class='star' href=''></a><a class='title'></a><h2 class='date'></h2><div class='content'></div></div>";
  itemNode.NODE = Y.Node.create(itemNode.TEMPLATE)
  

  Y.nlight.FeedWidget = Y.Base.create("FeedWidget", Y.Widget, [Y.WidgetStdMod, Y.WidgetPosition, Y.WidgetPositionAlign, feedWidget]);

}, {
    requires:  ["grapi", "anim", "grids", "widget", "widget", "widget-position", "widget-position-align", "widget-stdmod", "gallery-torelativetime", "event-key"]
});

