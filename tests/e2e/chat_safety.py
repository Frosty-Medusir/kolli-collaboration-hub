import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def rpc(page,name,args={}):
 return await page.evaluate('''async ([name,args]) => {const {supabase}=await import('/src/integrations/supabase/client.ts');const {data,error}=await supabase.rpc(name,args);if(error)throw Error(error.message);return data;}''',[name,args])
async def join(page,name):
 await page.goto('http://localhost:8080')
 await page.get_by_role('button',name='Join to match ↗',exact=True).click()
 await page.get_by_role('textbox',name='Display name').fill(name)
 for box in await page.get_by_role('checkbox').all(): await box.check()
 await page.get_by_role('button',name='Start watching').click()
 await page.get_by_role('dialog').wait_for(state='hidden')
 await page.get_by_role('button',name='Account and privacy').wait_for()
async def main():
 Path('/tmp/browser/chat-safety').mkdir(parents=True, exist_ok=True)
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True)
  contexts=[await b.new_context(viewport={'width':1280,'height':1800}) for _ in range(2)]
  pages=[await c.new_page() for c in contexts]
  errors=[]
  for page,name in zip(pages,['Safety Test A','Safety Test B']):
   page.on('pageerror',lambda e: errors.append(str(e)))
   await join(page,name)
  args={'p_content_id':27205,'p_title':'Inception','p_type':'movie','p_poster':None,'p_year':2010}
  await rpc(pages[0],'join_queue',args)
  mid=(await rpc(pages[1],'join_queue',args))['matchId']
  for page in pages:
   await page.goto('http://localhost:8080/lobby/'+mid)
   await page.get_by_role('textbox',name='Message',exact=True).wait_for()
  a=pages[0]; peer=pages[1]
  async def send(body):
   await a.get_by_role('textbox',name='Message',exact=True).fill(body)
   await a.get_by_role('button',name='Send',exact=True).click()
  await send('Hello, ready for the movie?')
  await a.get_by_text('Hello, ready for the movie?',exact=True).wait_for()
  await peer.reload()
  await peer.get_by_text('Hello, ready for the movie?',exact=False).wait_for()
  for body,reason in [('f.u.c.k you','Harassment'),('kill yourself','Harassment'),('f​uck you','Harassment'),('aaaaaaaaaaaa','Repeated text'),('watch watch watch watch watch watch','Repeated text'),('https://a.test https://b.test https://c.test https://d.test','Repeated text'),('Hello, ready for the movie?','Duplicate message')]:
   await send(body)
   await a.get_by_role('alert').filter(has_text=reason).wait_for()
   assert await a.get_by_role('textbox',name='Message',exact=True).input_value()==body
  await a.screenshot(path='/tmp/browser/chat-safety/blocked.png')
  result=await a.evaluate('''async(mid)=>{const {supabase}=await import('/src/integrations/supabase/client.ts');const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from('messages').insert({match_id:mid,sender_id:user.id,sender_name:'Safety Test A',body:'kill yourself',created_at:'2000-01-01'});return error?.message;}''',mid)
  assert 'Harassment' in result
  for i in range(4):
   await send('Unique chat line '+str(i))
   await a.get_by_text('Unique chat line '+str(i),exact=True).wait_for()
  await send('One too many messages')
  await a.get_by_role('alert').filter(has_text='Too many messages').wait_for()
  count=await a.evaluate('''async(mid)=>{const {supabase}=await import('/src/integrations/supabase/client.ts');return (await supabase.from('messages').select('id').eq('match_id',mid)).data.length;}''',mid)
  assert count==5
  await a.goto('http://localhost:8080')
  await a.get_by_role('button',name='Account and privacy').click()
  await a.get_by_role('dialog').wait_for()
  assert await a.get_by_text('Recommendation settings',exact=True).count()==0
  denial=await a.evaluate('''async()=>{const {supabase}=await import('/src/integrations/supabase/client.ts');const {error}=await supabase.from('recommendation_settings').upsert({id:1,taste_weight:5});return Boolean(error);}''')
  assert denial
  role_denial=await a.evaluate('''async()=>{const {supabase}=await import('/src/integrations/supabase/client.ts');const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from('user_roles').insert({user_id:user.id,role:'admin'});return Boolean(error);}''')
  assert role_denial
  await a.get_by_role('button',name='Close',exact=True).click()
  await a.get_by_role('button',name='For you',exact=True).click()
  await a.locator('#picks article').first.wait_for(timeout=30000)
  await a.set_viewport_size({'width':390,'height':844})
  await a.locator('#picks').scroll_into_view_if_needed()
  await a.screenshot(path='/tmp/browser/chat-safety/mobile.png')
  assert await a.evaluate('document.documentElement.scrollWidth <= innerWidth')
  assert not errors,errors
  print('PASS: partner chat; abuse, spam, duplicate and burst rejection; direct-write protection; role and settings access controls; recommendations and mobile layout.')
  await b.close()
asyncio.run(main())
