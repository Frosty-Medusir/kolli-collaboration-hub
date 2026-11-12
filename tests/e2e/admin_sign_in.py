import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
 Path('/tmp/browser/admin-sign-in').mkdir(parents=True, exist_ok=True)
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  page=await browser.new_page(viewport={'width':1280,'height':1800})
  await page.goto('http://localhost:8080/admin')
  await page.get_by_role('heading',name='Admin sign-in',exact=True).wait_for()
  await page.get_by_label('Email',exact=True).fill('nonexistent-admin@example.com')
  await page.get_by_label('Password',exact=True).fill('invalid-test-password')
  await page.get_by_role('button',name='Sign in',exact=True).click()
  await page.get_by_role('status').filter(has_text='Sign-in failed').wait_for()
  assert await page.get_by_role('spinbutton').count()==0
  await page.get_by_role('button',name='Create an account',exact=True).click()
  await page.get_by_role('heading',name='Create account',exact=True).wait_for()
  assert await page.get_by_label('Password',exact=True).get_attribute('minlength')=='12'
  await page.screenshot(path='/tmp/browser/admin-sign-in/desktop.png')
  await page.set_viewport_size({'width':390,'height':844})
  await page.screenshot(path='/tmp/browser/admin-sign-in/mobile.png')
  assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  await page.goto('http://localhost:8080/privacy')
  await page.get_by_text('Postal address: Brookside DR, Westlands 0800.',exact=False).wait_for()
  print('PASS: sign-in rejects invalid credentials, signup form, mobile layout, operator address. Owner email verification remains pending.')
  await browser.close()

asyncio.run(main())