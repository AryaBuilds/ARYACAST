const state={lat:28.6139,lon:77.2090,name:"New Delhi, India",data:null,unit:"celsius"};
const $=id=>document.getElementById(id);
const codeMap={
  0:["Clear sky","☀️","sunny"],1:["Mainly clear","🌤️","sunny"],2:["Partly cloudy","⛅","cloudy"],3:["Overcast","☁️","cloudy"],
  45:["Fog","🌫️","cloudy"],48:["Rime fog","🌫️","cloudy"],51:["Light drizzle","🌦️","rain"],53:["Drizzle","🌦️","rain"],55:["Heavy drizzle","🌧️","rain"],
  56:["Freezing drizzle","🌧️","rain"],57:["Freezing drizzle","🌧️","rain"],61:["Light rain","🌦️","rain"],63:["Rain","🌧️","rain"],65:["Heavy rain","🌧️","rain"],
  66:["Freezing rain","🌧️","rain"],67:["Freezing rain","🌧️","rain"],71:["Light snow","🌨️","snow"],73:["Snow","❄️","snow"],75:["Heavy snow","❄️","snow"],
  77:["Snow grains","❄️","snow"],80:["Rain showers","🌦️","rain"],81:["Rain showers","🌧️","rain"],82:["Heavy showers","⛈️","storm"],
  85:["Snow showers","🌨️","snow"],86:["Heavy snow showers","❄️","snow"],95:["Thunderstorm","⛈️","storm"],96:["Thunderstorm + hail","⛈️","storm"],99:["Thunderstorm + hail","⛈️","storm"]
};
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmtTemp(v){return state.unit==="fahrenheit"?Math.round(v*9/5+32):Math.round(v)}
function getWeather(code){return codeMap[code]||["Unknown","🌡️","cloudy"]}
function fmtTime(s){return new Date(s).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}
function fmtDate(s){return new Date(s).toLocaleDateString([], {weekday:"long",day:"numeric",month:"short"})}
async function loadWeather(){
  $("status").textContent="Getting your weather…";
  try{
    const u=new URL("https://api.open-meteo.com/v1/forecast");
    u.searchParams.set("latitude",state.lat);u.searchParams.set("longitude",state.lon);
    u.searchParams.set("current","temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility");
    u.searchParams.set("hourly","temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m");
    u.searchParams.set("daily","weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,precipitation_probability_max");
    u.searchParams.set("forecast_days","7");u.searchParams.set("timezone","auto");
    const r=await fetch(u);if(!r.ok)throw Error("Weather request failed");state.data=await r.json();render();$("status").textContent="Updated just now";
  }catch(e){$("status").textContent="Couldn't load weather. Check your internet and try again."}
}
function render(){
  const d=state.data,c=d.current,info=getWeather(c.weather_code);
  $("locationName").textContent=state.name;$("dateText").textContent=fmtDate(c.time);
  $("condition").textContent=info[0];$("temp").textContent=fmtTemp(c.temperature_2m);
  $("feels").textContent=`Feels like ${fmtTemp(c.apparent_temperature)}°`;
  $("humidity").textContent=`${Math.round(c.relative_humidity_2m)}%`;$("wind").textContent=`${Math.round(c.wind_speed_10m)} km/h`;
  $("uv").textContent=Math.round(d.daily.uv_index_max[0]);
  $("dFeels").textContent=`${fmtTemp(c.apparent_temperature)}°`;$("dHumidity").textContent=`${Math.round(c.relative_humidity_2m)}%`;
  $("dWind").textContent=`${Math.round(c.wind_speed_10m)} km/h`;$("dPressure").textContent=`${Math.round(c.surface_pressure)} hPa`;
  $("dVisibility").textContent=`${Math.round((c.visibility||0)/1000)} km`;$("dUv").textContent=Math.round(d.daily.uv_index_max[0]);
  $("sunrise").textContent=fmtTime(d.daily.sunrise[0]);$("sunset").textContent=fmtTime(d.daily.sunset[0]);
  const sky=$("sky");sky.className="sky "+info[2]+(c.is_day?"":" night");
  $("hourly").innerHTML=hourlyHTML(d);$("hourlyFull").innerHTML=hourlyHTML(d,true);
  $("dailyPreview").innerHTML=dailyHTML(d,false);$("dailyFull").innerHTML=dailyHTML(d,true);
  const alerts=[];if(Math.max(...d.daily.precipitation_probability_max)>=70)alerts.push(["Heavy Rain / Shower","High chance of precipitation in the forecast.","red"]);
  if(Math.max(...d.daily.uv_index_max)>=8)alerts.push(["High UV","UV index is high. Consider shade and sun protection.",""]);
  if(c.temperature_2m>=38)alerts.push(["Heat Alert","Very warm conditions. Stay hydrated.",""]);
  $("alertsList").innerHTML=alerts.length?alerts.map(a=>`<div class="alert ${a[2]}"><h3>⚠️ ${a[0]}</h3><p>${a[1]}</p></div>`).join(""):`<div class="alert"><h3>✅ No major alerts</h3><p>No simple threshold-based alerts detected for this forecast.</p></div>`;
}
function hourlyHTML(d,full=false){
  const now=new Date(d.current.time),start=Math.max(0,d.hourly.time.findIndex(t=>new Date(t)>=now));
  const n=full?24:8;let html="";
  for(let i=start;i<Math.min(start+n,d.hourly.time.length);i++){const [name,icon]=getWeather(d.hourly.weather_code[i]);html+=`<div class="hour ${i===start?"current":""}"><small>${fmtTime(d.hourly.time[i])}</small><div class="icon">${icon}</div><b>${fmtTemp(d.hourly.temperature_2m[i])}°</b><small>${d.hourly.precipitation_probability[i]||0}% rain</small></div>`}
  return html;
}
function dailyHTML(d,full=true){
  let h="";for(let i=0;i<7;i++){const [name,icon]=getWeather(d.daily.weather_code[i]);h+=`<div class="day-row"><div><b>${new Date(d.daily.time[i]).toLocaleDateString([], {weekday:"short"})}</b><small>${i===0?"Today":new Date(d.daily.time[i]).toLocaleDateString([], {day:"numeric",month:"short"})} • ${name}</small></div><div class="weather-icon">${icon}</div><b>${fmtTemp(d.daily.temperature_2m_max[i])}° / ${fmtTemp(d.daily.temperature_2m_min[i])}°</b></div>`}return h;
}
async function searchCity(q){
  $("searchResults").innerHTML="Searching…";
  try{const u=new URL("https://geocoding-api.open-meteo.com/v1/search");u.searchParams.set("name",q);u.searchParams.set("count","6");u.searchParams.set("language","en");u.searchParams.set("format","json");
    const r=await fetch(u);const j=await r.json();if(!j.results?.length){$("searchResults").innerHTML="No locations found.";return}
    $("searchResults").innerHTML=j.results.map((x,i)=>`<div class="result" data-i="${i}"><b>${esc(x.name)}</b><small>${esc([x.admin1,x.country].filter(Boolean).join(", "))}</small></div>`).join("");
    [...document.querySelectorAll(".result")].forEach(el=>el.onclick=()=>{const x=j.results[+el.dataset.i];state.lat=x.latitude;state.lon=x.longitude;state.name=[x.name,x.country].filter(Boolean).join(", ");localStorage.setItem("dw-location",JSON.stringify(state));$("searchModal").classList.add("hidden");loadWeather()});
  }catch(e){$("searchResults").textContent="Search failed. Try again."}
}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));window.scrollTo({top:0,behavior:"smooth"})}
document.addEventListener("click",e=>{const p=e.target.closest("[data-page]");if(p)showPage(p.dataset.page)});
$("searchBtn").onclick=()=>{$("searchModal").classList.remove("hidden");$("cityInput").focus()};
$("closeSearch").onclick=()=>$("searchModal").classList.add("hidden");
$("citySearch").onclick=()=>searchCity($("cityInput").value.trim());
$("cityInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchCity(e.target.value.trim())});
$("locateBtn").onclick=()=>navigator.geolocation?.getCurrentPosition(pos=>{state.lat=pos.coords.latitude;state.lon=pos.coords.longitude;state.name="Current location";loadWeather()},()=>alert("Location permission was not granted."));
$("unit").onchange=e=>{state.unit=e.target.value;if(state.data)render()};
$("clearLocation").onclick=()=>{localStorage.removeItem("dw-location");alert("Saved location cleared.")};
$("menuBtn").onclick=()=>showPage("settings");
try{const saved=JSON.parse(localStorage.getItem("dw-location"));if(saved){state.lat=saved.lat;state.lon=saved.lon;state.name=saved.name}}catch{}
loadWeather();
