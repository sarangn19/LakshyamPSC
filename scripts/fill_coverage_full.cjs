const S='https://cycutcqlhpeudmaebwmb.supabase.co';
const K=require('fs').readFileSync('.env','utf-8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const H={'Content-Type':'application/json','Authorization':'Bearer '+K};

const store=async(s,t,d,qt,op,ca,ex)=>{
  const r=await fetch(S+'/functions/v1/store-mcq-batch',{method:'POST',headers:H,body:JSON.stringify({questions:[{
    questionText:qt,options:op,correctAnswer:ca,subject:s,topic:t,difficulty:d,examType:'LDC',
    language:'en',explanation:ex||'',sourceType:'ai_generated',tags:[s,t,d],
  }]})});
  const x=await r.json();
  return x.stored>0;
};

const pools={
  'Renaissance/Major Agitations & Structural Protests/easy':[
    ['Which protest against the Malayali Memorial is considered a landmark in Kerala history?',['Malayali Memorial (1891)','Ezhava Memorial (1896)','Paliyam Satyagraha','Vaikom Satyagraha'],1,'The Ezhava Memorial of 1896 was presented to Sree Moolam Thirunal by Ezhava leaders.'],
    ['The Malayali Memorial of 1891 was submitted to which Maharaja?',['Sree Moolam Thirunal','Sree Chithira Thirunal','Sree Swathi Thirunal','Sree Uthram Thirunal'],0,'The Malayali Memorial was submitted to Sree Moolam Thirunal in 1891.'],
  ],
  'Constitution/State Executive & Legislature/easy':[
    ['Who appoints the Chief Minister of a state?',['Governor','Chief Justice of High Court','President','Leader of the Legislative Party'],0,'The Governor appoints the Chief Minister under Article 164.'],
    ['What is the maximum strength of the Legislative Assembly?',['500','250','404','550'],0,'Article 170 provides for not more than 500 and not less than 60 members.'],
    ['The Governor holds office during the pleasure of whom?',['President','Chief Minister','Chief Justice','Prime Minister'],0,'The Governor holds office during the pleasure of the President under Article 156.'],
  ],
  'Constitution/Directive Principles & Fundamental Duties/easy':[
    ['Directive Principles of State Policy are borrowed from which constitution?',['Ireland','USA','UK','Australia'],0,'The Directive Principles were inspired by the Irish Constitution.'],
    ['Which part deals with Fundamental Duties?',['Part IV-A','Part III','Part IV','Part II'],0,'Fundamental Duties were added by the 42nd Amendment as Part IV-A.'],
  ],
  'Constitution/Judiciary/easy':[
    ['The Supreme Court of India was established in which year?',['1950','1947','1949','1952'],0,'The Supreme Court was established on 28 January 1950.'],
    ['Who appoints Supreme Court judges?',['President','Prime Minister','Chief Justice','Law Minister'],0,'The President appoints Supreme Court judges under Article 124.'],
  ],
  'Constitution/Union Legislature/easy':[
    ['The Rajya Sabha is also known as which house?',['Council of States','House of the People','Legislative Assembly','Upper House'],0,'Rajya Sabha is the Council of States.'],
    ['What is the maximum strength of Lok Sabha?',['552','545','550','543'],0,'The maximum strength of Lok Sabha is 552.'],
  ],
  'Quantitative Aptitude/Algebra & Progressions/easy':[
    ['If x + y = 10 and x - y = 4, find x.',['7','6','5','8'],0,'Adding: 2x = 14, so x = 7.'],
    ['Sum of first 10 natural numbers?',['55','45','50','60'],0,'Sum = n(n+1)/2 = 10*11/2 = 55.'],
    ['nth term of AP: 2,5,8,11,...',['3n-1','3n+1','2n+1','2n-1'],0,'d=3, nth term = 2+(n-1)3 = 3n-1.'],
    ['What is 25% of 200?',['50','25','75','100'],0,'25% of 200 = (25/100)*200 = 50.'],
  ],
  'Science/Biology \u2014 Biochemistry, Nutrition & Diseases/easy':[
    ['Which vitamin is produced when skin is exposed to sunlight?',['Vitamin D','Vitamin A','Vitamin C','Vitamin B'],0,'Sunlight triggers Vitamin D synthesis.'],
    ['Which mineral is essential for hemoglobin formation?',['Iron','Calcium','Potassium','Zinc'],0,'Iron is a crucial component of hemoglobin.'],
    ['Kwashiorkor is caused by deficiency of which nutrient?',['Protein','Carbohydrates','Fats','Vitamins'],0,'Kwashiorkor results from severe protein deficiency.'],
  ],
  'Geography/General/hard':[
    ['Tropic of Cancer passes through how many Indian states?',['8','7','6','5'],0,'Passes through 8 states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, WB, Tripura, Mizoram.'],
    ['Largest delta in the world?',['Sunderbans','Amazon','Nile','Ganges-Brahmaputra'],0,'Sunderbans Delta is the largest.'],
    ['Westerly Jet Stream is also known as?',['Subtropical Westerly Jet Stream','Polar Jet Stream','Tropical Jet Stream','Equatorial Jet Stream'],0,'Flows at 27-30N in the upper troposphere.'],
  ],
  'Geography/Geographical Features/medium':[
    ['Himalayas formed by collision of which plates?',['Indo-Australian and Eurasian','Pacific and North American','African and Eurasian','South American and Nazca'],0,'Collision of Indo-Australian and Eurasian plates.'],
    ['Highest peak in the Western Ghats?',['Anamudi','Dodabetta','Mullayanagiri','Meesapulimala'],0,'Anamudi (2695m) in Kerala.'],
    ['Deccan Plateau composed mainly of which rock?',['Basalt','Granite','Sandstone','Limestone'],0,'Deccan Plateau is primarily basalt.'],
  ],
  'Quantitative Aptitude/Data Interpretation/medium':[
    ['Average of 5 numbers is 12, what is sum?',['60','50','65','55'],0,'Sum = Avg * Count = 12 * 5 = 60.'],
    ['20 items at Rs 50 each. Total revenue?',['Rs 1000','Rs 500','Rs 2000','Rs 1500'],0,'Total = 20 * 50 = Rs 1000.'],
    ['Mean of 10,15,20,x,25 is 18, find x.',['20','18','22','16'],0,'(70+x)/5=18, so 70+x=90, x=20.'],
  ],
  'Quantitative Aptitude/Mensuration/easy':[
    ['Area of rectangle 10cm x 5cm?',['50 sq cm','30 sq cm','15 sq cm','40 sq cm'],0,'Area = 10*5 = 50 sq cm.'],
    ['Circumference of circle r=7cm? (pi=22/7)',['44 cm','22 cm','14 cm','28 cm'],0,'C = 2*(22/7)*7 = 44 cm.'],
    ['Volume of cube side 4cm?',['64 cu cm','16 cu cm','32 cu cm','24 cu cm'],0,'V = 4^3 = 64 cu cm.'],
  ],
  'General Science/General/hard':[
    ['Chemical formula of Ozone?',['O3','O2','O','CO2'],0,'Ozone is a triatomic molecule (O3).'],
    ['Energy cannot be created or destroyed is which law?',['First Law of Thermodynamics','Second Law of Thermodynamics','Newtons First Law','Conservation of Mass'],0,'First Law of Thermodynamics states energy conservation.'],
  ],
  'Science/Biology \u2014 Plant Physiology & Ecology/easy':[
    ['Process by which plants convert sunlight to energy?',['Photosynthesis','Respiration','Transpiration','Fermentation'],0,'Photosynthesis converts light energy to chemical energy.'],
    ['Green pigment in plants?',['Chlorophyll','Carotene','Xanthophyll','Anthocyanin'],0,'Chlorophyll is the green pigment for photosynthesis.'],
  ],
  'Science/Environmental Science & Waste Management/easy':[
    ['What does biodegradable mean?',['Decomposed by microorganisms','Cannot be decomposed','Can be recycled','Can be reused'],0,'Biodegradable materials are broken down by microorganisms.'],
    ['Primary greenhouse gas?',['Carbon dioxide','Oxygen','Nitrogen','Hydrogen'],0,'CO2 is the primary greenhouse gas from human activities.'],
  ],
  'Geography/Geophysical Phenomena/easy':[
    ['Tectonic plate movement is driven by?',['Convection currents in mantle','Gravitational pull of moon','Earth magnetic field','Solar radiation'],0,'Convection currents in the mantle drive plate movement.'],
    ['Scale to measure earthquake magnitude?',['Richter Scale','Mercalli Scale','Beaufort Scale','Decibel Scale'],0,'Richter Scale measures earthquake magnitude.'],
  ],
  'Geography/Indian River Systems/easy':[
    ['Longest river in India?',['Ganges','Brahmaputra','Yamuna','Godavari'],0,'Ganges (2525 km) is the longest river in India.'],
    ['River Narmada flows into which water body?',['Arabian Sea','Bay of Bengal','Indian Ocean','Gulf of Khambhat'],0,'Narmada flows westward into the Arabian Sea.'],
  ],
  'Mental Ability/Clock, Calendar & Miscellaneous/easy':[
    ['If today is Monday, day after 50 days?',['Tuesday','Wednesday','Sunday','Monday'],0,'50=7*7+1, so 1 day after Monday = Tuesday.'],
    ['Time 3:15, angle between hour and minute hand?',['7.5 degrees','0 degrees','15 degrees','30 degrees'],0,'At 3:15, hour=97.5 deg, minute=90 deg, diff=7.5 deg.'],
    ['Days in a leap year?',['366','365','364','360'],0,'Leap year has 366 days.'],
    ['Next leap year after 2024?',['2028','2025','2026','2027'],0,'Leap years every 4 years. 2028 is next after 2024.'],
  ],
};

(async()=>{
let total=0,fail=0;
for(const[key,questions]of Object.entries(pools)){
  const[s,t,d]=key.split('/');
  for(const[q,o,c,e]of questions){
    process.stdout.write(key.substring(0,40)+'... ');
    const ok = await store(s,t,d,q,o,c,e);
    console.log(ok?'OK':'FAIL');
    if(ok) total++; else fail++;
    await new Promise(r=>setTimeout(r,200));
  }
}
console.log('\nTotal stored: '+total+' Failed: '+fail);

const r=await fetch(S+'/functions/v1/repository-analytics');
const a=await r.json();
console.log('Total questions now: '+a.overview?.totalQuestions);
})()
