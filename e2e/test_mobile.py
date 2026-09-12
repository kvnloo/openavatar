"""Mobile E2E for Claim / Imagine / Explore. Fail, then pass."""


def test_claim_phone_sigil_and_imagine_nav(page, server):
    page.goto(server + "/")
    assert page.get_by_role("link", name="Imagine").is_visible()
    page.locator('input[name="handle"]').fill("ada")
    sigil = page.locator("#sigil")
    sigil.wait_for()
    assert "@ada" in sigil.inner_html()
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
    )
    assert overflow is False


def test_imagine_phone_universes_require_photo(page, server):
    page.goto(server + "/imagine.html")
    assert page.get_by_role("heading", name="Imagine you").is_visible()
    page.get_by_role("button", name="Star Wars").click()
    page.get_by_role("button", name="Imagine this universe").click()
    status = page.locator("#status")
    status.wait_for()
    assert "photo" in status.inner_text().lower()


def test_explore_phone_seed_cards(page, server):
    page.goto(server + "/explore.html")
    page.wait_for_selector("#cards article")
    text = page.locator("#cards").inner_text()
    assert "@example" in text
    assert "@hermes" in text
