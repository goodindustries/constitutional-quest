import puppeteer from 'puppeteer-core';import path from 'path';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox']});
const p=await b.newPage();await p.setViewport({width:1100,height:900});
await p.goto('file://'+path.resolve('index.html'),{waitUntil:'networkidle0'});
await p.evaluate(()=>setCount(1));await new Promise(r=>setTimeout(r,400));
await p.screenshot({path:'home2.png'});
await b.close();console.log('saved');
