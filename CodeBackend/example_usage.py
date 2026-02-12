"""
Example usage of the Code Execution API
This script demonstrates how to use the API with different languages.
"""

import requests
import json

API_URL = "http://localhost:8000/api/execute"


def test_python():
    """Test Python code execution"""
    print("Testing Python code execution...")
    
    code = """
n = int(input())
print(n * 2)
"""
    
    test_cases = [
        {"input": "5", "expected_output": "10"},
        {"input": "10", "expected_output": "20"},
        {"input": "0", "expected_output": "0"}
    ]
    
    response = requests.post(API_URL, json={
        "code": code,
        "language": "python",
        "test_cases": test_cases
    })
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_c():
    """Test C code execution"""
    print("Testing C code execution...")
    
    code = """
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", n * 2);
    return 0;
}
"""
    
    test_cases = [
        {"input": "5", "expected_output": "10"},
        {"input": "10", "expected_output": "20"}
    ]
    
    response = requests.post(API_URL, json={
        "code": code,
        "language": "c",
        "test_cases": test_cases
    })
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_cpp():
    """Test C++ code execution"""
    print("Testing C++ code execution...")
    
    code = """
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << n * 2 << endl;
    return 0;
}
"""
    
    test_cases = [
        {"input": "5", "expected_output": "10"},
        {"input": "10", "expected_output": "20"}
    ]
    
    response = requests.post(API_URL, json={
        "code": code,
        "language": "cpp",
        "test_cases": test_cases
    })
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_java():
    """Test Java code execution"""
    print("Testing Java code execution...")
    
    code = """
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        System.out.println(n * 2);
    }
}
"""
    
    test_cases = [
        {"input": "5", "expected_output": "10"},
        {"input": "10", "expected_output": "20"}
    ]
    
    response = requests.post(API_URL, json={
        "code": code,
        "language": "java",
        "test_cases": test_cases
    })
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


if __name__ == "__main__":
    print("Make sure the server is running on http://localhost:8000")
    print("=" * 50)
    print()
    
    try:
        test_python()
        # Uncomment to test other languages (requires compilers installed)
        # test_c()
        # test_cpp()
        # test_java()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server.")
        print("Please make sure the server is running:")
        print("  cd CodeBackend")
        print("  python main.py")
    except Exception as e:
        print(f"Error: {e}")
