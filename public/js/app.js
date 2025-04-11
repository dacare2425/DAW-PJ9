import { canvas, frontend } from "./home.js";  
import { Fetch, checkboxManager } from "./urlfiltro.js";
import { crud } from "./script.js";
import { Quiz } from "./quiz.js";

window.onload = function() {
    frontend.mostrarBoton();

    if (window.location.pathname.includes("index.html") || window.location.pathname.includes("urlFiltro.html") || window.location.pathname === '/') {
    canvas.iniciar();
    }


    const logout = document.getElementById('logout');
    if (logout) {
        logout.addEventListener('click', frontend.logout);
    }
    if (window.location.pathname.includes("urlFiltro.html")){
        checkboxManager.mostrar();
        checkboxManager.cambio();
    
        const url = new URL(window.location.href);
        const parametros = new URLSearchParams(url.search);
        const pais = parametros.get('pais');
    
        if (pais) {
            document.getElementById('paisSelect').value = pais;
            Fetch.cargarInformacionPais(pais);
        } else {
            Fetch.actualizarInformacion();
        }
    
        document.getElementById('paisSelect').addEventListener('change', Fetch.actualizarInformacion);
        
    }

    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (window.location.pathname.includes("admin.html")){
        if (usuario && usuario.rol === "admin") {
            crud.cargarUsuarios();
        } else {
            alert("No tienes acceso a esta página.");
            window.location.href = "index.html";
        }
    }

    let login = document.getElementById('login');
    if (login) {
        login.addEventListener('click', crud.login);
    }

    let register = document.getElementById('register');
if (register) {
    register.addEventListener('click', (event) => {
        event.preventDefault(); 
        crud.register();
    });
}

if (window.location.pathname.includes("quiz.html")) {
    Quiz.loadQuiz();
}
}