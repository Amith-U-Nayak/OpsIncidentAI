const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/Dashboard.jsx',
  'src/pages/Incidents.jsx',
  'src/pages/IncidentDetail.jsx',
  'src/pages/NewIncident.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/Runbooks.jsx',
  'src/components/AgentStepper.jsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Color Palette Swaps (Slate to True Black/Zinc)
  content = content.replace(/bg-slate-900/g, 'bg-black');
  content = content.replace(/bg-slate-800/g, 'bg-zinc-950');
  content = content.replace(/border-slate-700/g, 'border-zinc-800');
  content = content.replace(/border-slate-600/g, 'border-zinc-800');
  content = content.replace(/border-slate-800/g, 'border-zinc-900');
  content = content.replace(/text-slate-400/g, 'text-zinc-400');
  content = content.replace(/text-slate-500/g, 'text-zinc-500');
  content = content.replace(/hover:bg-slate-700/g, 'hover:bg-zinc-900');
  
  // 2. Button and Accent Swaps (Indigo to White/Zinc like Vercel)
  content = content.replace(/bg-indigo-600/g, 'bg-white text-black');
  content = content.replace(/hover:bg-indigo-700/g, 'hover:bg-zinc-200');
  content = content.replace(/text-indigo-400/g, 'text-zinc-300');
  content = content.replace(/text-indigo-500/g, 'text-white');
  content = content.replace(/border-indigo-500/g, 'border-white');
  
  // 3. Corner Sharpening
  content = content.replace(/rounded-xl/g, 'rounded-md');
  content = content.replace(/rounded-lg/g, 'rounded-md');
  
  // 4. Strip emojis (Safely removing known emojis used in these files)
  const emojis = ['o"', 'dY",', '+-', 'dYs', 'dY"S', 'z ', 'dY"-', 'dY"', 'dY"', 'dY"-', 's', 'dY" ', 'dY"!', 'dY"a'];
  emojis.forEach(emoji => {
    content = content.split(emoji).join('');
  });

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('UI globally updated!');
