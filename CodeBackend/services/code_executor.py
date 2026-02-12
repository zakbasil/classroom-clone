"""
Code execution service for multiple programming languages
"""

import asyncio
import os
import tempfile
import subprocess
import shutil
from typing import List, Optional
from pathlib import Path
import re

from models.schemas import TestCase, CodeExecutionResponse, TestCaseResult


class CodeExecutor:
    """Handles code execution for Python, C, C++, and Java 8"""
    
    # Timeout for code execution (seconds)
    EXECUTION_TIMEOUT = 10
    
    # Maximum output size (bytes)
    MAX_OUTPUT_SIZE = 1024 * 1024  # 1MB
    
    def __init__(self):
        # Create a temporary directory for code execution
        self.temp_dir = Path(tempfile.gettempdir()) / "code_executor"
        self.temp_dir.mkdir(exist_ok=True)
    
    async def execute_and_test(
        self,
        code: str,
        language: str,
        test_cases: List[TestCase]
    ) -> CodeExecutionResponse:
        """
        Execute code and run test cases.
        
        Args:
            code: Source code to execute
            language: Programming language (python, c, cpp, java)
            test_cases: List of test cases
            
        Returns:
            CodeExecutionResponse with test results
        """
        results = []
        passed_count = 0
        
        try:
            # Compile/build the code if needed
            executable_path = await self._prepare_code(code, language)
            
            # Run each test case
            for idx, test_case in enumerate(test_cases):
                result = await self._run_test_case(
                    executable_path=executable_path,
                    language=language,
                    test_case=test_case,
                    test_index=idx
                )
                results.append(result)
                if result.passed:
                    passed_count += 1
            
            # Cleanup
            await self._cleanup(executable_path, language)
            
            return CodeExecutionResponse(
                total_test_cases=len(test_cases),
                passed_test_cases=passed_count,
                results=results,
                execution_error=None
            )
            
        except Exception as e:
            # If there's a compilation or execution error, return error response
            return CodeExecutionResponse(
                total_test_cases=len(test_cases),
                passed_test_cases=0,
                results=results,
                execution_error=str(e)
            )
    
    async def _prepare_code(self, code: str, language: str) -> Path:
        """
        Prepare code for execution (compile if needed).
        Returns path to executable or script.
        """
        # For Java, extract class name and name file accordingly
        if language == "java":
            class_name = self._extract_java_class_name(code)
            if not class_name:
                raise ValueError("Could not find public class in Java code")
            source_path = self.temp_dir / f"{class_name}.java"
            source_path.write_text(code, encoding='utf-8')
        else:
            # Create a unique temporary file for other languages
            temp_file = tempfile.NamedTemporaryFile(
                mode='w',
                delete=False,
                dir=self.temp_dir,
                suffix=self._get_file_extension(language)
            )
            
            temp_file.write(code)
            temp_file.close()
            
            source_path = Path(temp_file.name)
        
        if language == "python":
            return source_path
        elif language == "c":
            return await self._compile_c(source_path)
        elif language == "cpp":
            return await self._compile_cpp(source_path)
        elif language == "java":
            return await self._compile_java(source_path)
        else:
            raise ValueError(f"Unsupported language: {language}")
    
    async def _compile_c(self, source_path: Path) -> Path:
        """Compile C code"""
        executable_path = source_path.with_suffix('.exe' if os.name == 'nt' else '')
        
        process = await asyncio.create_subprocess_exec(
            'gcc',
            str(source_path),
            '-o',
            str(executable_path),
            '-std=c11',
            '-Wall',
            '-Wextra',
            stderr=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=self.EXECUTION_TIMEOUT
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            raise RuntimeError(f"C compilation failed: {error_msg}")
        
        return executable_path
    
    async def _compile_cpp(self, source_path: Path) -> Path:
        """Compile C++ code"""
        executable_path = source_path.with_suffix('.exe' if os.name == 'nt' else '')
        
        process = await asyncio.create_subprocess_exec(
            'g++',
            str(source_path),
            '-o',
            str(executable_path),
            '-std=c++17',
            '-Wall',
            '-Wextra',
            stderr=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=self.EXECUTION_TIMEOUT
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            raise RuntimeError(f"C++ compilation failed: {error_msg}")
        
        return executable_path
    
    async def _compile_java(self, source_path: Path) -> Path:
        """Compile Java code"""
        # Java requires the class name to match the filename
        # We'll compile in the temp directory
        compile_dir = source_path.parent
        
        process = await asyncio.create_subprocess_exec(
            'javac',
            '-source', '8',
            '-target', '8',
            str(source_path),
            cwd=str(compile_dir),
            stderr=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=self.EXECUTION_TIMEOUT
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            raise RuntimeError(f"Java compilation failed: {error_msg}")
        
        # Return the directory containing the .class file
        return compile_dir
    
    async def _run_test_case(
        self,
        executable_path: Path,
        language: str,
        test_case: TestCase,
        test_index: int
    ) -> TestCaseResult:
        """Run a single test case"""
        try:
            # Execute the code with test input
            output = await self._execute_code(
                executable_path=executable_path,
                language=language,
                input_data=test_case.input
            )
            
            # Normalize outputs for comparison (strip whitespace)
            expected = test_case.expected_output.strip()
            actual = output.strip()
            
            passed = expected == actual
            
            return TestCaseResult(
                test_case_index=test_index,
                passed=passed,
                input=test_case.input,
                expected_output=test_case.expected_output,
                actual_output=output,
                error=None
            )
            
        except Exception as e:
            return TestCaseResult(
                test_case_index=test_index,
                passed=False,
                input=test_case.input,
                expected_output=test_case.expected_output,
                actual_output=None,
                error=str(e)
            )
    
    async def _execute_code(
        self,
        executable_path: Path,
        language: str,
        input_data: str
    ) -> str:
        """Execute code with given input"""
        if language == "python":
            return await self._run_python(executable_path, input_data)
        elif language == "c" or language == "cpp":
            return await self._run_executable(executable_path, input_data)
        elif language == "java":
            return await self._run_java(executable_path, input_data)
        else:
            raise ValueError(f"Unsupported language: {language}")
    
    async def _run_python(self, script_path: Path, input_data: str) -> str:
        """Run Python script"""
        process = await asyncio.create_subprocess_exec(
            'python',
            str(script_path),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(input=input_data.encode('utf-8')),
            timeout=self.EXECUTION_TIMEOUT
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            raise RuntimeError(f"Python execution error: {error_msg}")
        
        output = stdout.decode('utf-8', errors='ignore')
        if len(output) > self.MAX_OUTPUT_SIZE:
            raise RuntimeError("Output exceeds maximum size limit")
        
        return output
    
    async def _run_executable(self, executable_path: Path, input_data: str) -> str:
        """Run compiled C/C++ executable"""
        process = await asyncio.create_subprocess_exec(
            str(executable_path),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(input=input_data.encode('utf-8')),
            timeout=self.EXECUTION_TIMEOUT
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            raise RuntimeError(f"Execution error: {error_msg}")
        
        output = stdout.decode('utf-8', errors='ignore')
        if len(output) > self.MAX_OUTPUT_SIZE:
            raise RuntimeError("Output exceeds maximum size limit")
        
        return output
    
    async def _run_java(self, class_dir: Path, input_data: str) -> str:
        """Run Java program"""
        # Find the .class file (assuming single class)
        class_files = list(class_dir.glob("*.class"))
        if not class_files:
            raise RuntimeError("No .class file found after compilation")
        
        # Get class name (filename without .class extension)
        class_name = class_files[0].stem
        
        process = await asyncio.create_subprocess_exec(
            'java',
            '-cp', str(class_dir),
            class_name,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(input=input_data.encode('utf-8')),
            timeout=self.EXECUTION_TIMEOUT
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            raise RuntimeError(f"Java execution error: {error_msg}")
        
        output = stdout.decode('utf-8', errors='ignore')
        if len(output) > self.MAX_OUTPUT_SIZE:
            raise RuntimeError("Output exceeds maximum size limit")
        
        return output
    
    def _get_file_extension(self, language: str) -> str:
        """Get file extension for a language"""
        extensions = {
            "python": ".py",
            "c": ".c",
            "cpp": ".cpp",
            "java": ".java"
        }
        return extensions.get(language, ".txt")
    
    def _extract_java_class_name(self, code: str) -> Optional[str]:
        """Extract the public class name from Java code"""
        # Look for public class declaration
        match = re.search(r'public\s+class\s+(\w+)', code)
        if match:
            return match.group(1)
        # Fallback: look for any class declaration
        match = re.search(r'class\s+(\w+)', code)
        if match:
            return match.group(1)
        return None
    
    async def _cleanup(self, executable_path: Path, language: str):
        """Clean up temporary files"""
        try:
            if language == "java":
                # Clean up .class files
                for class_file in executable_path.glob("*.class"):
                    class_file.unlink()
                # Clean up .java file
                for java_file in executable_path.glob("*.java"):
                    java_file.unlink()
            else:
                # Clean up source and executable files
                if executable_path.exists():
                    executable_path.unlink()
                # Find and remove source file
                source_ext = self._get_file_extension(language)
                source_file = executable_path.with_suffix(source_ext)
                if source_file.exists():
                    source_file.unlink()
        except Exception:
            # Ignore cleanup errors
            pass
