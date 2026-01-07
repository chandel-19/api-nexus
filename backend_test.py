#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Postman Clone
Tests all endpoints with proper authentication and data validation
"""

import requests
import json
import time
import subprocess
import sys
from datetime import datetime, timezone, timedelta

# Configuration
BACKEND_URL = "https://endpoint-dash.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"test.user.{int(time.time())}@example.com"
TEST_USER_NAME = "Test User API"

class PostmanCloneAPITester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        self.org_id = None
        self.collection_id = None
        self.request_id = None
        self.env_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def setup_test_user(self):
        """Create test user and session in MongoDB"""
        print("\n=== Setting up test user and session ===")
        
        try:
            # Generate unique IDs
            timestamp = int(time.time())
            self.user_id = f"test-user-{timestamp}"
            self.session_token = f"test_session_{timestamp}"
            
            # Generate org_id for default organization
            self.org_id = f"org_{timestamp}"
            
            # MongoDB commands to create test user, session, and default organization
            mongo_script = f"""
use('test_database');
db.users.insertOne({{
  user_id: '{self.user_id}',
  email: '{TEST_USER_EMAIL}',
  name: '{TEST_USER_NAME}',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: '{self.user_id}',
  session_token: '{self.session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
db.organizations.insertOne({{
  org_id: '{self.org_id}',
  name: 'My Workspace',
  type: 'personal',
  owner_id: '{self.user_id}',
  members: ['{self.user_id}'],
  created_at: new Date()
}});
print('Test user and organization created successfully');
"""
            
            # Execute MongoDB script
            result = subprocess.run(
                ["mongosh", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ Failed to create test user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error setting up test user: {e}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n=== Cleaning up test data ===")
        
        try:
            mongo_script = f"""
use('test_database');
db.users.deleteMany({{email: /test\\.user\\./}});
db.user_sessions.deleteMany({{session_token: /test_session/}});
db.organizations.deleteMany({{owner_id: /test-user-/}});
db.collections.deleteMany({{created_by: /test-user-/}});
db.requests.deleteMany({{created_by: /test-user-/}});
db.environments.deleteMany({{created_by: /test-user-/}});
db.request_history.deleteMany({{user_id: /test-user-/}});
print('Test data cleaned up');
"""
            
            result = subprocess.run(
                ["mongosh", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("✅ Test data cleaned up successfully")
            else:
                print(f"⚠️ Cleanup warning: {result.stderr}")
                
        except Exception as e:
            print(f"⚠️ Cleanup error: {e}")
    
    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper authentication"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if auth_required and self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=60)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=60)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=60)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=60)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.Timeout:
            print(f"Request timeout for {method} {url}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"Connection error for {method} {url}")
            return None
        except Exception as e:
            print(f"Request error for {method} {url}: {e}")
            return None
    
    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # Test /auth/me without token (should fail)
        response = self.make_request("GET", "/auth/me", auth_required=False)
        if response:
            if response.status_code == 401:
                self.log_test("Auth required - no token", True, "Correctly returns 401")
            else:
                self.log_test("Auth required - no token", False, f"Expected 401, got {response.status_code}")
        else:
            # Try with curl as fallback
            try:
                import subprocess
                result = subprocess.run(
                    ["curl", "-X", "GET", f"{BACKEND_URL}/auth/me", "--max-time", "10", "-s", "-w", "%{http_code}"],
                    capture_output=True, text=True, timeout=15
                )
                if result.returncode == 0 and "401" in result.stdout:
                    self.log_test("Auth required - no token", True, "Correctly returns 401 (via curl)")
                else:
                    self.log_test("Auth required - no token", False, f"Network issue - curl result: {result.stdout}")
            except:
                self.log_test("Auth required - no token", False, "Network connectivity issue")
        
        # Test /auth/me with valid token
        response = self.make_request("GET", "/auth/me")
        if response and response.status_code == 200:
            user_data = response.json()
            if user_data.get("user_id") == self.user_id:
                self.log_test("Get current user", True, f"User ID: {user_data.get('user_id')}")
            else:
                self.log_test("Get current user", False, f"User ID mismatch: {user_data}")
        else:
            self.log_test("Get current user", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_organization_endpoints(self):
        """Test organization endpoints"""
        print("\n=== Testing Organization Endpoints ===")
        
        # Get organizations
        response = self.make_request("GET", "/organizations")
        if response and response.status_code == 200:
            orgs = response.json()
            if orgs and len(orgs) > 0:
                self.org_id = orgs[0]["org_id"]
                self.log_test("Get organizations", True, f"Found {len(orgs)} organizations")
            else:
                self.log_test("Get organizations", False, "No organizations found")
        else:
            self.log_test("Get organizations", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Create new organization
        org_data = {
            "name": "Test Organization API",
            "type": "team"
        }
        response = self.make_request("POST", "/organizations", org_data)
        if response and response.status_code == 200:
            new_org = response.json()
            test_org_id = new_org.get("org_id")
            self.log_test("Create organization", True, f"Created org: {test_org_id}")
            
            # Get specific organization
            response = self.make_request("GET", f"/organizations/{test_org_id}")
            if response and response.status_code == 200:
                self.log_test("Get specific organization", True, "Organization retrieved")
            else:
                self.log_test("Get specific organization", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Update organization
            update_data = {"name": "Updated Test Organization"}
            response = self.make_request("PUT", f"/organizations/{test_org_id}", update_data)
            if response and response.status_code == 200:
                updated_org = response.json()
                if updated_org.get("name") == "Updated Test Organization":
                    self.log_test("Update organization", True, "Organization updated")
                else:
                    self.log_test("Update organization", False, "Name not updated")
            else:
                self.log_test("Update organization", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Create organization", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_collection_endpoints(self):
        """Test collection endpoints"""
        print("\n=== Testing Collection Endpoints ===")
        
        if not self.org_id:
            self.log_test("Collection tests", False, "No org_id available")
            return
        
        # Create collection
        coll_data = {
            "name": "Test Collection API",
            "description": "API testing collection",
            "color": "#FF5722"
        }
        response = self.make_request("POST", f"/organizations/{self.org_id}/collections", coll_data)
        if response and response.status_code == 200:
            collection = response.json()
            self.collection_id = collection.get("collection_id")
            self.log_test("Create collection", True, f"Created collection: {self.collection_id}")
            
            # Get collections in organization
            response = self.make_request("GET", f"/organizations/{self.org_id}/collections")
            if response and response.status_code == 200:
                collections = response.json()
                self.log_test("Get collections", True, f"Found {len(collections)} collections")
            else:
                self.log_test("Get collections", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Get specific collection
            response = self.make_request("GET", f"/collections/{self.collection_id}")
            if response and response.status_code == 200:
                self.log_test("Get specific collection", True, "Collection retrieved")
            else:
                self.log_test("Get specific collection", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Update collection
            update_data = {
                "name": "Updated Test Collection",
                "description": "Updated description"
            }
            response = self.make_request("PUT", f"/collections/{self.collection_id}", update_data)
            if response and response.status_code == 200:
                updated_coll = response.json()
                if updated_coll.get("name") == "Updated Test Collection":
                    self.log_test("Update collection", True, "Collection updated")
                else:
                    self.log_test("Update collection", False, "Name not updated")
            else:
                self.log_test("Update collection", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Create collection", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_request_endpoints(self):
        """Test request endpoints"""
        print("\n=== Testing Request Endpoints ===")
        
        if not self.org_id:
            self.log_test("Request tests", False, "No org_id available")
            return
        
        # Create request
        req_data = {
            "collection_id": self.collection_id,
            "name": "Test API Request",
            "method": "GET",
            "url": "https://httpbin.org/get",
            "headers": [
                {"key": "Content-Type", "value": "application/json", "enabled": True}
            ],
            "params": [
                {"key": "test", "value": "value", "enabled": True}
            ],
            "body": {
                "type": "none",
                "content": ""
            },
            "auth": {
                "type": "none"
            }
        }
        response = self.make_request("POST", "/requests", req_data)
        if response and response.status_code == 200:
            request_obj = response.json()
            self.request_id = request_obj.get("request_id")
            self.log_test("Create request", True, f"Created request: {self.request_id}")
            
            # Get requests in organization
            response = self.make_request("GET", f"/organizations/{self.org_id}/requests")
            if response and response.status_code == 200:
                requests_list = response.json()
                self.log_test("Get organization requests", True, f"Found {len(requests_list)} requests")
            else:
                self.log_test("Get organization requests", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Get specific request
            response = self.make_request("GET", f"/requests/{self.request_id}")
            if response and response.status_code == 200:
                self.log_test("Get specific request", True, "Request retrieved")
            else:
                self.log_test("Get specific request", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Update request
            update_data = {
                "name": "Updated Test Request",
                "method": "POST",
                "url": "https://httpbin.org/post"
            }
            response = self.make_request("PUT", f"/requests/{self.request_id}", update_data)
            if response and response.status_code == 200:
                updated_req = response.json()
                if updated_req.get("name") == "Updated Test Request":
                    self.log_test("Update request", True, "Request updated")
                else:
                    self.log_test("Update request", False, "Name not updated")
            else:
                self.log_test("Update request", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Create request", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_request_execution(self):
        """Test request execution proxy"""
        print("\n=== Testing Request Execution Proxy ===")
        
        # Test GET request
        exec_data = {
            "method": "GET",
            "url": "https://httpbin.org/get",
            "headers": [
                {"key": "User-Agent", "value": "PostmanClone-Test", "enabled": True}
            ],
            "params": [
                {"key": "test_param", "value": "test_value", "enabled": True}
            ],
            "body": {
                "type": "none",
                "content": ""
            },
            "auth": {
                "type": "none"
            }
        }
        response = self.make_request("POST", "/requests/execute", exec_data)
        if response and response.status_code == 200:
            result = response.json()
            if result.get("status") == 200 and "body" in result:
                self.log_test("Execute GET request", True, f"Status: {result.get('status')}, Time: {result.get('time')}ms")
            else:
                self.log_test("Execute GET request", False, f"Unexpected response: {result}")
        else:
            self.log_test("Execute GET request", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test POST request with JSON body
        exec_data = {
            "method": "POST",
            "url": "https://httpbin.org/post",
            "headers": [
                {"key": "Content-Type", "value": "application/json", "enabled": True}
            ],
            "params": [],
            "body": {
                "type": "json",
                "content": '{"test": "data", "number": 42}'
            },
            "auth": {
                "type": "none"
            }
        }
        response = self.make_request("POST", "/requests/execute", exec_data)
        if response and response.status_code == 200:
            result = response.json()
            if result.get("status") == 200:
                # Check if the JSON was properly sent
                body = result.get("body", {})
                if isinstance(body, dict) and body.get("json", {}).get("test") == "data":
                    self.log_test("Execute POST with JSON", True, f"JSON body properly sent")
                else:
                    self.log_test("Execute POST with JSON", False, f"JSON not properly sent: {body}")
            else:
                self.log_test("Execute POST with JSON", False, f"Status: {result.get('status')}")
        else:
            self.log_test("Execute POST with JSON", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test request with custom headers
        exec_data = {
            "method": "GET",
            "url": "https://httpbin.org/headers",
            "headers": [
                {"key": "X-Custom-Header", "value": "CustomValue", "enabled": True},
                {"key": "Authorization", "value": "Bearer test-token", "enabled": True}
            ],
            "params": [],
            "body": {
                "type": "none",
                "content": ""
            },
            "auth": {
                "type": "none"
            }
        }
        response = self.make_request("POST", "/requests/execute", exec_data)
        if response and response.status_code == 200:
            result = response.json()
            if result.get("status") == 200:
                body = result.get("body", {})
                headers = body.get("headers", {}) if isinstance(body, dict) else {}
                if headers.get("X-Custom-Header") == "CustomValue":
                    self.log_test("Execute with custom headers", True, "Custom headers sent correctly")
                else:
                    self.log_test("Execute with custom headers", False, f"Headers not sent: {headers}")
            else:
                self.log_test("Execute with custom headers", False, f"Status: {result.get('status')}")
        else:
            self.log_test("Execute with custom headers", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_environment_endpoints(self):
        """Test environment endpoints"""
        print("\n=== Testing Environment Endpoints ===")
        
        if not self.org_id:
            self.log_test("Environment tests", False, "No org_id available")
            return
        
        # Get environments (should be empty initially)
        response = self.make_request("GET", f"/organizations/{self.org_id}/environments")
        if response and response.status_code == 200:
            environments = response.json()
            self.log_test("Get environments", True, f"Found {len(environments)} environments")
        else:
            self.log_test("Get environments", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Note: The create environment endpoint has an issue in the server.py - it expects org_id as query param
        # but the endpoint signature shows it as a path param. This is a bug in the implementation.
        # For now, we'll test what we can
        
        env_data = {
            "name": "Test Environment",
            "variables": [
                {"key": "API_URL", "value": "https://api.example.com", "enabled": True},
                {"key": "API_KEY", "value": "secret-key", "enabled": True}
            ]
        }
        
        # This will likely fail due to the endpoint signature issue
        response = self.make_request("POST", f"/environments?org_id={self.org_id}", env_data)
        if response and response.status_code == 200:
            env = response.json()
            self.env_id = env.get("env_id")
            self.log_test("Create environment", True, f"Created environment: {self.env_id}")
        else:
            self.log_test("Create environment", False, f"Status: {response.status_code if response else 'No response'} - Known endpoint signature issue")
    
    def test_history_endpoints(self):
        """Test history endpoints"""
        print("\n=== Testing History Endpoints ===")
        
        if not self.org_id:
            self.log_test("History tests", False, "No org_id available")
            return
        
        # Get request history
        response = self.make_request("GET", f"/organizations/{self.org_id}/history")
        if response and response.status_code == 200:
            history = response.json()
            self.log_test("Get request history", True, f"Found {len(history)} history entries")
        else:
            self.log_test("Get request history", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_cleanup_operations(self):
        """Test delete operations"""
        print("\n=== Testing Cleanup Operations ===")
        
        # Delete request
        if self.request_id:
            response = self.make_request("DELETE", f"/requests/{self.request_id}")
            if response and response.status_code == 200:
                self.log_test("Delete request", True, "Request deleted")
            else:
                self.log_test("Delete request", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Delete collection
        if self.collection_id:
            response = self.make_request("DELETE", f"/collections/{self.collection_id}")
            if response and response.status_code == 200:
                self.log_test("Delete collection", True, "Collection deleted")
            else:
                self.log_test("Delete collection", False, f"Status: {response.status_code if response else 'No response'}")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
        
        print("\n" + "="*60)
    
    def run_all_tests(self):
        """Run all tests"""
        print("Starting Postman Clone Backend API Tests")
        print("="*60)
        
        # Setup
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Aborting tests.")
            return False
        
        try:
            # Run all test suites
            self.test_auth_endpoints()
            self.test_organization_endpoints()
            self.test_collection_endpoints()
            self.test_request_endpoints()
            self.test_request_execution()
            self.test_environment_endpoints()
            self.test_history_endpoints()
            self.test_cleanup_operations()
            
            # Print summary
            self.print_summary()
            
            # Determine overall success
            failed_tests = sum(1 for result in self.test_results if not result["success"])
            return failed_tests == 0
            
        finally:
            # Always cleanup
            self.cleanup_test_data()


if __name__ == "__main__":
    tester = PostmanCloneAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)