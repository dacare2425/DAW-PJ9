const http = require("http")
const fs = require("fs")
const path = require("path")
const url = require("url")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const pug = require("pug")

const port = 8888
const publicDir = path.join(__dirname, "public")
const viewsDir = path.join(__dirname, "views")

// 🔗 Conexión con MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/usuarios", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const db = mongoose.connection
db.on("error", console.error.bind(console, "Error de conexión a MongoDB:"))
db.once("open", () => console.log("Conectado a MongoDB con Mongoose"))

// 🧾 Esquema del usuario
const usuarioSchema = new mongoose.Schema({
  nom: String,
  contrasenya: String,
  rol: { type: String, default: "cliente" },
})
const Usuario = mongoose.model("Usuario", usuarioSchema)

// 📂 MIME types
const mimeTypes = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

// 🧠 Funciones utilitarias
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => resolve(JSON.parse(body)))
  })
}

const send = (res, status, data, type = "application/json") => {
  res.writeHead(status, { "Content-Type": type })
  res.end(type === "application/json" ? JSON.stringify(data) : data)
}

// Función para renderizar plantillas Pug
const renderPug = (templateName, data = {}) => {
  const templatePath = path.join(viewsDir, `${templateName}.pug`)
  try {
    return pug.renderFile(templatePath, data)
  } catch (err) {
    console.error(`Error rendering template ${templateName}:`, err)
    throw err
  }
}

// 🖥️ Servidor
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname
  const method = req.method

  // 🔐 Login
  if (pathname === "/login" && method === "GET") {
    const { nom, contrasenya } = parsedUrl.query
    const user = await Usuario.findOne({ nom })
    const auth = user && (await bcrypt.compare(contrasenya, user.contrasenya))
    if (auth) {
      return send(res, 200, { mensaje: "Usuario autenticado", usuario: { nom: user.nom, rol: user.rol } })
    } else {
      return send(res, 401, { mensaje: "Credenciales incorrectas" })
    }
  }

  // ➕ Agregar usuario
  if (pathname === "/agregarUsuario" && method === "POST") {
    const { nom, contrasenya } = await parseBody(req)
    const hash = await bcrypt.hash(contrasenya, 10)
    await Usuario.create({ nom, contrasenya: hash })
    return send(res, 200, { mensaje: "Usuario agregado" })
  }

  // 📋 Listar usuarios (solo admin)
  if (pathname === "/listarUsuarios" && method === "GET") {
    const usuarioStr = req.headers["usuario"]
    if (!usuarioStr) return send(res, 401, { mensaje: "No se ha proporcionado el usuario" })
    const usuario = JSON.parse(usuarioStr)
    if (usuario?.rol !== "admin") return send(res, 403, { mensaje: "Acceso denegado" })

    const usuarios = await Usuario.find({}, { contrasenya: 0 })
    return send(res, 200, { usuarios })
  }

  // ❌ Eliminar usuario
  if (pathname === "/eliminarUsuario" && method === "DELETE") {
    const { nom } = parsedUrl.query
    const result = await Usuario.deleteOne({ nom })
    if (result.deletedCount > 0) {
      return send(res, 200, { mensaje: "Usuario eliminado" })
    } else {
      return send(res, 404, { mensaje: "Usuario no encontrado" })
    }
  }

  // ✏️ Modificar usuario
  if (pathname === "/modificarUsuario" && method === "PUT") {
    const { nom, nuevoNom } = parsedUrl.query
    const result = await Usuario.updateOne({ nom }, { $set: { nom: nuevoNom } })
    if (result.matchedCount > 0) {
      return send(res, 200, { mensaje: "Usuario modificado" })
    } else {
      return send(res, 404, { mensaje: "Usuario no encontrado" })
    }
  }

  // Update the route handler for the usuarios page
  if (pathname === "/usuarios" && method === "GET") {
    const usuarioStr = req.headers["usuario"]
    if (!usuarioStr) return send(res, 401, { mensaje: "No se ha proporcionado el usuario" })
    const usuario = JSON.parse(usuarioStr)
    if (usuario?.rol !== "admin") return send(res, 403, { mensaje: "Acceso denegado" })

    try {
      const usuarios = await Usuario.find({}, { contrasenya: 0 })
      // Render the usuarios template with the users data
      const html = renderPug("usuarios", { usuarios })
      res.writeHead(200, { "Content-Type": "text/html" })
      return res.end(html)
    } catch (err) {
      return send(res, 500, { mensaje: "Error al obtener usuarios" })
    }
  }

  // Add a route for the agregar-usuario page
  if (pathname === "/agregar-usuario" && method === "GET") {
    const usuarioStr = req.headers["usuario"]
    if (!usuarioStr) return send(res, 401, { mensaje: "No se ha proporcionado el usuario" })
    const usuario = JSON.parse(usuarioStr)

    try {
      const html = renderPug("agregar-usuario", {
        formTitle: "Agregar Nuevo Usuario",
        formAction: "/agregarUsuario",
        submitText: "Agregar Usuario",
        isAdmin: usuario.rol === "admin",
      })
      res.writeHead(200, { "Content-Type": "text/html" })
      return res.end(html)
    } catch (err) {
      return send(res, 500, { mensaje: "Error al renderizar la página" })
    }
  }

  try {
    // Handle page requests - render Pug templates
    if (pathname === "/" || pathname.endsWith(".html")) {
      const templateName = pathname === "/" ? "index" : pathname.replace(".html", "").substring(1)
      try {
        const html = renderPug(templateName)
        res.writeHead(200, { "Content-Type": "text/html" })
        return res.end(html)
      } catch (err) {
        console.error(`Error rendering template ${templateName}:`, err)
        res.writeHead(404, { "Content-Type": "text/plain" })
        return res.end(`Template ${templateName} no encontrado`)
      }
    }

    // Serve static files (CSS, JS, images, etc.) from public directory
    const filePath = path.join(publicDir, pathname)
    const ext = path.extname(filePath)

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" })
        res.end("Archivo no encontrado")
      } else {
        res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" })
        res.end(data)
      }
    })
  } catch (err) {
    console.error("Error serving file:", err)
    res.writeHead(500, { "Content-Type": "text/plain" })
    res.end("Error interno del servidor")
  }
})

// 🛠️ Crear admin si no existe
;(async () => {
  const admin = await Usuario.findOne({ nom: "admin" })
  if (!admin) {
    const hash = await bcrypt.hash("admin123", 10)
    await Usuario.create({ nom: "admin", contrasenya: hash, rol: "admin" })
    console.log("Usuario admin creado")
  }
})()

server.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`)
})