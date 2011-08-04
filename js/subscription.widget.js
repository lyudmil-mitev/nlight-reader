YUI.add("nlight-subscription-widget", function(Y) {
   Y.namespace("nlight")

   /*
   * class Switcher
   * for switching between feeds
   *
   */

   Y.nlight.streamSwitcher = function(arguments) {
      return new Switcher(arguments)
   }
   Switcher = function(config) {
      this.addAttrs(Y.merge(Switcher.ATTRS), config)
      Y.on("hashchange", Y.bind(this.hashChange, this))
   }
   Switcher.ARROWS = '<div class="nlight-arrows">\
      <a href="" class="nlight-arrow-left"></a>\
      <a href="" class="nlight-arrow-right"></a>\
      </div>'
      Switcher.ATTRS = {
         feedwidgets: { value: {} },
         current: {
            getter: function() {
               widgets = this.get("feedwidgets")
               return widgets[this.get("currentstream")]
            },
            setter: function(streamid) {
               this.set("currentstream", streamid)
               widgets = this.get("feedwidgets")
               widgets[streamid] = new Y.nlight.FeedWidget({streamId: streamid, visible: true})
               this.set("feedwidgets", widgets)
               window.current = widgets[streamid];
               current.render(this.get("rendertarget"))
               current.load()
            }
         },
         currentstream: {},
         rendertarget: {}
      }
      Switcher.prototype = {
         previous: function(event) {
            if( event ) event.preventDefault()
               var subscrs = Y.grapi.subscriptions().get("subscriptionlist")
            var currentindex = Y.Array(subscrs).indexOf(this.get("currentstream"))
            if (currentindex < 1) return false
            this.switchTo(subscrs[currentindex-1])
         },
         next: function(event) {
            if( event ) event.preventDefault()
               var subscrs = Y.grapi.subscriptions().get("subscriptionlist")
            var currentindex = Y.Array(subscrs).indexOf(this.get("currentstream"))
            if (currentindex >= subscrs.length - 1) return false
            this.switchTo(subscrs[currentindex+1])
         },
         switchTo: function(streamid) {
            window.location.hash = streamid
            var current = this.get("current")
            if( current ) current.destroy();
            // 	if(current) {
            // 	  current.slideOut()
            // 	  current._slide_anim.on("end", function() { current.destroy() })
            // 	}
            this.set("current", streamid)
            return this.get("current")
         },
         hashChange: function() {
            if(window.location.hash.slice(1) !== this.get("currentstream"))
               this.switchTo(window.location.hash.slice(1))
         },
         render: function() {
            var arrows = Y.Node.create(Switcher.ARROWS)
            arrows.delegate("click", Y.bind(this.next, this), ".nlight-arrow-right")
            arrows.delegate("click", Y.bind(this.previous, this), ".nlight-arrow-left")
            Y.one(this.get("rendertarget")).appendChild(arrows)
         }
      }
      Y.augment(Switcher, Y.Attribute)

      SibscriptionWidget = function() {}
}, {
   requires:  ["grapi", "nlight-feed-widget", "attribute"]
})
