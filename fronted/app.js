// frontend/app.js - VERSIÓN MAESTRA FINAL 2.0

const API_AUTH = 'http://localhost:3000';
const API_ACADEMIC = 'http://localhost:3001';
let idUsuarioEditando = null;
let idTrabajadorEditando = null;
let alumnosSeccionActual = []; // Aquí guardaremos los datos para filtrarlos

// =======================================================
// 1. SISTEMA DE AUTENTICACIÓN (LOGIN)
// =======================================================

document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            mostrarDashboard();
        } else {
            document.getElementById('login-error').innerText = data.error;
        }
    } catch (error) {
        document.getElementById('login-error').innerText = "Error de conexión con el servidor";
    }
});

function logout() {
    localStorage.removeItem('token');
    location.reload();
}

// =======================================================
// 2. DASHBOARD Y NAVEGACIÓN (SIDEBAR)
// =======================================================

// 2. DASHBOARD Y NAVEGACIÓN
function mostrarDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        logout();
        return;
    }

    // 1. Mostrar pantalla principal
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard-screen').classList.remove('oculto'); 

    // 2. Decodificar Token con seguridad
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        var user = JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error leyendo token:", e);
        logout();
        return;
    }

    const nombresRoles = { 1: "Administrador", 2: "Secretaría", 3: "Docente", 4: "Apoderado" };
    
    // 3. Info de Usuario
    document.getElementById('user-info').innerHTML = `
        <div class="fw-bold text-white">${user.email.split('@')[0]}</div>
        <span class="badge bg-light text-dark mt-1">${nombresRoles[user.rol_id] || 'Usuario'}</span>
    `;

    // 4. Menú Lateral
    const menu = document.getElementById('sidebar-menu');
    // IMPORTANTE: Cambiamos location.reload() por mostrarInicio() para no recargar la página
    menu.innerHTML = `<a onclick="mostrarInicio()" class="nav-link-custom" style="cursor:pointer"><i class="bi bi-house-door-fill"></i> Inicio</a>`;

    const rol = user.rol_id;

    // ---> ESTA ES LA PARTE QUE TE FALTABA <---
    if (rol === 1) { // Admin
        menu.innerHTML += sidebarItemHtml('Gestión de Trabajadores', 'bi-briefcase-fill');
        menu.innerHTML += sidebarItemHtml('Gestión de Usuarios', 'bi-people-fill');
        menu.innerHTML += sidebarItemHtml('Gestión de Apoderados', 'bi-person-hearts');
        menu.innerHTML += sidebarItemHtml('Ver Estudiantes', 'bi-mortarboard-fill');
        menu.innerHTML += sidebarItemHtml('Gestión de Cursos', 'bi-book-half');
        menu.innerHTML += sidebarItemHtml('Asignar Horarios', 'bi-calendar-plus');
        menu.innerHTML += sidebarItemHtml('Gestión de Matrículas', 'bi-file-earmark-text-fill');
        menu.innerHTML += sidebarItemHtml('Reportes y Estadísticas', 'bi-bar-chart-fill');
    }

else if (rol === 2) { // SECRETARÍA (Operativo)
        // 1. Matrículas: Su herramienta principal
        menu.innerHTML += sidebarItemHtml('Gestión de Matrículas', 'bi-file-earmark-text-fill');
        
        // 2. Gestión de personas (Padres y Alumnos)
        menu.innerHTML += sidebarItemHtml('Ver Estudiantes', 'bi-person-badge');
        menu.innerHTML += sidebarItemHtml('Gestión de Apoderados', 'bi-people');

        // 3. Consultas (Solo ver)
        // Podemos reutilizar las vistas de Admin, pero idealmente quitaríamos los botones de "Editar" 
        // Si usas los mismos módulos, tendrá poder de edición. Para secretaría suele estar bien que editen.
        menu.innerHTML += sidebarItemHtml('Gestión de Cursos', 'bi-journal-bookmark'); 
        
        // Nota: NO le damos "Asignar Horarios" ni "Gestión de Usuarios" ni "Trabajadores".
    }
    
    else if (rol === 3) { // Docente
        // Debe llamar a cargarHorarioDocente() al hacer clic
        menu.innerHTML += `<a onclick="cargarHorarioDocente()" class="nav-link-custom" style="cursor:pointer"><i class="bi bi-calendar-week"></i> Mi Horario</a>`;
       menu.innerHTML += `<a onclick="cargarMisEstudiantesDocente()" class="nav-link-custom" style="cursor:pointer"><i class="bi bi-list-check"></i> Mis Estudiantes</a>`;
    }

    else if (rol === 4) { // Padre
        menu.innerHTML += `<a onclick="cargarMisHijos()" class="nav-link-custom" style="cursor:pointer"><i class="bi bi-people-fill"></i> Mis Hijos</a>`;
        menu.innerHTML += sidebarItemHtml(' Pre-Inscripción', 'bi-pencil-square');
    }
    // ---> FIN DE LA PARTE QUE FALTABA <---

    // 5. Banner de Bienvenida
    const banner = document.getElementById('welcome-banner');
    let bannerClass = 'bg-primary';
    let tituloBanner = 'Bienvenido al Sistema';
    let descBanner = 'Selecciona una opción del menú para comenzar.';

    if(rol === 1) { bannerClass = 'hero-admin'; tituloBanner = 'Panel de Administración'; descBanner = 'Control total del sistema escolar.'; }
    if(rol === 2) { bannerClass = 'hero-secre'; tituloBanner = 'Oficina Virtual'; descBanner = 'Gestión de matrículas y documentación.'; }
    if(rol === 3) { bannerClass = 'hero-docente'; tituloBanner = 'Portal Docente'; descBanner = 'Gestión de clases y asistencia.'; }
    if(rol === 4) { bannerClass = 'hero-padre'; tituloBanner = 'Portal Familiar'; descBanner = 'Seguimiento académico de sus hijos.'; }

    banner.innerHTML = `
        <div class="${bannerClass} p-4 rounded-3 text-white shadow d-flex align-items-center">
            <div class="me-4"><i class="bi bi-stars" style="font-size: 2.5rem;"></i></div>
            <div><h2 class="fw-bold mb-0">${tituloBanner}</h2><p class="mb-0 opacity-75">${descBanner}</p></div>
        </div>
    `;

    // 6. Cargar la pantalla de inicio
    mostrarInicio();
}
// =======================================================
// 3. ROUTER CENTRAL (AQUÍ ESTÁN TODOS LOS BOTONES)
// =======================================================

async function accionClick(titulo) {
    const area = document.getElementById('area-trabajo');
    
    if (titulo === 'Gestión de Usuarios') {
        cargarUsuarios(area);
    } 
    else if (titulo === 'Gestión de Apoderados') {
        cargarApoderados(area);
    }
    else if (titulo === 'Ver Estudiantes' || titulo === 'Mis Estudiantes' || titulo === '🎓 Buscar Estudiante') {
        cargarEstudiantes(); 
    } 
    else if (titulo === 'Gestión de Cursos') {
        cargarCursos(area);
    }
    else if (titulo === 'Asignar Horarios') {
        mostrarFormAsignarHorario(area);
    }
    else if (titulo === 'Mis Horarios') {
        cargarHorarioDocente(area);
    }
    else if (titulo === 'Gestión de Matrículas' || titulo === 'Nueva Matrícula') {
        cargarMatriculas(area);
    }
    else if (titulo === 'Reportes y Estadísticas') {
        cargarReportes(area);
    }
    else if (titulo === 'Gestión de Trabajadores') {
        cargarTrabajadores(area);
    }
    else if (titulo === 'Pre-Inscripción') {
        area.innerHTML = '<div class="alert alert-info">Formulario de pre-inscripción en construcción.</div>';
    }
    else if (titulo === 'Mis Hijos') {
        area.innerHTML = '<div class="alert alert-info">Vista de hijos en construcción.</div>';
    }
    else {
        area.innerHTML = `<div class="alert alert-info">Sección: <strong>${titulo}</strong> en construcción.</div>`;
    }
}

// =======================================================
// 4. MÓDULO: GESTIÓN DE USUARIOS (CRUD ADMIN)
// =======================================================

async function cargarUsuarios(area) {
    area.innerHTML = '<p>Cargando usuarios...</p>';
    try {
        const res = await fetch(`${API_AUTH}/usuarios`); 
        const usuarios = await res.json();

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3>Gestión de Usuarios</h3>
                <button class="btn btn-primary" onclick="idUsuarioEditando=null; mostrarFormularioCrear()">+ Nuevo Usuario</button>
            </div>
            <table class="table table-hover table-bordered shadow-sm bg-white">
                <thead class="table-dark"><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
                <tbody>
        `;
        usuarios.forEach(u => {
            html += `<tr>
                <td>${u.nombre_completo}</td><td>${u.email}</td><td><span class="badge bg-secondary">${u.rol}</span></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="cargarDatosEdicion(${u.id}, '${u.nombre_completo}', '${u.email}', '${u.rol}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id})">Eliminar</button>
                </td>
            </tr>`;
        });
        area.innerHTML = html + '</tbody></table>';
    } catch (e) { area.innerHTML = '<div class="alert alert-danger">Error cargando usuarios</div>'; }
}

async function mostrarFormularioCrear() {
    const area = document.getElementById('area-trabajo');
    // Cambiamos el título según el estado
    const titulo = idUsuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario de Sistema';

    area.innerHTML = `
        <h3 id="form-titulo">${titulo}</h3>
        <div class="card p-4 shadow-sm" style="max-width: 600px">
            
            <div id="sec-vincular" class="alert alert-secondary mb-3">
                <label class="fw-bold mb-2"><i class="bi bi-search"></i> Vincular con persona existente:</label>
                <div class="input-group">
                    <input type="text" id="busqueda-persona" class="form-control" placeholder="Escribe DNI o Nombre...">
                    <button class="btn btn-dark" type="button" onclick="buscarPersonaParaVincular()">Buscar</button>
                </div>
                <div id="resultado-busqueda" class="mt-2 text-muted small"></div>
            </div>
            <hr>

            <form onsubmit="guardarUsuario(event)">
                <div class="mb-3">
                    <label>Nombre Completo</label>
                    <input type="text" id="new-nombre" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label>Email (Login)</label>
                    <input type="email" id="new-email" class="form-control" required readonly>
                </div>
                
                <div class="mb-3" id="div-pass">
                    <label>Contraseña</label>
                    <input type="password" id="new-pass" class="form-control" required>
                </div>
                
                <div class="mb-3">
                    <label>Rol de Acceso</label>
                    <select id="new-rol" class="form-select">
                        <option value="1">Administrador</option>
                        <option value="2">Secretaría</option>
                        <option value="3">Docente</option>
                        <option value="4">Apoderado</option>
                    </select>
                </div>
                
                <button type="submit" class="btn btn-success w-100">Guardar Cambios</button>
                <button type="button" class="btn btn-secondary w-100 mt-2" onclick="accionClick('👥 Gestión de Usuarios')">Cancelar</button>
            </form>
        </div>
    `;

    // --- LÓGICA DE MODO EDICIÓN ---
    if(idUsuarioEditando) {
        // 1. Ocultar campo de contraseña (ya lo tenías)
        document.getElementById('div-pass').style.display = 'none';
        document.getElementById('new-pass').removeAttribute('required');
        
        // 2. Permitir editar email (ya lo tenías)
        document.getElementById('new-email').removeAttribute('readonly'); 

        // 3. NUEVO: OCULTAR EL BUSCADOR DE PERSONAS
        document.getElementById('sec-vincular').style.display = 'none';

        // 4. NUEVO: BLOQUEAR LA EDICIÓN DEL NOMBRE
        const inputNombre = document.getElementById('new-nombre');
        inputNombre.readOnly = true;
        inputNombre.style.backgroundColor = "#e9ecef"; // Color gris de "bloqueado"
    }
}
// --- FUNCIÓN INTELIGENTE: BUSCAR PERSONAS SIN USUARIO ---
async function buscarPersonaParaVincular() {
    const termino = document.getElementById('busqueda-persona').value;
    const resultadoDiv = document.getElementById('resultado-busqueda');
    
    if(termino.length < 3) return alert('Escribe al menos 3 letras o números');

    resultadoDiv.innerHTML = '<span class="text-muted"><span class="spinner-border spinner-border-sm"></span> Verificando disponibilidad...</span>';

    try {
        const resPersonas = await fetch(`${API_ACADEMIC}/personas/buscar/${termino}`);
        const personasEncontradas = await resPersonas.json();

        const resUsuarios = await fetch(`${API_AUTH}/usuarios`);
        const usuariosExistentes = await resUsuarios.json();
        
        const emailsOcupados = usuariosExistentes.map(u => u.email);
        const disponibles = personasEncontradas.filter(p => !emailsOcupados.includes(p.email));

        if (disponibles.length === 0) {
            if (personasEncontradas.length > 0) {
                resultadoDiv.innerHTML = '<div class="alert alert-warning py-1 small mb-0"><i class="bi bi-exclamation-triangle"></i> Las personas encontradas ya tienen un usuario creado.</div>';
            } else {
                resultadoDiv.innerHTML = '<span class="text-danger">No se encontraron personas con esos datos.</span>';
            }
            return;
        }

        if (disponibles.length === 1) {
            rellenarUsuario(disponibles[0]);
            resultadoDiv.innerHTML = '<span class="text-success fw-bold"><i class="bi bi-check-circle"></i> ¡Persona disponible encontrada y vinculada!</span>';
        } else {
            let html = '<p class="mb-1 text-primary small">Resultados disponibles (Sin usuario):</p><div class="list-group">';
            disponibles.forEach((p) => {
                const dataStr = encodeURIComponent(JSON.stringify(p));
                html += `<button type="button" class="list-group-item list-group-item-action py-2 small border-start border-4 border-success" onclick="seleccionarPersona('${dataStr}')"><div class="d-flex justify-content-between align-items-center"><div><strong>${p.nombres} ${p.apellidos}</strong><br><span class="text-muted" style="font-size:0.85em">DNI: ${p.dni} | ${p.email}</span></div><span class="badge bg-secondary">${p.rol_sugerido}</span></div></button>`;
            });
            html += '</div>';
            resultadoDiv.innerHTML = html;
        }
    } catch (e) { resultadoDiv.innerHTML = '<span class="text-danger">Error técnico en la búsqueda.</span>'; }
}

function seleccionarPersona(dataStr) {
    const p = JSON.parse(decodeURIComponent(dataStr));
    rellenarUsuario(p);
    document.getElementById('resultado-busqueda').innerHTML = `<span class="text-success">Seleccionado: ${p.nombres}</span>`;
}

function rellenarUsuario(datos) {
    // 1. Capturamos los inputs
    const inputNombre = document.getElementById('new-nombre');
    const inputEmail = document.getElementById('new-email');
    const selectRol = document.getElementById('new-rol');

    // 2. Rellenamos los datos
    inputNombre.value = `${datos.nombres} ${datos.apellidos}`;
    inputEmail.value = datos.email;

    // 3. BLOQUEAMOS LOS CAMPOS (La magia que pediste) 🔒
    // Al poner readOnly = true, el usuario ya no puede escribir
    inputNombre.readOnly = true;
    inputEmail.readOnly = true;

    // 4. Cambiamos el fondo a gris para que visualmente se note que está bloqueado
    inputNombre.style.backgroundColor = "#e9ecef"; // Gris claro estándar de Bootstrap
    inputEmail.style.backgroundColor = "#e9ecef";

    // 5. Asignación de Roles (Tu lógica original)
    if (datos.rol_sugerido === 'Docente') selectRol.value = "3";
    else if (datos.rol_sugerido === 'Secretaria') selectRol.value = "2";
    else if (datos.rol_sugerido === 'Apoderado') selectRol.value = "4";
    else if (datos.rol_sugerido === 'Director') selectRol.value = "1";
}

function cargarDatosEdicion(id, nombre, email, rol) {
    idUsuarioEditando = id;
    mostrarFormularioCrear();
    document.getElementById('new-nombre').value = nombre;
    document.getElementById('new-email').value = email;
    const map = {'Administrador':1, 'Secretaria':2, 'Docente':3, 'Apoderado':4};
    document.getElementById('new-rol').value = map[rol] || 1;
}

async function guardarUsuario(e) {
    e.preventDefault();
    const usuario = {
        nombre_completo: document.getElementById('new-nombre').value,
        email: document.getElementById('new-email').value,
        rol_id: document.getElementById('new-rol').value
    };
    if (!idUsuarioEditando) usuario.password = document.getElementById('new-pass').value;

    const url = idUsuarioEditando ? `${API_AUTH}/usuarios/${idUsuarioEditando}` : `${API_AUTH}/registro`;
    const method = idUsuarioEditando ? 'PUT' : 'POST';

    await fetch(url, { method: method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(usuario)});
    alert('Guardado'); accionClick('👥 Gestión de Usuarios');
}

async function eliminarUsuario(id) {
    if(confirm('¿Eliminar usuario?')) {
        await fetch(`${API_AUTH}/usuarios/${id}`, { method: 'DELETE' });
        accionClick('👥 Gestión de Usuarios');
    }
}
// =======================================================
// 5. MÓDULO: GESTIÓN DE APODERADOS (ACTUALIZADO: MULTI-HIJOS)
// =======================================================

// Variables de estado para este módulo
let idApoderadoEditando = null;
let listaHijosTemporal = []; // Lista para acumular los hijos antes de guardar

// 1. CARGAR TABLA DE APODERADOS
async function cargarApoderados(area) {
    area = area || document.getElementById('area-trabajo');
    try {
        const res = await fetch(`${API_ACADEMIC}/apoderados`);
        const padres = await res.json();
        
        let html = `
            <div class="d-flex justify-content-between mb-3">
                <h3>Directorio de Padres</h3>
                <button class="btn btn-primary" onclick="idApoderadoEditando=null; mostrarFormApoderado()">+ Nuevo Apoderado</button>
            </div>
            <table class="table table-hover bg-white shadow-sm align-middle">
                <thead class="table-dark">
                    <tr><th>DNI</th><th>Nombre</th><th>Teléfono</th><th>Hijos Asignados</th><th>Acciones</th></tr>
                </thead>
                <tbody>`;
        
        padres.forEach(p => {
            // Formatear la lista de hijos para que se vea bonita
            const hijosTag = p.hijos_asignados 
                ? `<span class="badge bg-success text-wrap" style="line-height: 1.5;">${p.hijos_asignados}</span>` 
                : `<span class="badge bg-secondary">Sin asignar</span>`;

            html += `
                <tr>
                    <td>${p.dni}</td>
                    <td>${p.nombres} ${p.apellidos}</td>
                    <td>${p.telefono || '-'}</td>
                    <td>${hijosTag}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-warning btn-sm" title="Editar"
                                onclick="cargarEdicionApoderado(${p.id}, '${p.dni}', '${p.nombres}', '${p.apellidos}', '${p.telefono || ''}', '${p.email || ''}')">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" title="Eliminar"
                                onclick="eliminarApoderado(${p.id})">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        });
        area.innerHTML = html + '</tbody></table>';
    } catch (e) { area.innerHTML = '<div class="alert alert-danger">Error cargando apoderados.</div>'; }
}

