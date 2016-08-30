import unittest
import requests
import json

url = 'http://localhost:8000'
json_headers = {'Content-Type': 'application/json'}

class TestAuth(unittest.TestCase):
   
   def setUp(self):
      r = requests.post(url+'/api/signup', headers=json_headers, data=json.dumps({'username':'Alice', 'password': '1234'}))
      self.assertNotEqual(r.status_code, 500, 'Alice Sign Up')
      r = requests.post(url+'/api/signup', headers=json_headers, data=json.dumps({'username':'Bob', 'password': 'abc'}))
      self.assertNotEqual(r.status_code, 500, 'Bob Sign Up')

   def test_login(self):
      r = requests.post(url+'/api/login', headers=json_headers, data=json.dumps({'username':'Alice', 'password': '1234'}))
      self.assertEqual(r.status_code, 200, 'Alice Log In')
      r = requests.post(url+'/api/login', headers=json_headers, data=json.dumps({'username':'Bob', 'password': 'abc'}))
      self.assertEqual(r.status_code, 200, 'Bob Log In')

if __name__ == '__main__':
   unittest.main()
