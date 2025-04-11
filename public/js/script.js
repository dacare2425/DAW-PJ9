let crud = {
    async register() {
        const nom = document.getElementById("username").value;
        const contrasenya = document.getElementById("password").value;
        
        const res = await fetch('/agregarUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
            },
            body: JSON.stringify({
                nom: nom,
                contrasenya: contrasenya,
            })
        });
        
        const data = await res.json();
        document.getElementById("register-mensaje").innerText = data.mensaje;
    },
    
    async cargarUsuarios() {
        const usuario = localStorage.getItem("usuario");
    
        if (!usuario) {
            alert("No tienes permiso para ver esta información.");
            window.location.href = "index.html";
        }
    
        const res = await fetch("/listarUsuarios", {
            headers: {
                "usuario": usuario 
            }
        });
    
        const data = await res.json();
    
        if (res.ok) {
            const lista = document.getElementById("lista-usuarios");
            lista.innerHTML = "";
            data.usuarios.forEach(user => {
                const li = document.createElement("li");
                li.innerHTML = `${user.nom} - ${user.rol} 
                     <button class="modificar" data-nom="${user.nom}">Modificar</button>
                    <button class="eliminar" data-nom="${user.nom}">Eliminar</button>`;
                lista.appendChild(li);
            });

            const eliminarButtons = document.querySelectorAll('.eliminar');
        eliminarButtons.forEach(button => {
            button.addEventListener('click', () => {
                const nom = button.getAttribute('data-nom');
                crud.eliminarUsuario(nom);
            });
        });

        const modificarButtons = document.querySelectorAll('.modificar');
        modificarButtons.forEach(button => {
            button.addEventListener('click', () => {
                const nom = button.getAttribute('data-nom');
                crud.modificarUsuario(nom);
            });
        });
        
        } else {
            alert(data.mensaje);
        }
    },
    
    async login() {
        const nom = document.getElementById("login-nom").value;
        const contrasenya = document.getElementById("login-contrasenya").value;
        
        const res = await fetch(`/login?nom=${nom}&contrasenya=${contrasenya}`);
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem("usuario", JSON.stringify(data.usuario));
            window.location.href = "index.html";
        } else {
            document.getElementById("login-mensaje").innerText = data.mensaje;
        }
    },
    
    async eliminarUsuario(nom) {
        if (confirm(`¿Estás seguro de que deseas eliminar a ${nom}?`)) {
            const res = await fetch(`/eliminarUsuario?nom=${nom}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.mensaje);
            await crud.cargarUsuarios();
        }
    },
    
    async modificarUsuario(nom) {
        const nuevoNombre = prompt("Nuevo nombre para " + nom, nom);
        if (nuevoNombre && nuevoNombre !== nom) {
            const res = await fetch(`/modificarUsuario?nom=${nom}&nuevoNom=${nuevoNombre}`, { method: 'PUT' });
            const data = await res.json();
            alert(data.mensaje);
            await crud.cargarUsuarios();
        }
    },
}

export { crud };