// 2. MOSTRAR FORMULARIO (NUEVO / EDITAR)
function mostrarFormApoderado() {
    const area = document.getElementById('area-trabajo');
    const titulo = idApoderadoEditando ? 'Editar Apoderado' : 'Nuevo Apoderado';
    
    const ro = idApoderadoEditando ? 'readonly style="background-color: #e9ecef;"' : '';
    const btnLupa = !idApoderadoEditando 
        ? `<button type="button" class="btn btn-info text-white" onclick="reniecApo()"><i class="bi bi-search"></i></button>`
        : '';

    // Si es nuevo, limpiamos la lista. (Si es editar, la lista ya se habrá llenado en cargarEdicionApoderado)
    if (!idApoderadoEditando) listaHijosTemporal = [];

    area.innerHTML = `
        <h3>${titulo}</h3>
        <div class="card p-4 shadow" style="max-width:700px">
            <form onsubmit="guardarApoderado(event)">
                <h5 class="text-primary mb-3">Datos Personales</h5>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label>DNI *</label>
                        <div class="input-group">
                            <input type="text" id="p-dni" class="form-control" maxlength="8" required placeholder="DNI" ${ro}>
                            ${btnLupa}
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label>Teléfono (9 dígitos)</label>
                        <input type="text" id="p-telefono" class="form-control" maxlength="9" required oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                    </div>
                    <div class="col-md-6 mb-3"><label>Nombres</label><input type="text" id="p-nombres" class="form-control" required ${ro}></div>
                    <div class="col-md-6 mb-3"><label>Apellidos</label><input type="text" id="p-apellidos" class="form-control" required ${ro}></div>
                    <div class="col-md-12 mb-3"><label>Email</label><input type="email" id="p-email" class="form-control"></div>
                </div>
                
                <hr>
                <h5 class="text-primary mb-3">Gestionar Hijos</h5>
                
                <div class="bg-light p-3 rounded border mb-3">
                    <label class="small text-muted mb-2">Para agregar un hijo, busca su DNI:</label>
                    <div class="input-group mb-2">
                        <input type="text" id="busqueda-hijo-dni" class="form-control" placeholder="DNI del Alumno" maxlength="8">
                        <button type="button" class="btn btn-secondary" onclick="buscarYAgregarHijo()"><i class="bi bi-plus-circle"></i> Agregar</button>
                    </div>
                    
                    <label class="fw-bold mt-2">Hijos asignados actualmente:</label>
                    <ul id="lista-hijos-ui" class="list-group mt-1"></ul>
                    <small class="text-muted fst-italic">* Si quitas a un hijo de la lista y guardas, se desvinculará.</small>
                </div>

                <div class="d-flex gap-2 mt-4">
                    <button type="submit" class="btn btn-primary w-50">Guardar Cambios</button>
                    <button type="button" class="btn btn-secondary w-50" onclick="cargarApoderados()">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    renderizarListaHijos(); // Importante para que se vean los hijos al cargar editar
}
// 3. CARGAR DATOS PARA EDICIÓN
async function cargarEdicionApoderado(id, dni, nom, ape, telf, email) {
    idApoderadoEditando = id;
    
    // 1. Preparamos la lista vacía
    listaHijosTemporal = [];

    // 2. Buscamos TODOS los estudiantes para filtrar cuáles son hijos de este señor
    // (Nota: Esto se podría optimizar en el backend, pero para mantener tu estructura lo hacemos aquí)
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_ACADEMIC}/estudiantes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const todosLosEstudiantes = await res.json();

        // Filtramos: Los que tengan apoderado_id igual al ID que estamos editando
        const susHijos = todosLosEstudiantes.filter(e => e.apoderado_id === id);

        // Llenamos la lista temporal con el formato correcto
        susHijos.forEach(h => {
            listaHijosTemporal.push({
                id: h.id,
                nombre: `${h.nombres} ${h.apellidos}`
            });
        });

    } catch (e) {
        console.error('Error cargando hijos:', e);
        alert('Hubo un problema cargando la lista de hijos.');
    }

    // 3. Mostramos el formulario (que ahora dibujará la listaHijosTemporal)
    mostrarFormApoderado();
    
    // 4. Rellenamos los datos del Padre
    document.getElementById('p-dni').value = dni;
    document.getElementById('p-nombres').value = nom;
    document.getElementById('p-apellidos').value = ape;
    document.getElementById('p-telefono').value = telf;
    document.getElementById('p-email').value = email;

    // Bloqueamos nombres visualmente
    document.getElementById('p-nombres').readOnly = true;
    document.getElementById('p-nombres').style.backgroundColor = "#e9ecef";
    document.getElementById('p-apellidos').readOnly = true;
    document.getElementById('p-apellidos').style.backgroundColor = "#e9ecef";
}

// --- FUNCIONES LÓGICAS ---

// A. BUSCAR EN RENIEC
async function reniecApo() {
    const dni = document.getElementById('p-dni').value;
    if (dni.length !== 8) return alert('El DNI debe tener 8 dígitos');

    // Botón feedback
    const btn = document.querySelector('#p-dni + button');
    const original = btn.innerHTML;
    btn.innerHTML = '...'; btn.disabled = true;

    try {
        const res = await fetch(`${API_ACADEMIC}/reniec/${dni}`);
        if(!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        
        const inputNom = document.getElementById('p-nombres');
        const inputApe = document.getElementById('p-apellidos');

        inputNom.value = data.nombres;
        inputApe.value = `${data.apellidoPaterno} ${data.apellidoMaterno}`;

        // BLOQUEAR CAMPOS TRAS BÚSQUEDA EXITOSA
        inputNom.readOnly = true;
        inputNom.style.backgroundColor = "#e9ecef";
        inputApe.readOnly = true;
        inputApe.style.backgroundColor = "#e9ecef";

    } catch (e) { 
        alert('DNI no encontrado en Reniec');
        // Si falla, permitimos escribir manual
        document.getElementById('p-nombres').readOnly = false;
        document.getElementById('p-apellidos').readOnly = false;
    } finally {
        btn.innerHTML = original; btn.disabled = false;
    }
}

// B. AGREGAR HIJO A LA LISTA TEMPORAL
async function buscarYAgregarHijo() {
    const dniHijo = document.getElementById('busqueda-hijo-dni').value;
    const token = localStorage.getItem('token');
    
    if(!dniHijo || dniHijo.length < 8) return alert("Ingresa un DNI de alumno válido");

    try {
        // Obtenemos lista de estudiantes para buscar (Idealmente el backend tendría un endpoint de búsqueda directa)
        const res = await fetch(`${API_ACADEMIC}/estudiantes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const lista = await res.json();
        const alumno = lista.find(est => est.dni === dniHijo);

        if (alumno) {
            // Verificar duplicados en la lista actual
            if (listaHijosTemporal.some(h => h.id === alumno.id)) {
                return alert(`El alumno ${alumno.nombres} ya está en la lista.`);
            }

            // Agregamos a la lista
            listaHijosTemporal.push({
                id: alumno.id,
                nombre: `${alumno.nombres} ${alumno.apellidos}`
            });

            // Limpiamos input y actualizamos vista
            document.getElementById('busqueda-hijo-dni').value = '';
            document.getElementById('aviso-hijos').style.display = 'none'; // Ocultar aviso de error si había
            renderizarListaHijos();

        } else {
            alert('Alumno no encontrado en la base de datos.');
        }
    } catch (e) { alert('Error al buscar alumno'); }
}

// C. DIBUJAR LA LISTA (UL)
function renderizarListaHijos() {
    const ul = document.getElementById('lista-hijos-ui');
    if(!ul) return;
    
    ul.innerHTML = '';
    
    if(listaHijosTemporal.length === 0) {
        ul.innerHTML = '<li class="list-group-item text-muted small text-center">No hay alumnos agregados aún.</li>';
        return;
    }

    listaHijosTemporal.forEach((hijo, index) => {
        ul.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center bg-white">
                <span><i class="bi bi-person-fill text-primary"></i> ${hijo.nombre}</span>
                <button type="button" class="btn btn-outline-danger btn-sm py-0" onclick="quitarHijo(${index})">
                    <i class="bi bi-x"></i>
                </button>
            </li>
        `;
    });
}

// D. QUITAR HIJO DE LA LISTA
function quitarHijo(index) {
    listaHijosTemporal.splice(index, 1);
    renderizarListaHijos();
}

// E. GUARDAR TODO
async function guardarApoderado(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Validación Frontend Rápida
    const tel = document.getElementById('p-telefono').value;
    if(tel.length !== 9) return alert("El teléfono debe tener 9 dígitos exactos.");

    // Validar que haya al menos un hijo (si es nuevo registro)
    if(!idApoderadoEditando && listaHijosTemporal.length === 0) {
        document.getElementById('aviso-hijos').style.display = 'block';
        return alert("Debes asignar al menos un hijo al crear al apoderado.");
    }

    const data = {
        dni: document.getElementById('p-dni').value,
        nombres: document.getElementById('p-nombres').value,
        apellidos: document.getElementById('p-apellidos').value,
        telefono: tel,
        email: document.getElementById('p-email').value,
        // ENVIAMOS EL ARRAY DE HIJOS
        estudiantes_ids: listaHijosTemporal.map(h => h.id)
    };

    const url = idApoderadoEditando 
        ? `${API_ACADEMIC}/apoderados/${idApoderadoEditando}` 
        : `${API_ACADEMIC}/apoderados`;
    const method = idApoderadoEditando ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { 
            method: method, 
            headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, 
            body: JSON.stringify(data)
        });

        const respuesta = await res.json();

        if (res.ok) { 
            alert(respuesta.mensaje || 'Operación exitosa'); 
            idApoderadoEditando = null; 
            listaHijosTemporal = []; // Limpiamos la lista
            cargarApoderados(); 
        } else { 
            alert('Error: ' + respuesta.error); 
        }
    } catch (err) { alert('Error de conexión'); }
}

// F. ELIMINAR
async function eliminarApoderado(id) {
    if(!confirm('⚠️ ¿Estás seguro de eliminar a este apoderado?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_ACADEMIC}/apoderados/${id}`, { 
            method: 'DELETE', 
            headers: {'Authorization': `Bearer ${token}`} 
        });
        
        const respuesta = await res.json();

        if(res.ok) {
            alert('Apoderado eliminado');
            cargarApoderados();
        } else {
            alert('❌ Error: ' + respuesta.error);
        }
    } catch (err) { alert('Error de conexión'); }
}
// =======================================================
// =======================================================
// 6. MÓDULO: GESTIÓN DE ESTUDIANTES (FINAL 5.0 - CON MODAL DE DETALLE)
// =======================================================

