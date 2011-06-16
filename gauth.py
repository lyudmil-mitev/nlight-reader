#!/usr/bin/python
import urllib2

GOOGLE_AUTH_URL = 'https://www.google.com/accounts/ClientLogin'
READER_TOKEN_URL = 'http://www.google.com/reader/api/0/token'
CLIENT_NAME = 'python-grapi'

class BadAuthentication(urllib2.HTTPError): pass

def authenticate(email, password):
 url = GOOGLE_AUTH_URL
 post_data = "Email=" + email + "&Passwd=" + password + "&source=" + CLIENT_NAME + "&service=reader"
 try:
  result = urllib2.urlopen(url, post_data)
  for line in result:
   if line.startswith("SID="): SID = line
   if line.startswith("LSID="): LSID = line
   if line.startswith("Auth="): Auth = line
  return (SID, LSID, Auth)

 except urllib2.HTTPError, e:
  if e.code == 403: raise BadAuthentication(e.url, e.code, e.msg, e.hdrs, e.fp)
 
def get_token(AUTH):
 url = READER_TOKEN_URL
 request = urllib2.Request(url)
 request.add_header("Authorization", "GoogleLogin auth=" + AUTH.replace("Auth=", ""))
 try:
  result = urllib2.urlopen(request)
  for line in result: 
   if line: return line
   else: return ''
 except urllib2.HTTPError, e:
  if e.code == 403: raise BadAuthentication(e.url, e.code, e.msg, e.hdrs, e.fp)

if __name__ == "__main__":
  SID, LSID, AUTH = authenticate("nlightreademo", "thecakeisapie")
  TOKEN = get_token(AUTH)
  print SID, LSID, AUTH, TOKEN

