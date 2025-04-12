const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const pug = require("pug");

// 🏗️ Clases de Usuarios
class Usuario {
  constructor(nom, contrasenya, rol = "cliente") {
    this.nom = nom;
    this.contrasenya = contrasenya;
    this.rol = rol;
  }

  async encryptPassword() {
    const salt = await bcrypt.genSalt(10);
    this.contrasenya = await bcrypt.hash(this.contrasenya, salt);
  }

  async comparePassword(contrasenya) {
    return await bcrypt.compare(contrasenya, this.contrasenya);
  }

  toJSON() {
    return {
      nom: this.nom,
      rol: this.rol
    };
  }
}

class Administrador extends Usuario {
  constructor(nom, contrasenya) {
    super(nom, contrasenya, "admin");
  }

  static async createAdminIfNotExists(UsuarioModel) {
    const admin = await UsuarioModel.findOne({ nom: "admin" });
    if (!admin) {
      const newAdmin = new Administrador("admin", "admin123");
      await newAdmin.encryptPassword();
      await UsuarioModel.create(newAdmin);
      console.log("Usuario admin creado");
    }
  }

  // Métodos específicos de administrador
  async listUsers(UsuarioModel) {
    return await UsuarioModel.find({}, { contrasenya: 0 });
  }

  async deleteUser(UsuarioModel, nom) {
    return await UsuarioModel.deleteOne({ nom });
  }

  async modifyUser(UsuarioModel, nom, nuevoNom) {
    return await UsuarioModel.updateOne({ nom }, { $set: { nom: nuevoNom } });
  }
}

// 🛠️ Configuración del Servidor
class ServerConfig {
  constructor() {
    this.port = 8888;
    this.publicDir = path.join(__dirname, "public");
    this.viewsDir = path.join(__dirname, "views");
    this.mimeTypes = {
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };
  }
}

// 🗃️ Base de Datos
class Database {
  constructor() {
    this.connect();
    this.UsuarioModel = this.createUserModel();
  }

  connect() {
    mongoose.connect("mongodb://127.0.0.1:27017/usuarios", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "Error de conexión a MongoDB:"));
    db.once("open", () => console.log("Conectado a MongoDB con Mongoose"));
  }

  createUserModel() {
    const usuarioSchema = new mongoose.Schema({
      nom: String,
      contrasenya: String,
      rol: { type: String, default: "cliente" },
    });
    return mongoose.model("Usuario", usuarioSchema);
  }
}

// 🧰 Utilidades
class Utils {
  static async parseBody(req) {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => resolve(JSON.parse(body)));
    });
  }

  static send(res, status, data, type = "application/json") {
    res.writeHead(status, { "Content-Type": type });
    res.end(type === "application/json" ? JSON.stringify(data) : data);
  }

  static renderPug(viewsDir, templateName, data = {}) {
    const templatePath = path.join(viewsDir, `${templateName}.pug`);
    try {
      return pug.renderFile(templatePath, data);
    } catch (err) {
      console.error(`Error rendering template ${templateName}:`, err);
      throw err;
    }
  }
}

