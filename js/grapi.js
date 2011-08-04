YUI.add('grapi', function(Y) {

   Y.namespace('grapi')
   var isUndefined = Y.Lang.isUndefined // Shortcut

   Y.grapi.stream = function(id) {
      if(isUndefined(Y.grapi.cache.streams[id])) {
         Y.grapi.cache.streams[id] = new Stream( {id: id} )
         return Y.grapi.cache.streams[id];
      } else {
         return Y.grapi.cache.streams[id];
      }
   }

   Y.grapi.item = function(id) {
      return Y.grapi.cache.items[id]
   }

   Y.grapi.subscriptions = function() {
      if(isUndefined(Y.grapi.cache.subscriptions)) {
         Y.grapi.cache.subscriptions = new SubscriptionList();
         return Y.grapi.cache.subscriptions
      } else {
         return Y.grapi.cache.subscriptions
      }
   }

   Y.grapi.cache = {
      items: {  },
      streams: { }
   }

   Y.grapi.io = {
      //TODO: getReadingList, getUnreadCount, etc.
      getStream: function(cfg, callback) {
         var uri = "/api/0/stream/contents/feed/" + escape(cfg.id.replace("feed/", ""))
         params = "?"
         if(!isUndefined(cfg.continuation)) params += "c=" + cfg.continuation + "&"
         if(!isUndefined(cfg.number)) params += "n=" + cfg.number + "&"
         if(!isUndefined(cfg.order)) params += "r=" + cfg.order
         params += "&client=grapi&ck=" + (new Date()).getTime()
         // TODO: Progress/Faliure handlers
         var config = {
            on: {
               success: function(tid, response) {
                  callback(Y.JSON.parse(response.responseText))
               }
            }
         }
         return Y.io(uri + params, config);
      },
      getToken: function(callback) {
         var uri = "/api/0/token?client=grapi&ck=" + (new Date()).getTime()
         var config = {
            on: {
               success: function(tid, response) {
                  callback(response.responseText)
               }
            }
         }
         return Y.io(uri, config)
      },
      getSubscriptionList: function(callback) {
         var uri = "/api/0/subscription/list?output=json&client=grapi&ck=" + (new Date()).getTime()
         var config = {
            on: {
               success: function(tid, response) {
                  callback(Y.JSON.parse(response.responseText))
               }
            }
         }
         return Y.io(uri, config)
      },
      getUnreadCount: function(callback) {
         var uri = "/api/0/unread-count?all=true&output=json&client=grapi&ck=" + (new Date()).getTime()
         var config = {
            on: {
               success: function(tid, response) {
                  callback(Y.JSON.parse(response.responseText))
               }
            }
         }
         return Y.io(uri, config)
      },
      editTag: function(cfg, callback) {
         var uri = "/api/0/stream/contents/feed/" + escape(cfg.id.replace("feed/", ""))
         params = "?"
      }
   }

   function Stream(config) {
      this.addAttrs(Y.merge(Stream.ATTRS), config)
      this.publish("contentLoadStart");
      this.publish("contentLoadSuccess");
   }
   Stream.ATTRS = {
      unread: {},
      sortid: {},
      firstitemmsec: {},
      id: {},
      categories: {
         value: [],
      },

      itemlist: {
         value: []
      },
      description: {},
      items: {
         value: [],
         setter: function(items) {
            for(var i = 0; i < items.length; i++) {
               //TODO: Optimize
               var config = {
                  id: items[i].id,
                  streamId: items[i].origin.streamId,
                  title: items[i].title,
                  author: items[i].author,
                  categories: items[i].categories,
                  url: items[i].alternate[0].href,
                  crawlTime: parseInt(items[i].crawlTimeMsec)
               }
               if(!Y.Lang.isUndefined(items[i].content)) {
                  config.contents = items[i].content.content
               } else if (!Y.Lang.isUndefined(items[i].summary)) {
                  config.contents = items[i].summary.content
               } else {
                  config.contents = " "
               }
               Y.grapi.cache.items[config.id] = new Item(config)
               context = this
               var itemlist = this.get("itemlist")
               if( Y.Lang.isUndefined(itemlist) ) itemlist = []
               itemlist.push(config.id)
               this.set("itemlist", itemlist)
            }
         },
         getter: function() {
            items = this.get("itemlist")
            // if there're no items
            if(isUndefined(items)) return undefined;
            var result = []
            for(var i = 0; i < items.length; i++) {
               result[i] = Y.grapi.cache.items[items[i]]
            }
            return result
         }
      },
      title: {},
      continuation: {},
      url: {}
   }
   Stream.prototype = {
      load: function(number, callback) {
         var scope = this;
         function processData(data) {
            scope.set("title", data.title)
            scope.set("url", data.alternate[0].href)
            scope.set("continuation", data.continuation)
            scope.set("description", data.description)
            scope.set("items", data.items)
            scope.fire("contentLoadSuccess")
            if(!isUndefined(callback)) callback(scope)
         }
         config = {
            id: this.get("id"),
            number: number,
            continuation: this.get("continuation")
         }
         scope.fire("contentLoadStart")
         Y.grapi.io.getStream(config, processData)
      }
   }
   Y.augment(Stream, Y.Attribute)

   function SubscriptionList(config) {
      this.addAttrs(Y.merge(SubscriptionList.ATTRS), config)
   }

   SubscriptionList.ATTRS = {
      subscriptions: { 
         value: [],
         setter: function(data) {
            var result = []
            for(var i = 0; i < data.length; i++) {
               result.push(data[i].id)
            }
            this.set("subscriptionlist", result)
         },
         getter: function() {
            var result = []
            var subscriptions = this.get("subscriptionlist")
            for(var i = 0; i < subscriptions.length; i++) {
               result[i] = Y.grapi.stream(subscriptions[i]);
            }
            return result
         }
      },
      subscriptionlist: {value: []},
      lastrefresh: {},
      refreshcount: { value: 0},
   }

   SubscriptionList.prototype = {
      load: function() {
         function processSubscriptions(data) {
            for(var i = 0; i < data.subscriptions.length; i++) {
               var subscr = Y.grapi.stream(data.subscriptions[i].id)
               subscr.setAttrs(data.subscriptions[i]);
            }
            this.set("subscriptions", data.subscriptions)
         }
         return {
            list: Y.grapi.io.getSubscriptionList(Y.bind(processSubscriptions, this)),
            unread: this.refresh()
         }
      },
      refresh: function() {
         function processUnread(data) {
            var items = data.unreadcounts
            for(var i = 0; i < items.length; i++) {
               var subscr = Y.grapi.stream(items[i].id);
               subscr.setAttrs({unread: items[i].count, firstitemmsec: items[i].newestItemTimestampUsec})
            }
            this.set("refreshcount", this.get("refreshcount") + 1)
            this.set("lastrefresh", (new Date).getTime())
         }
         return Y.grapi.io.getUnreadCount(Y.bind(processUnread, this))
      }
   }

   Y.augment(SubscriptionList, Y.Attribute)

   function Item(config) {
      // this.addAttrs(Y.merge(Item.ATTRS), config, true)
      // this.addAttrs(Y.merge(Item.ATTRS), config)
      // this.addAttrs(Y.merge(Item.ATTRS))
      // FIXME: This is slow
      this.setAttrs(config)
   }

   Item.ATTRS = {
      title: { writeOnce: true },
      id: { writeOnce: true },
      streamId: { writeOnce: true },
      contents: { writeOnce: true },
      categories: { writeOnce: true },
      author: { },
      url: { },
      starred: {
         getter: function() {
            var categories = this.get("categories")
            for(var i = 0; i < categories.length; i++) {
               if(categories[i].match(/user\/.*\/state\/com\.google\/starred$/)) return true;
            }
            return false;
         },
         setter: function(value) {
            if (value === this.get("starred")) return;
            if (value) this.get("categories").push("user/-/state/com.google/starred")
               else {
                  var categories = this.get("categories")
                  for( var i = 0; i < categories.length; i++ ) {
                     if(categories[i].match(/user\/.*\/state\/com\.google\/starred$/)) delete categories[i]
                  }
               }
         }
      },
      read: {
         getter: function() {
            var categories = this.get("categories")
            for(var i = 0; i < categories.length; i++) {
               if(categories[i].match(/user\/.*\/state\/com\.google\/read$/)) return true;
            }
            return false;
         },
         setter: function(value) {
            if (value === this.get("read")) return;
            if (value) this.get("categories").push("user/-/state/com.google/read")
               else {
                  var categories = this.get("categories")
                  for( var i = 0; i < categories.length; i++ ) {
                     if(categories[i].match(/user\/.*\/state\/com\.google\/read$/)) delete categories[i]
                  }
               }
         }
      },
      crawlTime: {}
   }
   // Item.prototype
   Y.augment(Item, Y.Attribute)

}, {
   requires: ['io', 'json-parse', 'attribute']
});
