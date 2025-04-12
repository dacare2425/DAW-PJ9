const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const pug = require("pug");

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

class Database {
  constructor() {
    this.connect();
    this.Usuario = this.createUserModel();
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

  async createAdminUser() {
    const admin = await this.Usuario.findOne({ nom: "admin" });
    if (!admin) {
      const hash = await bcrypt.hash("admin123", 10);
      await this.Usuario.create({ nom: "admin", contrasenya: hash, rol: "admin" });
      console.log("Usuario admin creado");
    }
  }
}

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

class RequestHandler {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Route handling
    if (pathname === "/login" && method === "GET") {
      return this.handleLogin(req, res, parsedUrl);
    } else if (pathname === "/agregarUsuario" && method === "POST") {
      return this.handleAddUser(req, res);
    } else if (pathname === "/listarUsuarios" && method === "GET") {
      return this.handleListUsers(req, res);
    } else if (pathname === "/eliminarUsuario" && method === "DELETE") {
      return this.handleDeleteUser(req, res, parsedUrl);
    } else if (pathname === "/modificarUsuario" && method === "PUT") {
      return this.handleModifyUser(req, res, parsedUrl);
    } else if (pathname === "/usuarios" && method === "GET") {
      return this.handleUsersPage(req, res);
    } else if (pathname === "/agregar-usuario" && method === "GET") {
      return this.handleAddUserPage(req, res);
    } else if (pathname === "/" || pathname.endsWith(".html")) {
      return this.handlePageRequest(req, res, pathname);
    } else {
      return this.handleStaticFile(req, res, pathname);
    }
  }

  async handleLogin(req, res, parsedUrl) {
    const { nom, contrasenya } = parsedUrl.query;
    const user = await this.db.Usuario.findOne({ nom });
    const auth = user && (await bcrypt.compare(contrasenya, user.contrasenya));
    
    if (auth) {
      Utils.send(res, 200, { 
        mensaje: "Usuario autenticado", 
        usuario: { nom: user.nom, rol: user.rol } 
      });
    } else {
      Utils.send(res, 401, { mensaje: "Credenciales incorrectas" });
    }
  }

  async handleAddUser(req, res) {
    const { nom, contrasenya } = await Utils.parseBody(req);
    const hash = await bcrypt.hash(contrasenya, 10);
    await this.db.Usuario.create({ nom, contrasenya: hash });
    Utils.send(res, 200, { mensaje: "Usuario agregado" });
  }

  async handleListUsers(req, res) {
    const usuarioStr = req.headers["usuario"];
    if (!usuarioStr) return Utils.send(res, 401, { mensaje: "No se ha proporcionado el usuario" });
    
    const usuario = JSON.parse(usuarioStr);
    if (usuario?.rol !== "admin") return Utils.send(res, 403, { mensaje: "Acceso denegado" });

    const usuarios = await this.db.Usuario.find({}, { contrasenya: 0 });
    Utils.send(res, 200, { usuarios });
  }

  async handleDeleteUser(req, res, parsedUrl) {
    const { nom } = parsedUrl.query;
    const result = await this.db.Usuario.deleteOne({ nom });
    
    if (result.deletedCount > 0) {
      Utils.send(res, 200, { mensaje: "Usuario eliminado" });
    } else {
      Utils.send(res, 404, { mensaje: "Usuario no encontrado" });
    }
  }

  async handleModifyUser(req, res, parsedUrl) {
    const { nom, nuevoNom } = parsedUrl.query;
    const result = await this.db.Usuario.updateOne({ nom }, { $set: { nom: nuevoNom } });
    
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
      const usuarios = await this.db.Usuario.find({}, { contrasenya: 0 });
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

  handlePageRequest(req, res, pathname) {
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

  handleStaticFile(req, res, pathname) {
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

class WebServer {
  constructor() {
    this.config = new ServerConfig();
    this.db = new Database();
    this.requestHandler = new RequestHandler(this.db, this.config);
    this.server = http.createServer((req, res) => this.requestHandler.handleRequest(req, res));
  }

  start() {
    this.db.createAdminUser();
    this.server.listen(this.config.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.config.port}`);
    });
  }
}

// Iniciar el servidor
const webServer = new WebServer();
webServer.start();