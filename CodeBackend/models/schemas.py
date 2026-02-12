"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class TestCase(BaseModel):
    """Represents a single test case"""
    input: str = Field(..., description="Input for the test case")
    expected_output: str = Field(..., description="Expected output for the test case")


class CodeExecutionRequest(BaseModel):
    """Request model for code execution"""
    code: str = Field(..., description="Source code to execute")
    language: str = Field(..., description="Programming language: python, c, cpp, or java")
    test_cases: List[TestCase] = Field(..., description="List of test cases to run")


class TestCaseResult(BaseModel):
    """Result of a single test case execution"""
    test_case_index: int = Field(..., description="Index of the test case")
    passed: bool = Field(..., description="Whether the test case passed")
    input: str = Field(..., description="Input that was used")
    expected_output: str = Field(..., description="Expected output")
    actual_output: Optional[str] = Field(None, description="Actual output from code execution")
    error: Optional[str] = Field(None, description="Error message if execution failed")


class CodeExecutionResponse(BaseModel):
    """Response model for code execution"""
    total_test_cases: int = Field(..., description="Total number of test cases")
    passed_test_cases: int = Field(..., description="Number of test cases that passed")
    results: List[TestCaseResult] = Field(..., description="Detailed results for each test case")
    execution_error: Optional[str] = Field(None, description="Error during code execution if any")
