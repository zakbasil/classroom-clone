# Code Execution Backend

A Python-based backend service for executing code in multiple programming languages (Python, C, C++, Java 8) and running test cases.

## Features

- Execute code in Python, C, C++, and Java 8
- Run multiple test cases against submitted code
- Returns detailed results including passed/failed test cases
- Timeout protection (10 seconds per execution)
- Output size limits (1MB max)

## Requirements

### System Requirements

- Python 3.8+
- GCC compiler (for C/C++)
- Java JDK 8+ (for Java)
- Python interpreter (for Python)

### Python Dependencies

Install dependencies using:

```bash
pip install -r requirements.txt
```

## Running the Server

```bash
cd CodeBackend
python main.py
```

The server will start on `http://localhost:8000`

Alternatively, use uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST `/api/execute`

Execute code and run test cases.

**Request Body:**
```json
{
  "code": "# Your code here\nprint('Hello, World!')",
  "language": "python",
  "test_cases": [
    {
      "input": "",
      "expected_output": "Hello, World!\n"
    }
  ]
}
```

**Response:**
```json
{
  "total_test_cases": 1,
  "passed_test_cases": 1,
  "results": [
    {
      "test_case_index": 0,
      "passed": true,
      "input": "",
      "expected_output": "Hello, World!\n",
      "actual_output": "Hello, World!\n",
      "error": null
    }
  ],
  "execution_error": null
}
```

### GET `/`

Health check endpoint.

**Response:**
```json
{
  "message": "Code Execution API is running",
  "status": "ok"
}
```

## Supported Languages

- **python**: Python 3.x
- **c**: C (C11 standard)
- **cpp**: C++ (C++17 standard)
- **java**: Java 8

## Code Examples

### Python Example

```python
# Read input
n = int(input())
result = n * 2
print(result)
```

### C Example

```c
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\n", n * 2);
    return 0;
}
```

### C++ Example

```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << n * 2 << endl;
    return 0;
}
```

### Java Example

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        System.out.println(n * 2);
    }
}
```

## Security Considerations

⚠️ **Warning**: This service executes arbitrary code. For production use, consider:

1. Running in a sandboxed environment (Docker containers, VMs)
2. Implementing resource limits (CPU, memory)
3. Network isolation
4. File system restrictions
5. User authentication and rate limiting
6. Code validation and sanitization

## Project Structure

```
CodeBackend/
├── main.py                 # FastAPI application entry point
├── models/
│   └── schemas.py          # Pydantic models for request/response
├── services/
│   └── code_executor.py    # Code execution logic
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Error Handling

The API handles various error scenarios:

- **Compilation errors**: Returned in `execution_error` field
- **Runtime errors**: Included in individual test case results
- **Timeout errors**: Execution is terminated after 10 seconds
- **Output size limits**: Errors if output exceeds 1MB

## Development

To run in development mode with auto-reload:

```bash
uvicorn main:app --reload
```

## Testing

Example curl request:

```bash
curl -X POST "http://localhost:8000/api/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(int(input()) * 2)",
    "language": "python",
    "test_cases": [
      {"input": "5", "expected_output": "10"},
      {"input": "10", "expected_output": "20"}
    ]
  }'
```
