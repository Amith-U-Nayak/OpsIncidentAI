const fs = require('fs');
const path = require('path');

// 1. UPDATE INDEX.HTML (Add Inter Font)
let htmlPath = 'index.html';
let htmlCode = fs.readFileSync(htmlPath, 'utf8');
if (!htmlCode.includes('fonts.googleapis.com')) {
  htmlCode = htmlCode.replace('<head>', `<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`);
  fs.writeFileSync(htmlPath, htmlCode);
}

// 2. UPDATE TAILWIND CONFIG (Set Inter)
let twPath = 'tailwind.config.js';
let twCode = fs.readFileSync(twPath, 'utf8');
if (!twCode.includes('Inter')) {
  twCode = twCode.replace('theme: {', `theme: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
    },`);
  fs.writeFileSync(twPath, twCode);
}

// 3. MASS REPLACE COLORS & ROUNDING IN JSX
const walk = dir => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
};

const files = walk('src');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // Replace slates with blacks/zincs
  c = c.replace(/slate-900/g, 'black');
  c = c.replace(/slate-800/g, 'zinc-950'); // Darkest gray for cards
  c = c.replace(/slate-700/g, 'zinc-900'); // Borders
  c = c.replace(/slate-600/g, 'zinc-800');
  c = c.replace(/slate-500/g, 'zinc-500');
  c = c.replace(/slate-400/g, 'zinc-400');
  
  // Sharpen corners
  c = c.replace(/rounded-xl/g, 'rounded-md');
  c = c.replace(/rounded-lg/g, 'rounded-md');
  
  // Remove emojis globally from raw strings where known
  c = c.replace(/s /g, '');
  c = c.replace(/dY"S /g, '');
  c = c.replace(/dYs" /g, '');
  c = c.replace(/z  /g, '');
  c = c.replace(/dY"- /g, '');
  c = c.replace(/dYs /g, '');
  c = c.replace(/o" /g, '');
  
  fs.writeFileSync(f, c);
});

console.log('Font added and UI color/rounding mass-replaced.');