let idEstudianteEditando = null;
let estudiantesCache = []; // AQUÍ GUARDAMOS LOS DATOS PARA NO RECARGAR AL ABRIR EL MODAL
let misEstudiantesCache = []; // Guardamos los alumnos en memoria para el rol docente

// 1. CARGAR TABLA
async function cargarEstudiantes() {
    const token = localStorage.getItem('token');
    const area = document.getElementById('area-trabajo');
    
    // Decodificar rol
    const base64Url = token.split('.')[1];
    const user = JSON.parse(window.atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
    const esAdmin = (user.rol_id === 1 || user.rol_id === 2); // Admin o Secre

    area.innerHTML = '<p class="text-center mt-5"><span class="spinner-border text-primary"></span> Cargando estudiantes...</p>';
    
    try {
        const res = await fetch(`${API_ACADEMIC}/estudiantes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const list = await res.json();
        
        // BOTÓN SOLO PARA ADMIN/SECRE
        const btnNuevo = esAdmin 
            ? `<button class="btn btn-success shadow-sm" onclick="idEstudianteEditando=null; mostrarFormularioEstudiante()">
                 <i class="bi bi-person-plus-fill"></i> Nuevo Estudiante
               </button>` 
            : ''; // Si es docente, vacío

        let html = `
            <div class="d-flex justify-content-between mb-3 align-items-center">
                <h3><i class="bi bi-mortarboard-fill"></i> Estudiantes</h3>
                ${btnNuevo}
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover bg-white shadow-sm align-middle rounded-3 overflow-hidden">
                    <thead class="bg-primary text-white">
                        <tr>
                            <th>Foto</th>
                            <th>DNI</th>
                            <th>Apellidos y Nombres</th>
                            <th>Aula</th>
                            <th>Info Médica</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        list.forEach(e => {
            const foto = e.foto_perfil ? `<img src="${e.foto_perfil}" width="40" height="40" class="rounded-circle">` : '👤';
            const aulaInfo = e.grado_nombre ? `<span class="badge bg-info text-dark">${e.grado_nombre} "${e.seccion_letra}"</span>` : '<span class="badge bg-secondary">--</span>';

            // Botones limitados para docente (Solo ver)
            let acciones = `<button class="btn btn-info btn-sm text-white" onclick="verModalEstudiante(${e.id})"><i class="bi bi-eye-fill"></i></button>`;
            
            if (esAdmin) {
                acciones += ` <button class="btn btn-warning btn-sm" onclick="cargarEdicionEstudiante(${e.id}, '${e.dni}', '${e.nombres}', '${e.apellidos}', '${e.fecha_nacimiento||''}', '${e.direccion||''}', '${e.tipo_sangre||''}', '${e.alergias||''}')"><i class="bi bi-pencil-square"></i></button>`;
                acciones += ` <button class="btn btn-danger btn-sm" onclick="eliminarEstudiante(${e.id})"><i class="bi bi-trash"></i></button>`;
            }

            html += `<tr><td>${foto}</td><td>${e.dni}</td><td>${e.apellidos}, ${e.nombres}</td><td>${aulaInfo}</td><td><small>${e.tipo_sangre||'--'}</small></td><td>${acciones}</td></tr>`;
        });
        
        area.innerHTML = html + '</tbody></table></div><div id="modal-detalle-container"></div>';

    } catch (e) { area.innerHTML = 'Error cargando datos.'; }
}
// 2. FUNCIÓN PARA MOSTRAR EL MODAL CON DATOS
// =======================================================
// FUNCION AUXILIAR: VER FICHA DE ESTUDIANTE (ADMIN/SECRE)
// =======================================================

// =======================================================
// FICHA ADMINISTRATIVA (PARA ADMIN Y SECRETARIA)
// Muestra: Datos Personales, Médicos, Documentos y Contacto del Padre
// =======================================================

// =======================================================
// FICHA ADMINISTRATIVA (PARA ADMIN Y SECRETARIA)
// Diseño: Foto flotante, datos médicos y contacto
// =======================================================

// =======================================================
// FICHA ADMINISTRATIVA (BLINDADA A PRUEBA DE FALLOS)
// =======================================================

async function verModalEstudiante(id) {
    const token = localStorage.getItem('token');
    let alumno = null;

    // 1. Intentamos buscar en memoria primero
    if (typeof estudiantesCache !== 'undefined' && estudiantesCache.length > 0) {
        // Convertimos a String para asegurar que coincida (5 vs "5")
        alumno = estudiantesCache.find(e => String(e.id) === String(id));
    }

    // 2. Si NO está en memoria, lo pedimos al servidor (Plan B)
    if (!alumno) {
        try {
            const res = await fetch(`${API_ACADEMIC}/estudiantes`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const lista = await res.json();
            
            // Actualizamos la caché ya que estamos aquí
            estudiantesCache = lista;
            
            // Buscamos de nuevo
            alumno = lista.find(e => String(e.id) === String(id));
        } catch (e) {
            console.error(e);
            return alert("Error de conexión al buscar el estudiante.");
        }
    }

    // Si después de todo sigue sin aparecer...
    if (!alumno) return alert("Estudiante no encontrado en la base de datos.");

    // 3. Preparar Datos Visuales
    const fechaNac = alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toLocaleDateString() : 'No registrada';
    
    // Calcular edad
    let edad = "";
    if (alumno.fecha_nacimiento) {
        const hoy = new Date();
        const nac = new Date(alumno.fecha_nacimiento);
        let e = hoy.getFullYear() - nac.getFullYear();
        if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--;
        edad = `(${e} años)`;
    }

    // Avatar
    const avatar = (alumno.foto_perfil && alumno.foto_perfil !== "null")
        ? `<img src="${alumno.foto_perfil}" class="rounded-circle shadow border border-3 border-white" style="width: 120px; height: 120px; object-fit: cover; margin-top: -60px;">`
        : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow border border-3 border-white" style="width: 120px; height: 120px; font-size: 3rem; margin: 0 auto; margin-top: -60px;">${alumno.nombres.charAt(0)}</div>`;

    // Estado Matrícula
    const estadoAula = alumno.grado_nombre 
        ? `<span class="badge bg-success">${alumno.grado_nombre} "${alumno.seccion_letra}"</span>`
        : `<span class="badge bg-secondary">No Matriculado</span>`;

    // Datos del Padre
    const infoApoderado = alumno.apoderado_nombre
        ? `<div class="p-2 bg-white border rounded mb-1">
             <div class="fw-bold text-dark"><i class="bi bi-person-fill"></i> ${alumno.apoderado_nombre} ${alumno.apoderado_apellido}</div>
             <div class="text-primary small"><i class="bi bi-telephone-fill"></i> ${alumno.apoderado_telefono}</div>
             <div class="text-muted small"><i class="bi bi-envelope"></i> ${alumno.apoderado_email || 'Sin correo'}</div>
           </div>`
        : `<div class="alert alert-warning py-1 small mb-0">Sin apoderado asignado</div>`;


    // 4. HTML DEL MODAL
    const modalHtml = `
    <div class="modal fade" id="modalAdminEstudiante" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-visible">
                
                <div class="modal-header bg-primary text-white border-bottom-0 p-4" style="border-radius: 1rem 1rem 0 0;">
                    <h5 class="modal-title fw-bold"><i class="bi bi-file-earmark-person-fill"></i> Legajo del Estudiante</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="cerrarModalAdmin()"></button>
                </div>

                <div class="modal-body p-4 pt-0">
                    <div class="text-center mb-3 position-relative">
                        ${avatar}
                        <h4 class="fw-bold text-dark mt-2 mb-0">${alumno.nombres}</h4>
                        <h5 class="text-muted fs-6">${alumno.apellidos}</h5>
                        <div class="mt-2">${estadoAula} <span class="badge bg-dark">DNI: ${alumno.dni}</span></div>
                    </div>

                    <div class="card bg-light border-0 rounded-3 p-3">
                        <h6 class="text-primary border-bottom pb-1 mb-2 fw-bold">📍 Datos Personales</h6>
                        <div class="row g-2 mb-3 small">
                            <div class="col-6"><strong>Nacimiento:</strong><br>${fechaNac} ${edad}</div>
                            <div class="col-6"><strong>Dirección:</strong><br>${alumno.direccion || '-'}</div>
                        </div>

                        <h6 class="text-danger border-bottom pb-1 mb-2 fw-bold">🏥 Salud</h6>
                        <div class="row g-2 mb-3 small">
                            <div class="col-6"><strong>Tipo Sangre:</strong><br>${alumno.tipo_sangre || '--'}</div>
                            <div class="col-6"><strong>Alergias:</strong><br>${alumno.alergias || 'Ninguna registrada'}</div>
                        </div>

                        <h6 class="text-success border-bottom pb-1 mb-2 fw-bold">📞 Contacto Apoderado</h6>
                        ${infoApoderado}
                    </div>

                    ${(alumno.documento_pdf && alumno.documento_pdf !== "null") ? `
                    <div class="d-grid mt-3">
                        <a href="${alumno.documento_pdf}" target="_blank" class="btn btn-outline-danger btn-sm rounded-pill">
                            <i class="bi bi-file-earmark-pdf-fill"></i> Ver Documento Adjunto
                        </a>
                    </div>` : ''}

                </div>
                
                <div class="modal-footer border-0 pt-0 justify-content-center">
                    <button type="button" class="btn btn-secondary rounded-pill px-4" onclick="cerrarModalAdmin()">Cerrar</button>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('modal-detalle-container').innerHTML = modalHtml;
    
    const modalEl = document.getElementById('modalAdminEstudiante');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Función para cerrar correctamente
function cerrarModalAdmin() {
    const modalEl = document.getElementById('modalAdminEstudiante');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
        setTimeout(() => {
            document.getElementById('modal-detalle-container').innerHTML = '';
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style = '';
        }, 300);
    }
}

// 3. MOSTRAR FORMULARIO (CREAR / EDITAR)
function mostrarFormularioEstudiante() {
    const area = document.getElementById('area-trabajo');
    const titulo = idEstudianteEditando ? 'Editar Estudiante' : 'Registrar Nuevo Estudiante';
    const btnTexto = idEstudianteEditando ? 'Guardar Cambios' : 'Registrar Estudiante';
    
    const ro = idEstudianteEditando ? 'readonly style="background-color: #e9ecef;"' : '';
    const disabledSelect = idEstudianteEditando ? 'disabled style="background-color: #e9ecef;"' : '';
    const btnLupa = !idEstudianteEditando 
        ? `<button type="button" class="btn btn-info text-white" onclick="buscarDatosReniec()"><i class="bi bi-search"></i></button>` 
        : '';

    area.innerHTML = `
        <div class="d-flex align-items-center mb-3">
            <button class="btn btn-outline-secondary me-3" onclick="cargarEstudiantes()"><i class="bi bi-arrow-left"></i> Volver</button>
            <h3 class="mb-0">${titulo}</h3>
        </div>

        <div class="card p-4 shadow-sm border-0" style="max-width:850px; margin:0 auto;">
            <form id="form-estudiante" onsubmit="guardarEstudiante(event)">
                <h5 class="text-primary border-bottom pb-2 mb-3">Datos Personales</h5>
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label fw-bold">DNI *</label>
                        <div class="input-group">
                            <input type="text" id="dni_busqueda" name="dni" class="form-control" maxlength="8" required placeholder="8 dígitos" ${ro}>
                            ${btnLupa}
                        </div>
                    </div>
                    <div class="col-md-4"><label class="form-label">Fecha Nacimiento</label><input type="date" name="fecha_nacimiento" id="e-fecha" class="form-control" ${ro}></div>
                    <div class="col-md-4"><label class="form-label">Tipo de Sangre</label><select name="tipo_sangre" id="e-sangre" class="form-select" ${disabledSelect}><option value="">--</option><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select></div>
                    <div class="col-md-6"><label class="form-label">Nombres *</label><input type="text" name="nombres" id="e-nombres" class="form-control" required ${ro}></div>
                    <div class="col-md-6"><label class="form-label">Apellidos *</label><input type="text" name="apellidos" id="e-apellidos" class="form-control" required ${ro}></div>
                    <div class="col-12"><label class="form-label fw-bold text-success">Dirección (Editable)</label><input type="text" name="direccion" id="e-direccion" class="form-control"></div>
                </div>
                <h5 class="text-primary border-bottom pb-2 mb-3 mt-4">Datos Médicos & Archivos</h5>
                <div class="row g-3">
                    <div class="col-12"><label class="form-label fw-bold text-success">Alergias (Editable)</label><textarea name="alergias" id="e-alergias" class="form-control" rows="2"></textarea></div>
                    <div class="col-md-6"><label class="form-label">Foto Perfil</label><input type="file" name="foto" class="form-control" accept="image/*"></div>
                    <div class="col-md-6"><label class="form-label">Documento PDF</label><input type="file" name="documento" class="form-control" accept="application/pdf"></div>
                </div>
                <div class="d-grid gap-2 mt-4"><button type="submit" class="btn btn-primary btn-lg">${btnTexto}</button></div>
            </form>
        </div>
    `;
}

function cargarEdicionEstudiante(id, dni, nom, ape, fecha, dir, san, ale) {
    idEstudianteEditando = id;
    mostrarFormularioEstudiante();
    document.getElementById('dni_busqueda').value = dni;
    document.getElementById('e-nombres').value = nom;
    document.getElementById('e-apellidos').value = ape;
    document.getElementById('e-direccion').value = (dir !== 'null') ? dir : '';
    document.getElementById('e-sangre').value = (san !== 'null') ? san : '';
    document.getElementById('e-alergias').value = (ale !== 'null') ? ale : '';
    if(fecha && fecha !== 'null' && fecha !== '0000-00-00') document.getElementById('e-fecha').value = fecha.split('T')[0];
}

async function buscarDatosReniec() {
    const dni = document.getElementById('dni_busqueda').value;
    if(dni.length !== 8) return alert("DNI debe tener 8 dígitos");
    const btn = document.querySelector('#dni_busqueda + button'); btn.innerHTML = '...'; btn.disabled = true;
    try {
        const res = await fetch(`${API_ACADEMIC}/reniec/${dni}`);
        if(!res.ok) throw new Error();
        const data = await res.json();
        document.getElementById('e-nombres').value = data.nombres;
        document.getElementById('e-apellidos').value = `${data.apellidoPaterno} ${data.apellidoMaterno}`;
        if(data.direccion) document.getElementById('e-direccion').value = data.direccion;
        document.getElementById('e-nombres').readOnly = true; document.getElementById('e-nombres').style.backgroundColor = "#e9ecef";
        document.getElementById('e-apellidos').readOnly = true; document.getElementById('e-apellidos').style.backgroundColor = "#e9ecef";
    } catch(e) { alert('DNI no encontrado'); document.getElementById('e-nombres').readOnly = false; document.getElementById('e-apellidos').readOnly = false; }
    finally { btn.innerHTML = '<i class="bi bi-search"></i>'; btn.disabled = false; }
}

async function guardarEstudiante(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if(idEstudianteEditando) document.getElementById('e-sangre').disabled = false; 
    const formData = new FormData(document.getElementById('form-estudiante'));
    const url = idEstudianteEditando ? `${API_ACADEMIC}/estudiantes/${idEstudianteEditando}` : `${API_ACADEMIC}/estudiantes`;
    const method = idEstudianteEditando ? 'PUT' : 'POST';
    try {
        const res = await fetch(url, { method: method, headers: {'Authorization': `Bearer ${token}`}, body: formData });
        const data = await res.json();
        if(res.ok) { alert(data.mensaje); idEstudianteEditando=null; cargarEstudiantes(); } else { alert(data.error); }
    } catch(err) { alert('Error de conexión'); }
}

async function eliminarEstudiante(id) {
    if(!confirm('🚨 ¿Estás seguro de borrar este alumno?')) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_ACADEMIC}/estudiantes/${id}`, { method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} });
        if(res.ok) { alert('Eliminado'); cargarEstudiantes(); } else { const d=await res.json(); alert(d.error); }
    } catch(e) { alert('Error de conexión'); }
}
// 1. VISTA PRINCIPAL: TARJETAS DE SECCIONES ASIGNADAS
async function cargarMisEstudiantesDocente() {
    const area = document.getElementById('area-trabajo');
    const token = localStorage.getItem('token');
    
    area.innerHTML = '<p class="text-center mt-5"><span class="spinner-border text-success"></span> Cargando mis aulas...</p>';

    try {
        const res = await fetch(`${API_ACADEMIC}/trabajadores/mis-estudiantes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const list = await res.json();
        
        misEstudiantesCache = list; 

        // Agrupar por sección
        const seccionesMap = {};
        list.forEach(e => {
            // TRUCO: Quitamos las comillas dobles del nombre para el ID interno
            // Usaremos '1ro Grado A' en vez de '1ro Grado "A"' para la clave
            const nombreLimpio = `${e.grado} ${e.seccion}`; 
            
            if (!seccionesMap[nombreLimpio]) {
                seccionesMap[nombreLimpio] = [];
            }
            seccionesMap[nombreLimpio].push(e);
        });

        let html = `
            <div class="mb-4">
                <h3 class="fw-bold text-dark"><i class="bi bi-person-workspace text-success"></i> Mis Aulas</h3>
                <p class="text-muted small">Selecciona una sección para ver la lista.</p>
            </div>
            <div class="row g-4">`;

        const aulas = Object.keys(seccionesMap);

        if (aulas.length === 0) {
            html += `<div class="col-12"><div class="alert alert-warning text-center">Aún no tienes estudiantes asignados.</div></div>`;
        }

        aulas.forEach(aulaNombre => {
            const cantidad = seccionesMap[aulaNombre].length;
            const esPrimaria = aulaNombre.includes('Grado'); 
            const colorBorde = esPrimaria ? 'border-success' : 'border-primary';
            const badgeColor = esPrimaria ? 'bg-success' : 'bg-primary';

            // AQUÍ ESTÁ EL ARREGLO: Pasamos 'aulaNombre' que ya no tiene comillas dobles
            html += `
                <div class="col-md-4 col-lg-3">
                    <div class="card h-100 shadow-sm border-0 hover-effect" 
                         style="cursor: pointer; transition: transform 0.2s;"
                         onclick="verListaMisAlumnos('${aulaNombre}')" 
                         onmouseover="this.style.transform='translateY(-5px)'" 
                         onmouseout="this.style.transform='translateY(0)'">
                        
                        <div class="card-header bg-white border-top border-4 ${colorBorde} pt-3 border-bottom-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge ${badgeColor} bg-opacity-10 text-dark px-2 py-1 rounded-pill small">
                                    ${esPrimaria ? 'Primaria' : 'Secundaria'}
                                </span>
                                <i class="bi bi-people text-muted"></i>
                            </div>
                        </div>

                        <div class="card-body text-center">
                            <h4 class="fw-bold text-dark mb-1">${aulaNombre.replace(/ ([A-Z])$/, ' "$1"')}</h4>
                            <p class="text-muted small mb-3">${cantidad} Estudiantes</p>
                            
                            <div class="avatar-group d-flex justify-content-center mb-2">
                                <i class="bi bi-person-circle fs-4 text-secondary me-1" style="opacity:0.8"></i>
                                <i class="bi bi-person-circle fs-4 text-secondary me-1" style="opacity:0.6"></i>
                                <i class="bi bi-person-circle fs-4 text-secondary" style="opacity:0.4"></i>
                            </div>
                        </div>
                        
                        <div class="card-footer bg-white border-0 text-center pb-3">
                            <span class="btn btn-outline-success btn-sm rounded-pill px-4">Ver Lista</span>
                        </div>
                    </div>
                </div>`;
        });

        html += `</div>`;
        area.innerHTML = html;

    } catch (e) { 
        console.error(e);
        area.innerHTML = '<div class="alert alert-danger">Error cargando mis estudiantes.</div>'; 
    }
}

// 2. VISTA DETALLE: LISTA DE ALUMNOS DE UN AULA 
function verListaMisAlumnos(aulaNombreLimpio) {
    const area = document.getElementById('area-trabajo');
    
    // Filtramos usando la misma lógica de nombre limpio
    const alumnos = misEstudiantesCache.filter(e => `${e.grado} ${e.seccion}` === aulaNombreLimpio);
    
    // Ordenar alfabéticamente
    alumnos.sort((a, b) => a.apellidos.localeCompare(b.apellidos));

    // Recuperamos el título con comillas visualmente
    const tituloVisual = aulaNombreLimpio.replace(/ ([A-Z])$/, ' "$1"');

    let html = `
        <div class="d-flex align-items-center mb-4">
            <button class="btn btn-outline-secondary me-3 rounded-circle shadow-sm" onclick="cargarMisEstudiantesDocente()" style="width:45px;height:45px">
                <i class="bi bi-arrow-left fs-5"></i>
            </button>
            <div>
                <h3 class="fw-bold mb-0 text-success">${tituloVisual}</h3>
                <span class="text-muted small">Listado de clase (${alumnos.length} alumnos)</span>
            </div>
            <div class="ms-auto">
                 <button class="btn btn-success btn-sm rounded-pill px-3" onclick="alert('Próximamente: Notas por Bimestre')">
                    <i class="bi bi-table"></i> Notas
                </button>
            </div>
        </div>

        <div class="card border-0 shadow-sm overflow-hidden rounded-4">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light text-secondary small text-uppercase">
                        <tr>
                            <th class="ps-4 py-3" style="width: 50px;">#</th>
                            <th>Apellidos y Nombres</th>
                            <th>DNI</th>
                            </tr>
                    </thead>
                    <tbody class="border-top-0">`;

    if (alumnos.length === 0) {
        html += `<tr><td colspan="3" class="text-center p-5 text-muted">No hay estudiantes en esta lista.</td></tr>`;
    }

    alumnos.forEach((e, index) => {
        let avatarHtml;
        if (e.foto_perfil && e.foto_perfil !== "null") {
            avatarHtml = `<img src="${e.foto_perfil}" class="rounded-circle border shadow-sm" style="width: 35px; height: 35px; object-fit: cover;">`;
        } else {
            avatarHtml = `<div class="rounded-circle bg-success bg-opacity-25 text-dark d-flex align-items-center justify-content-center fw-bold" style="width: 35px; height: 35px; font-size: 0.8rem;">${e.nombres.charAt(0)}</div>`;
        }

        html += `
            <tr>
                <td class="ps-4 fw-bold text-muted">${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">${avatarHtml}</div>
                        <span class="fw-bold text-dark">${e.apellidos}, ${e.nombres}</span>
                    </div>
                </td>
                <td><span class="font-monospace text-secondary">${e.dni}</span></td>
                </tr>`;
    });

    html += `</tbody></table></div></div>`;
    area.innerHTML = html;
}

// =======================================================
// 7. MÓDULO: GESTIÓN DE CURSOS
// =======================================================

// =======================================================
// 7. MÓDULO: GESTIÓN DE CURSOS Y SECCIONES (ACTUALIZADO)
// =======================================================

// 1. CARGAR CURSOS (DISEÑO MEJORADO)
async function cargarCursos(area) {
    area = area || document.getElementById('area-trabajo');
    
    // Mostramos un spinner mientras carga
    area.innerHTML = '<p class="text-center mt-5"><span class="spinner-border text-warning"></span> Cargando cursos...</p>';

    try {
        const res = await fetch(`${API_ACADEMIC}/cursos`); 
        const filas = await res.json();
        
        // Agrupamos por Curso
        const cursosMap = {};
        filas.forEach(f => {
            if(!cursosMap[f.curso_id]) cursosMap[f.curso_id] = { nombre: f.nombre, nivel: f.nivel, secciones: [] };
            if(f.letra) cursosMap[f.curso_id].secciones.push({ id: f.seccion_id, letra: f.letra, vacantes: f.vacantes });
        });

        let html = `
            <div class="d-flex justify-content-between mb-4 align-items-center">
                <h3 class="fw-bold text-dark"><i class="bi bi-journal-bookmark-fill text-warning"></i> Oferta Académica</h3>
                <button class="btn btn-warning text-dark fw-bold shadow-sm px-4 py-2" onclick="mostrarFormCurso()">
                    <i class="bi bi-plus-lg"></i> Nuevo Curso
                </button>
            </div>
            <div class="row g-4">`; // g-4 da más espacio entre tarjetas

        for (const [id, c] of Object.entries(cursosMap)) {
            
            // Generamos los botones de las secciones MÁS GRANDES Y BONITOS
            let badges = c.secciones.map(s => `
                <button class="btn btn-outline-primary position-relative me-3 mb-3 fw-bold shadow-sm" 
                        onclick="verAlumnosSeccion(${s.id}, '${c.nombre}', '${s.letra}')"
                        style="min-width: 60px; height: 50px; font-size: 1.2rem; border-width: 2px;">
                    ${s.letra} 
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white shadow-sm" 
                          style="font-size: 0.75rem;">
                        ${s.vacantes}
                    </span>
                </button>
            `).join('');

            if(!badges) badges = '<div class="alert alert-light text-muted border-0 small"><i class="bi bi-info-circle"></i> No hay secciones creadas aún.</div>';

            // Definimos color según nivel
            const colorBorde = c.nivel === 'Primaria' ? 'border-success' : 'border-primary';
            const badgeNivel = c.nivel === 'Primaria' ? 'bg-success' : 'bg-primary';

            html += `
                <div class="col-md-6 col-lg-4"> <div class="card h-100 shadow-sm border-top border-4 ${colorBorde} rounded-3">
                        <div class="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                            <h5 class="fw-bold mb-0 text-dark">${c.nombre}</h5>
                            <span class="badge ${badgeNivel} rounded-pill px-3">${c.nivel}</span>
                        </div>
                        <div class="card-body">
                            <p class="text-muted small mb-3">Selecciona una sección para ver alumnos:</p>
                            <div class="d-flex flex-wrap">
                                ${badges}
                            </div>
                        </div>
                        <div class="card-footer bg-white border-0 pb-3">
                            <button class="btn btn-light text-primary w-100 fw-bold border-0" onclick="mostrarFormSeccion(${id}, '${c.nombre}')">
                                <i class="bi bi-plus-circle-dotted"></i> Agregar Sección
                            </button>
                        </div>
                    </div>
                </div>`;
        }
        
        // Contenedor para el modal de alumnos
        html += `</div><div id="modal-alumnos-container"></div>`;
        
        area.innerHTML = html;
        
    } catch (e) {
        area.innerHTML = '<div class="alert alert-danger">Error cargando la oferta académica.</div>';
    }
}

// FORMULARIO NUEVO CURSO
function mostrarFormCurso() {
    document.getElementById('area-trabajo').innerHTML = `
        <h3>Nuevo Curso</h3>
        <div class="card p-4 shadow" style="max-width:400px">
            <form onsubmit="guardarCurso(event)">
                <label>Nombre del Grado</label>
                <input id="c-nombre" class="form-control mb-2" placeholder="Ej: 3er Grado">
                <label>Nivel</label>
                <select id="c-nivel" class="form-select mb-3">
                    <option>Primaria</option>
                    <option>Secundaria</option>
                    <option>Inicial</option>
                </select>
                <div class="d-flex gap-2">
                    <button class="btn btn-warning text-white w-50">Guardar</button>
                    <button type="button" class="btn btn-secondary w-50" onclick="cargarCursos()">Cancelar</button>
                </div>
            </form>
        </div>`;
}

// FORMULARIO NUEVA SECCIÓN
function mostrarFormSeccion(id, nom) {
    document.getElementById('area-trabajo').innerHTML = `
        <h3>Nueva Sección para: <span class="text-primary">${nom}</span></h3>
        <div class="card p-4 shadow" style="max-width:400px">
            <form onsubmit="guardarSeccion(event, ${id})">
                <label>Letra de Sección</label>
                <input id="s-letra" class="form-control mb-2" placeholder="Ej: A, B, C..." required maxlength="1" oninput="this.value = this.value.toUpperCase()">
                <label>Vacantes Disponibles</label>
                <input id="s-vacantes" type="number" value="30" class="form-control mb-3">
                <div class="d-flex gap-2">
                    <button class="btn btn-primary w-50">Guardar</button>
                    <button type="button" class="btn btn-secondary w-50" onclick="cargarCursos()">Cancelar</button>
                </div>
            </form>
        </div>`;
}

async function guardarCurso(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${API_ACADEMIC}/cursos`, { 
        method:'POST', 
        headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${token}`}, 
        body: JSON.stringify({ nombre:document.getElementById('c-nombre').value, nivel:document.getElementById('c-nivel').value }) 
    });
    cargarCursos();
}

async function guardarSeccion(e, id) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const res = await fetch(`${API_ACADEMIC}/cursos/secciones`, { // OJO: Verifica si tu ruta es /cursos/secciones o solo /secciones
        method:'POST', 
        headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${token}`}, 
        body: JSON.stringify({ curso_id:id, letra:document.getElementById('s-letra').value, vacantes:document.getElementById('s-vacantes').value }) 
    });

    if(res.ok) {
        alert("Sección creada");
        cargarCursos();
    } else {
        const data = await res.json();
        alert("Error: " + data.error); // Aquí saldrá "La sección A ya existe..."
    }
}

// --- NUEVO: VER ALUMNOS EN MODAL ---
// VER ALUMNOS EN MODAL (CON BUSCADOR)
async function verAlumnosSeccion(seccionId, cursoNombre, letra) {
    const token = localStorage.getItem('token');
    
    // 1. Mostrar carga
    document.getElementById('modal-alumnos-container').innerHTML = `
        <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-5">
                        <div class="spinner-border text-primary"></div>
                        <p class="mt-2">Cargando lista...</p>
                    </div>
                </div>
            </div>
        </div>`;

    try {
        const res = await fetch(`${API_ACADEMIC}/cursos/secciones/${seccionId}/alumnos`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        // 2. Guardamos la lista completa en la variable global
        alumnosSeccionActual = await res.json();

        // 3. Estructura del Modal (Input + Contenedor de Lista)
        const modalHtml = `
            <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title fw-bold">
                                <i class="bi bi-people-fill"></i> ${cursoNombre} "${letra}"
                            </h5>
                            <button type="button" class="btn-close btn-close-white" onclick="cerrarModalAlumnos()"></button>
                        </div>
                        
                        <div class="modal-header bg-light border-bottom-0 py-2">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                                <input type="text" id="buscador-alumno-modal" class="form-control border-start-0" 
                                       placeholder="Buscar por DNI o Nombre..." 
                                       onkeyup="filtrarAlumnosSeccion()">
                            </div>
                        </div>

                        <div class="modal-body p-0" style="min-height: 200px;">
                            <div id="contenedor-lista-alumnos"></div>
                        </div>
                        
                        <div class="modal-footer bg-light">
                            <small class="text-muted me-auto fw-bold" id="contador-alumnos">
                                Total: ${alumnosSeccionActual.length} alumnos
                            </small>
                            <button type="button" class="btn btn-secondary" onclick="cerrarModalAlumnos()">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-alumnos-container').innerHTML = modalHtml;
        
        // 4. Dibujamos la lista inicial (todos)
        renderizarListaAlumnos(alumnosSeccionActual);

    } catch (error) {
        alert("Error cargando alumnos");
        cerrarModalAlumnos();
    }
}
// FUNCIÓN AUXILIAR: MODAL DE "SIN ALUMNOS"
function mostrarModalVacio(curso, letra) {
    const modalHtml = `
    <div class="modal fade" id="modalVacio" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content text-center rounded-4 border-0 shadow">
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <i class="bi bi-folder2-open text-muted display-1 opacity-25"></i>
                    </div>
                    <h5 class="fw-bold text-dark mb-2">Aula Vacía</h5>
                    <p class="text-muted small mb-3">
                        La sección <strong>${curso} "${letra}"</strong> aún no tiene estudiantes matriculados.
                    </p>
                    <button type="button" class="btn btn-dark rounded-pill w-100 btn-sm" data-bs-dismiss="modal">Entendido</button>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('modal-container').innerHTML = modalHtml;
    const modal = new bootstrap.Modal(document.getElementById('modalVacio'));
    modal.show();
}
// FUNCIÓN PARA FILTRAR (Se ejecuta al escribir)
function filtrarAlumnosSeccion() {
    const texto = document.getElementById('buscador-alumno-modal').value.toLowerCase();
    
    // Filtramos la lista global buscando coincidencias en nombre, apellido o DNI
    const filtrados = alumnosSeccionActual.filter(a => 
        a.nombres.toLowerCase().includes(texto) || 
        a.apellidos.toLowerCase().includes(texto) || 
        a.dni.includes(texto)
    );
    
    renderizarListaAlumnos(filtrados);
}

// FUNCIÓN PARA DIBUJAR LA LISTA (Recibe un array y crea el HTML)
function renderizarListaAlumnos(lista) {
    const contenedor = document.getElementById('contenedor-lista-alumnos');
    const contador = document.getElementById('contador-alumnos');
    
    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center p-5 text-muted">
                <i class="bi bi-search fs-1 mb-2 d-block opacity-50"></i>
                <p>No se encontraron alumnos.</p>
            </div>`;
        contador.innerText = "Mostrando: 0";
        return;
    }

    let html = '<ul class="list-group list-group-flush">';
    
    lista.forEach((a, index) => {
        // Avatar con iniciales o foto
        const avatar = a.foto_perfil 
            ? `<img src="${a.foto_perfil}" class="rounded-circle border" width="40" height="40" style="object-fit:cover">`
            : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width:40px; height:40px; font-size: 14px;">${a.nombres.charAt(0)}${a.apellidos.charAt(0)}</div>`;

        html += `
            <li class="list-group-item d-flex align-items-center py-2 px-3 hover-effect">
                <span class="badge bg-light text-secondary border me-3" style="width: 25px;">${index + 1}</span>
                <div class="me-3">${avatar}</div>
                <div>
                    <div class="fw-bold text-dark">${a.apellidos}, ${a.nombres}</div>
                    <div class="small text-muted"><i class="bi bi-card-heading"></i> ${a.dni}</div>
                </div>
            </li>
        `;
    });
    
    html += '</ul>';
    contenedor.innerHTML = html;
    
    // Actualizamos el contador del pie de página
    contador.innerText = `Mostrando: ${lista.length} de ${alumnosSeccionActual.length}`;
}

function cerrarModalAlumnos() {
    document.getElementById('modal-alumnos-container').innerHTML = '';
}

// =======================================================
// 8. MÓDULO: GESTIÓN DE HORARIOS (BLOQUEO Y VALIDACIÓN)
// =======================================================

// =======================================================
// 8. MÓDULO: GESTIÓN DE HORARIOS (VISTA ESTÁTICA DE SECCIÓN)
// =======================================================

// --- CONSTANTES ---
const BLOQUES_HORARIO = [
    { inicio: '08:00', fin: '08:45', tipo: 'CLASE' },
    { inicio: '08:45', fin: '09:30', tipo: 'CLASE' },
    { inicio: '09:30', fin: '10:15', tipo: 'CLASE' },
    { inicio: '10:15', fin: '10:45', tipo: 'RECREO' }, 
    { inicio: '10:45', fin: '11:30', tipo: 'CLASE' },
    { inicio: '11:30', fin: '12:15', tipo: 'CLASE' },
    { inicio: '12:15', fin: '13:00', tipo: 'CLASE' }
];
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// --- VARIABLES GLOBALES ---
let seccionSeleccionadaId = null;
let docenteSeleccionadoId = null;
let docentesCacheHorario = []; 

// 1. VISTA PRINCIPAL
async function mostrarFormAsignarHorario(area) {
    area = area || document.getElementById('area-trabajo');
    const token = localStorage.getItem('token');
    
    area.innerHTML = `
        <h3 class="mb-4"><i class="bi bi-calendar-week"></i> Gestión de Horarios</h3>
        <div class="row">
            <div class="col-md-3">
                
                <div class="card p-3 shadow-sm mb-3">
                    <h6 class="fw-bold text-primary">1. Visualizar Tabla</h6>
                    <label class="small text-muted mt-2">Ver Horario de Sección:</label>
                    <select id="filtro-seccion" class="form-select mb-3" onchange="verHorarioSeccion(this.value)">
                        <option value="">-- Elige Aula --</option>
                    </select>
                    
                    <hr>
                    <label class="small text-muted">Ver Horario de Docente:</label>
                    <select id="filtro-docente" class="form-select mb-3" onchange="verHorarioDocente(this.value)">
                        <option value="">-- Elige Docente --</option>
                    </select>
                </div>

                <div class="card p-3 shadow-sm bg-light border-dark">
                    <h6 class="fw-bold text-dark">2. Asignar Clase Nueva</h6>
                    <form onsubmit="guardarHorario(event)">
                        <input type="hidden" id="h-seccion-id"> 
                        <input type="hidden" id="h-docente-id">

                        <div class="mb-2">
                            <label class="small fw-bold">Aula Destino</label>
                            <select id="h-seccion-select" class="form-select form-select-sm" onchange="sincronizarAula(this.value)" required>
                                <option value="">-- Elige Aula --</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label class="small fw-bold">Docente a Programar</label>
                            <select id="h-docente-select" class="form-select form-select-sm" onchange="autoseleccionarMateria()" required>
                                <option value="">-- Elige Docente --</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label class="small">Materia</label>
                            <select id="h-materia" class="form-select form-select-sm" required>
                                <option value="">-- Selecciona --</option>
                                ${CURSOS_DISPONIBLES.map(m => `<option value="${m}">${m}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="mb-2">
                            <label class="small">Día</label>
                            <select id="h-dia" class="form-select form-select-sm" required>
                                <option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="small">Bloque</label>
                            <select id="h-bloque" class="form-select form-select-sm" required>
                                ${BLOQUES_HORARIO.filter(b => b.tipo === 'CLASE').map(b => `<option value="${b.inicio}|${b.fin}">${b.inicio} - ${b.fin}</option>`).join('')}
                            </select>
                        </div>

                        <button id="btn-asignar" class="btn btn-dark w-100">
                            <i class="bi bi-plus-circle"></i> Agregar al Horario
                        </button>
                    </form>
                </div>
            </div>

            <div class="col-md-9">
                <div class="card shadow-sm">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <span id="titulo-tabla" class="fw-bold h5 mb-0">Vista Previa</span>
                        <span class="badge bg-secondary" id="modo-vista">Selecciona un filtro</span>
                    </div>
                    <div class="card-body p-0 table-responsive">
                        <table class="table table-bordered text-center mb-0" style="font-size: 0.9rem;">
                            <thead class="bg-dark text-white">
                                <tr>
                                    <th style="width:100px">Hora</th>
                                    <th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th>
                                </tr>
                            </thead>
                            <tbody id="cuerpo-horario">
                                <tr><td colspan="6" class="p-5 text-muted">Aquí aparecerá el horario de la sección o docente que selecciones arriba.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    // CARGAR DATOS
    try {
        const [resTrabajadores, resCursos] = await Promise.all([
            fetch(`${API_ACADEMIC}/trabajadores`), 
            fetch(`${API_ACADEMIC}/cursos`)
        ]);
        
        const trabajadores = await resTrabajadores.json();
        const cursos = await resCursos.json();

        // Docentes
        docentesCacheHorario = trabajadores.filter(t => t.cargo === 'Docente');
        let optDoc = '<option value="">-- Selecciona Docente --</option>';
        docentesCacheHorario.forEach(d => { optDoc += `<option value="${d.id}">${d.nombres} ${d.apellidos}</option>`; });
        
        document.getElementById('filtro-docente').innerHTML = optDoc;
        document.getElementById('h-docente-select').innerHTML = optDoc;

        // Secciones
        let optSec = '<option value="">-- Selecciona Sección --</option>';
        cursos.forEach(c => { if(c.letra) optSec += `<option value="${c.seccion_id}">${c.nombre} "${c.letra}"</option>`; });
        
        document.getElementById('filtro-seccion').innerHTML = optSec;
        document.getElementById('h-seccion-select').innerHTML = optSec;

    } catch(e) { console.error(e); alert('Error cargando listas.'); }
}

// 2. AUTOCOMPLETAR MATERIA (NO TOCA LA TABLA)
function autoseleccionarMateria() {
    const idDocente = document.getElementById('h-docente-select').value;
    const profe = docentesCacheHorario.find(d => d.id == idDocente);
    const selectMateria = document.getElementById('h-materia');
    
    // Actualizamos variable global para el guardado
    docenteSeleccionadoId = idDocente;
    document.getElementById('h-docente-id').value = idDocente;

    if (profe && profe.curso_principal) {
        selectMateria.value = profe.curso_principal;
    } else {
        selectMateria.value = "";
    }
}

// 3. SINCRONIZAR AULA (Si cambio el aula en el formulario, actualizo la vista para ver ese horario)
function sincronizarAula(idAula) {
    if(!idAula) return;
    // Seleccionamos también en el filtro visual para que sea coherente
    document.getElementById('filtro-seccion').value = idAula;
    // Llamamos a ver horario
    verHorarioSeccion(idAula);
}

// 4. VER HORARIO DE SECCIÓN (Muestra TODOS los ocupantes)
async function verHorarioSeccion(id) {
    if(!id) return;
    seccionSeleccionadaId = id;
    const token = localStorage.getItem('token');
    
    // Sincronizar Formulario de abajo
    document.getElementById('h-seccion-select').value = id;
    document.getElementById('h-seccion-id').value = id;
    
    // Limpiar filtro docente para no confundir
    document.getElementById('filtro-docente').value = ""; 

    document.getElementById('titulo-tabla').innerText = "Horario del Aula";
    document.getElementById('modo-vista').className = "badge bg-info text-dark";
    document.getElementById('modo-vista').innerText = "Viendo Sección";

    try {
        const res = await fetch(`${API_ACADEMIC}/horarios/seccion/${id}`, { headers: {'Authorization': `Bearer ${token}`} });
        const data = await res.json();
        dibujarTabla(data, 'seccion');
    } catch(e) { alert('Error cargando horario'); }
}

// 5. VER HORARIO DE DOCENTE
async function verHorarioDocente(id) {
    if(!id) return;
    const token = localStorage.getItem('token');
    
    // Sincronizar Formulario
    document.getElementById('h-docente-select').value = id;
    autoseleccionarMateria(); // Rellenar materia y ID oculto
    
    document.getElementById('filtro-seccion').value = ""; // Limpiar filtro seccion

    document.getElementById('titulo-tabla').innerText = "Horario del Docente";
    document.getElementById('modo-vista').className = "badge bg-warning text-dark";
    document.getElementById('modo-vista').innerText = "Viendo Docente";

    try {
        const res = await fetch(`${API_ACADEMIC}/horarios/docente/${id}`, { headers: {'Authorization': `Bearer ${token}`} });
        const data = await res.json();
        dibujarTabla(data, 'docente');
    } catch(e) { alert('Error cargando horario'); }
}

// 6. DIBUJAR TABLA (SOLUCIÓN HORA + VISUALIZACIÓN)
function dibujarTabla(datosHorario, modo) {
    const tbody = document.getElementById('cuerpo-horario');
    tbody.innerHTML = '';

    BLOQUES_HORARIO.forEach(bloque => {
        let filaHtml = `<tr><td class="fw-bold bg-light align-middle" style="font-size:0.8rem">${bloque.inicio} - ${bloque.fin}</td>`;

        if (bloque.tipo === 'RECREO') {
            filaHtml += `<td colspan="5" class="bg-success text-white fw-bold align-middle py-2" style="letter-spacing: 2px;">☕ RECREO / BREAK</td></tr>`;
            tbody.innerHTML += filaHtml;
            return;
        }

        DIAS_SEMANA.forEach(dia => {
            // Buscamos coincidencia flexible de hora
            const clase = datosHorario.find(h => h.dia === dia && h.hora_inicio.toString().startsWith(bloque.inicio));
            
            if (clase) {
                if (modo === 'seccion') {
                    // MODO AULA: Muestra MATERIA GRANDE y Docente pequeño
                    const nombreProfe = clase.docente_nom ? `${clase.docente_nom.split(' ')[0]} ${clase.docente_ape.split(' ')[0]}` : 'Docente';
                    filaHtml += `
                        <td class="table-primary align-middle border border-white p-1" title="Docente: ${nombreProfe}">
                            <div class="fw-bold text-primary text-uppercase" style="font-size:0.85rem">${clase.materia}</div>
                            <div class="text-dark small" style="font-size:0.7rem; opacity:0.8"><i class="bi bi-person-fill"></i> ${nombreProfe}</div>
                        </td>`;
                } else {
                    // MODO DOCENTE: Muestra MATERIA GRANDE y Aula pequeña
                    const aulaInfo = clase.curso_nom ? `${clase.curso_nom} "${clase.seccion_letra}"` : 'S/A';
                    filaHtml += `
                        <td class="table-warning align-middle border border-white p-1">
                            <div class="fw-bold text-dark text-uppercase" style="font-size:0.85rem">${clase.materia}</div>
                            <span class="badge bg-dark text-white mt-1" style="font-size:0.7rem">${aulaInfo}</span>
                        </td>`;
                }
            } else {
                // CELDA VACÍA
                filaHtml += `<td class="align-middle" style="background-color: #fcfcfc;"></td>`;
            }
        });

        filaHtml += '</tr>';
        tbody.innerHTML += filaHtml;
    });
}

// 7. GUARDAR HORARIO
async function guardarHorario(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const [inicio, fin] = document.getElementById('h-bloque').value.split('|');
    
    const data = {
        seccion_id: document.getElementById('h-seccion-select').value,
        docente_id: document.getElementById('h-docente-select').value,
        materia: document.getElementById('h-materia').value,
        dia: document.getElementById('h-dia').value,
        hora_inicio: inicio, 
        hora_fin: fin
    };

    if(!data.seccion_id || !data.docente_id) return alert("Error: Faltan datos.");

    try {
        const res = await fetch(`${API_ACADEMIC}/horarios`, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, 
            body: JSON.stringify(data)
        });

        const respuesta = await res.json();

        if (res.ok) {
            alert("✅ Clase asignada correctamente");
            
            // SIEMPRE RECARGAMOS LA VISTA DEL AULA AFECTADA PARA VER EL CAMBIO
            verHorarioSeccion(data.seccion_id);
            // Y nos aseguramos que el filtro visual coincida
            document.getElementById('filtro-seccion').value = data.seccion_id;
            
        } else {
            alert("⚠️ " + respuesta.error);
        }
    } catch (err) { alert('Error de conexión'); }
}


