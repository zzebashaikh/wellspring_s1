#!/bin/bash

# WellSpring Hospital Management System - Integration Test Script
# This script tests all the major functionality of the system

echo "🏥 WellSpring Hospital Management System - Integration Test"
echo "=========================================================="

BASE_URL="http://localhost:8081/api"
AUTH_TOKEN="demo-token-123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASSED${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Test 1: Health Check
echo -e "\n${YELLOW}1. Testing Health Check${NC}"
test_endpoint "GET" "/health" "" "Health Check"

# Test 2: Get All Patients
echo -e "\n${YELLOW}2. Testing Patient Management${NC}"
test_endpoint "GET" "/patients" "" "Get All Patients"

# Test 3: Get Resources
echo -e "\n${YELLOW}3. Testing Resource Management${NC}"
test_endpoint "GET" "/resources" "" "Get All Resources"

# Test 4: Get Doctors List
echo -e "\n${YELLOW}4. Testing Doctor Management${NC}"
test_endpoint "GET" "/resources/doctors/list" "" "Get Doctors List"

# Test 5: Create New Patient
echo -e "\n${YELLOW}5. Testing Patient Creation${NC}"
# Generate unique contact number
UNIQUE_CONTACT=$(date +%s | tail -c 10)
PATIENT_DATA="{
    \"name\": \"Integration Test Patient\",
    \"age\": 30,
    \"gender\": \"Male\",
    \"contact\": \"$UNIQUE_CONTACT\",
    \"diagnosis\": \"Integration test\",
    \"assignedDoctor\": \"Dr. A. Mehta (Cardiology)\",
    \"severity\": 3
}"

test_endpoint "POST" "/patients" "$PATIENT_DATA" "Create New Patient"

# Test 6: Get Patient by ID (using the created patient)
echo -e "\n${YELLOW}6. Testing Patient Retrieval${NC}"
# First get the list to find a patient ID
PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/patients" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json")

# Extract the first patient ID
PATIENT_ID=$(echo "$PATIENTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PATIENT_ID" ]; then
    test_endpoint "GET" "/patients/$PATIENT_ID" "" "Get Patient by ID"
else
    echo -e "${RED}✗ FAILED - No patient ID found${NC}"
fi

# Test 7: Resource Allocation
echo -e "\n${YELLOW}7. Testing Resource Allocation${NC}"
if [ -n "$PATIENT_ID" ]; then
    ALLOCATION_DATA='{"allocatedResource": "beds"}'
    test_endpoint "POST" "/patients/$PATIENT_ID/allocate" "$ALLOCATION_DATA" "Allocate Resource to Patient"
else
    echo -e "${RED}✗ FAILED - No patient ID for allocation test${NC}"
fi

# Test 8: Resource Allocation (Direct)
echo -e "\n${YELLOW}8. Testing Direct Resource Allocation${NC}"
test_endpoint "POST" "/resources/beds/allocate" "" "Allocate Bed Resource"

# Test 9: Resource Release
echo -e "\n${YELLOW}9. Testing Resource Release${NC}"
test_endpoint "POST" "/resources/beds/release" "" "Release Bed Resource"

echo -e "\n${GREEN}🎉 Integration Test Complete!${NC}"
echo "=========================================================="
echo "All major functionality has been tested."
echo "If all tests passed, the system is working correctly."
