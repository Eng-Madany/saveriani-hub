#!/usr/bin/env python3
"""
Backend API Testing for Camp Management System Saveriani
Tests all endpoints with proper error handling and validation
"""

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, Any

class CampAPITester:
    def __init__(self, base_url="https://camp-dashboard-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_staff = None
        self.test_resident = None
        self.test_log = None
        self.test_handover = None
        self.test_meal = None

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict[Any, Any] = None, params: Dict[str, str] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test("Root API", "GET", "", 200)
        return success

    def test_seed_data(self):
        """Test seeding initial data"""
        success, response = self.run_test("Seed Data", "POST", "seed", 200)
        if success:
            print(f"   Seeded: {response.get('staff_count', 0)} staff, {response.get('residents_count', 0)} residents")
        return success

    def test_staff_login(self):
        """Test staff login with PIN"""
        success, response = self.run_test("Staff Login", "POST", "staff/login?pin=1111", 200)
        if success and response:
            self.test_staff = response
            print(f"   Logged in as: {response.get('name')} ({response.get('role')})")
        return success

    def test_staff_operations(self):
        """Test staff CRUD operations"""
        # Get all staff
        success1, staff_list = self.run_test("Get All Staff", "GET", "staff", 200)
        
        # Create new staff
        new_staff_data = {
            "name": "Test Staff",
            "pin": "9999",
            "role": "operatore"
        }
        success2, created_staff = self.run_test("Create Staff", "POST", "staff", 200, new_staff_data)
        
        # Delete test staff
        success3 = True
        if success2 and created_staff:
            success3, _ = self.run_test("Delete Staff", "DELETE", f"staff/{created_staff['id']}", 200)
        
        return success1 and success2 and success3

    def test_time_tracking(self):
        """Test time tracking operations"""
        if not self.test_staff:
            print("❌ Skipping time tracking - no staff logged in")
            return False

        # Clock in
        clock_in_data = {
            "staff_id": self.test_staff["id"],
            "staff_name": self.test_staff["name"],
            "entry_type": "clock_in"
        }
        success1, clock_in_entry = self.run_test("Clock In", "POST", "time-entries", 200, clock_in_data)
        
        # Get time entries
        success2, entries = self.run_test("Get Time Entries", "GET", "time-entries", 200)
        
        # Get last entry for staff
        success3, last_entry = self.run_test("Get Last Entry", "GET", f"time-entries/last-entry/{self.test_staff['id']}", 200)
        
        # Clock out
        clock_out_data = {
            "staff_id": self.test_staff["id"],
            "staff_name": self.test_staff["name"],
            "entry_type": "clock_out"
        }
        success4, clock_out_entry = self.run_test("Clock Out", "POST", "time-entries", 200, clock_out_data)
        
        return success1 and success2 and success3 and success4

    def test_residents_operations(self):
        """Test residents CRUD operations"""
        # Get all residents
        success1, residents = self.run_test("Get All Residents", "GET", "residents", 200)
        
        # Create new resident
        new_resident_data = {
            "surname": "TEST",
            "name": "Resident",
            "nationality": "Test Country",
            "room_number": 99,
            "medical_alerts": ["Test alert"],
            "security_notes": ["Test note"],
            "status": "presente"
        }
        success2, created_resident = self.run_test("Create Resident", "POST", "residents", 200, new_resident_data)
        
        if success2 and created_resident:
            self.test_resident = created_resident
            
            # Get specific resident
            success3, resident = self.run_test("Get Resident", "GET", f"residents/{created_resident['id']}", 200)
            
            # Update resident
            update_data = {"status": "assente"}
            success4, updated_resident = self.run_test("Update Resident", "PUT", f"residents/{created_resident['id']}", 200, update_data)
            
            # Delete resident
            success5, _ = self.run_test("Delete Resident", "DELETE", f"residents/{created_resident['id']}", 200)
            
            return success1 and success2 and success3 and success4 and success5
        
        return success1 and success2

    def test_log_entries(self):
        """Test digital logbook operations"""
        if not self.test_staff:
            print("❌ Skipping log entries - no staff logged in")
            return False

        # Create log entry
        log_data = {
            "category": "Generale",
            "content": "Test log entry for system testing",
            "staff_id": self.test_staff["id"],
            "staff_name": self.test_staff["name"],
            "shift": "mattina"
        }
        success1, created_log = self.run_test("Create Log Entry", "POST", "logs", 200, log_data)
        
        if success1 and created_log:
            self.test_log = created_log
            
            # Get all logs
            success2, logs = self.run_test("Get All Logs", "GET", "logs", 200)
            
            # Get logs by category
            success3, category_logs = self.run_test("Get Logs by Category", "GET", "logs", 200, params={"category": "Generale"})
            
            # Delete log entry
            success4, _ = self.run_test("Delete Log Entry", "DELETE", f"logs/{created_log['id']}", 200)
            
            return success1 and success2 and success3 and success4
        
        return success1

    def test_shift_handovers(self):
        """Test shift handover operations"""
        if not self.test_staff:
            print("❌ Skipping handovers - no staff logged in")
            return False

        # Create handover
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        handover_data = {
            "date": today,
            "shift": "mattina",
            "notes": "Test handover notes for system testing",
            "staff_id": self.test_staff["id"],
            "staff_name": self.test_staff["name"]
        }
        success1, created_handover = self.run_test("Create Handover", "POST", "handovers", 200, handover_data)
        
        if success1 and created_handover:
            self.test_handover = created_handover
            
            # Get all handovers
            success2, handovers = self.run_test("Get All Handovers", "GET", "handovers", 200)
            
            # Get pending handovers
            success3, pending = self.run_test("Get Pending Handovers", "GET", "handovers", 200, params={"pending": "true"})
            
            # Acknowledge handover
            ack_data = {
                "staff_id": self.test_staff["id"],
                "staff_name": self.test_staff["name"]
            }
            success4, _ = self.run_test("Acknowledge Handover", "PUT", f"handovers/{created_handover['id']}/acknowledge", 200, ack_data)
            
            return success1 and success2 and success3 and success4
        
        return success1

    def test_meal_records(self):
        """Test meal tracking operations"""
        if not self.test_staff:
            print("❌ Skipping meals - no staff logged in")
            return False

        # Create meal record
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        meal_data = {
            "date": today,
            "meal_type": "pranzo",
            "meal_count": 50,
            "quality_rating": 4,
            "leftover_status": "pochi",
            "notes": "Test meal record",
            "staff_id": self.test_staff["id"],
            "staff_name": self.test_staff["name"]
        }
        success1, created_meal = self.run_test("Create Meal Record", "POST", "meals", 200, meal_data)
        
        if success1 and created_meal:
            self.test_meal = created_meal
            
            # Get all meals
            success2, meals = self.run_test("Get All Meals", "GET", "meals", 200)
            
            # Get waste stats
            success3, stats = self.run_test("Get Waste Stats", "GET", "meals/waste-stats", 200)
            
            return success1 and success2 and success3
        
        return success1

    def test_laundry_schedule(self):
        """Test laundry schedule operations"""
        # Get today's laundry
        success1, today_laundry = self.run_test("Get Today Laundry", "GET", "laundry/today", 200)
        
        # Get laundry schedule
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        success2, schedule = self.run_test("Get Laundry Schedule", "GET", "laundry/schedule", 200, params={"date": today})
        
        if success1 and today_laundry:
            print(f"   Today's laundry rooms: {len(today_laundry.get('shift_1', []) + today_laundry.get('shift_2', []) + today_laundry.get('shift_3', []))}")
        
        return success1 and success2

    def test_reports(self):
        """Test report generation"""
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        # Attendance report
        success1, attendance = self.run_test("Attendance Report", "GET", f"reports/attendance?year={current_year}&month={current_month}", 200)
        
        # Security report
        success2, security = self.run_test("Security Report", "GET", f"reports/security?year={current_year}&month={current_month}", 200)
        
        # Food waste report
        success3, food_waste = self.run_test("Food Waste Report", "GET", f"reports/food-waste?year={current_year}&month={current_month}", 200)
        
        return success1 and success2 and success3

    def test_export_import(self):
        """Test data export/import operations"""
        # Export data
        success1, export_data = self.run_test("Export Data", "GET", "export", 200)
        
        if success1 and export_data:
            print(f"   Exported {len(export_data.get('staff', []))} staff, {len(export_data.get('residents', []))} residents")
            
            # Test import (with same data)
            success2, _ = self.run_test("Import Data", "POST", "import", 200, export_data)
            
            return success1 and success2
        
        return success1

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Camp Management System API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Core tests
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("Seed Data", self.test_seed_data),
            ("Staff Login", self.test_staff_login),
            ("Staff Operations", self.test_staff_operations),
            ("Time Tracking", self.test_time_tracking),
            ("Residents Operations", self.test_residents_operations),
            ("Log Entries", self.test_log_entries),
            ("Shift Handovers", self.test_shift_handovers),
            ("Meal Records", self.test_meal_records),
            ("Laundry Schedule", self.test_laundry_schedule),
            ("Reports", self.test_reports),
            ("Export/Import", self.test_export_import),
        ]

        failed_tests = []
        
        for test_name, test_func in tests:
            print(f"\n📋 Running {test_name} Tests...")
            try:
                if not test_func():
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
                failed_tests.append(test_name)

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if failed_tests:
            print(f"❌ Failed test categories: {', '.join(failed_tests)}")
            return 1
        else:
            print("✅ All test categories passed!")
            return 0

def main():
    tester = CampAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())