// 🖥️ Manejador de Peticiones
class RequestHandler {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    try {
      if (pathname === "/login" && method === "GET") {
        await this.handleLogin(req, res, parsedUrl);
      } else if (pathname === "/agregarUsuario" && method === "POST") {
        await this.handleAddUser(req, res);
      } else if (pathname === "/listarUsuarios" && method === "GET") {
        await this.handleListUsers(req, res);
      } else if (pathname === "/eliminarUsuario" && method === "DELETE") {
        await this.handleDeleteUser(req, res, parsedUrl);
      } else if (pathname === "/modificarUsuario" && method === "PUT") {
        await this.handleModifyUser(req, res, parsedUrl);
      } else if (pathname === "/usuarios" && method === "GET") {
        await this.handleUsersPage(req, res);
      } else if (pathname === "/agregar-usuario" && method === "GET") {
        await this.handleAddUserPage(req, res);
      } else if (pathname === "/" || pathname.endsWith(".html")) {
        await this.handlePageRequest(req, res, pathname);
      } else {
        await this.handleStaticFile(req, res, pathname);
      }
    } catch (error) {
      console.error("Error handling request:", error);
      Utils.send(res, 500, { mensaje: "Error interno del servidor" });
    }
  }

  async handleLogin(req, res, parsedUrl) {
    const { nom, contrasenya } = parsedUrl.query;
    const userDoc = await this.db.UsuarioModel.findOne({ nom });
    
    if (!userDoc) {
      return Utils.send(res, 401, { mensaje: "Credenciales incorrectas" });
    }

    let user;
    if (userDoc.rol === "admin") {
      user = new Administrador(userDoc.nom, userDoc.contrasenya);
    } else {
      user = new Usuario(userDoc.nom, userDoc.contrasenya, userDoc.rol);
    }

    const auth = await user.comparePassword(contrasenya);
    if (auth) {
      Utils.send(res, 200, { 
        mensaje: "Usuario autenticado", 
        usuario: user.toJSON() 
      });
    } else {
      Utils.send(res, 401, { mensaje: "Credenciales incorrectas" });
    }
  }

  async handleAddUser(req, res) {
    const { nom, contrasenya } = await Utils.parseBody(req);
    const user = new Usuario(nom, contrasenya);
    await user.encryptPassword();
    await this.db.UsuarioModel.create(user);
    Utils.send(res, 200, { mensaje: "Usuario agregado" });
  }

  async handleListUsers(req, res) {
    const usuarioStr = req.headers["usuario"];
    if (!usuarioStr) return Utils.send(res, 401, { mensaje: "No se ha proporcionado el usuario" });
    
    const usuario = JSON.parse(usuarioStr);
    if (usuario?.rol !== "admin") return Utils.send(res, 403, { mensaje: "Acceso denegado" });

    const admin = new Administrador(usuario.nom, "");
    const usuarios = await admin.listUsers(this.db.UsuarioModel);
    Utils.send(res, 200, { usuarios });
  }

  async handleDeleteUser(req, res, parsedUrl) {
    const { nom } = parsedUrl.query;
    const usuarioStr = req.headers["usuario"];
    if (!usuarioStr) return Utils.send(res, 401, { mensaje: "No se ha proporcionado el usuario" });
    
    const usuario = JSON.parse(usuarioStr);
    if (usuario?.rol !== "admin") return Utils.send(res, 403, { mensaje: "Acceso denegado" });

    const admin = new Administrador(usuario.nom, "");
    const result = await admin.deleteUser(this.db.UsuarioModel, nom);
    
    if (result.deletedCount > 0) {
      Utils.send(res, 200, { mensaje: "Usuario eliminado" });
    } else {
      Utils.send(res, 404, { mensaje: "Usuario no encontrado" });
    }
  }

  async handleModifyUser(req, res, parsedUrl) {
    const { nom, nuevoNom } = parsedUrl.query;
    const usuarioStr = req.headers["usuario"];
    if (!usuarioStr) return Utils.send(res, 401, { mensaje: "No se ha proporcionado el usuario" });
    
    const usuario = JSON.parse(usuarioStr);
    if (usuario?.rol !== "admin") return Utils.send(res, 403, { mensaje: "Acceso denegado" });

    const admin = new Administrador(usuario.nom, "");
    const result = await admin.modifyUser(this.db.UsuarioModel, nom, nuevoNom);
    
    if (result.matchedCount > 0) {
      Utils.send(res, 200, { mensaje: "Usuario modificado" });
    } else {
      Utils.send(res, 404, { mensaje: "Usuario no encontrado" });
    }
  }

  async handleUsersPage(req, res) {
    const usuarioStr = req.headers["usuario"];
    if (!usuarioStr) return Utils.send(res, 401, { mensaje: "No se ha proporcionado el usuario" });
    
    const usuario = JSON.parse(usuarioStr);
    if (usuario?.rol !== "admin") return Utils.send(res, 403, { mensaje: "Acceso denegado" });

    try {
      const admin = new Administrador(usuario.nom, "");
      const usuarios = await admin.listUsers(this.db.UsuarioModel);
      const html = Utils.renderPug(this.config.viewsDir, "usuarios", { usuarios });
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } catch (err) {
      Utils.send(res, 500, { mensaje: "Error al obtener usuarios" });
    }
  }

  async handleAddUserPage(req, res) {
    const usuarioStr = req.headers["usuario"];
    if (!usuarioStr) return Utils.send(res, 401, { mensaje: "No se ha proporcionado el usuario" });
    
    const usuario = JSON.parse(usuarioStr);

    try {
      const html = Utils.renderPug(this.config.viewsDir, "agregar-usuario", {
        formTitle: "Agregar Nuevo Usuario",
        formAction: "/agregarUsuario",
        submitText: "Agregar Usuario",
        isAdmin: usuario.rol === "admin",
      });
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } catch (err) {
      Utils.send(res, 500, { mensaje: "Error al renderizar la página" });
    }
  }

  async handlePageRequest(req, res, pathname) {
    const templateName = pathname === "/" ? "index" : pathname.replace(".html", "").substring(1);
    
    try {
      const html = Utils.renderPug(this.config.viewsDir, templateName);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } catch (err) {
      console.error(`Error rendering template ${templateName}:`, err);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Template ${templateName} no encontrado`);
    }
  }

  async handleStaticFile(req, res, pathname) {
    const filePath = path.join(this.config.publicDir, pathname);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Archivo no encontrado");
      } else {
        const contentType = this.config.mimeTypes[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  }
}

// 🌐 Servidor Web
class WebServer {
  constructor() {
    this.config = new ServerConfig();
    this.db = new Database();
    this.requestHandler = new RequestHandler(this.db, this.config);
    this.server = http.createServer((req, res) => this.requestHandler.handleRequest(req, res));
  }

  async start() {
    await Administrador.createAdminIfNotExists(this.db.UsuarioModel);
    this.server.listen(this.config.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.config.port}`);
    });
  }
}

const webServer = new WebServer();
webServer.start().catch(err => console.error("Error al iniciar el servidor:", err));