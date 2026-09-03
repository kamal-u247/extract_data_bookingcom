import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('page_dump_scrolled.html', 'utf-8');
const $ = cheerio.load(html);

console.log('=== Checking #hp_facilities_box in scrolled HTML ===');
const box = $('#hp_facilities_box');
console.log('Box innerHTML length:', box.html()?.length);

// Let's print all text inside facility category containers in hp_facilities_box
box.find('div, section').each((i, el) => {
  const testid = $(el).attr('data-testid');
  const cls = $(el).attr('class');
  const text = $(el).text().trim();
  if (testid && testid.includes('facility')) {
    console.log(`Facility testid: ${testid}, text snippet: ${text.slice(0, 100)}`);
  }
});

// Search for all category blocks
console.log('\n=== All headers/titles inside hp_facilities_box ===');
box.find('h3, h4, h5, div[class*="title"], span[class*="title"], div[class*="header"]').each((i, el) => {
  console.log(`Header ${i}: tag=${el.tagName}, text=${$(el).text().trim()}`);
});

// Print full html of property-facilities-block-container or hp_facilities_box
console.log('\n=== Full text inside #hp_facilities_box ===');
console.log(box.text().replace(/\s+/g, ' ').slice(0, 2000));
