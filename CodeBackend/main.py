"""
Code Execution Backend Server
Handles execution of Python, C, C++, and Java 8 code with test case validation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from services.code_executor import CodeExecutor
from models.schemas import CodeExecutionRequest, CodeExecutionResponse, TestCase

app = FastAPI(title="Code Execution API", version="1.0.0")

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize code executor
executor = CodeExecutor()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Code Execution API is running", "status": "ok"}


@app.post("/api/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    """
    Execute code and run test cases.
    
    Request body:
    - code: The source code to execute
    - language: One of "python", "c", "cpp", "java"
    - test_cases: List of test cases, each with input and expected_output
    
    Returns:
    - total_test_cases: Total number of test cases
    - passed_test_cases: Number of test cases that passed
    - results: Detailed results for each test case
    """
    try:
        # Validate language
        if request.language not in ["python", "c", "cpp", "java"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported language: {request.language}. Supported: python, c, cpp, java"
            )
        
        # Validate test cases
        if not request.test_cases or len(request.test_cases) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one test case is required"
            )
        
        # Execute code and run test cases
        result = await executor.execute_and_test(
            code=request.code,
            language=request.language,
            test_cases=request.test_cases
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
