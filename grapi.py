from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import urllib2
import gauth

class MainHandler(webapp.RequestHandler):
  def get(self, path):
   try:
    SID, LSID, AUTH = gauth.authenticate('nlightreademo', 'thecakeisapie')
    rq = urllib2.Request('http://google.com/reader' + self.request.path_qs)
    #SID Cookies are deprecated as of 24.06.2009
    #rq.add_header("Cookie", SID)
    rq.add_header("Authorization", "GoogleLogin auth=" + AUTH.replace("Auth=", ""))
    r = urllib2.urlopen(rq)
    self.response.out.write("".join(r.readlines()))
   except urllib2.HTTPError, e:
    self.error(e.code)
    self.response.out.write("".join(e.readlines()))

  def post(self, path):
   try:
    SID, LSID, AUTH = gauth.authenticate('nlightreademo', 'thecakeisapie')
    rq = urllib2.Request('http://google.com/reader' + self.request.path_qs, self.request.body)
    #SID Cookies are deprecated as of 24.06.2009
    #rq.add_header("Cookie", SID)
    rq.add_header("Authorization", "GoogleLogin auth=" + AUTH.replace("Auth=", ""))
    r = urllib2.urlopen(rq)
    self.response.out.write("".join(r.readlines()))
   except urllib2.HTTPError, e:
    self.error(e.code)
    self.response.out.write("".join(e.readlines()))

class TokenHandler(webapp.RequestHandler):
  def get(self):
    SID, LSID, AUTH = gauth.authenticate('nlightreademo', 'thecakeisapie')
    self.response.headers['Content-Type'] = 'text/plain; charset=utf8'
    self.response.out.write(gauth.get_token(AUTH))

def main():
  application = webapp.WSGIApplication([('/api/0/token', TokenHandler), ('(.*)', MainHandler)], debug=True)
  util.run_wsgi_app(application)

if __name__ == '__main__':
  main()
