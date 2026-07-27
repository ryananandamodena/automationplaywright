"""
AI Service — Test Case Generation

Mendukung dua mode:
1. OpenAI mode  — jika OPENAI_API_KEY diset dan valid
2. Mock mode    — generate test case dummy untuk testing/demo
"""
import json
import logging
import re
from typing import Any, Dict, List

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert QA engineer. Given information about web pages discovered 
in a web application, generate comprehensive, actionable test cases.

For each test case, output ONLY a JSON array (no markdown, no explanation) where each item has:
{
  "title": "Short test case title",
  "description": "Brief description of what is being tested",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "test_type": "FUNCTIONAL" | "UI" | "ACCESSIBILITY" | "SECURITY",
  "steps": ["Step 1 description", "Step 2 description", "Step 3 description"],
  "expected_result": "What should happen if the test passes"
}

Focus on:
- Navigation and routing between pages
- Form validations and user interactions
- UI responsiveness and accessibility
- Common security checks (XSS, SQL injection inputs)
- Error handling and edge cases
"""

USER_PROMPT_TEMPLATE = """Project: {project_name}

Discovered pages:
{pages_info}

Generate 6-10 test cases covering the most critical functionality of this application.
Return ONLY a valid JSON array."""


def _build_pages_info(pages: List[Dict[str, Any]]) -> str:
    """Format page data into readable text for the prompt."""
    lines = []
    for i, page in enumerate(pages[:10], 1):  # limit to 10 pages
        url = page.get("url", "unknown")
        title = page.get("title") or page.get("page_name") or "Untitled"
        lines.append(f"{i}. {title} — {url}")
    return "\n".join(lines) if lines else "No pages discovered"


def _get_mock_test_cases(pages: List[Dict[str, Any]], project_name: str) -> List[Dict[str, Any]]:
    """Generate mock test cases for demo/testing when no API key is set."""
    base_url = pages[0].get("url", "https://app.example.com") if pages else "https://app.example.com"
    page_titles = [p.get("title") or p.get("page_name") or "Page" for p in pages[:3]]

    return [
        {
            "title": f"Verify {project_name} Homepage Loads",
            "description": "Check that the application homepage loads correctly with all elements visible",
            "priority": "HIGH",
            "test_type": "FUNCTIONAL",
            "steps": [
                f"Navigate to {base_url}",
                "Wait for page to fully load",
                "Verify page title is present",
                "Check that main navigation is visible",
                "Verify no console errors",
            ],
            "expected_result": "Page loads within 3 seconds, title is visible, navigation works correctly",
        },
        {
            "title": "Navigation Between Pages",
            "description": "Verify navigation links work correctly across all discovered pages",
            "priority": "HIGH",
            "test_type": "FUNCTIONAL",
            "steps": [
                "Start at homepage",
                *[f"Click link to navigate to '{t}'" for t in page_titles],
                "Verify URL changes correctly",
                "Use browser back button to return",
            ],
            "expected_result": "All navigation links work, correct pages load, browser history is maintained",
        },
        {
            "title": "Page Responsiveness on Mobile",
            "description": "Test that all pages render correctly on mobile viewport (375px)",
            "priority": "MEDIUM",
            "test_type": "UI",
            "steps": [
                "Open browser developer tools",
                "Set viewport to 375x812 (iPhone SE)",
                f"Navigate to {base_url}",
                "Verify no horizontal scroll",
                "Check that all buttons are tappable (min 44px)",
                "Verify text is readable without zooming",
            ],
            "expected_result": "All content fits within viewport, no horizontal overflow, interactive elements accessible",
        },
        {
            "title": "Page Load Performance",
            "description": "Verify all pages load within acceptable time limits",
            "priority": "MEDIUM",
            "test_type": "FUNCTIONAL",
            "steps": [
                f"Open Network tab and navigate to {base_url}",
                "Record total load time",
                "Check for resources > 1MB",
                "Verify no failed network requests (4xx/5xx)",
            ],
            "expected_result": "Page loads under 3 seconds, no failed requests, no resources above 2MB",
        },
        {
            "title": "Keyboard Accessibility Navigation",
            "description": "Verify the application is navigable using keyboard only",
            "priority": "MEDIUM",
            "test_type": "ACCESSIBILITY",
            "steps": [
                f"Navigate to {base_url}",
                "Press Tab to move focus through interactive elements",
                "Verify focus indicators are visible",
                "Press Enter/Space to activate focused elements",
                "Verify all functionality is accessible without mouse",
            ],
            "expected_result": "All interactive elements receive focus in logical order, focus is always visible",
        },
        {
            "title": "XSS Input Validation",
            "description": "Test that input fields sanitize malicious scripts",
            "priority": "HIGH",
            "test_type": "SECURITY",
            "steps": [
                "Find all text input fields on each page",
                "Enter payload: <script>alert('XSS')</script>",
                "Submit the form",
                "Verify no alert dialog appears",
                "Verify the script tag is escaped in the output",
            ],
            "expected_result": "Input is sanitized, no script execution, content is escaped correctly",
        },
        {
            "title": "404 Error Page Handling",
            "description": "Verify a proper 404 page is shown for non-existent routes",
            "priority": "LOW",
            "test_type": "FUNCTIONAL",
            "steps": [
                f"Navigate to {base_url}/this-page-does-not-exist-123",
                "Verify HTTP status is 404",
                "Check that a user-friendly error page is displayed",
                "Verify navigation back to homepage is possible",
            ],
            "expected_result": "404 page shown with helpful message and link back to homepage",
        },
        {
            "title": "Image Alt Text Accessibility",
            "description": "Verify all images have appropriate alt text for screen readers",
            "priority": "LOW",
            "test_type": "ACCESSIBILITY",
            "steps": [
                f"Navigate to each discovered page",
                "Inspect all <img> elements",
                "Verify each has non-empty alt attribute",
                "Check that decorative images have alt=''",
            ],
            "expected_result": "All informational images have descriptive alt text, decorative images have empty alt",
        },
    ]


async def generate_test_cases(
    pages: List[Dict[str, Any]],
    project_name: str,
) -> List[Dict[str, Any]]:
    """
    Generate test cases using OpenAI or fall back to mock mode.

    Args:
        pages: List of page dicts with url, title, page_name, dom_snapshot
        project_name: Name of the project for context

    Returns:
        List of test case dicts
    """
    api_key = settings.OPENAI_API_KEY
    use_mock = not api_key or api_key.startswith("sk-your") or api_key == ""

    if use_mock:
        logger.info("AI Service: Using mock mode (OPENAI_API_KEY not set or is placeholder)")
        return _get_mock_test_cases(pages, project_name)

    # --- Real OpenAI call ---
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key)
        pages_info = _build_pages_info(pages)
        user_prompt = USER_PROMPT_TEMPLATE.format(
            project_name=project_name,
            pages_info=pages_info,
        )

        logger.info(f"AI Service: Calling OpenAI for project '{project_name}' with {len(pages)} pages")

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "[]"

        # Parse response — handle both array and object with array key
        parsed = json.loads(content)
        if isinstance(parsed, list):
            test_cases = parsed
        elif isinstance(parsed, dict):
            # GPT sometimes wraps in {"test_cases": [...]}
            test_cases = next(
                (v for v in parsed.values() if isinstance(v, list)),
                []
            )
        else:
            test_cases = []

        logger.info(f"AI Service: Generated {len(test_cases)} test cases")
        return test_cases

    except Exception as e:
        logger.error(f"AI Service: OpenAI call failed: {e}. Falling back to mock.")
        return _get_mock_test_cases(pages, project_name)
