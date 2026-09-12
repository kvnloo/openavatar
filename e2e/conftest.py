import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
IPHONE = {"width": 390, "height": 844}


@pytest.fixture(scope="session")
def server():
    port = 3456
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "agent" / "serve.py"), "--host", "127.0.0.1", "--port", str(port)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    url = f"http://127.0.0.1:{port}"
    deadline = time.time() + 8
    while time.time() < deadline:
        try:
            urlopen(url)
            break
        except OSError:
            time.sleep(0.1)
    else:
        proc.kill()
        pytest.fail("serve.py did not start")
    yield url
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


@pytest.fixture
def page(server):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport=IPHONE, is_mobile=True, has_touch=True)
        pg = context.new_page()
        pg.set_default_timeout(8000)
        yield pg
        context.close()
        browser.close()