// =======================================================
// VISTA EXCLUSIVA PARA DOCENTES (SOLO LECTURA)
// =======================================================

async function cargarHorarioDocente() {
    const area = document.getElementById('area-trabajo');
    const token = localStorage.getItem('token');
    
    area.innerHTML = '<p class="text-center mt-5"><span class="spinner-border text-warning"></span> Cargando mi agenda...</p>';

    try {
        // Llamamos al endpoint que usa el token para saber quién soy
        const res = await fetch(`${API_ACADEMIC}/horarios/mis-horarios`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (!res.ok) throw new Error("No se pudo cargar el horario");
        
        const misClases = await res.json();

        // Dibujamos la estructura
        let html = `
            <div class="d-flex align-items-center mb-4">
                <h3 class="fw-bold mb-0 text-dark">
                    <i class="bi bi-calendar-check text-warning"></i> Mi Agenda Semanal
                </h3>
            </div>

            <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-bordered text-center mb-0 align-middle">
                        <thead class="bg-dark text-white">
                            <tr>
                                <th style="width:100px" class="py-3">Horario</th>
                                <th class="py-3">Lunes</th>
                                <th class="py-3">Martes</th>
                                <th class="py-3">Miércoles</th>
                                <th class="py-3">Jueves</th>
                                <th class="py-3">Viernes</th>
                            </tr>
                        </thead>
                        <tbody>`;

        BLOQUES_HORARIO.forEach(bloque => {
            html += `<tr><td class="fw-bold bg-light text-secondary small">${bloque.inicio} - ${bloque.fin}</td>`;

            if (bloque.tipo === 'RECREO') {
                html += `<td colspan="5" class="bg-success bg-opacity-10 text-success fw-bold py-2 small" style="letter-spacing: 1px;">☕ RECREO / BREAK</td></tr>`;
                return;
            }

            DIAS_SEMANA.forEach(dia => {
                const clase = misClases.find(h => h.dia === dia && h.hora_inicio.toString().startsWith(bloque.inicio));

                if (clase) {
                    html += `
                        <td class="p-1 position-relative" style="background-color: #fff8e1; border-bottom: 3px solid #ffc107;">
                            <div class="p-2">
                                <div class="fw-bold text-dark text-uppercase small">${clase.materia}</div>
                                <span class="badge bg-dark mt-1 rounded-pill">
                                    ${clase.grado} "${clase.seccion}"
                                </span>
                            </div>
                        </td>`;
                } else {
                    html += `<td class="bg-white"></td>`;
                }
            });
            html += `</tr>`;
        });

        html += `</tbody></table></div></div>`;
        
        // (SE ELIMINÓ EL DIV DE RESUMEN DE HORAS AQUÍ)

        area.innerHTML = html;

    } catch (e) {
        console.error(e);
        area.innerHTML = `
            <div class="alert alert-warning text-center p-5 shadow-sm rounded-4">
                <i class="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
                <h4>No se encontró horario</h4>
                <p class="text-muted">Parece que tu usuario no está vinculado correctamente a un registro de docente o aún no te han asignado clases.</p>
            </div>`;
    }
}
// =======================================================
// 9. MÓDULO: GESTIÓN DE MATRÍCULAS (AGRUPADO POR SECCIONES)
// =======================================================

// Variable para guardar los datos y no recargar al cambiar de vista
let matriculasCache = []; 


// 1. VISTA PRINCIPAL: TARJETAS DE SECCIONES
async function cargarMatriculas(area) {
    area = area || document.getElementById('area-trabajo');
    area.innerHTML = '<p class="text-center mt-5"><span class="spinner-border text-primary"></span> Cargando aulas...</p>';

    try {
        // PASO 1: Pedimos TODAS las secciones y TODAS las matrículas al mismo tiempo
        const [resCursos, resMatriculas] = await Promise.all([
            fetch(`${API_ACADEMIC}/cursos`), 
            fetch(`${API_ACADEMIC}/matriculas`)
        ]);

        const listaCursos = await resCursos.json();
        matriculasCache = await resMatriculas.json(); // Guardamos alumnos en memoria

        // PASO 2: Preparamos la estructura visual
        let html = `
            <div class="d-flex justify-content-between mb-4 align-items-center">
                <div>
                    <h3 class="fw-bold text-dark mb-0"><i class="bi bi-journal-check text-primary"></i> Matrículas 2025</h3>
                    <p class="text-muted small mb-0">Selecciona un aula para ver la lista de clase.</p>
                </div>
                <button class="btn btn-primary shadow px-4 py-2 rounded-pill" onclick="formMatricula()">
                    <i class="bi bi-plus-lg"></i> Nueva Matrícula
                </button>
            </div>
            <div class="row g-4">`;

        // PASO 3: Recorremos los CURSOS (Secciones) para crear las tarjetas
        let seccionesEncontradas = 0;

        listaCursos.forEach(c => {
            // Solo procesamos si el curso tiene una sección definida (letra)
            if (c.letra) {
                seccionesEncontradas++;
                
                // Filtramos cuántos alumnos hay REALMENTE en esta sección específica
                const cantidadAlumnos = matriculasCache.filter(m => m.seccion_id === c.seccion_id).length;
                
                // Estilos según nivel
                const badgeColor = c.nivel === 'Primaria' ? 'bg-success' : 'bg-primary';
                const bordeColor = c.nivel === 'Primaria' ? 'border-success' : 'border-primary';

                html += `
                <div class="col-md-4 col-lg-3">
                    <div class="card h-100 shadow-sm border-0 hover-effect" 
                         style="cursor: pointer; transition: transform 0.2s;"
                         onclick="verAlumnosDeSeccion(${c.seccion_id}, '${c.nombre}', '${c.letra}')"
                         onmouseover="this.style.transform='translateY(-5px)'" 
                         onmouseout="this.style.transform='translateY(0)'">
                        
                        <div class="card-header border-top border-4 ${bordeColor} bg-white border-bottom-0 pt-3">
                            <span class="badge ${badgeColor} bg-opacity-10 text-dark border px-2 py-1 rounded-pill small">
                                ${c.nivel}
                            </span>
                        </div>

                        <div class="card-body text-center pt-0">
                            <h5 class="fw-bold text-dark mb-0 mt-2">${c.nombre}</h5>
                            <h1 class="display-3 fw-bold text-primary my-1">"${c.letra}"</h1>
                            
                            <div class="text-muted small mt-3">
                                <i class="bi bi-people-fill me-1"></i> ${cantidadAlumnos} / ${c.vacantes} Inscritos
                            </div>
                            
                            <div class="progress mt-2" style="height: 5px;">
                                <div class="progress-bar ${cantidadAlumnos >= c.vacantes ? 'bg-danger' : 'bg-primary'}" 
                                     role="progressbar" 
                                     style="width: ${(cantidadAlumnos / c.vacantes) * 100}%">
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-footer bg-white border-0 text-center pb-3">
                            <span class="btn btn-outline-secondary btn-sm rounded-pill px-4">Ver Lista</span>
                        </div>
                    </div>
                </div>`;
            }
        });

        if (seccionesEncontradas === 0) {
            html += `<div class="col-12"><div class="alert alert-warning">No hay cursos ni secciones creadas. Ve a "Gestión de Cursos" primero.</div></div>`;
        }

        html += `</div>`;
        area.innerHTML = html;

    } catch (e) {
        console.error(e);
        area.innerHTML = '<div class="alert alert-danger shadow-sm">Error cargando panel de matrículas.</div>';
    }
}

// 2. VISTA DETALLE: LISTA DE ALUMNOS (Igual que antes, pero filtrando seguro)
// 2. VISTA DETALLE: VER ALUMNOS DE UNA SECCIÓN ESPECÍFICA
// 2. VISTA DETALLE: LOGICA INTELIGENTE (LISTA O AVISO)
async function verAlumnosDeSeccion(seccionId, nombreCurso, letra) {
    const area = document.getElementById('area-trabajo');
    
    // 1. Asegurar datos
    if (!matriculasCache || matriculasCache.length === 0) {
        try {
            const res = await fetch(`${API_ACADEMIC}/matriculas`);
            matriculasCache = await res.json();
        } catch (e) { return alert("Error recuperando datos."); }
    }
    
    // 2. Filtrar alumnos (Comparación Segura de Texto/Número)
    const alumnos = matriculasCache.filter(m => String(m.seccion_id) === String(seccionId));

    // 3. DECISIÓN: ¿ESTÁ VACÍO?
    if (alumnos.length === 0) {
        // CASO A: VACÍO -> MOSTRAMOS MODAL DE AVISO
        mostrarModalVacio(nombreCurso, letra);
        return; // Nos detenemos aquí, no cambiamos la pantalla
    }

    // CASO B: HAY ALUMNOS -> MOSTRAMOS LA TABLA
    alumnos.sort((a, b) => a.apellidos.localeCompare(b.apellidos));

    let html = `
        <div class="d-flex align-items-center mb-4">
            <button class="btn btn-outline-secondary me-3 rounded-circle shadow-sm" onclick="cargarMatriculas()" style="width:45px;height:45px">
                <i class="bi bi-arrow-left fs-5"></i>
            </button>
            <div>
                <h3 class="fw-bold mb-0 text-dark">${nombreCurso} "${letra}"</h3>
                <span class="text-muted small">Listado oficial de estudiantes (${alumnos.length})</span>
            </div>
            <div class="ms-auto">
                 <button class="btn btn-success btn-sm rounded-pill px-3" onclick="alert('Función: Exportar a Excel')">
                    <i class="bi bi-file-earmark-excel"></i> Exportar Lista
                </button>
            </div>
        </div>

        <div class="card border-0 shadow-sm overflow-hidden rounded-4">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light text-secondary small text-uppercase">
                        <tr>
                            <th class="ps-4 py-3" style="width: 50px;">#</th>
                            <th>Estudiante</th>
                            <th>DNI</th>
                            <th>Fecha</th>
                            <th class="text-end pe-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="border-top-0">`;

    alumnos.forEach((m, index) => {
        const fechaObj = new Date(m.fecha_matricula);
        const fechaTexto = fechaObj.toLocaleDateString('es-ES');

        let avatarHtml;
        if (m.foto_perfil && m.foto_perfil !== "null") {
            avatarHtml = `<img src="${m.foto_perfil}" class="rounded-circle border border-2 shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">`;
        } else {
            const iniciales = `${m.nombres.charAt(0)}${m.apellidos.charAt(0)}`.toUpperCase();
            avatarHtml = `<div class="rounded-circle bg-warning bg-opacity-25 text-dark d-flex align-items-center justify-content-center fw-bold" style="width: 40px; height: 40px; font-size: 0.9rem;">${iniciales}</div>`;
        }

        html += `
            <tr>
                <td class="ps-4 fw-bold text-muted">${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">${avatarHtml}</div>
                        <span class="fw-bold text-dark">${m.apellidos}, ${m.nombres}</span>
                    </div>
                </td>
                <td><span class="font-monospace text-secondary">${m.dni}</span></td>
                <td><small class="text-muted">${fechaTexto}</small></td>
                <td class="text-end pe-4">
                    <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick="verDetalleMatricula(${m.id})">
                        <i class="bi bi-eye-fill me-1"></i> Detalle
                    </button>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div></div>`;
    area.innerHTML = html;
}   

// 3. FORMULARIO Y GUARDADO (Se mantienen igual)
async function formMatricula() {
    const area = document.getElementById('area-trabajo');
    area.innerHTML = '<p class="text-center mt-5"><span class="spinner-border text-primary"></span> Cargando datos...</p>';

    try {
        const [re, rc] = await Promise.all([
            fetch(`${API_ACADEMIC}/estudiantes`), 
            fetch(`${API_ACADEMIC}/cursos`)
        ]);
        const est = await re.json(); 
        const cur = await rc.json();
        
        const disponibles = est.filter(alumno => !alumno.grado_nombre);

        let oe = '<option value="">-- Selecciona al Alumno --</option>'; 
        if (disponibles.length === 0) oe = '<option value="">✅ Todos matriculados</option>';
        else disponibles.forEach(e => oe += `<option value="${e.id}">${e.dni} - ${e.apellidos}, ${e.nombres}</option>`);
        
        let oc = '<option value="">-- Selecciona el Aula --</option>'; 
        cur.forEach(c => { 
            if(c.letra) {
                const disabled = c.vacantes <= 0 ? 'disabled style="background-color:#ffebeb"' : '';
                const textoVacantes = c.vacantes <= 0 ? 'LLENO' : `${c.vacantes} vacantes`;
                oc += `<option value="${c.seccion_id}" ${disabled}>${c.nombre} "${c.letra}" (${textoVacantes})</option>`; 
            }
        });

        area.innerHTML = `
            <div class="d-flex align-items-center mb-4">
                <button class="btn btn-outline-secondary me-3 rounded-circle" onclick="cargarMatriculas()" style="width:40px;height:40px"><i class="bi bi-arrow-left"></i></button>
                <h3 class="mb-0 fw-bold">Nueva Matrícula 2025</h3>
            </div>
            <div class="card shadow-lg border-0 rounded-4" style="max-width: 600px; margin: 0 auto;">
                <div class="card-body p-5">
                    <div class="text-center mb-4">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;"><i class="bi bi-mortarboard-fill display-4"></i></div>
                        <h5 class="fw-bold">Registro Académico</h5>
                        <p class="text-muted small">Solo aparecen los estudiantes que <b>aún no tienen aula</b> asignada.</p>
                    </div>
                    <form onsubmit="guardarMatricula(event)">
                        <div class="mb-4"><label class="form-label fw-bold small text-muted">ESTUDIANTE</label><select id="m-est" class="form-select form-select-lg" required>${oe}</select></div>
                        <div class="mb-4"><label class="form-label fw-bold small text-muted">AULA</label><select id="m-sec" class="form-select form-select-lg" required>${oc}</select></div>
                        <div class="alert alert-info border-0 d-flex align-items-center small"><i class="bi bi-info-circle-fill me-2 fs-5"></i><span>Al guardar, se descontará una vacante.</span></div>
                        <button class="btn btn-primary w-100 btn-lg rounded-3 fw-bold mt-2" ${disponibles.length === 0 ? 'disabled' : ''}>Confirmar Matrícula</button>
                    </form>
                </div>
            </div>`;
    } catch (e) { area.innerHTML = '<div class="alert alert-danger">Error cargando formulario.</div>'; }
}

async function guardarMatricula(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const body = { estudiante_id: document.getElementById('m-est').value, seccion_id: document.getElementById('m-sec').value };
    if(!body.estudiante_id || !body.seccion_id) return alert("Selecciona todos los datos.");

    try {
        const res = await fetch(`${API_ACADEMIC}/matriculas`, { 
            method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${token}`}, body: JSON.stringify(body) 
        });
        if(res.ok) { alert('✅ Matrícula exitosa'); cargarMatriculas(); } 
        else { const err = await res.json(); alert('⛔ Error: ' + err.error); }
    } catch(err) { alert('Error de conexión'); }
}

// (Mantén aquí verDetalleMatricula y descargarPDFMatricula como estaban)
// 4. MANTENEMOS LAS FUNCIONES AUXILIARES (MODAL Y PDF)
async function verDetalleMatricula(idMatricula) {
    try {
        // Como ya tenemos los datos en caché, los buscamos ahí directo (más rápido)
        const m = matriculasCache.find(item => item.id === idMatricula);
        if (!m) return alert("Datos no encontrados.");

        const fechaObj = new Date(m.fecha_matricula);
        const fechaLarga = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const aula = `${m.curso} "${m.letra}" - ${m.nivel}`;

        let avatarHtml;
        if (m.foto_perfil && m.foto_perfil !== "null") {
            avatarHtml = `<img src="${m.foto_perfil}" class="rounded-circle shadow-sm border border-4 border-white mb-3 bg-white" style="width: 130px; height: 130px; object-fit: cover; margin-top: -65px;">`;
        } else {
            const iniciales = `${m.nombres.charAt(0)}${m.apellidos.charAt(0)}`.toUpperCase();
            avatarHtml = `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm border border-4 border-white mb-3" style="width: 130px; height: 130px; font-size: 3.5rem; margin: 0 auto; margin-top: -65px;">${iniciales}</div>`;
        }

        const modalHtml = `
        <div class="modal fade" id="modalDetalle" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-4 overflow-visible">
                    <div class="modal-header bg-primary text-white p-4 border-bottom-0" style="border-radius: 1rem 1rem 0 0;">
                        <h5 class="modal-title fw-bold">Constancia de Matrícula</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 pt-0">
                        <div class="text-center mb-4 position-relative">
                            ${avatarHtml}
                            <h4 class="fw-bold mb-1 text-dark">${m.nombres} ${m.apellidos}</h4>
                            <p class="text-muted mb-2">DNI: ${m.dni}</p>
                            <span class="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-2">Matriculado 2025</span>
                        </div>
                        <div class="card bg-light border-0 rounded-3 p-3 mb-3">
                            <div class="d-flex justify-content-between mb-2 border-bottom pb-2"><span>Aula Asignada:</span><span class="fw-bold text-dark">${aula}</span></div>
                            <div class="d-flex justify-content-between mb-2 border-bottom pb-2"><span>Fecha Registro:</span><span class="fw-bold text-dark">${fechaLarga}</span></div>
                            <div class="d-flex justify-content-between"><span>Código:</span><span class="fw-bold text-dark font-monospace">MAT-${String(m.id).padStart(6, '0')}</span></div>
                        </div>
                    </div>
                    <div class="modal-footer border-top-0 p-4 pt-0 justify-content-center">
                        <button onclick="descargarPDFMatricula(${m.id})" class="btn btn-danger btn-lg rounded-pill w-100 shadow-sm fw-bold">
                            <i class="bi bi-file-earmark-pdf-fill me-2"></i> Descargar Constancia PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = modalHtml;
        const modalBootstrap = new bootstrap.Modal(document.getElementById('modalDetalle'));
        modalBootstrap.show();
    } catch (e) { console.error(e); alert("Error al cargar detalles."); }
}

function descargarPDFMatricula(id) {
    const url = `${API_ACADEMIC}/matriculas/${id}/pdf`;
    window.open(url, '_blank');
}

// 4. REPORTES (MÓDULO FINAL)
async function cargarReportes(area) {
    area = area || document.getElementById('area-trabajo');
    try {
        const res = await fetch(`${API_ACADEMIC}/reportes/dashboard`); 
        const data = await res.json();
        
        let html = `
            <h3 class="fw-bold mb-4">📊 Panel de Control</h3>
            <div class="row g-4 mb-5">
                <div class="col-md-6">
                    <div class="card bg-primary text-white border-0 shadow rounded-4 overflow-hidden h-100">
                        <div class="card-body p-4 position-relative">
                            <h1 class="display-3 fw-bold mb-0">${data.total_matriculados}</h1>
                            <p class="fs-5 opacity-75">Estudiantes Matriculados</p>
                            <i class="bi bi-people-fill position-absolute bottom-0 end-0 p-4" style="font-size: 6rem; opacity: 0.2;"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-success text-white border-0 shadow rounded-4 overflow-hidden h-100">
                        <div class="card-body p-4 position-relative">
                            <h1 class="display-3 fw-bold mb-0">${data.total_vacantes}</h1>
                            <p class="fs-5 opacity-75">Vacantes Disponibles</p>
                            <i class="bi bi-door-open-fill position-absolute bottom-0 end-0 p-4" style="font-size: 6rem; opacity: 0.2;"></i>
                        </div>
                    </div>
                </div>
            </div>
            <h5 class="fw-bold text-secondary mb-3">Ocupación por Aulas</h5>
            <div class="row g-3">`;
            
        data.detalle_cursos.forEach(c => {
            const cap = c.inscritos + c.vacantes; 
            const p = Math.round((c.inscritos/cap)*100);
            const colorBarra = p > 90 ? 'bg-danger' : (p > 50 ? 'bg-primary' : 'bg-success');
            html += `
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm p-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="fw-bold">${c.nombre} "${c.letra}"</span>
                            <span class="badge bg-light text-dark border">${c.inscritos} / ${cap}</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar ${colorBarra}" role="progressbar" style="width: ${p}%"></div>
                        </div>
                    </div>
                </div>`;
        });
        area.innerHTML = html + '</div>';
    } catch(e) { area.innerHTML = "Error cargando reporte."; }
}
// =======================================================
// 10. MÓDULO: GESTIÓN DE TRABAJADORES (CRUD + ASIGNACIÓN CURSO)
// =======================================================

// Lista de materias disponibles (debe coincidir con la de horarios)
const CURSOS_DISPONIBLES = ['Física', 'Química', 'Matemáticas', 'Ed. Física', 'Comunicación', 'Ed. Cívica', 'Historia'];

async function cargarTrabajadores(area) {
    area = area || document.getElementById('area-trabajo');
    try {
        const res = await fetch(`${API_ACADEMIC}/trabajadores`);
        const lista = await res.json();
        
        let html = `
            <div class="d-flex justify-content-between mb-3">
                <h3>Personal del Colegio</h3>
                <button class="btn btn-primary" onclick="idTrabajadorEditando=null; mostrarFormTrabajador()">+ Nuevo Trabajador</button>
            </div>
            <table class="table table-hover bg-white shadow-sm align-middle">
                <thead class="table-dark">
                    <tr><th>DNI</th><th>Nombre</th><th>Cargo</th><th>Curso (Docente)</th><th>Email</th><th>Acciones</th></tr>
                </thead>
                <tbody>`;
        
        lista.forEach(t => {
            // Mostrar curso si es docente
            const cursoInfo = t.curso_principal 
                ? `<span class="badge bg-info text-dark">${t.curso_principal}</span>` 
                : '-';

            html += `
                <tr>
                    <td>${t.dni}</td>
                    <td>${t.nombres} ${t.apellidos}</td>
                    <td><span class="badge bg-secondary">${t.cargo}</span></td>
                    <td>${cursoInfo}</td>
                    <td>${t.email}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-warning btn-sm" title="Editar"
                                onclick="cargarEdicionTrabajador(${t.id}, '${t.dni}', '${t.nombres}', '${t.apellidos}', '${t.email}', '${t.cargo}', '${t.telefono || ''}', '${t.curso_principal || ''}')">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" title="Eliminar"
                                onclick="eliminarTrabajador(${t.id})">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        });
        area.innerHTML = html + '</tbody></table>';
    } catch(e) { area.innerHTML = '<div class="alert alert-danger">Error cargando trabajadores.</div>'; }
}

function mostrarFormTrabajador() {
    const area = document.getElementById('area-trabajo');
    const titulo = idTrabajadorEditando ? 'Editar Trabajador' : 'Nuevo Trabajador';
    const readonlyEdit = idTrabajadorEditando ? 'readonly style="background-color: #e9ecef;"' : '';
    const readonlyNew = 'readonly'; 

    const btnLupa = !idTrabajadorEditando 
        ? `<button type="button" class="btn btn-info text-white" onclick="buscarTrabajadorReniec()"><i class="bi bi-search"></i></button>`
        : '';

    // Generamos las opciones del select de cursos
    const opcionesCursos = CURSOS_DISPONIBLES.map(c => `<option value="${c}">${c}</option>`).join('');

    area.innerHTML = `
        <h3>${titulo}</h3>
        <div class="card p-4 shadow" style="max-width:600px">
            <form id="form-trabajador" onsubmit="guardarTrabajador(event)">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label>DNI</label>
                        <div class="input-group">
                            <input id="t-dni" class="form-control" required maxlength="8" placeholder="DNI" ${readonlyEdit}>
                            ${btnLupa}
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-3">
                        <label>Cargo</label>
                        <select id="t-cargo" class="form-select" onchange="toggleCursoDocente()">
                            <option>Docente</option>
                            <option>Secretaria</option>
                            <option>Administrativo</option>
                        </select>
                    </div>

                    <div class="col-12 mb-3 bg-light p-2 border rounded" id="div-curso-principal" style="display:none;">
                        <label class="text-primary fw-bold">📚 Materia que enseña:</label>
                        <select id="t-curso" class="form-select">
                            <option value="">-- Selecciona Materia --</option>
                            ${opcionesCursos}
                        </select>
                    </div>

                    <div class="col-md-6 mb-3">
                        <label>Nombres</label>
                        <input id="t-nombres" class="form-control" required ${readonlyEdit} ${!idTrabajadorEditando ? readonlyNew : ''}>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label>Apellidos</label>
                        <input id="t-apellidos" class="form-control" required ${readonlyEdit} ${!idTrabajadorEditando ? readonlyNew : ''}>
                    </div>
                    <div class="col-md-12 mb-3">
                        <label>Email Corporativo</label>
                        <input type="email" id="t-email" class="form-control" required>
                    </div>
                    
                    <div class="col-md-6 mb-3">
                        <label>Teléfono</label>
                        <input type="text" id="t-telefono" class="form-control" 
                               maxlength="9" 
                               oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                    </div>

                </div>
                <div class="d-flex gap-2 mt-3">
                    <button type="submit" class="btn btn-primary w-50">Guardar</button>
                    <button type="button" class="btn btn-secondary w-50" onclick="cargarTrabajadores()">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    // Ejecutamos la función una vez para ajustar la visibilidad inicial
    toggleCursoDocente();
}

// Función auxiliar para mostrar/ocultar el select de curso
function toggleCursoDocente() {
    const cargo = document.getElementById('t-cargo').value;
    const div = document.getElementById('div-curso-principal');
    
    if (cargo === 'Docente') {
        div.style.display = 'block';
    } else {
        div.style.display = 'none';
        document.getElementById('t-curso').value = ""; // Limpiar si cambia de cargo
    }
}

function cargarEdicionTrabajador(id, dni, nom, ape, email, cargo, telf, curso) {
    idTrabajadorEditando = id;
    mostrarFormTrabajador(); 
    
    document.getElementById('t-dni').value = dni;
    document.getElementById('t-nombres').value = nom;
    document.getElementById('t-apellidos').value = ape;
    document.getElementById('t-email').value = email;
    document.getElementById('t-cargo').value = cargo;
    document.getElementById('t-telefono').value = telf;
    
    // Ajustar visibilidad y valor del curso
    toggleCursoDocente(); // Primero mostramos el div si es docente
    if(cargo === 'Docente') {
        document.getElementById('t-curso').value = curso || "";
    }
}

async function buscarTrabajadorReniec() {
    const dni = document.getElementById('t-dni').value;
    const btnGuardar = document.querySelector('#form-trabajador button[type="submit"]'); 
    
    if (dni.length !== 8) return alert('El DNI debe tener 8 dígitos');

    const btnLupa = document.querySelector('#t-dni + button');
    const iconoOriginal = btnLupa.innerHTML;
    btnLupa.innerHTML = '...'; btnLupa.disabled = true;

    try {
        const checkRes = await fetch(`${API_ACADEMIC}/trabajadores/verificar/${dni}`);
        const checkData = await checkRes.json();

        if (checkData.existe) {
            alert(`⚠️ El trabajador "${checkData.trabajador.nombres}" ya está registrado.`);
            document.getElementById('t-nombres').value = '';
            document.getElementById('t-apellidos').value = '';
            if(btnGuardar) btnGuardar.disabled = true;
            return;
        }

        if(btnGuardar) btnGuardar.disabled = false;

        const res = await fetch(`${API_ACADEMIC}/reniec/${dni}`);
        if (!res.ok) throw new Error('DNI no encontrado');
        
        const data = await res.json();
        document.getElementById('t-nombres').value = data.nombres;
        document.getElementById('t-apellidos').value = `${data.apellidoPaterno} ${data.apellidoMaterno}`;
        
    } catch (e) {
        console.error(e);
        alert('DNI no encontrado o error de conexión');
        document.getElementById('t-nombres').removeAttribute('readonly');
        document.getElementById('t-apellidos').removeAttribute('readonly');
        if(btnGuardar) btnGuardar.disabled = false;
    } finally {
        btnLupa.innerHTML = iconoOriginal;
        btnLupa.disabled = false;
    }
}

async function guardarTrabajador(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const data = {
        dni: document.getElementById('t-dni').value, 
        cargo: document.getElementById('t-cargo').value,
        nombres: document.getElementById('t-nombres').value, 
        apellidos: document.getElementById('t-apellidos').value,
        email: document.getElementById('t-email').value,
        telefono: document.getElementById('t-telefono').value,
        curso_principal: document.getElementById('t-curso').value // ENVIAMOS EL CURSO
    };

    const url = idTrabajadorEditando 
        ? `${API_ACADEMIC}/trabajadores/${idTrabajadorEditando}` 
        : `${API_ACADEMIC}/trabajadores`;
        
    const metodo = idTrabajadorEditando ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { 
            method: metodo, 
            headers: {'Content-Type':'application/json', 'Authorization':`Bearer ${token}`}, 
            body: JSON.stringify(data)
        });

        const respuestaJson = await res.json();

        if(res.ok) { 
            alert('¡Guardado correctamente!'); 
            idTrabajadorEditando = null; 
            cargarTrabajadores(); 
        }
        else { 
            alert('Error: ' + (respuestaJson.error || 'Ocurrió un problema desconocido')); 
        }
    } catch(err) { 
        console.error(err);
        alert('Error de conexión con el servidor'); 
    }
}

// --- FUNCIÓN ELIMINAR TRABAJADOR ---
async function eliminarTrabajador(id) {
    if (!confirm('⚠️ ¿Estás seguro de eliminar a este trabajador?')) return;

    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API_ACADEMIC}/trabajadores/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert('Trabajador eliminado correctamente.');
            cargarTrabajadores(); 
        } else {
            const data = await res.json();
            alert('Error: ' + (data.error || 'No se pudo eliminar'));
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor');
    }
}

// --- FUNCIONES AUXILIARES NECESARIAS ---

function sidebarItemHtml(titulo, icono) {
    return `<a onclick="accionClick('${titulo}')" class="nav-link-custom" style="cursor:pointer"><i class="bi ${icono}"></i> ${titulo}</a>`;
}

// PANTALLA DE BIENVENIDA (CON IMAGEN DEL COLEGIO)
function mostrarInicio() {
    const area = document.getElementById('area-trabajo');
    const token = localStorage.getItem('token');
    
    let nombreUsuario = "Usuario";
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const user = JSON.parse(window.atob(base64));
            // Intentamos obtener el nombre del email (ej: "juan" de "juan@gmail.com")
            nombreUsuario = user.email.split('@')[0];
            // Capitalizar primera letra (ej: "Juan")
            nombreUsuario = nombreUsuario.charAt(0).toUpperCase() + nombreUsuario.slice(1);
        } catch (e) {}
    }

    area.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center h-100 text-center animate-fade-in">
            
            <div class="mb-4">
                <h2 class="fw-bold text-dark display-6">¡Hola, ${nombreUsuario}! </h2>
                <p class="text-muted fs-5">Bienvenido al Panel de Gestión Escolar</p>
            </div>

            <div class="position-relative mb-4" style="max-width: 600px; width: 100%;">
                <div class="ratio ratio-16x9 shadow-lg rounded-4 overflow-hidden border border-4 border-white">
                    <img src="img/logo.png" 
                         class="object-fit-cover" 
                         alt="Imagen Institucional"
                         onerror="this.src='https://img.freepik.com/free-vector/school-building-illustration_138676-2413.jpg'">
                </div>
            </div>

            <div class="alert alert-light border-0 shadow-sm text-secondary" style="max-width: 500px;">
                <i class="bi bi-info-circle-fill me-2 text-primary"></i>
                Selecciona una opción del menú lateral para comenzar a trabajar.
            </div>

        </div>
    `;
}

// =======================================================
// 11. MÓDULO: PORTAL DEL APODERADO (MIS HIJOS)
// =======================================================


// =======================================================
// 11. MÓDULO: PORTAL DEL APODERADO (FINAL Y LIMPIO)
// =======================================================

// Variable global para este módulo
let misHijosCache = [];

async function cargarMisHijos() {
    const area = document.getElementById('area-trabajo');
    const token = localStorage.getItem('token');
    
    area.innerHTML = '<p class="text-center mt-5"><span class="spinner-border text-info"></span> Cargando información familiar...</p>';

    try {
        const res = await fetch(`${API_ACADEMIC}/apoderados/mis-hijos`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (!res.ok) throw new Error("Error al obtener datos");
        
        misHijosCache = await res.json();

        let html = `
            <div class="mb-4">
                <h3 class="fw-bold text-dark"><i class="bi bi-emoji-smile text-warning"></i> Mis Hijos</h3>
                <p class="text-muted small">Información académica de sus estudiantes a cargo.</p>
            </div>
            <div class="row g-4">`;

        if (misHijosCache.length === 0) {
            html += `<div class="col-12"><div class="alert alert-info text-center">No tiene hijos vinculados a esta cuenta. Comuníquese con secretaría.</div></div>`;
        }

        misHijosCache.forEach(h => {
            // Avatar
            let avatarHtml;
            if (h.foto_perfil && h.foto_perfil !== "null") {
                avatarHtml = `<img src="${h.foto_perfil}" class="rounded-circle border border-4 border-white shadow" style="width: 100px; height: 100px; object-fit: cover; margin-top: -50px;">`;
            } else {
                avatarHtml = `<div class="rounded-circle bg-info text-white d-flex align-items-center justify-content-center fw-bold shadow border border-4 border-white" style="width: 100px; height: 100px; font-size: 2.5rem; margin: 0 auto; margin-top: -50px;">${h.nombres.charAt(0)}</div>`;
            }

            const estadoMatricula = h.grado 
                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success px-3 py-1 rounded-pill">Matriculado: ${h.grado} "${h.seccion}"</span>`
                : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-1 rounded-pill">No Matriculado 2025</span>`;

            const accionFicha = h.seccion_id 
                ? `verFichaCompletaHijo(${h.id})` 
                : `alert('El estudiante aún no tiene aula asignada.')`;

            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm rounded-4 pt-5 mt-3">
                        <div class="text-center px-3">
                            ${avatarHtml}
                            <h4 class="fw-bold text-dark mt-3 mb-1">${h.nombres.split(' ')[0]} ${h.apellidos.split(' ')[0]}</h4>
                            <p class="text-muted small mb-3">DNI: ${h.dni}</p>
                            ${estadoMatricula}
                        </div>
                        <div class="card-body mt-3">
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary rounded-pill" onclick="${accionFicha}">
                                    <i class="bi bi-person-lines-fill"></i> Ver Ficha & Horario
                                </button>
                                </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        area.innerHTML = html;

    } catch (e) { area.innerHTML = `<div class="alert alert-danger text-center">Error de conexión.</div>`; }
}
// =======================================================
// VISTA FICHA COMPLETA DEL HIJO (VERSIÓN OPTIMIZADA)
// =======================================================

// VISTA FICHA COMPLETA DEL HIJO (SIN PDF NI ALERTAS MÉDICAS)
async function verFichaCompletaHijo(idEstudiante) {
    try {
        const datosHijo = misHijosCache.find(h => h.id === idEstudiante);
        if (!datosHijo) return alert("Error: Datos no encontrados.");

        const token = localStorage.getItem('token');
        const resHorario = await fetch(`${API_ACADEMIC}/horarios/seccion/${datosHijo.seccion_id}`, {
             headers: { 'Authorization': `Bearer ${token}` } 
        });
        const horario = await resHorario.json();

        // Tabla de Horario
        let tablaHorarioHtml = '';
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        
        tablaHorarioHtml = `
            <div class="table-responsive mt-3">
                <table class="table table-bordered table-sm text-center" style="font-size: 0.8rem;">
                    <thead class="table-light">
                        <tr><th>Hora</th>${dias.map(d => `<th>${d.substr(0,3)}</th>`).join('')}</tr>
                    </thead>
                    <tbody>`;

        BLOQUES_HORARIO.forEach(b => {
            if(b.tipo === 'RECREO') {
                tablaHorarioHtml += `<tr class="table-success"><td colspan="6" class="py-1 fw-bold text-success">RECREO</td></tr>`;
                return;
            }
            tablaHorarioHtml += `<tr><td class="fw-bold text-muted">${b.inicio}</td>`;
            dias.forEach(dia => {
                const clase = horario.find(h => h.dia === dia && h.hora_inicio.toString().startsWith(b.inicio));
                tablaHorarioHtml += clase ? `<td class="bg-primary bg-opacity-10 text-primary fw-bold border-white p-2">${clase.materia}</td>` : `<td></td>`;
            });
            tablaHorarioHtml += `</tr>`;
        });
        tablaHorarioHtml += `</tbody></table></div>`;

        // Modal
        const avatar = datosHijo.foto_perfil 
            ? `<img src="${datosHijo.foto_perfil}" class="rounded-circle border shadow-sm" style="width: 80px; height: 80px; object-fit: cover;">`
            : `<div class="rounded-circle bg-info text-white d-flex align-items-center justify-content-center fw-bold" style="width: 80px; height: 80px; font-size: 2rem;">${datosHijo.nombres.charAt(0)}</div>`;

        const modalHtml = `
        <div class="modal fade" id="modalFichaHijo" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-light border-bottom-0 pb-0">
                        <div class="d-flex align-items-center w-100">
                            <div class="me-3">${avatar}</div>
                            <div class="flex-grow-1">
                                <h4 class="fw-bold mb-0 text-dark">${datosHijo.nombres} ${datosHijo.apellidos}</h4>
                                <span class="badge bg-primary mt-1">${datosHijo.grado} "${datosHijo.seccion}"</span>
                                <span class="badge bg-secondary mt-1">DNI: ${datosHijo.dni}</span>
                            </div>
                            <button type="button" class="btn-close ms-auto" data-bs-dismiss="modal"></button>
                        </div>
                    </div>
                    <div class="modal-body px-4">
                        <h5 class="text-primary border-bottom pb-2 mt-3"><i class="bi bi-calendar-week"></i> Horario de Clases</h5>
                        ${tablaHorarioHtml}
                    </div>
                    <div class="modal-footer border-top-0">
                        <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('modalFichaHijo'));
        modal.show();

    } catch (e) { alert("Error al cargar la ficha."); }
}

// ESTA LÍNEA ES LA QUE HACE QUE CARGUE AL DAR REFRESH (F5)
if (localStorage.getItem('token')) {
    mostrarDashboard();
}