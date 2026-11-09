function applyTheme(mode){
    document.body.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme", mode);

    const btn = document.getElementById("themeBtn");
    if(btn){
        btn.innerText = mode === "dark" ? "☀️ Light" : "🌙 Dark";
    }
}

function toggleTheme(){
    const current = localStorage.getItem("theme") || "light";
    const next = current === "light" ? "dark" : "light";

    animateTheme(next);
    applyTheme(next);
}

function animateTheme(mode){
    let box = document.getElementById("themeAnim");

    if(!box){
        box = document.createElement("div");
        box.id = "themeAnim";
        document.body.appendChild(box);
    }

    const el = document.createElement("div");
    el.className = mode === "dark" ? "moon" : "sun";
    box.appendChild(el);

    setTimeout(()=>el.remove(),1500);
}

document.addEventListener("DOMContentLoaded", ()=>{
    if(!document.getElementById("themeBtn")){
        const btn = document.createElement("button");
        btn.id = "themeBtn";
        btn.className = "theme-toggle";
        btn.onclick = toggleTheme;
        document.body.appendChild(btn);
    }

    applyTheme(localStorage.getItem("theme") || "light");
});