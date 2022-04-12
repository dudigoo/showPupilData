var gpar={};

function doGet() {
  Logger.log('in get');
  return HtmlService.createTemplateFromFile('Index').evaluate();
}

function processForm(formObject){  

  var result = "";
  if(formObject.searchtext){//Execute if form passes search text
      result = search(formObject.searchtext);
  }
  return result;
}

function getAlfonNames() {
  aprj.collectParams();
  let ar = aprj.getAlfonKids('just_name');
  //let alfon_sh = aprj.getAlfonSS().getSheetByName('pupils');
  //let ar = alfon_sh.getRange(2,2,20,1).getValues();
  //let ar = alfon_sh.getRange(2,2,alfon_sh.getLastRow()-2,1).getValues();
  return(ar.flat());
}
 
function getGroupPupils(str){
  let group=str.match(/\d/);
  //Logger.log('group='+group );
  if (group == null){//not a group search
    return;
  }
  group=group[0];
  let query;
  let lvl=str.match(/\D+/)[0];
  if (['ח','ז','ט','י','יא','יב'].includes(lvl)){
    query = 'select B where (A = "'+lvl + '" and D = '+group+')';
  } else {
    query = 'select B where (H = "'+lvl + '")';
  }

  let vals = fetchPupils(query);

  let rval=vals.join(',');
  //Logger.log('rval='+rval );
  return rval; 
}

function fetchPupils(query){
  var sheetId = SpreadsheetApp.openById(alfon_file_id).getSheetByName('pupils').getSheetId();
  var url = "https://docs.google.com/spreadsheets/d/" + alfon_file_id + "/gviz/tq?gid=" + sheetId + "&tqx=out:csv&tq=" + encodeURIComponent(query);
  //Logger.log('query='+query );
  var res = UrlFetchApp.fetch(url, {headers: {Authorization: "Bearer " + ScriptApp.getOAuthToken()}});
  //Logger.log('res='+res );
  let vals;
  try {
    vals = Utilities.parseCsv(res.getContentText());
  } catch(er){
    Logger.log('er='+er);
    vals=[[]];
  }
  //Logger.log('vals='+vals );
  vals.shift();
  return vals;
}

//SEARCH FOR MATCHED CONTENTS 
function search(searchtext){
  aprj.collectParams();
  Logger.log('in search 4 '+searchtext);
  let gnms=getGroupPupils(searchtext);
  if (gnms){
    //Logger.log('group search ');
    searchtext=gnms;
  }
  gpar.pupilNm = searchtext.split(',').join('|');
  gpar.pupilRe = new RegExp(gpar.pupilNm);
  let ar=[]; let sh; let dat; let ar2;


  sh=aprj.getMaakavSS().getSheetByName('allQuiz');
  dat = sh.getRange(2,1,sh.getLastRow(),5).getDisplayValues();
  //Logger.log('nm='+gpar.pupilNm );
  ar2 = dat.filter(filterKid);
  if (ar2.length){
    ar2.forEach(el => el[1]=el[1].replace(/^(\d+)\/(\d+)\/(\d+)\s/,'$3-$2-$1 '));
    ar2.forEach(el => el[4]= el[4] ? '<a href="'+el[4]+'">view</a>' : '');
    //ar2.forEach(el => Logger.log('dt='+el[1]));
    ar.push(['!head', 'quiz']);
    ar=ar.concat(ar2);    
  }

  sh = aprj.getMaakavSS().getSheetByName('all');
  dat = sh.getRange(2,1,sh.getLastRow(),13).getDisplayValues();
  //Logger.log('all len='+dat.length); 
  ar2 = dat.filter(filterKidMaakav);
  if (ar2.length){
    //Logger.log('ar2[0][8]='+ar2[0][8]+' len='+ar2.length); 
    ar2.forEach(el => el.splice(8,2));

    ar.push(['!head','treport']);
    ar=ar.concat(ar2);
  }
  
  sh = aprj.getMaakavSS().getSheetByName('schoolGrades');
  dat = sh.getRange(2,1,sh.getLastRow(),4).getDisplayValues();
  //Logger.log('all len='+dat.length); 
  ar2 = dat.filter(filterKid);
  if (ar2.length){
    ar.push(['!head','schoolGrades']);
    ar=ar.concat(ar2);
  }   

  sh = aprj.getMaakavSS().getSheetByName('mipuiOldKids4/21');
  dat = sh.getRange(2,3,sh.getLastRow(),18).getDisplayValues();
  //Logger.log('all len='+dat.length); 
  ar2 = dat.filter(filterKid);
  if (ar2.length){
    ar.push(['!head','mipold']);
    ar=ar.concat(ar2);
  }  

  sh = aprj.getMaakavSS().getSheetByName('mipuiNewKids21');
  dat = sh.getRange(2,3,sh.getLastRow(),12).getDisplayValues();
  //Logger.log('all len='+dat.length); 
  ar2 = dat.filter(filterKid);
  if (ar2.length){
    ar.push(['!head','mipnew']);
    ar=ar.concat(ar2);
  }  

  //Logger.log('rows returned='+ar.length );
  //Logger.log('ar='+JSON.stringify(ar) );
  return ar;
}

function filterKidMaakav(elem) {
  if (elem[5].match(gpar.pupilRe)) {
    return 1;
  }
  return 0;
}

function filterKid(elem) {
  if (elem[0].match(gpar.pupilRe)) {
    return 1;
  }
  return 0;
}